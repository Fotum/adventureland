import { PartyController } from "../../controller/party_controller";
import { MageAttackStrategy } from "../../strategies/mage/mage_attack_strategy";
import { BaseMoveStrategy } from "../../strategies/move_strategies";
import { MAGE_FAST } from "../equipment_setups";
import { SpotConfig } from "../spot_configs";

export function getCrabQuestConfig(partyController: PartyController): SpotConfig {
    return {
        mage: {
            attack: new MageAttackStrategy(partyController, {
                typeList: ["crab", "phoenix"],
                enableGreedyAggro: ["phoenix"],
                equipmentSet: MAGE_FAST
            }),
            move: new BaseMoveStrategy("crab")
        }
    };
}
