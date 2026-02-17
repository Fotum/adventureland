import { PartyController } from "../../controller/party_controller";
import { DEFAULT_ENERGIZE, MageAttackStrategy } from "../../strategies/mage/mage_attack_strategy";
import { SpecialMonsterKiteStrategy } from "../../strategies/move_strategies";
import { PriestAttackStrategy } from "../../strategies/priest/priest_attack_strategy";
import { WarriorAttackStrategy } from "../../strategies/warrior/warrior_attack_strategy";
import { MAGE_DPS, PRIEST_TANKY_MAGIC, WARRIOR_DPS } from "../equipment_setups";
import { EventConfig } from "../event_configs";

export function getSkeletorConfig(partyController: PartyController): EventConfig {
    return {
        targets: ["skeletor"],
        scheduled: false,
        override: false,
        strategies: {
            warrior: {
                attack: new WarriorAttackStrategy(partyController, {
                    type: "skeletor",
                    equipmentSet: WARRIOR_DPS,
                    disableAgitate: true,
                    disableCleave: true,
                    disableStomp: true
                }),
                move: new SpecialMonsterKiteStrategy({ partyController: partyController, typeList: ["skeletor"] })
            },
            mage: {
                attack: new MageAttackStrategy(partyController, {
                    type: "skeletor",
                    equipmentSet: MAGE_DPS,
                    energize: DEFAULT_ENERGIZE,
                    disableCburst: true
                }),
                move: new SpecialMonsterKiteStrategy({ partyController: partyController, typeList: ["skeletor"] })
            },
            priest: {
                attack: new PriestAttackStrategy(partyController, {
                    type: "skeletor",
                    enableAbsorbToTank: true,
                    equipmentSet: PRIEST_TANKY_MAGIC,
                    startHealingAtRatio: 0.8
                }),
                move: new SpecialMonsterKiteStrategy({ partyController: partyController, typeList: ["skeletor"] })
            }
        }
    };
}
