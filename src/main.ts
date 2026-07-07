import {
    Game,
    Pathfinder,
    PingCompensatedCharacter,
    type CharacterType,
    type ServerIdentifier,
    type ServerRegion
} from "alclient";
import { type SpotName } from "./base/constants.js";
import { startCharacter } from "./base/functions/characters.js";
import { sleep } from "./base/functions/general.js";
import { FRIENDLY_CHARACTERS, MY_CHARACTERS } from "./base/settings.js";
import { BWIReporter } from "./bwi_reporter.js";
import { PartyController } from "./controller/party_controller.js";
import { wrapLog } from "./logger.js";
import { CharacterRunner } from "./strategies/character_runner.js";

// Redirect default console logging to winston logger
wrapLog();

await Promise.all([Game.loginJSONFile("credentials.json", true), Game.getGData(true, true)]);
await Pathfinder.prepare(Game.G, { remove_abtesting: true, remove_test: true });

const ACTIVE_COMP: string[] = ["RangeFotum", "MagicFotum", "Flamme", "Momental"];
const HOME_SERVER_NAME: ServerRegion = "EU";
const HOME_SERVER_ID: ServerIdentifier = "II";
const DEFAULT_SPOT: SpotName = "crab";
const MAIN_TANK: string = "Flamme";
const LOOTER: string = "Flamme";

const SEND_TO_NAME: string = "Momental";
const PARTY_LEADER: string = "Flamme";
const PARTY_ALLOW: string[] = [...MY_CHARACTERS.keys(), ...FRIENDLY_CHARACTERS];

const PARTY_CONTROLLER: PartyController = new PartyController({
    homeServerName: HOME_SERVER_NAME,
    homeServerId: HOME_SERVER_ID,
    defaultSpot: DEFAULT_SPOT,
    partyLeader: PARTY_LEADER,
    partyAllow: PARTY_ALLOW,
    mainTank: MAIN_TANK,
    sendToName: SEND_TO_NAME,
    looter: LOOTER,

    doQuests: new Set<CharacterType>(["mage"]),
    defSpotOverride: new Map<String, SpotName>(),

    enableBosses: true,
    enableCyberland: true,
    enableBanking: true
});
async function run(): Promise<void> {
    // Start characters
    for (const [name, ctype] of MY_CHARACTERS) {
        if (!ACTIVE_COMP.includes(name)) continue;
        startRunner(name, ctype);
    }

    while (
        PARTY_CONTROLLER.getRunners().length < ACTIVE_COMP.length ||
        !PARTY_CONTROLLER.getRunners().every((r) => r.isReady())
    ) {
        await sleep(1000);
    }

    // Initialize and start bwi
    new BWIReporter(PARTY_CONTROLLER);
    PARTY_CONTROLLER.startController();
}
run();

async function startRunner(name: string, ctype: CharacterType): Promise<void> {
    let runner: CharacterRunner<PingCompensatedCharacter> = await startCharacter(
        PARTY_CONTROLLER,
        name,
        ctype,
        HOME_SERVER_NAME,
        HOME_SERVER_ID
    );
    PARTY_CONTROLLER.addRunner(runner);
}
