import { CharacterType, Game, Mage, Merchant, Pathfinder, PingCompensatedCharacter, Priest, Ranger, ServerIdentifier, ServerRegion, Warrior } from "alclient";
import { FRIENDLY_CHARACTERS, MY_CHARACTERS } from "./base/constants";
import { Strategy, CharacterRunner } from "./strategies/character_runner";
import { BaseStrategy } from "./strategies/base_strategy";
import { PartyController } from "./controller/party_controller";
import { UnstuckStrategy } from "./strategies/unstack_strategy";
import { AcceptPartyRequest, RequestParty } from "./strategies/party_strategy";
import { MagiportSmartMovingStrategy } from "./strategies/mage/magiport_strategy";
import { PartyHealStrategy } from "./strategies/priest/party_heal_strategy";
import { MerchantStrategy } from "./strategies/merchant/merchant_strategy";
import { MerchantUpgradeStrategy } from "./strategies/merchant/merchant_upgrade_strategy";
import { SpotConfig, SpotName, getSpotConfig } from "./configs/spot_configs";
import { BWIReporter } from "./bwi_reporter";


// await Promise.all([Game.loginJSONFile("credentials.json"), Game.getGData(true, true)]);
await Promise.all([Game.loginJSONFile("credentials_debug.json"), Game.getGData(true, true)]);
await Pathfinder.prepare(Game.G, { remove_abtesting: true, remove_test: true });

const HOME_SERVER_NAME: ServerRegion = "EU";
const HOME_SERVER_ID: ServerIdentifier = "II";
const DEFAULT_SPOT: SpotName = "cave_first";

const PARTY_LEADER: string = "NIami";
const PARTY_ALLOW: string[] = [...MY_CHARACTERS.keys(), ...FRIENDLY_CHARACTERS];

const ACTIVE: CharacterRunner<PingCompensatedCharacter>[] = [];
async function run(): Promise<void> {
    // Start characters
    await startCharacters(HOME_SERVER_NAME, HOME_SERVER_ID);
    // Initialize controller
    // let controller: CharacterController = new CharacterController(ACTIVE, DEFAULT_SPOT);
    // Controller

    // TODO: TEMP DEBUG
    let spotConfig: SpotConfig = getSpotConfig(DEFAULT_SPOT, ACTIVE);
    for (let runner of ACTIVE) {
        let ctype: CharacterType = runner.bot.ctype;
        let config = spotConfig.farmOptions[ctype];

        if (config.attack) runner.applyStrategy(config.attack);
        if (config.move) runner.applyStrategy(config.move);
    }

    // Initialize and start bwi
    new BWIReporter(ACTIVE);
}
run();

export async function startCharacters(serverName: ServerRegion, serverId: ServerIdentifier): Promise<void> {
    let baseStrategy: Strategy<PingCompensatedCharacter> = new BaseStrategy(ACTIVE, { hpPotType: "hpot0", mpPotType: "mpot0", useHpAt: 0.8, useMpAt: 0.5, keepPotions: { max: 5000, min: 3000 }});

    for (let [name, ctype] of MY_CHARACTERS) {
        let executor: CharacterRunner<PingCompensatedCharacter>;
        try {
            switch (ctype) {
                case "warrior": {
                    let character: Warrior = await Game.startWarrior(name, serverName, serverId);
                    executor = new CharacterRunner(character, baseStrategy);
                    break;
                }
                case "mage": {
                    let character: Mage = await Game.startMage(name, serverName, serverId);
                    executor = new CharacterRunner(character, baseStrategy);
                    executor.applyStrategy(new MagiportSmartMovingStrategy(ACTIVE));
                    break;
                }
                case "priest": {
                    let character: Priest = await Game.startPriest(name, serverName, serverId);
                    executor = new CharacterRunner(character, baseStrategy);
                    executor.applyStrategy(new PartyHealStrategy(ACTIVE));
                    break;
                }
                case "merchant": {
                    let character: Merchant = await Game.startMerchant(name, serverName, serverId);
                    executor = new CharacterRunner(character, baseStrategy);
                    executor.applyStrategy(new MerchantStrategy(ACTIVE));
                    executor.applyStrategy(new MerchantUpgradeStrategy());
                    break;
                }
                case "ranger": {
                    let character: Ranger = await Game.startRanger(name, serverName, serverId);
                    executor = new CharacterRunner(character, baseStrategy);
                    break;
                }
                default:
                    console.warn(`No handler for character ${name} of ctype ${ctype} found`);
            }

            if (executor) {
                if (executor.bot.id == PARTY_LEADER) executor.applyStrategy(new AcceptPartyRequest({ accept: PARTY_ALLOW }));
                else executor.applyStrategy(new RequestParty(PARTY_LEADER));

                executor.applyStrategy(new UnstuckStrategy());

                ACTIVE.push(executor);
            }
        } catch (ex) {
            console.error(ex);
        }
    }
}