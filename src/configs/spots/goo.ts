import { PartyController } from "../../controller/party_controller";
import { MageAttackStrategy, DEFAULT_ENERGIZE } from "../../strategies/mage/mage_attack_strategy";
import { KiteMonsterStrategy, HoldPositionStrategy } from "../../strategies/move_strategies";
import { PriestAttackStrategy } from "../../strategies/priest/priest_attack_strategy";
import { WarriorAttackStrategy } from "../../strategies/warrior/warrior_attack_strategy";
import { WARRIOR_AOE, MAGE_AOE, PRIEST_MF } from "../equipment_setups";
import { SpotConfig } from "../spot_configs";

export function getGooSpotConfig(partyController: PartyController): SpotConfig {
    return {
        warrior: {
            attack: new WarriorAttackStrategy(partyController, {
                type: "goo",
                enableGreedyAggro: true,
                maximumTargets: 5,
                equipmentSet: WARRIOR_AOE,
                enableEquipForCleave: true,
                enableEquipForStomp: true
            }),
            move: new KiteMonsterStrategy({
                partyController: partyController,
                typeList: ["goo"]
            })
        },
        mage: {
            attack: new MageAttackStrategy(partyController, {
                type: "goo",
                equipmentSet: MAGE_AOE,
                energize: DEFAULT_ENERGIZE
            }),
            move: new KiteMonsterStrategy({
                partyController: partyController,
                typeList: ["goo"]
            })
        },
        priest: {
            attack: new PriestAttackStrategy(partyController, {
                type: "goo",
                enableGreedyAggro: true,
                maximumTargets: 5,
                equipmentSet: PRIEST_MF,
                enableAbsorbToTank: true,
                startHealingAtRatio: 0.8
            }),
            move: new KiteMonsterStrategy({
                partyController: partyController,
                typeList: ["goo"]
            })
        },
        merchant: {
            move: new HoldPositionStrategy({ position: { x: -1, y: 648, map: "main" } })
        }
    };
}
