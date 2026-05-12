import type { PingCompensatedCharacter } from "alclient";
import { PartyController } from "../../controller/party_controller.js";
import { NoAttackScareStrategy } from "../../strategies/base_attack_strategy.js";
import type { Strategy } from "../../strategies/character_runner.js";
import { DEFAULT_ENERGIZE, MageAttackStrategy } from "../../strategies/mage/mage_attack_strategy.js";
import { HoldPositionStrategy, KiteInCircleStrategy, MoveInCircleStrategy } from "../../strategies/move_strategies.js";
import { PriestAttackStrategy } from "../../strategies/priest/priest_attack_strategy.js";
import { WarriorAttackStrategy } from "../../strategies/warrior/warrior_attack_strategy.js";
import { MAGE_AOE, PRIEST_TANKY_PHYSICAL, WARRIOR_AOE } from "../equipment_setups.js";
import { type SpotConfig } from "../spot_configs.js";

export function getDryadConfig(partyController: PartyController): SpotConfig {
    return {
        warrior: {
            attack: new WarriorAttackStrategy(partyController, {
                typeList: ["dryad"],
                maximumTargets: 3,
                equipmentSet: WARRIOR_AOE,
                enableEquipForCleave: true,
                enableEquipForStomp: true,
                disableAgitate: true
            }) as unknown as Strategy<PingCompensatedCharacter>,
            move: new KiteInCircleStrategy({
                centre: partyController.getRunner(partyController.config.mainTank),
                radius: 35,
                typeList: ["dryad"]
            })
        },
        mage: {
            attack: new MageAttackStrategy(partyController, {
                typeList: ["dryad"],
                maximumTargets: 2,
                equipmentSet: MAGE_AOE,
                disableCburst: true,
                energize: DEFAULT_ENERGIZE
            }) as unknown as Strategy<PingCompensatedCharacter>,
            move: new HoldPositionStrategy({ position: { map: "mforest", x: 198, y: -342 } })
        },
        priest: {
            attack: new PriestAttackStrategy(partyController, {
                typeList: ["dryad"],
                equipmentSet: PRIEST_TANKY_PHYSICAL,
                enableGreedyAggro: true,
                startHealingAtRatio: 0.8,
                enableAbsorbToTank: true,
                disableZapperAttack: true
            }) as unknown as Strategy<PingCompensatedCharacter>,
            move: new MoveInCircleStrategy({ centre: { map: "mforest", x: 292, y: -341 }, radius: 35, sides: 4 })
        },
        merchant: {
            attack: new NoAttackScareStrategy(),
            move: new HoldPositionStrategy({ position: { map: "mforest", x: 191, y: -239 } })
        }
    };
}
