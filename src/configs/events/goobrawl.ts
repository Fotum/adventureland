import { PartyController } from "../../controller/party_controller";
import { DEFAULT_ENERGIZE, MageAttackStrategy } from "../../strategies/mage/mage_attack_strategy";
import { BaseMoveStrategy, FollowMoveStrategy, KiteInCircleStrategy } from "../../strategies/move_strategies";
import { PriestAttackStrategy } from "../../strategies/priest/priest_attack_strategy";
import { WarriorAttackStrategy } from "../../strategies/warrior/warrior_attack_strategy";
import { WARRIOR_AOE, MAGE_AOE, PRIEST_GF } from "../equipment_setups";
import { EventConfig } from "../event_configs";

export function getGoobrawlConfig(partyController: PartyController): EventConfig {
    return {
        targets: ["pinkgoo", "bgoo", "rgoo"],
        scheduled: true,
        waitForRespawnMs: 10_000,
        override: true,
        strategies: {
            warrior: {
                attack: new WarriorAttackStrategy(partyController, {
                    typeList: ["pinkgoo", "bgoo", "rgoo"],
                    disableIdleAttack: true,
                    enableGreedyAggro: true,
                    maximumTargets: 5,
                    equipmentSet: WARRIOR_AOE,
                    disableStomp: true,
                    enableEquipForCleave: true
                }),
                move: new KiteInCircleStrategy({
                    centre: partyController.getRunner(partyController.config.mainTank),
                    radius: 200,
                    typeList: ["pinkgoo", "bgoo", "rgoo"]
                })
            },
            mage: {
                attack: new MageAttackStrategy(partyController, {
                    typeList: ["pinkgoo", "bgoo", "rgoo"],
                    disableIdleAttack: true,
                    enableGreedyAggro: true,
                    maximumTargets: 5,
                    equipmentSet: MAGE_AOE,
                    disableScare: true,
                    energize: DEFAULT_ENERGIZE
                }),
                move: new KiteInCircleStrategy({
                    centre: partyController.getRunner(partyController.config.mainTank),
                    radius: 200,
                    typeList: ["pinkgoo", "bgoo", "rgoo"]
                })
            },
            priest: {
                attack: new PriestAttackStrategy(partyController, {
                    typeList: ["pinkgoo", "bgoo", "rgoo"],
                    disableIdleAttack: true,
                    enableGreedyAggro: true,
                    enableAbsorbToTank: true,
                    equipmentSet: PRIEST_GF,
                    startHealingAtRatio: 0.8
                }),
                move: new BaseMoveStrategy(["pinkgoo", "bgoo", "rgoo"])
            }
        }
    };
}
