import { type PingCompensatedCharacter } from "alclient";
import { PartyController } from "../../controller/party_controller.js";
import { type Strategy } from "../../strategies/character_runner.js";
import { DEFAULT_ENERGIZE, MageAttackStrategy } from "../../strategies/mage/mage_attack_strategy.js";
import { BaseMoveStrategy, HoldPositionStrategy, KiteInCircleStrategy } from "../../strategies/move_strategies.js";
import { PriestAttackStrategy } from "../../strategies/priest/priest_attack_strategy.js";
import { WarriorAttackStrategy } from "../../strategies/warrior/warrior_attack_strategy.js";
import { MAGE_AOE, PRIEST_MF, WARRIOR_AOE } from "../equipment_setups.js";
import { type SpotConfig } from "../spot_configs.js";

export function getScorpionSpotConfig(partyController: PartyController): SpotConfig {
    return {
        warrior: {
            attack: new WarriorAttackStrategy(partyController, {
                typeList: ["scorpion", "phoenix"],
                enableGreedyAggro: true,
                equipmentSet: WARRIOR_AOE,
                enableEquipForCleave: true,
                enableEquipForStomp: true
            }) as unknown as Strategy<PingCompensatedCharacter>,
            move: new BaseMoveStrategy(["phoenix", "scorpion"])
        },
        mage: {
            attack: new MageAttackStrategy(partyController, {
                typeList: ["scorpion", "phoenix"],
                enableGreedyAggro: true,
                equipmentSet: MAGE_AOE,
                disableCburst: true,
                energize: DEFAULT_ENERGIZE
            }) as unknown as Strategy<PingCompensatedCharacter>,
            move: new BaseMoveStrategy(["phoenix", "scorpion"])
        },
        priest: {
            attack: new PriestAttackStrategy(partyController, {
                typeList: ["scorpion", "phoenix"],
                equipmentSet: PRIEST_MF,
                enableAbsorbToTank: true,
                disableScare: true,
                startHealingAtRatio: 0.8
            }) as unknown as Strategy<PingCompensatedCharacter>,
            move: new KiteInCircleStrategy({
                centre: { map: "main", x: 1309, y: -215 },
                radius: 30,
                typeList: ["scorpion", "phoenix"]
            })
        },
        merchant: {
            move: new HoldPositionStrategy({ position: { x: 1308, y: -331, map: "main" } })
        }
    };
}
