import type { PingCompensatedCharacter } from "alclient";
import { PartyController } from "../../controller/party_controller.js";
import type { Strategy } from "../../strategies/character_runner.js";
import { DEFAULT_ENERGIZE, MageAttackStrategy } from "../../strategies/mage/mage_attack_strategy.js";
import { BaseMoveStrategy } from "../../strategies/move_strategies.js";
import { PriestAttackStrategy } from "../../strategies/priest/priest_attack_strategy.js";
import { WarriorAttackStrategy } from "../../strategies/warrior/warrior_attack_strategy.js";
import { MAGE_DPS, PRIEST_TANKY_MAGIC, WARRIOR_DPS } from "../equipment_setups.js";
import { type EventConfig } from "../event_configs.js";

export function getDragoldConfig(partyController: PartyController): EventConfig {
    return {
        targets: ["dragold"],
        scheduled: true,
        override: true,
        strategies: {
            warrior: {
                attack: new WarriorAttackStrategy(partyController, {
                    type: "dragold",
                    disableIdleAttack: true,
                    equipmentSet: WARRIOR_DPS,
                    disableAgitate: true,
                    disableCleave: true,
                    disableStomp: true
                }) as unknown as Strategy<PingCompensatedCharacter>,
                move: new BaseMoveStrategy(["dragold"])
            },
            mage: {
                attack: new MageAttackStrategy(partyController, {
                    type: "dragold",
                    disableIdleAttack: true,
                    equipmentSet: MAGE_DPS,
                    disableCburst: true,
                    energize: DEFAULT_ENERGIZE
                }) as unknown as Strategy<PingCompensatedCharacter>,
                move: new BaseMoveStrategy(["dragold"])
            },
            priest: {
                attack: new PriestAttackStrategy(partyController, {
                    type: "dragold",
                    disableIdleAttack: true,
                    enableAbsorbToTank: true,
                    equipmentSet: PRIEST_TANKY_MAGIC,
                    enableHealStrangers: true,
                    startHealingAtRatio: 0.8
                }) as unknown as Strategy<PingCompensatedCharacter>,
                move: new BaseMoveStrategy(["dragold"])
            }
        }
    };
}
