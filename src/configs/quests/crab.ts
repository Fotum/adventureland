import { PartyController } from "../../controller/party_controller";
import { MageAttackStrategy } from "../../strategies/mage/mage_attack_strategy";
import { BaseMoveStrategy } from "../../strategies/move_strategies";
import { MAGE_AOE } from "../equipment_setups";
import { SpotConfig } from "../spot_configs";

export function getCrabQuestConfig(partyController: PartyController): SpotConfig {
    return {
        mage: {
            attack: new MageAttackStrategy(partyController, {
                typeList: ["crab", "phoenix"],
                enableGreedyAggro: ["phoenix"],
                maximumTargets: 4,
                equipmentSet: MAGE_AOE
            }),
            move: new BaseMoveStrategy("crab")
        }
    };
}
