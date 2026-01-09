import { PartyController } from "../../controller/party_controller";
import { MageAttackStrategy, DEFAULT_ENERGIZE } from "../../strategies/mage/mage_attack_strategy";
import { KiteInCircleStrategy, HoldPositionStrategy } from "../../strategies/move_strategies";
import { PriestAttackStrategy } from "../../strategies/priest/priest_attack_strategy";
import { WarriorAttackStrategy } from "../../strategies/warrior/warrior_attack_strategy";
import { WARRIOR_AOE, MAGE_AOE, PRIEST_TANKY } from "../equipment_setups";
import { SpotConfig } from "../spot_configs";

export function getFireroamerSpotConfig(partyController: PartyController): SpotConfig {
    return {
        warrior: {
            attack: new WarriorAttackStrategy(partyController, {
                type: "fireroamer",
                notType: "ent",
                maximumTargets: 2,
                equipmentSet: WARRIOR_AOE,
                enableEquipForCleave: true,
                enableEquipForStomp: true,
                disableKillSteal: true
            }),
            move: new KiteInCircleStrategy({
                centre: partyController.getRunner(partyController.config.mainTank),
                radius: 100,
                typeList: ["fireroamer"]
            })
        },
        mage: {
            attack: new MageAttackStrategy(partyController, {
                type: "fireroamer",
                notType: "ent",
                enableGreedyAggro: false,
                maximumTargets: 2,
                equipmentSet: MAGE_AOE,
                disableCburst: true,
                disableKillSteal: true,
                energize: DEFAULT_ENERGIZE
            }),
            move: new KiteInCircleStrategy({
                centre: partyController.getRunner(partyController.config.mainTank),
                radius: 100,
                typeList: ["fireroamer"]
            })
        },
        priest: {
            attack: new PriestAttackStrategy(partyController, {
                type: "fireroamer",
                notType: "ent",
                maximumTargets: 2,
                equipmentSet: PRIEST_TANKY,
                startHealingAtRatio: 0.8,
                disableKillSteal: true,
                disableZapper: true
            }),
            move: new KiteInCircleStrategy({
                centre: { map: "desertland", x: 241, y: -835 },
                radius: 140,
                typeList: ["fireroamer"]
            })
        },
        merchant: {
            move: new HoldPositionStrategy({ position: { x: 1308, y: -331, map: "main" } })
        }
    };
}
