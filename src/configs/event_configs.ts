import { PingCompensatedCharacter, type CharacterType, type MonsterName } from "alclient";
import { PartyController } from "../controller/party_controller.js";
import logger from "../logger.js";
import { type Strategy } from "../strategies/character_runner.js";
import { getDragoldConfig } from "./events/dragold.js";
import { getFrogConfig } from "./events/frog.js";
import { getFvampireConfig } from "./events/fvampire.js";
import { getGoobrawlConfig } from "./events/goobrawl.js";
import { getGreenjrConfig } from "./events/greenjr.js";
import { getIcegolemConfig } from "./events/icegolem.js";
import { getJrConfig } from "./events/jr.js";
import { getMvampireConfig } from "./events/mvampire.js";
import { getPhoenixConfig } from "./events/phoenix.js";
import { getPinkgooConfig } from "./events/pinkgoo.js";
import { getSkeletorConfig } from "./events/skeletor.js";
import { getSnowmanConfig } from "./events/snowman.js";
import { getWabbitConfig } from "./events/wabbit.js";

export type EventConfig = {
    targets: MonsterName[];
    scheduled: boolean;
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
        case "wabbit":
            return getWabbitConfig(partyController);

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
