import { PartyController } from "../../controller/party_controller";
import { MageAttackStrategy, DEFAULT_ENERGIZE } from "../../strategies/mage/mage_attack_strategy";
import { BaseMoveStrategy } from "../../strategies/move_strategies";
import { PriestAttackStrategy } from "../../strategies/priest/priest_attack_strategy";
import { WarriorAttackStrategy } from "../../strategies/warrior/warrior_attack_strategy";
import { WARRIOR_DPS, MAGE_FAST, PRIEST_MF } from "../equipment_setups";
import { EventConfig } from "../event_configs";

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
                }),
                move: new BaseMoveStrategy(["snowman"])
            },
            mage: {
                attack: new MageAttackStrategy(partyController, {
                    type: "snowman",
                    equipmentSet: MAGE_FAST,
                    disableKillSteal: true,
                    disableCburst: true,
                    energize: DEFAULT_ENERGIZE
                }),
                move: new BaseMoveStrategy(["snowman"])
            },
            priest: {
                attack: new PriestAttackStrategy(partyController, {
                    type: "snowman",
                    equipmentSet: PRIEST_MF,
                    startHealingAtRatio: 0.8,
                    disableAbsorb: true
                }),
                move: new BaseMoveStrategy(["snowman"])
            }
        }
    };
}
