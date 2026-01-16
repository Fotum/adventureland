import { PartyController } from "../../controller/party_controller";
import { MageAttackStrategy } from "../../strategies/mage/mage_attack_strategy";
import { HoldPositionStrategy } from "../../strategies/move_strategies";
import { MAGE_FAST } from "../equipment_setups";
import { SpotConfig } from "../spot_configs";

export function getSnakeQuestConfig(partyController: PartyController): SpotConfig {
    return {
        mage: {
            attack: new MageAttackStrategy(partyController, {
                type: "snake",
                equipmentSet: MAGE_FAST,
                disableCburst: true
            }),
            move: new HoldPositionStrategy({ position: { map: "main", x: -62, y: 1895 } })
        }
    };
}
