import type { PingCompensatedCharacter } from "alclient";
import { PartyController } from "../../controller/party_controller.js";
import type { Strategy } from "../../strategies/character_runner.js";
import { MageAttackStrategy } from "../../strategies/mage/mage_attack_strategy.js";
import { KiteInCircleStrategy } from "../../strategies/move_strategies.js";
import { MAGE_DPS } from "../equipment_setups.js";
import { type SpotConfig } from "../spot_configs.js";

export function getStonewormQuestConfig(partyController: PartyController): SpotConfig {
    return {
        mage: {
            attack: new MageAttackStrategy(partyController, {
                type: "stoneworm",
                equipmentSet: MAGE_DPS
            }) as unknown as Strategy<PingCompensatedCharacter>,
            move: new KiteInCircleStrategy({
                centre: { map: "spookytown", x: 860, y: -14 },
                radius: 100,
                typeList: ["stoneworm"]
            })
        }
    };
}
