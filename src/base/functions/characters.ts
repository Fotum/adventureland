// @ts-nocheck
import {
    Game,
    Mage,
    Merchant,
    Paladin,
    PingCompensatedCharacter,
    Priest,
    Ranger,
    Rogue,
    Warrior,
    type CharacterType,
    type ServerIdentifier,
    type ServerRegion
} from "alclient";
import { PartyController } from "../../controller/party_controller.js";
import { RunnerException } from "../../exceptions/exceptions.js";
import logger from "../../logger.js";
import { AdminCommandStrategy } from "../../strategies/admin_command_strategy.js";
import { NoAttackScareStrategy } from "../../strategies/base_attack_strategy.js";
import { BaseInventoryStrategy, BaseStrategy } from "../../strategies/base_strategy.js";
import { CharacterRunner } from "../../strategies/character_runner.js";
import { MagiportStrategy } from "../../strategies/mage/magiport_strategy.js";
import { MerchantStrategy } from "../../strategies/merchant/merchant_strategy.js";
import { MerchantUpgradeStrategy } from "../../strategies/merchant/merchant_upgrade_strategy.js";
import { AcceptPartyRequest, RequestParty } from "../../strategies/party_strategy.js";
import { PartyHealStrategy } from "../../strategies/priest/party_heal_strategy.js";
import { UnstackStrategy } from "../../strategies/unstack_strategy.js";
import { MY_CHARACTERS, STORE_ITEMS } from "../settings.js";
import { ignoreExceptions, sleep } from "./general.js";

export function shouldGoBank(bot: PingCompensatedCharacter): boolean {
    for (const [, item] of bot.getItems()) {
        if (item.l) continue;
        for (let [name, storeInfo] of STORE_ITEMS) {
            if (item.name == name && (!item.level || item.level >= storeInfo.level)) {
                return true;
            }
        }
    }

    return false;
}

export async function massMagiport(
    summoner: PingCompensatedCharacter,
    toSummon: string[],
    shouldWait?: boolean,
    signal?: AbortSignal
): Promise<void> {
    if (summoner.ctype != "mage") {
        return;
    }
    if (!toSummon || toSummon.length == 0) {
        return;
    }

    if (shouldWait === undefined) {
        shouldWait = false;
    }
    if (signal === undefined) {
        signal = new AbortController().signal;
    }

    let needMp: number = toSummon.length * Game.G.skills.magiport.mp;

    while (summoner.mp < needMp && shouldWait && !signal.aborted) {
        await sleep(1000);
    }
    signal.throwIfAborted();

    for (let target of toSummon) {
        await (summoner as Mage).magiport(target).catch(ignoreExceptions);
    }
}

export async function startCharacter(
    partyController: PartyController,
    name: string,
    ctype?: CharacterType,
    serverName?: ServerRegion,
    serverId?: ServerIdentifier
): Promise<CharacterRunner<PingCompensatedCharacter> | undefined> {
    try {
        if (!serverName) serverName = partyController.config.homeServerName;
        if (!serverId) serverId = partyController.config.homeServerId;

        if (!ctype) {
            if (!MY_CHARACTERS.has(name)) {
                throw new RunnerException(
                    "InitializationException",
                    `Could not find character with name ${name} in list of MY_CHARACTERS`
                );
            }
            ctype = MY_CHARACTERS.get(name);
        }

        let baseStrategy: BaseStrategy<PingCompensatedCharacter> = new BaseStrategy(partyController, {
            hpPotType: "hpot1",
            mpPotType: "mpot1",
            useHpAt: 0.8,
            useMpAt: 0.5,
            keepPotions: { max: 5000, min: 3000 }
        });
        let runner: CharacterRunner<PingCompensatedCharacter> = undefined;

        switch (ctype) {
            case "warrior": {
                let character: Warrior = await Game.startWarrior(name, serverName, serverId);
                runner = new CharacterRunner(character, baseStrategy);
                checkRunner(runner, name, ctype);

                break;
            }
            case "mage": {
                let character: Mage = await Game.startMage(name, serverName, serverId);
                runner = new CharacterRunner(character, baseStrategy);
                checkRunner(runner, name, ctype);

                runner.applyStrategy(new MagiportStrategy(partyController));
                break;
            }
            case "priest": {
                let character: Priest = await Game.startPriest(name, serverName, serverId);
                runner = new CharacterRunner(character, baseStrategy);
                checkRunner(runner, name, ctype);

                runner.applyStrategy(new PartyHealStrategy(partyController));
                break;
            }
            case "merchant": {
                let character: Merchant = await Game.startMerchant(name, serverName, serverId);
                runner = new CharacterRunner(character, baseStrategy);
                checkRunner(runner, name, ctype);

                runner.applyStrategy(new NoAttackScareStrategy());
                runner.applyStrategy(new MerchantStrategy(partyController));
                runner.applyStrategy(new MerchantUpgradeStrategy());
                break;
            }
            case "ranger": {
                let character: Ranger = await Game.startRanger(name, serverName, serverId);
                runner = new CharacterRunner(character, baseStrategy);
                checkRunner(runner, name, ctype);

                break;
            }
            case "paladin": {
                let character: Paladin = await Game.startPaladin(name, serverName, serverId);
                runner = new CharacterRunner(character, baseStrategy);
                checkRunner(runner, name, ctype);

                break;
            }
            case "rogue": {
                let character: Rogue = await Game.startRogue(name, serverName, serverId);
                runner = new CharacterRunner(character, baseStrategy);
                checkRunner(runner, name, ctype);

                break;
            }
            default: {
                logger.warn(`No handler for character ${name} of ctype ${ctype} found`);
                return undefined;
            }
        }

        if (runner.bot.id == partyController.config.partyLeader) {
            runner.applyStrategy(new AcceptPartyRequest({ accept: partyController.config.partyAllow }));
        } else {
            runner.applyStrategy(new RequestParty(partyController.config.partyLeader));
        }

        if (runner.bot.ctype != "merchant") {
            runner.applyStrategy(new BaseInventoryStrategy(partyController, { enableSend: true, enableSell: true }));
        } else {
            runner.applyStrategy(
                new BaseInventoryStrategy(partyController, {
                    enableSell: true,
                    enableExchange: true,
                    enableDismantle: true
                })
            );
        }

        runner.applyStrategy(new UnstackStrategy());
        runner.applyStrategy(new AdminCommandStrategy(partyController));

        return runner;
    } catch (ex) {
        logger.error(ex);

        if (!(ex instanceof RunnerException)) {
            // Reconnect again
            await sleep(5000);
            return startCharacter(partyController, name, ctype, serverName, serverId);
        } else if (ex.message.includes("wait_")) {
            await sleep(5000);
            return startCharacter(partyController, name, ctype, serverName, serverId);
        }
    }
}

function checkRunner(runner: CharacterRunner<PingCompensatedCharacter>, name: string, ctype: CharacterType): void {
    if (!runner)
        throw new RunnerException(
            "InitializationException",
            `Failed to initialize runner for character ${name} of ctype ${ctype}`
        );
}
