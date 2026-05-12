import { type PingCompensatedCharacter } from "alclient";
import { PartyController } from "../../controller/party_controller.js";
import { type Strategy } from "../../strategies/character_runner.js";
import { DEFAULT_ENERGIZE, MageAttackStrategy } from "../../strategies/mage/mage_attack_strategy.js";
import { BaseMoveStrategy, HoldPositionStrategy } from "../../strategies/move_strategies.js";
import { PriestAttackStrategy } from "../../strategies/priest/priest_attack_strategy.js";
import { MAGE_AOE, PRIEST_MF } from "../equipment_setups.js";
import { type SpotConfig } from "../spot_configs.js";

export function getPorcupineSpotConfig(partyController: PartyController): SpotConfig {
    return {
        mage: {
            attack: new MageAttackStrategy(partyController, {
                type: "porcupine",
                notType: "plantoid",
                enableGreedyAggro: true,
                maximumTargets: 5,
                equipmentSet: MAGE_AOE,
                energize: DEFAULT_ENERGIZE
            }) as unknown as Strategy<PingCompensatedCharacter>,
            move: new BaseMoveStrategy(["porcupine"])
        },
        priest: {
            attack: new PriestAttackStrategy(partyController, {
                type: "porcupine",
                notType: "plantoid",
                enableGreedyAggro: true,
                maximumTargets: 5,
                equipmentSet: PRIEST_MF,
                enableAbsorbToTank: true,
                startHealingAtRatio: 0.8
            }) as unknown as Strategy<PingCompensatedCharacter>,
            move: new BaseMoveStrategy(["porcupine"])
        },
        merchant: {
            move: new HoldPositionStrategy({ position: { x: -585, y: 320, map: "desertland" } })
        }
    };
}
