import { PartyController } from "../../controller/party_controller";
import { MageAttackStrategy, DEFAULT_ENERGIZE } from "../../strategies/mage/mage_attack_strategy";
import { BaseMoveStrategy } from "../../strategies/move_strategies";
import { PriestAttackStrategy } from "../../strategies/priest/priest_attack_strategy";
import { WarriorAttackStrategy } from "../../strategies/warrior/warrior_attack_strategy";
import { WARRIOR_DPS, MAGE_DPS, PRIEST_MF } from "../equipment_setups";
import { EventConfig } from "../event_configs";

export function getFvampireConfig(partyController: PartyController): EventConfig {
    return {
        targets: ["fvampire"],
        override: false,
        strategies: {
            warrior: {
                attack: new WarriorAttackStrategy(partyController, {
                    type: "fvampire",
                    equipmentSet: WARRIOR_DPS,
                    disableAgitate: true,
                    disableCleave: true,
                    enableEquipForStomp: true
                }),
                move: new BaseMoveStrategy(["fvampire"])
            },
            mage: {
                attack: new MageAttackStrategy(partyController, {
                    type: "fvampire",
                    equipmentSet: MAGE_DPS,
                    energize: DEFAULT_ENERGIZE
                }),
                move: new BaseMoveStrategy(["fvampire"])
            },
            priest: {
                attack: new PriestAttackStrategy(partyController, {
                    type: "fvampire",
                    enableAbsorbToTank: true,
                    equipmentSet: PRIEST_MF,
                    startHealingAtRatio: 0.8
                }),
                move: new BaseMoveStrategy(["fvampire"])
            }
        }
    };
}
