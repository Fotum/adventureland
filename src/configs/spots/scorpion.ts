import { PartyController } from "../../controller/party_controller";
import { MageAttackStrategy, DEFAULT_ENERGIZE } from "../../strategies/mage/mage_attack_strategy";
import { BaseMoveStrategy, KiteInCircleStrategy, HoldPositionStrategy } from "../../strategies/move_strategies";
import { PriestAttackStrategy } from "../../strategies/priest/priest_attack_strategy";
import { WarriorAttackStrategy } from "../../strategies/warrior/warrior_attack_strategy";
import { WARRIOR_AOE, MAGE_AOE, PRIEST_MF } from "../equipment_setups";
import { SpotConfig } from "../spot_configs";

export function getScorpionSpotConfig(partyController: PartyController): SpotConfig {
    return {
        warrior: {
            attack: new WarriorAttackStrategy(partyController, {
                typeList: ["scorpion", "phoenix"],
                enableGreedyAggro: true,
                equipmentSet: WARRIOR_AOE,
                enableEquipForCleave: true,
                enableEquipForStomp: true
            }),
            move: new BaseMoveStrategy(["phoenix", "scorpion"])
        },
        mage: {
            attack: new MageAttackStrategy(partyController, {
                typeList: ["scorpion", "phoenix"],
                enableGreedyAggro: true,
                equipmentSet: MAGE_AOE,
                disableCburst: true,
                energize: DEFAULT_ENERGIZE
            }),
            move: new BaseMoveStrategy(["phoenix", "scorpion"])
        },
        priest: {
            attack: new PriestAttackStrategy(partyController, {
                typeList: ["scorpion", "phoenix"],
                equipmentSet: PRIEST_MF,
                enableAbsorbToTank: true,
                disableScare: true,
                startHealingAtRatio: 0.8
            }),
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
