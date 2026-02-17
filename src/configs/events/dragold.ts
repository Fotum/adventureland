import { PartyController } from "../../controller/party_controller";
import { MageAttackStrategy, DEFAULT_ENERGIZE } from "../../strategies/mage/mage_attack_strategy";
import { BaseMoveStrategy } from "../../strategies/move_strategies";
import { PriestAttackStrategy } from "../../strategies/priest/priest_attack_strategy";
import { WarriorAttackStrategy } from "../../strategies/warrior/warrior_attack_strategy";
import { WARRIOR_DPS, MAGE_DPS, PRIEST_TANKY_MAGIC } from "../equipment_setups";
import { EventConfig } from "../event_configs";

export function getDragoldConfig(partyController: PartyController): EventConfig {
    return {
        targets: ["dragold"],
        scheduled: true,
        override: true,
        strategies: {
            warrior: {
                attack: new WarriorAttackStrategy(partyController, {
                    type: "dragold",
                    disableIdleAttack: true,
                    equipmentSet: WARRIOR_DPS,
                    disableAgitate: true,
                    disableCleave: true,
                    disableStomp: true
                }),
                move: new BaseMoveStrategy(["dragold"])
            },
            mage: {
                attack: new MageAttackStrategy(partyController, {
                    type: "dragold",
                    disableIdleAttack: true,
                    equipmentSet: MAGE_DPS,
                    disableCburst: true,
                    energize: DEFAULT_ENERGIZE
                }),
                move: new BaseMoveStrategy(["dragold"])
            },
            priest: {
                attack: new PriestAttackStrategy(partyController, {
                    type: "dragold",
                    disableIdleAttack: true,
                    enableAbsorbToTank: true,
                    equipmentSet: PRIEST_TANKY_MAGIC,
                    enableHealStrangers: true,
                    startHealingAtRatio: 0.8
                }),
                move: new BaseMoveStrategy(["dragold"])
            }
        }
    };
}
