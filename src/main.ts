import { CharacterType, Game, Pathfinder, PingCompensatedCharacter, ServerIdentifier, ServerRegion } from "alclient";
import { MY_CHARACTERS, SpotName } from "./base/constants";
import { sleep, startCharacter } from "./base/functions/general";
import { FRIENDLY_CHARACTERS } from "./base/settings";
import { BWIReporter } from "./bwi_reporter";
import { PartyController } from "./controller/party_controller";
import { CharacterRunner } from "./strategies/character_runner";
import { wrapLog } from "./logger";

// Redirect default console logging to winston logger
wrapLog();

await Promise.all([Game.loginJSONFile("credentials.json"), Game.getGData(true, true)]);
await Pathfinder.prepare(Game.G, { remove_abtesting: true, remove_test: true });

const DEFAULT_COMP: string[] = ["Shalfey", "MagicFotum", "Flamme", "Momental"];
const HOME_SERVER_NAME: ServerRegion = "EU";
const HOME_SERVER_ID: ServerIdentifier = "II";
const DEFAULT_SPOT: SpotName = "xscorpion";
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

    enableBosses: true,
    enableCyberland: true,
    enableBanking: true
});
async function run(): Promise<void> {
    // Start characters
    for (const [name, ctype] of MY_CHARACTERS) {
        if (!DEFAULT_COMP.includes(name)) continue;
        startRunner(name, ctype);
    }

    while (PARTY_CONTROLLER.getRunners().length < DEFAULT_COMP.length || !PARTY_CONTROLLER.getRunners().every((r) => r.isReady())) {
        await sleep(1000);
    }

    // Initialize and start bwi
    new BWIReporter(PARTY_CONTROLLER);
    PARTY_CONTROLLER.startControler();
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
