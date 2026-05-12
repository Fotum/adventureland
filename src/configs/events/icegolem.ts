import type { PingCompensatedCharacter } from "alclient";
import { PartyController } from "../../controller/party_controller.js";
import type { Strategy } from "../../strategies/character_runner.js";
import { DEFAULT_ENERGIZE, MageAttackStrategy } from "../../strategies/mage/mage_attack_strategy.js";
import { HoldPositionStrategy } from "../../strategies/move_strategies.js";
import { PriestAttackStrategy } from "../../strategies/priest/priest_attack_strategy.js";
import { WarriorAttackStrategy } from "../../strategies/warrior/warrior_attack_strategy.js";
import { MAGE_DPS, PRIEST_TANKY_MAGIC, WARRIOR_DPS } from "../equipment_setups.js";
import { type EventConfig } from "../event_configs.js";

export function getIcegolemConfig(partyController: PartyController): EventConfig {
    return {
        targets: ["icegolem"],
        scheduled: true,
        override: true,
        strategies: {
            warrior: {
                attack: new WarriorAttackStrategy(partyController, {
                    type: "icegolem",
                    disableIdleAttack: true,
                    equipmentSet: WARRIOR_DPS,
                    disableAgitate: true,
                    disableCleave: true,
                    disableStomp: true
                }) as unknown as Strategy<PingCompensatedCharacter>,
                move: new HoldPositionStrategy({ position: { map: "winterland", x: 824, y: 415 }, delta: 45 })
            },
            mage: {
                attack: new MageAttackStrategy(partyController, {
                    type: "icegolem",
                    disableIdleAttack: true,
                    equipmentSet: MAGE_DPS,
                    disableKillSteal: true,
                    disableCburst: true,
                    energize: DEFAULT_ENERGIZE
                }) as unknown as Strategy<PingCompensatedCharacter>,
                move: new HoldPositionStrategy({ position: { map: "winterland", x: 824, y: 415 }, delta: 45 })
            },
            priest: {
                attack: new PriestAttackStrategy(partyController, {
                    type: "icegolem",
                    disableIdleAttack: true,
                    enableAbsorbToTank: true,
                    maximumTargets: 3,
                    equipmentSet: PRIEST_TANKY_MAGIC,
                    enableHealStrangers: true,
                    startHealingAtRatio: 0.8
                }) as unknown as Strategy<PingCompensatedCharacter>,
                move: new HoldPositionStrategy({ position: { map: "winterland", x: 824, y: 415 }, delta: 45 })
            }
        }
    };
}
