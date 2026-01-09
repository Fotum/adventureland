import { PartyController } from "../../controller/party_controller";
import { MageAttackStrategy, DEFAULT_ENERGIZE } from "../../strategies/mage/mage_attack_strategy";
import { BaseMoveStrategy } from "../../strategies/move_strategies";
import { PriestAttackStrategy } from "../../strategies/priest/priest_attack_strategy";
import { WarriorAttackStrategy } from "../../strategies/warrior/warrior_attack_strategy";
import { WARRIOR_DPS, MAGE_DPS, PRIEST_MF } from "../equipment_setups";
import { EventConfig } from "../event_configs";

export function getMvampireConfig(partyController: PartyController): EventConfig {
    return {
        targets: ["mvampire"],
        override: false,
        strategies: {
            warrior: {
                attack: new WarriorAttackStrategy(partyController, {
                    type: "mvampire",
                    equipmentSet: WARRIOR_DPS,
                    disableAgitate: true,
                    disableCleave: true,
                    enableEquipForStomp: true
                }),
                move: new BaseMoveStrategy(["mvampire"])
            },
            mage: {
                attack: new MageAttackStrategy(partyController, {
                    type: "mvampire",
                    equipmentSet: MAGE_DPS,
                    energize: DEFAULT_ENERGIZE
                }),
                move: new BaseMoveStrategy(["mvampire"])
            },
            priest: {
                attack: new PriestAttackStrategy(partyController, {
                    type: "mvampire",
                    enableAbsorbToTank: true,
                    equipmentSet: PRIEST_MF,
                    startHealingAtRatio: 0.8
                }),
                move: new BaseMoveStrategy(["mvampire"])
            }
        }
    };
}
