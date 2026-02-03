import { MonsterName } from "alclient";
import logger from "../logger";
import { PartyController } from "../controller/party_controller";
import { getArmadilloQuestConfig } from "./quests/armadillo";
import { getBatQuestConfig } from "./quests/bat";
import { getBeeQuestConfig } from "./quests/bee";
import { getCrabQuestConfig } from "./quests/crab";
import { getCrabxQuestConfig } from "./quests/crabx";
import { getGooQuestConfig } from "./quests/goo";
import { getMinimushQuestConfig } from "./quests/minimush";
import { getOsnakeQuestConfig } from "./quests/osnake";
import { getPorcupineQuestConfig } from "./quests/porcupine";
import { getRatQuestConfig } from "./quests/rat";
import { getSnakeQuestConfig } from "./quests/snake";
import { getSquigQuestConfig } from "./quests/squig";
import { getStonewormQuestConfig } from "./quests/stoneworm";
import { SpotConfig } from "./spot_configs";

export function getQuestConfig(partyController: PartyController, questName: MonsterName): SpotConfig | undefined {
    switch (questName) {
        case "porcupine":
            return getPorcupineQuestConfig(partyController);
        case "bee":
            return getBeeQuestConfig(partyController);
        case "goo":
            return getGooQuestConfig(partyController);
        case "snake":
            return getSnakeQuestConfig(partyController);
        case "crab":
            return getCrabQuestConfig(partyController);
        case "rat":
            return getRatQuestConfig(partyController);
        case "squig":
            return getSquigQuestConfig(partyController);
        case "stoneworm":
            return getStonewormQuestConfig(partyController);
        case "crabx":
            return getCrabxQuestConfig(partyController);
        case "osnake":
            return getOsnakeQuestConfig(partyController);
        case "minimush":
            return getMinimushQuestConfig(partyController);
        case "bat":
            return getBatQuestConfig(partyController);
        case "armadillo":
            return getArmadilloQuestConfig(partyController);
        default: {
            logger.warn(`Could not find quest named ${questName}`);
            return undefined;
        }
    }
}
