import type { PingCompensatedCharacter } from "alclient";
import { PartyController } from "../../controller/party_controller.js";
import type { Strategy } from "../../strategies/character_runner.js";
import { DEFAULT_ENERGIZE, MageAttackStrategy } from "../../strategies/mage/mage_attack_strategy.js";
import { BaseMoveStrategy } from "../../strategies/move_strategies.js";
import { PriestAttackStrategy } from "../../strategies/priest/priest_attack_strategy.js";
import { RangerAttackStrategy } from "../../strategies/ranger/ranger_attack_strategy.js";
import { WarriorAttackStrategy } from "../../strategies/warrior/warrior_attack_strategy.js";
import { MAGE_FAST, PRIEST_MF, WARRIOR_DPS } from "../equipment_setups.js";
import { type EventConfig } from "../event_configs.js";

export function getSnowmanConfig(partyController: PartyController): EventConfig {
    return {
        targets: ["snowman"],
        scheduled: true,
        override: false,
        strategies: {
            warrior: {
                attack: new WarriorAttackStrategy(partyController, {
                    type: "snowman",
                    equipmentSet: WARRIOR_DPS,
                    disableAgitate: true,
                    disableCleave: true,
                    disableStomp: true
                }) as unknown as Strategy<PingCompensatedCharacter>,
                move: new BaseMoveStrategy(["snowman"])
            },
            mage: {
                attack: new MageAttackStrategy(partyController, {
                    type: "snowman",
                    equipmentSet: MAGE_FAST,
                    disableKillSteal: true,
                    disableCburst: true,
                    energize: DEFAULT_ENERGIZE
                }) as unknown as Strategy<PingCompensatedCharacter>,
                move: new BaseMoveStrategy(["snowman"])
            },
            priest: {
                attack: new PriestAttackStrategy(partyController, {
                    type: "snowman",
                    equipmentSet: PRIEST_MF,
                    startHealingAtRatio: 0.8,
                    disableAbsorb: true
                }) as unknown as Strategy<PingCompensatedCharacter>,
                move: new BaseMoveStrategy(["snowman"])
            },
            ranger: {
                attack: new RangerAttackStrategy(partyController, {
                    type: "snowman",
                    disableMultiShot: true
                }) as unknown as Strategy<PingCompensatedCharacter>,
                move: new BaseMoveStrategy(["snowman"])
            }
        }
    };
}
