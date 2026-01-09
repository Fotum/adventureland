import { PartyController } from "../../controller/party_controller";
import { DEFAULT_ENERGIZE, MageAttackStrategy } from "../../strategies/mage/mage_attack_strategy";
import { BaseMoveStrategy } from "../../strategies/move_strategies";
import { MAGE_DPS } from "../equipment_setups";
import { EventConfig } from "../event_configs";

export function getGreenjrConfig(partyController: PartyController): EventConfig {
    return {
        targets: ["greenjr"],
        override: false,
        strategies: {
            mage: {
                attack: new MageAttackStrategy(partyController, {
                    type: "greenjr",
                    equipmentSet: MAGE_DPS,
                    energize: DEFAULT_ENERGIZE
                }),
                move: new BaseMoveStrategy(["greenjr"])
            }
        }
    };
}
