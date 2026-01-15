import { PartyController } from "../../controller/party_controller";
import { DEFAULT_ENERGIZE, MageAttackStrategy } from "../../strategies/mage/mage_attack_strategy";
import { KiteInCircleStrategy, HoldPositionStrategy } from "../../strategies/move_strategies";
import { PriestAttackStrategy } from "../../strategies/priest/priest_attack_strategy";
import { WarriorAttackStrategy } from "../../strategies/warrior/warrior_attack_strategy";
import { WARRIOR_DPS } from "../equipment_setups";
import { SpotConfig } from "../spot_configs";

export function getBatSpotConfig(partyController: PartyController): SpotConfig {
    return {
        warrior: {
            attack: new WarriorAttackStrategy(partyController, {
                typeList: ["bat", "goldenbat", "phoenix", "mvampire"],
                maximumTargets: 15,
                equipmentSet: WARRIOR_DPS,
                enableEquipForCleave: true
            }),
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
                // equipmentSet: MAGE_AOE,
                disableCburst: false,
                energize: DEFAULT_ENERGIZE
            }),
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
                // equipmentSet: PRIEST_MF,
                disableCurse: true,
                enableAbsorbToTank: true,
                startHealingAtRatio: 0.8
            }),
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
