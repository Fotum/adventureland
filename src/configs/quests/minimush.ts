import { PartyController } from "../../controller/party_controller";
import { MageAttackStrategy } from "../../strategies/mage/mage_attack_strategy";
import { HoldPositionStrategy } from "../../strategies/move_strategies";
import { MAGE_AOE } from "../equipment_setups";
import { SpotConfig } from "../spot_configs";

export function getMinimushQuestConfig(partyController: PartyController): SpotConfig {
    return {
        mage: {
            attack: new MageAttackStrategy(partyController, {
                typeList: ["minimush", "phoenix"],
                notType: "greenfairy",
                maximumTargets: 3,
                equipmentSet: MAGE_AOE
            }),
            move: new HoldPositionStrategy({ position: { map: "halloween", x: 14, y: 414 } })
        }
    };
}
