import { PartyController } from "../../controller/party_controller";
import { MageAttackStrategy, DEFAULT_ENERGIZE } from "../../strategies/mage/mage_attack_strategy";
import { BaseMoveStrategy, HoldPositionStrategy } from "../../strategies/move_strategies";
import { PriestAttackStrategy } from "../../strategies/priest/priest_attack_strategy";
import { MAGE_AOE, PRIEST_MF } from "../equipment_setups";
import { SpotConfig } from "../spot_configs";

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
            }),
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
            }),
            move: new BaseMoveStrategy(["porcupine"])
        },
        merchant: {
            move: new HoldPositionStrategy({ position: { x: -585, y: 320, map: "desertland" } })
        }
    };
}
