import { PartyController } from "../../controller/party_controller";
import { MageAttackStrategy, DEFAULT_ENERGIZE } from "../../strategies/mage/mage_attack_strategy";
import { BaseMoveStrategy } from "../../strategies/move_strategies";
import { MAGE_DPS } from "../equipment_setups";
import { EventConfig } from "../event_configs";

export function getFrogConfig(partyController: PartyController): EventConfig {
    return {
        targets: ["frog", "phoenix"],
        override: false,
        strategies: {
            mage: {
                attack: new MageAttackStrategy(partyController, {
                    type: "frog",
                    equipmentSet: MAGE_DPS,
                    energize: DEFAULT_ENERGIZE
                }),
                move: new BaseMoveStrategy(["frog", "phoenix"])
            }
        }
    };
}
