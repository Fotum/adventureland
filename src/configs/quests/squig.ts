import { PartyController } from "../../controller/party_controller";
import { MageAttackStrategy } from "../../strategies/mage/mage_attack_strategy";
import { BaseMoveStrategy } from "../../strategies/move_strategies";
import { MAGE_AOE } from "../equipment_setups";
import { SpotConfig } from "../spot_configs";

export function getSquigQuestConfig(partyController: PartyController): SpotConfig {
    return {
        mage: {
            attack: new MageAttackStrategy(partyController, {
                typeList: ["squig", "squigtoad", "frog", "phoenix"],
                maximumTargets: 5,
                equipmentSet: MAGE_AOE,
                disableCburst: true
            }),
            move: new BaseMoveStrategy(["squig", "squigtoad", "frog"])
        }
    };
}
