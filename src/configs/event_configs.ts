import { CharacterType, MonsterName, PingCompensatedCharacter } from "alclient";
import { PartyController } from "../controller/party_controller";
import logger from "../logger";
import { Strategy } from "../strategies/character_runner";
import { getDragoldConfig } from "./events/dragold";
import { getFrogConfig } from "./events/frog";
import { getFvampireConfig } from "./events/fvampire";
import { getGoobrawlConfig } from "./events/goobrawl";
import { getGreenjrConfig } from "./events/greenjr";
import { getIcegolemConfig } from "./events/icegolem";
import { getJrConfig } from "./events/jr";
import { getMvampireConfig } from "./events/mvampire";
import { getPhoenixConfig } from "./events/phoenix";
import { getPinkgooConfig } from "./events/pinkgoo";
import { getSkeletorConfig } from "./events/skeletor";
import { getSnowmanConfig } from "./events/snowman";

export type EventConfig = {
    targets: MonsterName[];
    waitForRespawnMs?: number;
    override?: boolean;
    strategies: {
        [T in CharacterType]?: {
            attack?: Strategy<PingCompensatedCharacter>;
            move?: Strategy<PingCompensatedCharacter>;
        };
    };
};
export function getEventConfig(eventName: string, partyController: PartyController): EventConfig | undefined {
    switch (eventName) {
        // Events
        case "goobrawl":
            return getGoobrawlConfig(partyController);
        case "dragold":
            return getDragoldConfig(partyController);
        case "icegolem":
            return getIcegolemConfig(partyController);
        case "pinkgoo":
            return getPinkgooConfig(partyController);
        case "snowman":
            return getSnowmanConfig(partyController);

        // Special monsters
        case "phoenix":
            return getPhoenixConfig(partyController);
        case "frog":
            return getFrogConfig(partyController);
        case "fvampire":
            return getFvampireConfig(partyController);
        case "mvampire":
            return getMvampireConfig(partyController);
        case "jr":
            return getJrConfig(partyController);
        case "greenjr":
            return getGreenjrConfig(partyController);
        case "skeletor":
            return getSkeletorConfig(partyController);
        default: {
            logger.warn(`Could not find event named ${eventName}`);
            return undefined;
        }
    }
}
