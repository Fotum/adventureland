import { CharacterType, Game, Mage, Merchant, Pathfinder, PingCompensatedCharacter, Priest, ServerIdentifier, ServerRegion, Warrior } from "alclient";
import { MY_CHARACTERS } from "./base/constants";
import { Strategy, StrategyExecutor } from "./strategies/strategy_executor";
import { BaseStrategy } from "./strategies/base_strategy";
import { CharacterController } from "./controller/character_controller";
import { UnstuckStrategy } from "./strategies/unstack_strategy";
import { AcceptPartyRequest, RequestParty } from "./strategies/party_strategy";
import { MagiportSmartMovingStrategy } from "./strategies/mage/magiport_strategy";
import { PartyHealStrategy } from "./strategies/priest/party_heal_strategy";
import { MerchantStrategy } from "./strategies/merchant/merchant_strategy";
import { MerchantUpgradeStrategy } from "./strategies/merchant/merchant_upgrade_strategy";
import { SpotConfig, SpotName, getSpotConfig } from "./configs/spot_configs";
import { BWIReporter } from "./bwi_reporter";


await Promise.all([Game.loginJSONFile("credentials.json"), Game.getGData(true, true)]);
await Pathfinder.prepare(Game.G, { remove_abtesting: true, remove_test: true });

const HOME_SERVER_NAME: ServerRegion = "US";
const HOME_SERVER_ID: ServerIdentifier = "III";
const DEFAULT_SPOT: SpotName = "spider";

const PARTY_LEADER: string = "Flamme";
const PARTY_ALLOW: string[] = Array.from(MY_CHARACTERS.keys());

const ACTIVE: StrategyExecutor<PingCompensatedCharacter>[] = [];
async function run(): Promise<void> {
    // Start characters
    await startCharacters(HOME_SERVER_NAME, HOME_SERVER_ID);
    // Initialize controller
    // let controller: CharacterController = new CharacterController(ACTIVE, DEFAULT_SPOT);
    // Controller

    // TODO: TEMP DEBUG
    let spotConfig: SpotConfig = getSpotConfig(DEFAULT_SPOT, ACTIVE);
    for (let executor of ACTIVE) {
        let ctype: CharacterType = executor.bot.ctype;
        let config = spotConfig.farmOptions[ctype];

        if (config.attack) executor.applyStrategy(config.attack);
        if (config.move) executor.applyStrategy(config.move);
    }

    // Initialize and start bwi
    new BWIReporter(ACTIVE);
}
run();

export async function startCharacters(serverName: ServerRegion, serverId: ServerIdentifier): Promise<void> {
    let baseStrategy: Strategy<PingCompensatedCharacter> = new BaseStrategy(ACTIVE, {hpPotType: "hpot1", mpPotType: "mpot1", useHpAt: 0.8, useMpAt: 0.5});

    for (let [name, ctype] of MY_CHARACTERS) {
        let executor: StrategyExecutor<PingCompensatedCharacter>;
        try {
            switch (ctype) {
                case "warrior": {
                    let character: Warrior = await Game.startWarrior(name, serverName, serverId);
                    executor = new StrategyExecutor(character, baseStrategy);
                    break;
                }
                case "mage": {
                    let character: Mage = await Game.startMage(name, serverName, serverId);
                    executor = new StrategyExecutor(character, baseStrategy);
                    executor.applyStrategy(new MagiportSmartMovingStrategy(ACTIVE));
                    break;
                }
                case "priest": {
                    let character: Priest = await Game.startPriest(name, serverName, serverId);
                    executor = new StrategyExecutor(character, baseStrategy);
                    executor.applyStrategy(new PartyHealStrategy(ACTIVE));
                    break;
                }
                // case "merchant": {
                //     let character: Merchant = await Game.startMerchant(name, serverName, serverId);
                //     executor = new StrategyExecutor(character, baseStrategy);
                //     executor.applyStrategy(new MerchantStrategy(ACTIVE));
                //     executor.applyStrategy(new MerchantUpgradeStrategy());
                //     break;
                // }
                default:
                    console.warn(`No handler for character ${name} of ctype ${ctype} found`);
            }

            if (executor) {
                if (executor.bot.id == PARTY_LEADER) executor.applyStrategy(new AcceptPartyRequest({ accept: PARTY_ALLOW }));
                else executor.applyStrategy(new RequestParty(PARTY_LEADER));

                // executor.applyStrategy(new UnstuckStrategy());

                ACTIVE.push(executor);
            }
        } catch (ex) {
            console.error(ex);
        }
    }
}