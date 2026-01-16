import { CharacterType, PingCompensatedCharacter } from "alclient";
import { SpotName } from "../base/constants";
import { PartyController } from "../controller/party_controller";
import { Strategy } from "../strategies/character_runner";
import { getArmadilloSpotConfig } from "./spots/armadillo";
import { getBatSpotConfig } from "./spots/bat";
import { getBeeSpotConfig } from "./spots/bee";
import { getBigbirdSpotConfig } from "./spots/bigbird";
import { getBoobooSpotConfig } from "./spots/booboo";
import { getCgooSpotConfig } from "./spots/cgoo";
import { getCrabSpotConfig } from "./spots/crab";
import { getCrabxSpotConfig } from "./spots/crabx";
import { getCrocSpotConfig } from "./spots/croc";
import { getFireroamerSpotConfig } from "./spots/fireroamer";
import { getGooSpotConfig } from "./spots/goo";
import { getIceroamerSpotConfig } from "./spots/iceroamer";
import { getMinimushSpotConfig } from "./spots/minimush";
import { getMoleSpotConfig } from "./spots/mole";
import { getOsnakeSpotConfig } from "./spots/osnake";
import { getPorcupineSpotConfig } from "./spots/porcupine";
import { getRatSpotConfig } from "./spots/rat";
import { getScorpionSpotConfig } from "./spots/scorpion";
import { getSnakeSpotConfig } from "./spots/snake";
import { getSpiderSpotConfig } from "./spots/spider";
import { getSquigSpotConfig } from "./spots/squig";
import { getStonewormSpotConfig } from "./spots/stoneworm";
import { getTortoiseSpotConfig } from "./spots/tortoise";
import { getXscorpionConfig } from "./spots/xscorpion";

export type SpotConfig = {
    [T in CharacterType]?: {
        attack?: Strategy<PingCompensatedCharacter>;
        move?: Strategy<PingCompensatedCharacter>;
    };
};
export function getSpotConfig(partyController: PartyController, spotName?: SpotName): SpotConfig | undefined {
    if (!spotName) {
        spotName = partyController.config.defaultSpot;
    }

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
        default: {
            console.warn(`Could not find spot named ${spotName}`);
            return undefined;
        }
    }
}
