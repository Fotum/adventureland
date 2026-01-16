import { PartyController } from "../../controller/party_controller";
import { MageAttackStrategy } from "../../strategies/mage/mage_attack_strategy";
import { BaseMoveStrategy } from "../../strategies/move_strategies";
import { MAGE_FAST } from "../equipment_setups";
import { SpotConfig } from "../spot_configs";

export function getGooQuestConfig(partyController: PartyController): SpotConfig {
    return {
        mage: {
            attack: new MageAttackStrategy(partyController, {
                type: "goo",
                enableGreedyAggro: true,
                equipmentSet: MAGE_FAST,
                disableCburst: true
            }),
            move: new BaseMoveStrategy("goo")
        }
    };
}
