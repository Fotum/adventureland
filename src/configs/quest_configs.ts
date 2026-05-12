import { type MonsterName } from "alclient";
import { PartyController } from "../controller/party_controller.js";
import logger from "../logger.js";
import { getArmadilloQuestConfig } from "./quests/armadillo.js";
import { getBatQuestConfig } from "./quests/bat.js";
import { getBeeQuestConfig } from "./quests/bee.js";
import { getCrabQuestConfig } from "./quests/crab.js";
import { getCrabxQuestConfig } from "./quests/crabx.js";
import { getGooQuestConfig } from "./quests/goo.js";
import { getMinimushQuestConfig } from "./quests/minimush.js";
import { getOsnakeQuestConfig } from "./quests/osnake.js";
import { getPorcupineQuestConfig } from "./quests/porcupine.js";
import { getRatQuestConfig } from "./quests/rat.js";
import { getSnakeQuestConfig } from "./quests/snake.js";
import { getSquigQuestConfig } from "./quests/squig.js";
import { getStonewormQuestConfig } from "./quests/stoneworm.js";
import { type SpotConfig } from "./spot_configs.js";

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
