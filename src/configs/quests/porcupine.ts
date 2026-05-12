import type { PingCompensatedCharacter } from "alclient";
import { PartyController } from "../../controller/party_controller.js";
import type { Strategy } from "../../strategies/character_runner.js";
import { MageAttackStrategy } from "../../strategies/mage/mage_attack_strategy.js";
import { HoldPositionStrategy } from "../../strategies/move_strategies.js";
import { MAGE_FAST } from "../equipment_setups.js";
import { type SpotConfig } from "../spot_configs.js";

export function getPorcupineQuestConfig(partyController: PartyController): SpotConfig {
    return {
        mage: {
            attack: new MageAttackStrategy(partyController, {
                type: "porcupine",
                notType: "plantoid",
                equipmentSet: MAGE_FAST
            }) as unknown as Strategy<PingCompensatedCharacter>,
            move: new HoldPositionStrategy({ position: { map: "desertland", x: -819, y: 179 } })
        }
    };
}
