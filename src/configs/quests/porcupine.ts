import { PartyController } from "../../controller/party_controller";
import { MageAttackStrategy } from "../../strategies/mage/mage_attack_strategy";
import { HoldPositionStrategy } from "../../strategies/move_strategies";
import { MAGE_FAST } from "../equipment_setups";
import { SpotConfig } from "../spot_configs";

export function getPorcupineQuestConfig(partyController: PartyController): SpotConfig {
    return {
        mage: {
            attack: new MageAttackStrategy(partyController, {
                type: "porcupine",
                notType: "plantoid",
                equipmentSet: MAGE_FAST
            }),
            move: new HoldPositionStrategy({ position: { map: "desertland", x: -819, y: 179 } })
        }
    };
}
