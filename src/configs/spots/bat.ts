import type { PingCompensatedCharacter } from "alclient";
import { PartyController } from "../../controller/party_controller.js";
import type { Strategy } from "../../strategies/character_runner.js";
import { DEFAULT_ENERGIZE, MageAttackStrategy } from "../../strategies/mage/mage_attack_strategy.js";
import { HoldPositionStrategy, KiteInCircleStrategy } from "../../strategies/move_strategies.js";
import { PriestAttackStrategy } from "../../strategies/priest/priest_attack_strategy.js";
import { WarriorAttackStrategy } from "../../strategies/warrior/warrior_attack_strategy.js";
import { MAGE_AOE, PRIEST_MF, WARRIOR_DPS } from "../equipment_setups.js";
import { type SpotConfig } from "../spot_configs.js";

export function getBatSpotConfig(partyController: PartyController): SpotConfig {
    return {
        warrior: {
            attack: new WarriorAttackStrategy(partyController, {
                typeList: ["bat", "goldenbat", "phoenix", "mvampire"],
                maximumTargets: 15,
                equipmentSet: WARRIOR_DPS,
                enableEquipForCleave: true
            }) as unknown as Strategy<PingCompensatedCharacter>,
            move: new KiteInCircleStrategy({
                centre: { map: "cave", x: -200, y: -478 },
                radius: 100,
                typeList: ["bat", "mvampire", "phoenix"]
            })
        },
        mage: {
            attack: new MageAttackStrategy(partyController, {
                typeList: ["bat", "goldenbat", "phoenix", "mvampire"],
                enableGreedyAggro: ["goldenbat"],
                maximumTargets: 10,
                equipmentSet: MAGE_AOE,
                disableCburst: false,
                energize: DEFAULT_ENERGIZE
            }) as unknown as Strategy<PingCompensatedCharacter>,
            move: new KiteInCircleStrategy({
                centre: { map: "cave", x: -200, y: -478 },
                radius: 100,
                typeList: ["bat", "mvampire", "phoenix"]
            })
        },
        priest: {
            attack: new PriestAttackStrategy(partyController, {
                typeList: ["bat", "goldenbat", "phoenix", "mvampire"],
                enableGreedyAggro: true,
                maximumTargets: 15,
                equipmentSet: PRIEST_MF,
                disableCurse: true,
                enableAbsorbToTank: true,
                startHealingAtRatio: 0.8
            }) as unknown as Strategy<PingCompensatedCharacter>,
            move: new KiteInCircleStrategy({
                centre: { map: "cave", x: -200, y: -478 },
                radius: 100,
                typeList: ["bat", "mvampire", "phoenix"]
            })
        },
        merchant: {
            move: new HoldPositionStrategy({ position: { x: -200, y: -478, map: "cave" } })
        }
    };
}
