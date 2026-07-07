import type { PingCompensatedCharacter } from "alclient";
import { PartyController } from "../../controller/party_controller.js";
import { NoAttackScareStrategy } from "../../strategies/base_attack_strategy.js";
import type { Strategy } from "../../strategies/character_runner.js";
import { DEFAULT_ENERGIZE, MageAttackStrategy } from "../../strategies/mage/mage_attack_strategy.js";
import { BaseMoveStrategy, HoldPositionStrategy } from "../../strategies/move_strategies.js";
import { PriestAttackStrategy } from "../../strategies/priest/priest_attack_strategy.js";
import { RangerAttackStrategy } from "../../strategies/ranger/ranger_attack_strategy.js";
import { WarriorAttackStrategy } from "../../strategies/warrior/warrior_attack_strategy.js";
import { MAGE_AOE, PRIEST_MF, WARRIOR_AOE } from "../equipment_setups.js";
import { type SpotConfig } from "../spot_configs.js";

export function getCrabSpotConfig(partyController: PartyController): SpotConfig {
    return {
        warrior: {
            attack: new WarriorAttackStrategy(partyController, {
                typeList: ["crab", "phoenix"],
                maximumTargets: 5,
                equipmentSet: WARRIOR_AOE,
                enableEquipForCleave: true,
                enableEquipForStomp: true,
                disableKillSteal: true
            }) as unknown as Strategy<PingCompensatedCharacter>,
            move: new BaseMoveStrategy(["crab", "phoenix"])
        },
        mage: {
            attack: new MageAttackStrategy(partyController, {
                typeList: ["crab", "phoenix"],
                maximumTargets: 5,
                equipmentSet: MAGE_AOE,
                energize: DEFAULT_ENERGIZE,
                disableKillSteal: true
            }) as unknown as Strategy<PingCompensatedCharacter>,
            move: new HoldPositionStrategy({ position: { map: "main", x: -1200, y: -90 } })
        },
        priest: {
            attack: new PriestAttackStrategy(partyController, {
                typeList: ["crab", "phoenix"],
                startHealingAtRatio: 0.8,
                equipmentSet: PRIEST_MF,
                enableAbsorbToTank: true,
                enableGreedyAggro: true,
                disableKillSteal: true
            }) as unknown as Strategy<PingCompensatedCharacter>,
            move: new HoldPositionStrategy({ position: { map: "main", x: -1150, y: -55 } })
        },
        ranger: {
            attack: new RangerAttackStrategy(partyController, {
                typeList: ["crab", "phoenix"],
                maximumTargets: 3,
                disableHuntersMark: true,
                disableSuperShot: true,
                disableKillSteal: true
            }) as unknown as Strategy<PingCompensatedCharacter>,
            move: new HoldPositionStrategy({ position: { map: "main", x: -1200, y: -20 } })
        },
        merchant: {
            attack: new NoAttackScareStrategy(),
            move: new HoldPositionStrategy({ position: { map: "main", x: -920, y: -40 } })
        }
    };
}
