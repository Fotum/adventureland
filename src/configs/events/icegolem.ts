import { PartyController } from "../../controller/party_controller";
import { MageAttackStrategy, DEFAULT_ENERGIZE } from "../../strategies/mage/mage_attack_strategy";
import { HoldPositionStrategy } from "../../strategies/move_strategies";
import { PriestAttackStrategy } from "../../strategies/priest/priest_attack_strategy";
import { WarriorAttackStrategy } from "../../strategies/warrior/warrior_attack_strategy";
import { WARRIOR_DPS, MAGE_DPS, PRIEST_TANKY_MAGIC } from "../equipment_setups";
import { EventConfig } from "../event_configs";

export function getIcegolemConfig(partyController: PartyController): EventConfig {
    return {
        targets: ["icegolem"],
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
                }),
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
                }),
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
                }),
                move: new HoldPositionStrategy({ position: { map: "winterland", x: 824, y: 415 }, delta: 45 })
            }
        }
    };
}
