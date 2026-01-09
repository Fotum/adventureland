import { PartyController } from "../../controller/party_controller";
import { MageAttackStrategy, DEFAULT_ENERGIZE } from "../../strategies/mage/mage_attack_strategy";
import { BaseMoveStrategy, HoldPositionStrategy } from "../../strategies/move_strategies";
import { PriestAttackStrategy } from "../../strategies/priest/priest_attack_strategy";
import { WarriorAttackStrategy } from "../../strategies/warrior/warrior_attack_strategy";
import { WARRIOR_AOE, MAGE_AOE, PRIEST_TANKY } from "../equipment_setups";
import { SpotConfig } from "../spot_configs";

export function getMoleSpotConfig(partyController: PartyController): SpotConfig {
    return {
        warrior: {
            attack: new WarriorAttackStrategy(partyController, {
                type: "mole",
                notType: "wabbit",
                enableGreedyAggro: true,
                maximumTargets: 5,
                equipmentSet: WARRIOR_AOE,
                enableEquipForCleave: true,
                enableEquipForStomp: true
            }),
            move: new BaseMoveStrategy(["mole"])
        },
        mage: {
            attack: new MageAttackStrategy(partyController, {
                type: "mole",
                notType: "wabbit",
                enableGreedyAggro: true,
                maximumTargets: 5,
                equipmentSet: MAGE_AOE,
                energize: DEFAULT_ENERGIZE
            }),
            move: new BaseMoveStrategy(["mole"])
        },
        priest: {
            attack: new PriestAttackStrategy(partyController, {
                type: "mole",
                notType: "wabbit",
                enableGreedyAggro: true,
                maximumTargets: 5,
                equipmentSet: PRIEST_TANKY,
                enableAbsorbToTank: true,
                startHealingAtRatio: 0.8
            }),
            move: new BaseMoveStrategy(["mole"])
        },
        merchant: {
            move: new HoldPositionStrategy({ position: { x: 242, y: -21, map: "tunnel" } })
        }
    };
}
