import { PartyController } from "../../controller/party_controller";
import { MageAttackStrategy } from "../../strategies/mage/mage_attack_strategy";
import { BaseMoveStrategy } from "../../strategies/move_strategies";
import { MAGE_AOE } from "../equipment_setups";
import { SpotConfig } from "../spot_configs";

export function getCrabxQuestConfig(partyController: PartyController): SpotConfig {
    return {
        mage: {
            attack: new MageAttackStrategy(partyController, {
                typeList: ["crabx", "phoenix"],
                notType: "crabxx",
                enableGreedyAggro: ["phoenix"],
                equipmentSet: MAGE_AOE
            }),
            move: new BaseMoveStrategy(["crabx"])
        }
    };
}
