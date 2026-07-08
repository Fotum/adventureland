import type { PingCompensatedCharacter } from "alclient";
import { PartyController } from "../../controller/party_controller.js";
import type { Strategy } from "../../strategies/character_runner.js";
import { DEFAULT_ENERGIZE, MageAttackStrategy } from "../../strategies/mage/mage_attack_strategy.js";
import { SpecialMonsterKiteStrategy } from "../../strategies/move_strategies.js";
import { PriestAttackStrategy } from "../../strategies/priest/priest_attack_strategy.js";
import { RangerAttackStrategy } from "../../strategies/ranger/ranger_attack_strategy.js";
import { WarriorAttackStrategy } from "../../strategies/warrior/warrior_attack_strategy.js";
import { MAGE_DPS, PRIEST_MF, RANGER_DPS, WARRIOR_DPS } from "../equipment_setups.js";
import { type EventConfig } from "../event_configs.js";

export function getMvampireConfig(partyController: PartyController): EventConfig {
    return {
        targets: ["mvampire"],
        scheduled: false,
        override: false,
        strategies: {
            warrior: {
                attack: new WarriorAttackStrategy(partyController, {
                    type: "mvampire",
                    equipmentSet: WARRIOR_DPS,
                    disableAgitate: true,
                    disableCleave: true,
                    enableEquipForStomp: true
                }) as unknown as Strategy<PingCompensatedCharacter>,
                move: new SpecialMonsterKiteStrategy({ partyController: partyController, typeList: ["mvampire"] })
            },
            mage: {
                attack: new MageAttackStrategy(partyController, {
                    type: "mvampire",
                    equipmentSet: MAGE_DPS,
                    energize: DEFAULT_ENERGIZE,
                    disableCburst: true
                }) as unknown as Strategy<PingCompensatedCharacter>,
                move: new SpecialMonsterKiteStrategy({ partyController: partyController, typeList: ["mvampire"] })
            },
            priest: {
                attack: new PriestAttackStrategy(partyController, {
                    type: "mvampire",
                    enableAbsorbToTank: true,
                    equipmentSet: PRIEST_MF,
                    startHealingAtRatio: 0.8
                }) as unknown as Strategy<PingCompensatedCharacter>,
                move: new SpecialMonsterKiteStrategy({ partyController: partyController, typeList: ["mvampire"] })
            },
            ranger: {
                attack: new RangerAttackStrategy(partyController, {
                    type: "mvampire",
                    equipmentSet: RANGER_DPS,
                    disableMultiShot: true
                }) as unknown as Strategy<PingCompensatedCharacter>,
                move: new SpecialMonsterKiteStrategy({ partyController: partyController, typeList: ["mvampire"] })
            }
        }
    };
}
