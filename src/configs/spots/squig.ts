import { PartyController } from "../../controller/party_controller";
import { DEFAULT_ENERGIZE, MageAttackStrategy } from "../../strategies/mage/mage_attack_strategy";
import { BaseMoveStrategy } from "../../strategies/move_strategies";
import { PriestAttackStrategy } from "../../strategies/priest/priest_attack_strategy";
import { WarriorAttackStrategy } from "../../strategies/warrior/warrior_attack_strategy";
import { MAGE_AOE, PRIEST_MF, WARRIOR_AOE } from "../equipment_setups";
import { SpotConfig } from "../spot_configs";

export function getSquigSpotConfig(partyController: PartyController): SpotConfig {
    return {
        warrior: {
            attack: new WarriorAttackStrategy(partyController, {
                typeList: ["squig", "squigtoad", "frog", "phoenix"],
                enableGreedyAggro: true,
                maximumTargets: 5,
                equipmentSet: WARRIOR_AOE,
                enableEquipForCleave: true,
                enableEquipForStomp: true
            }),
            move: new BaseMoveStrategy(["squig", "squigtoad", "frog", "phoenix"])
        },
        mage: {
            attack: new MageAttackStrategy(partyController, {
                typeList: ["squig", "squigtoad", "frog", "phoenix"],
                enableGreedyAggro: true,
                maximumTargets: 5,
                equipmentSet: MAGE_AOE,
                energize: DEFAULT_ENERGIZE
            }),
            move: new BaseMoveStrategy(["squig", "squigtoad", "frog", "phoenix"])
        },
        priest: {
            attack: new PriestAttackStrategy(partyController, {
                typeList: ["squig", "squigtoad", "frog", "phoenix"],
                enableGreedyAggro: true,
                maximumTargets: 10,
                equipmentSet: PRIEST_MF,
                enableAbsorbToTank: true,
                startHealingAtRatio: 0.8
            }),
            move: new BaseMoveStrategy(["squig", "squigtoad", "frog", "phoenix"])
        }
    };
}
