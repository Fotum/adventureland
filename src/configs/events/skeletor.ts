import { PartyController } from "../../controller/party_controller";
import { MageAttackStrategy, DEFAULT_ENERGIZE } from "../../strategies/mage/mage_attack_strategy";
import { BaseMoveStrategy } from "../../strategies/move_strategies";
import { PriestAttackStrategy } from "../../strategies/priest/priest_attack_strategy";
import { WarriorAttackStrategy } from "../../strategies/warrior/warrior_attack_strategy";
import { WARRIOR_DPS, MAGE_DPS, PRIEST_TANKY } from "../equipment_setups";
import { EventConfig } from "../event_configs";

export function getSkeletorConfig(partyController: PartyController): EventConfig {
    return {
        targets: ["skeletor"],
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
                move: new BaseMoveStrategy(["skeletor"])
            },
            mage: {
                attack: new MageAttackStrategy(partyController, {
                    type: "skeletor",
                    equipmentSet: MAGE_DPS,
                    energize: DEFAULT_ENERGIZE
                }),
                move: new BaseMoveStrategy(["skeletor"])
            },
            priest: {
                attack: new PriestAttackStrategy(partyController, {
                    type: "skeletor",
                    enableAbsorbToTank: true,
                    equipmentSet: PRIEST_TANKY,
                    startHealingAtRatio: 0.8
                }),
                move: new BaseMoveStrategy(["skeletor"])
            }
        }
    };
}
