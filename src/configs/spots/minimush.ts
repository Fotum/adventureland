import { PartyController } from "../../controller/party_controller";
import { MageAttackStrategy, DEFAULT_ENERGIZE } from "../../strategies/mage/mage_attack_strategy";
import { BaseMoveStrategy, HoldPositionStrategy } from "../../strategies/move_strategies";
import { PriestAttackStrategy } from "../../strategies/priest/priest_attack_strategy";
import { WarriorAttackStrategy } from "../../strategies/warrior/warrior_attack_strategy";
import { WARRIOR_AOE, MAGE_AOE, PRIEST_MF } from "../equipment_setups";
import { SpotConfig } from "../spot_configs";

export function getMinimushSpotConfig(partyController: PartyController): SpotConfig {
    return {
        warrior: {
            attack: new WarriorAttackStrategy(partyController, {
                typeList: ["minimush", "phoenix"],
                enableGreedyAggro: true,
                maximumTargets: 5,
                equipmentSet: WARRIOR_AOE,
                enableEquipForCleave: true,
                enableEquipForStomp: true
            }),
            move: new BaseMoveStrategy(["minimush", "phoenix"])
        },
        mage: {
            attack: new MageAttackStrategy(partyController, {
                typeList: ["minimush", "phoenix"],
                enableGreedyAggro: true,
                maximumTargets: 5,
                equipmentSet: MAGE_AOE,
                energize: DEFAULT_ENERGIZE
            }),
            move: new BaseMoveStrategy(["minimush", "phoenix"])
        },
        priest: {
            attack: new PriestAttackStrategy(partyController, {
                typeList: ["minimush", "phoenix"],
                enableGreedyAggro: true,
                maximumTargets: 5,
                equipmentSet: PRIEST_MF,
                enableAbsorbToTank: true,
                startHealingAtRatio: 0.8
            }),
            move: new BaseMoveStrategy(["minimush", "phoenix"])
        },
        merchant: {
            move: new HoldPositionStrategy({ position: { x: 14, y: 414, map: "halloween" } })
        }
    };
}
