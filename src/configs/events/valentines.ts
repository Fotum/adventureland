import { PartyController } from "../../controller/party_controller";
import { MageAttackStrategy, DEFAULT_ENERGIZE } from "../../strategies/mage/mage_attack_strategy";
import { BaseMoveStrategy } from "../../strategies/move_strategies";
import { PriestAttackStrategy } from "../../strategies/priest/priest_attack_strategy";
import { WarriorAttackStrategy } from "../../strategies/warrior/warrior_attack_strategy";
import { WARRIOR_DPS, MAGE_FAST, PRIEST_MF } from "../equipment_setups";
import { EventConfig } from "../event_configs";

export function getValentinesConfig(partyController: PartyController): EventConfig {
    return {
        targets: ["pinkgoo"],
        override: false,
        strategies: {
            warrior: {
                attack: new WarriorAttackStrategy(partyController, {
                    type: "pinkgoo",
                    disableIdleAttack: true,
                    equipmentSet: WARRIOR_DPS,
                    disableAgitate: true,
                    disableCleave: true,
                    disableStomp: true
                }),
                move: new BaseMoveStrategy(["pinkgoo"])
            },
            mage: {
                attack: new MageAttackStrategy(partyController, {
                    type: "pinkgoo",
                    disableIdleAttack: true,
                    equipmentSet: MAGE_FAST,
                    disableKillSteal: true,
                    disableCburst: true,
                    energize: DEFAULT_ENERGIZE
                }),
                move: new BaseMoveStrategy(["pinkgoo"])
            },
            priest: {
                attack: new PriestAttackStrategy(partyController, {
                    type: "pinkgoo",
                    disableIdleAttack: true,
                    equipmentSet: PRIEST_MF,
                    startHealingAtRatio: 0.8
                }),
                move: new BaseMoveStrategy(["pinkgoo"])
            }
        }
    };
}
