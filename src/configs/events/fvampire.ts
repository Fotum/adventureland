import { PartyController } from "../../controller/party_controller";
import { DEFAULT_ENERGIZE, MageAttackStrategy } from "../../strategies/mage/mage_attack_strategy";
import { SpecialMonsterKiteStrategy } from "../../strategies/move_strategies";
import { PriestAttackStrategy } from "../../strategies/priest/priest_attack_strategy";
import { WarriorAttackStrategy } from "../../strategies/warrior/warrior_attack_strategy";
import { MAGE_DPS, PRIEST_MF, WARRIOR_DPS } from "../equipment_setups";
import { EventConfig } from "../event_configs";

export function getFvampireConfig(partyController: PartyController): EventConfig {
    return {
        targets: ["fvampire"],
        scheduled: false,
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
                move: new SpecialMonsterKiteStrategy({ partyController: partyController, typeList: ["fvampire"] })
            },
            mage: {
                attack: new MageAttackStrategy(partyController, {
                    type: "fvampire",
                    equipmentSet: MAGE_DPS,
                    energize: DEFAULT_ENERGIZE,
                    disableCburst: true
                }),
                move: new SpecialMonsterKiteStrategy({ partyController: partyController, typeList: ["fvampire"] })
            },
            priest: {
                attack: new PriestAttackStrategy(partyController, {
                    type: "fvampire",
                    enableAbsorbToTank: true,
                    equipmentSet: PRIEST_MF,
                    startHealingAtRatio: 0.8
                }),
                move: new SpecialMonsterKiteStrategy({ partyController: partyController, typeList: ["fvampire"] })
            }
        }
    };
}
