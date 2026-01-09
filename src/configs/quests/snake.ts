import { PartyController } from "../../controller/party_controller";
import { MageAttackStrategy } from "../../strategies/mage/mage_attack_strategy";
import { HoldPositionStrategy } from "../../strategies/move_strategies";
import { MAGE_AOE } from "../equipment_setups";
import { SpotConfig } from "../spot_configs";

export function getSnakeQuestConfig(partyController: PartyController): SpotConfig {
    return {
        mage: {
            attack: new MageAttackStrategy(partyController, {
                type: "snake",
                enableGreedyAggro: true,
                equipmentSet: MAGE_AOE
            }),
            move: new HoldPositionStrategy({ position: { map: "main", x: -62, y: 1895 } })
        }
    };
}
