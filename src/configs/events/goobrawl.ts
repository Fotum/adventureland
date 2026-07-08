import type { PingCompensatedCharacter } from "alclient";
import { PartyController } from "../../controller/party_controller.js";
import type { Strategy } from "../../strategies/character_runner.js";
import { DEFAULT_ENERGIZE, MageAttackStrategy } from "../../strategies/mage/mage_attack_strategy.js";
import { BaseMoveStrategy, KiteInCircleStrategy } from "../../strategies/move_strategies.js";
import { PriestAttackStrategy } from "../../strategies/priest/priest_attack_strategy.js";
import { RangerAttackStrategy } from "../../strategies/ranger/ranger_attack_strategy.js";
import { WarriorAttackStrategy } from "../../strategies/warrior/warrior_attack_strategy.js";
import { MAGE_AOE, PRIEST_GF, RANGER_DPS, WARRIOR_AOE } from "../equipment_setups.js";
import { type EventConfig } from "../event_configs.js";

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
                }) as unknown as Strategy<PingCompensatedCharacter>,
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
                }) as unknown as Strategy<PingCompensatedCharacter>,
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
                }) as unknown as Strategy<PingCompensatedCharacter>,
                move: new BaseMoveStrategy(["pinkgoo", "bgoo", "rgoo"])
            },
            ranger: {
                attack: new RangerAttackStrategy(partyController, {
                    typeList: ["pinkgoo", "bgoo", "rgoo"],
                    equipmentSet: RANGER_DPS,
                    disableSuperShot: true
                }) as unknown as Strategy<PingCompensatedCharacter>,
                move: new KiteInCircleStrategy({
                    centre: partyController.getRunner(partyController.config.mainTank),
                    radius: 200,
                    typeList: ["pinkgoo", "bgoo", "rgoo"]
                })
            }
        }
    };
}
