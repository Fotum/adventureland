import { CharacterType, Game, Mage, Merchant, Paladin, PingCompensatedCharacter, Priest, Ranger, Rogue, ServerData, ServerIdentifier, ServerRegion, Warrior } from "alclient"
import { PartyController } from "../../controller/party_controller"
import { RunnerException } from "../../exceptions/exceptions"
import { AdminCommandStrategy } from "../../strategies/admin_command_strategy"
import { NoAttackScareStrategy } from "../../strategies/base_attack_strategy"
import { BaseInventoryStrategy } from "../../strategies/base_inventory_strategy"
import { BaseStrategy } from "../../strategies/base_strategy"
import { CharacterRunner } from "../../strategies/character_runner"
import { MagiportSmartMovingStrategy } from "../../strategies/mage/magiport_strategy"
import { MerchantStrategy } from "../../strategies/merchant/merchant_strategy"
import { MerchantUpgradeStrategy } from "../../strategies/merchant/merchant_upgrade_strategy"
import { AcceptPartyRequest, RequestParty } from "../../strategies/party_strategy"
import { PartyHealStrategy } from "../../strategies/priest/party_heal_strategy"
import { UnstackStrategy } from "../../strategies/unstack_strategy"
import { MY_CHARACTERS } from "../constants"


export type FilterRunnersOptions = {
    owner?: string
    serverData?: ServerData
}
export function filterRunners(executors: CharacterRunner<PingCompensatedCharacter>[], filters: FilterRunnersOptions = {}): CharacterRunner<PingCompensatedCharacter>[] {
    let filteredExecutors: CharacterRunner<PingCompensatedCharacter>[] = [];
    for (let executor of executors) {
        if (!executor.isReady()) continue;
        if (filters.owner && executor.bot.owner !== filters.owner) continue;
        if (filters.serverData &&
            (filters.serverData.region !== executor.bot.serverData.region ||
                filters.serverData.name !== executor.bot.serverData.name)
        ) continue;

        filteredExecutors.push(executor);
    }

    return filteredExecutors;
}

export async function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export function ignoreExceptions(): void {
    return;
}

export function generateRandomId(idLength?: number): string {
    if (!idLength) { idLength = 0xffff; }
    return (Date.now() & idLength).toString();
}

export function mssince(tsFrom: number, tsTo?: number): number {
    if (!tsTo) { tsTo = Date.now(); }
    return tsTo - tsFrom;
}

export function ssince(tsFrom: number, tsTo?: number): number {
    return Math.round(mssince(tsFrom, tsTo) / 1000);
}

export function msince(tsFrom: number, tsTo?: number): number {
    return Math.round(mssince(tsFrom, tsTo) / 60000);
}

export async function startCharacter(partyController: PartyController, name: string, ctype?: CharacterType, serverName?: ServerRegion, serverId?: ServerIdentifier): Promise<CharacterRunner<PingCompensatedCharacter> | undefined> {
    try {
        if (!serverName) serverName = partyController.config.homeServerName;
        if (!serverId) serverId = partyController.config.homeServerId;

        if (!ctype) {
            if (!MY_CHARACTERS.has(name)) {
                throw new RunnerException("InitializationException", `Could not find character with name ${name} in list of MY_CHARACTERS`);
            }

            ctype = MY_CHARACTERS.get(name);
        }

        let baseStrategy: BaseStrategy<PingCompensatedCharacter> = new BaseStrategy(partyController, { hpPotType: "hpot0", mpPotType: "mpot0", useHpAt: 0.8, useMpAt: 0.5, keepPotions: { max: 5000, min: 3000 }});
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

                runner.applyStrategy(new MagiportSmartMovingStrategy(partyController));
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
                console.warn(`No handler for character ${name} of ctype ${ctype} found`);
                return undefined;
            }
        }

        if (runner.bot.id == partyController.config.partyLeader) {
            runner.applyStrategy(new AcceptPartyRequest({ accept: partyController.config.partyAllow }));
        } else {
            runner.applyStrategy(new RequestParty(partyController.config.partyLeader));
        }

        if (runner.bot.ctype != "merchant") {
            runner.applyStrategy(new BaseInventoryStrategy(partyController));
        }

        runner.applyStrategy(new UnstackStrategy());
        runner.applyStrategy(new AdminCommandStrategy(partyController));

        return runner;
    } catch (ex) {
        console.error(ex);

        if (!(ex instanceof RunnerException)) {
            // Reconnect again
            setTimeout(async () => { startCharacter(partyController, name, ctype, serverName, serverId); }, 5000);
        }
    }
}

function checkRunner(runner: CharacterRunner<PingCompensatedCharacter>, name: string, ctype: CharacterType): void {
    if (!runner) throw new RunnerException("InitializationException", `Failed to initialize runner for character ${name} of ctype ${ctype}`);
}