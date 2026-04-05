import { PartyController } from "../../controller/party_controller";
import { MageAttackStrategy } from "../../strategies/mage/mage_attack_strategy";
import { HoldPositionStrategy } from "../../strategies/move_strategies";
import { MAGE_AOE } from "../equipment_setups";
import { SpotConfig } from "../spot_configs";

export function getArmadilloQuestConfig(partyController: PartyController): SpotConfig {
    return {
        mage: {
            attack: new MageAttackStrategy(partyController, {
                typeList: ["armadillo", "phoenix"],
                maximumTargets: 3,
                disableCburst: true,
                equipmentSet: MAGE_AOE
            }),
            move: new HoldPositionStrategy({ position: { map: "main", x: 506, y: 1817 } })
        }
    };
}
