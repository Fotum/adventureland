import { PartyController } from "../../controller/party_controller";
import { MageAttackStrategy } from "../../strategies/mage/mage_attack_strategy";
import { BaseMoveStrategy } from "../../strategies/move_strategies";
import { MAGE_AOE } from "../equipment_setups";
import { SpotConfig } from "../spot_configs";

export function getBatQuestConfig(partyController: PartyController): SpotConfig {
    return {
        mage: {
            attack: new MageAttackStrategy(partyController, {
                typeList: ["bat", "phoenix", "mvampire"],
                enableGreedyAggro: ["phoenix", "mvampire"],
                equipmentSet: MAGE_AOE
            }),
            move: new BaseMoveStrategy(["bat", "phoenix", "mvampire"])
        }
    };
}
