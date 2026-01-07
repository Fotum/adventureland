import { CharacterType, Game, Pathfinder, PingCompensatedCharacter, ServerIdentifier, ServerRegion } from "alclient";
import { MY_CHARACTERS, SpotName } from "./base/constants";
import { startCharacter } from "./base/functions";
import { FRIENDLY_CHARACTERS } from "./base/settings";
import { BWIReporter } from "./bwi_reporter";
import { SpotConfig, getSpotConfig } from "./configs/spot_configs";
import { PartyController } from "./controller/party_controller";
import { CharacterRunner } from "./strategies/character_runner";


// await Promise.all([Game.loginJSONFile("credentials.json"), Game.getGData(true, true)]);
await Promise.all([Game.loginJSONFile("credentials_debug.json"), Game.getGData(true, true)]);
await Pathfinder.prepare(Game.G, { remove_abtesting: true, remove_test: true });

const HOME_SERVER_NAME: ServerRegion = "EU";
const HOME_SERVER_ID: ServerIdentifier = "II";
const DEFAULT_SPOT: SpotName = "cave_first";
const MAIN_TANK: string = "NIami";

const SEND_TO_NAME: string = "Fotum";
const PARTY_LEADER: string = "NIami";
const PARTY_ALLOW: string[] = [...MY_CHARACTERS.keys(), ...FRIENDLY_CHARACTERS];

const PARTY_CONTROLLER: PartyController = new PartyController({
    homeServerName: HOME_SERVER_NAME,
    homeServerId: HOME_SERVER_ID,
    defaultSpot: DEFAULT_SPOT,
    partyLeader: PARTY_LEADER,
    partyAllow: PARTY_ALLOW,
    mainTank: MAIN_TANK,
    sendToName: SEND_TO_NAME,
    doQuests: new Set<CharacterType>()
});
async function run(): Promise<void> {
    // Start characters
    await startCharacters();

    // #TODO: Load and apply character state or use default
    let spotConfig: SpotConfig = getSpotConfig(PARTY_CONTROLLER);
    for (let runner of PARTY_CONTROLLER.getRunners()) {
        let ctype: CharacterType = runner.bot.ctype;
        let config = spotConfig[ctype];

        if (config.attack) runner.applyStrategy(config.attack);
        if (config.move) runner.applyStrategy(config.move);
    }

    PARTY_CONTROLLER.startControler();

    // Initialize and start bwi
    new BWIReporter(PARTY_CONTROLLER);
    PARTY_CONTROLLER.startControler();
}
run();

async function startCharacters(): Promise<void> {
    for (let [name, ctype] of MY_CHARACTERS) {
        let runner: CharacterRunner<PingCompensatedCharacter> = await startCharacter(PARTY_CONTROLLER, name, ctype, HOME_SERVER_NAME, HOME_SERVER_ID);
        if (!runner) return;

        PARTY_CONTROLLER.addRunner(runner);
    }
}