import { CharacterType, Game, Pathfinder, PingCompensatedCharacter, ServerIdentifier, ServerRegion } from "alclient";
import { FRIENDLY_CHARACTERS, MY_CHARACTERS } from "./base/constants";
import { startCharacter } from "./base/functions";
import { BWIReporter } from "./bwi_reporter";
import { SpotConfig, SpotName, getSpotConfig } from "./configs/spot_configs";
import { PartyController } from "./controller/party_controller";
import { CharacterRunner } from "./strategies/character_runner";
import { MagiportSmartMovingStrategy } from "./strategies/mage/magiport_strategy";
import { MerchantStrategy } from "./strategies/merchant/merchant_strategy";
import { MerchantUpgradeStrategy } from "./strategies/merchant/merchant_upgrade_strategy";
import { AcceptPartyRequest, RequestParty } from "./strategies/party_strategy";
import { PartyHealStrategy } from "./strategies/priest/party_heal_strategy";
import { UnstackStrategy } from "./strategies/unstack_strategy";


// await Promise.all([Game.loginJSONFile("credentials.json"), Game.getGData(true, true)]);
await Promise.all([Game.loginJSONFile("credentials_debug.json"), Game.getGData(true, true)]);
await Pathfinder.prepare(Game.G, { remove_abtesting: true, remove_test: true });

const HOME_SERVER_NAME: ServerRegion = "EU";
const HOME_SERVER_ID: ServerIdentifier = "II";
const DEFAULT_SPOT: SpotName = "cave_first";

const PARTY_LEADER: string = "NIami";
const PARTY_ALLOW: string[] = [...MY_CHARACTERS.keys(), ...FRIENDLY_CHARACTERS];

const PARTY_CONTROLLER: PartyController = new PartyController(HOME_SERVER_NAME, HOME_SERVER_ID, DEFAULT_SPOT, PARTY_LEADER, PARTY_ALLOW);
async function run(): Promise<void> {
    // Start characters
    await startCharacters();

    let spotConfig: SpotConfig = getSpotConfig(DEFAULT_SPOT, PARTY_CONTROLLER);
    for (let runner of PARTY_CONTROLLER.getRunners()) {
        let ctype: CharacterType = runner.bot.ctype;
        let config = spotConfig.farmOptions[ctype];

        if (config.attack) runner.applyStrategy(config.attack);
        if (config.move) runner.applyStrategy(config.move);
    }

    // Initialize and start bwi
    new BWIReporter(PARTY_CONTROLLER);
}
run();

async function startCharacters(): Promise<void> {
    for (let [name, ctype] of MY_CHARACTERS) {
        let runner: CharacterRunner<PingCompensatedCharacter> = await startCharacter(PARTY_CONTROLLER, name, ctype, HOME_SERVER_NAME, HOME_SERVER_ID);
        if (!runner) return;

        if (runner.bot.id == PARTY_LEADER) runner.applyStrategy(new AcceptPartyRequest({ accept: PARTY_ALLOW }));
        else runner.applyStrategy(new RequestParty(PARTY_LEADER));

        runner.applyStrategy(new UnstackStrategy());

        switch (ctype) {
            case "warrior": {
                break;
            }
            case "mage": {
                runner.applyStrategy(new MagiportSmartMovingStrategy(PARTY_CONTROLLER));
                break;
            }
            case "priest": {
                runner.applyStrategy(new PartyHealStrategy(PARTY_CONTROLLER));
                break;
            }
            case "merchant": {
                runner.applyStrategy(new MerchantStrategy(PARTY_CONTROLLER));
                runner.applyStrategy(new MerchantUpgradeStrategy());
                break;
            }
            case "ranger": {
                break;
            }
            default:
                console.warn(`No handler for character ${name} of ctype ${ctype} found`);
        }

        PARTY_CONTROLLER.addRunner(runner);
    }
}