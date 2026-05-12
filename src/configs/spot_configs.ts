import { PingCompensatedCharacter, type CharacterType } from "alclient";
import { type SpotName } from "../base/constants.js";
import { PartyController } from "../controller/party_controller.js";
import logger from "../logger.js";
import { type Strategy } from "../strategies/character_runner.js";
import { getArmadilloSpotConfig } from "./spots/armadillo.js";
import { getBatSpotConfig } from "./spots/bat.js";
import { getBeeSpotConfig } from "./spots/bee.js";
import { getBigbirdSpotConfig } from "./spots/bigbird.js";
import { getBoobooSpotConfig } from "./spots/booboo.js";
import { getCgooSpotConfig } from "./spots/cgoo.js";
import { getCrabSpotConfig } from "./spots/crab.js";
import { getCrabxSpotConfig } from "./spots/crabx.js";
import { getCrocSpotConfig } from "./spots/croc.js";
import { getDryadConfig } from "./spots/dryad.js";
import { getFireroamerSpotConfig } from "./spots/fireroamer.js";
import { getGooSpotConfig } from "./spots/goo.js";
import { getIceroamerSpotConfig } from "./spots/iceroamer.js";
import { getMinimushSpotConfig } from "./spots/minimush.js";
import { getMoleSpotConfig } from "./spots/mole.js";
import { getOsnakeSpotConfig } from "./spots/osnake.js";
import { getPorcupineSpotConfig } from "./spots/porcupine.js";
import { getRatSpotConfig } from "./spots/rat.js";
import { getScorpionSpotConfig } from "./spots/scorpion.js";
import { getSnakeSpotConfig } from "./spots/snake.js";
import { getSpiderSpotConfig } from "./spots/spider.js";
import { getSquigSpotConfig } from "./spots/squig.js";
import { getStonewormSpotConfig } from "./spots/stoneworm.js";
import { getTortoiseSpotConfig } from "./spots/tortoise.js";
import { getXscorpionConfig } from "./spots/xscorpion.js";

export type SpotConfig = {
    [T in CharacterType]?: {
        attack?: Strategy<PingCompensatedCharacter>;
        move?: Strategy<PingCompensatedCharacter>;
    };
};
export function getSpotConfig(partyController: PartyController, spotName: SpotName): SpotConfig | undefined {
    switch (spotName) {
        case "cave_first":
            return getBatSpotConfig(partyController);
        case "stoneworm":
            return getStonewormSpotConfig(partyController);
        case "booboo":
            return getBoobooSpotConfig(partyController);
        case "bee":
            return getBeeSpotConfig(partyController);
        case "crab":
            return getCrabSpotConfig(partyController);
        case "crabx":
            return getCrabxSpotConfig(partyController);
        case "squig":
            return getSquigSpotConfig(partyController);
        case "tortoise":
            return getTortoiseSpotConfig(partyController);
        case "croc":
            return getCrocSpotConfig(partyController);
        case "armadillo":
            return getArmadilloSpotConfig(partyController);
        case "rat":
            return getRatSpotConfig(partyController);
        case "mole":
            return getMoleSpotConfig(partyController);
        case "porcupine":
            return getPorcupineSpotConfig(partyController);
        case "goo":
            return getGooSpotConfig(partyController);
        case "snake":
            return getSnakeSpotConfig(partyController);
        case "cgoo":
            return getCgooSpotConfig(partyController);
        case "iceroamer":
            return getIceroamerSpotConfig(partyController);
        case "osnake":
            return getOsnakeSpotConfig(partyController);
        case "minimush":
            return getMinimushSpotConfig(partyController);
        case "bigbird":
            return getBigbirdSpotConfig(partyController);
        case "scorpion":
            return getScorpionSpotConfig(partyController);
        case "spider":
            return getSpiderSpotConfig(partyController);
        case "fireroamer":
            return getFireroamerSpotConfig(partyController);
        case "xscorpion":
            return getXscorpionConfig(partyController);
        case "dryad":
            return getDryadConfig(partyController);
        default: {
            logger.warn(`Could not find spot named ${spotName}`);
            return undefined;
        }
    }
}
