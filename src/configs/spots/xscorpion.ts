import { PartyController } from "../../controller/party_controller";
import { NoAttackScareStrategy } from "../../strategies/base_attack_strategy";
import { DEFAULT_ENERGIZE, MageAttackStrategy } from "../../strategies/mage/mage_attack_strategy";
import { HoldPositionStrategy, KiteInCircleStrategy, MoveInCircleStrategy } from "../../strategies/move_strategies";
import { PriestAttackStrategy } from "../../strategies/priest/priest_attack_strategy";
import { WarriorAttackStrategy } from "../../strategies/warrior/warrior_attack_strategy";
import { MAGE_AOE, PRIEST_TANKY_PHYSICAL, WARRIOR_AOE } from "../equipment_setups";
import { SpotConfig } from "../spot_configs";

export function getXscorpionConfig(partyController: PartyController): SpotConfig {
    return {
        warrior: {
            attack: new WarriorAttackStrategy(partyController, {
                typeList: ["xscorpion", "minimush", "phoenix"],
                maximumTargets: 3,
                equipmentSet: WARRIOR_AOE,
                enableEquipForCleave: true,
                enableEquipForStomp: true,
                disableAgitate: true
            }),
            move: new KiteInCircleStrategy({
                centre: partyController.getRunner(partyController.config.mainTank),
                radius: 35,
                typeList: ["xscorpion", "minimush", "phoenix"]
            })
        },
        mage: {
            attack: new MageAttackStrategy(partyController, {
                typeList: ["xscorpion", "minimush", "phoenix"],
                maximumTargets: 2,
                equipmentSet: MAGE_AOE,
                disableCburst: true,
                energize: DEFAULT_ENERGIZE
            }),
            move: new HoldPositionStrategy({ position: { map: "halloween", x: -164, y: 723 } })
        },
        priest: {
            attack: new PriestAttackStrategy(partyController, {
                typeList: ["xscorpion", "minimush", "phoenix"],
                equipmentSet: PRIEST_TANKY_PHYSICAL,
                enableGreedyAggro: true,
                startHealingAtRatio: 0.8,
                enableAbsorbToTank: true,
                disableZapperAttack: true
            }),
            move: new MoveInCircleStrategy({ centre: { map: "halloween", x: -257, y: 726 }, radius: 35, sides: 4 })
        },
        merchant: {
            attack: new NoAttackScareStrategy(),
            move: new HoldPositionStrategy({ position: { map: "halloween", x: -189, y: 676 } })
        }
    };
}
