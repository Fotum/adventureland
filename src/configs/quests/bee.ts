import { PartyController } from "../../controller/party_controller";
import { MageAttackStrategy } from "../../strategies/mage/mage_attack_strategy";
import { HoldPositionStrategy } from "../../strategies/move_strategies";
import { MAGE_FAST } from "../equipment_setups";
import { SpotConfig } from "../spot_configs";

export function getBeeQuestConfig(partyController: PartyController): SpotConfig {
    return {
        mage: {
            attack: new MageAttackStrategy(partyController, {
                typeList: ["bee", "cutebee"],
                equipmentSet: MAGE_FAST,
                disableCburst: true
            }),
            move: new HoldPositionStrategy({ position: { map: "main", x: 547, y: 1064 } })
        }
    };
}
