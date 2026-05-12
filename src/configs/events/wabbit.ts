import type { PingCompensatedCharacter } from "alclient";
import { PartyController } from "../../controller/party_controller.js";
import type { Strategy } from "../../strategies/character_runner.js";
import { DEFAULT_ENERGIZE, MageAttackStrategy } from "../../strategies/mage/mage_attack_strategy.js";
import { BaseMoveStrategy } from "../../strategies/move_strategies.js";
import { PriestAttackStrategy } from "../../strategies/priest/priest_attack_strategy.js";
import { WarriorAttackStrategy } from "../../strategies/warrior/warrior_attack_strategy.js";
import { MAGE_FAST, PRIEST_MF, WARRIOR_DPS } from "../equipment_setups.js";
import { type EventConfig } from "../event_configs.js";

export function getWabbitConfig(partyController: PartyController): EventConfig {
    return {
        targets: ["wabbit"],
        scheduled: true,
        override: false,
        strategies: {
            warrior: {
                attack: new WarriorAttackStrategy(partyController, {
                    type: "wabbit",
                    disableIdleAttack: true,
                    equipmentSet: WARRIOR_DPS,
                    disableAgitate: true,
                    disableCleave: true,
                    disableStomp: true
                }) as unknown as Strategy<PingCompensatedCharacter>,
                move: new BaseMoveStrategy(["wabbit"])
            },
            mage: {
                attack: new MageAttackStrategy(partyController, {
                    type: "wabbit",
                    disableIdleAttack: true,
                    equipmentSet: MAGE_FAST,
                    disableKillSteal: true,
                    disableCburst: true,
                    energize: DEFAULT_ENERGIZE
                }) as unknown as Strategy<PingCompensatedCharacter>,
                move: new BaseMoveStrategy(["wabbit"])
            },
            priest: {
                attack: new PriestAttackStrategy(partyController, {
                    type: "wabbit",
                    disableIdleAttack: true,
                    equipmentSet: PRIEST_MF,
                    startHealingAtRatio: 0.8
                }) as unknown as Strategy<PingCompensatedCharacter>,
                move: new BaseMoveStrategy(["wabbit"])
            }
        }
    };
}
