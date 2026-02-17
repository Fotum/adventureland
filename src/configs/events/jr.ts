import { PartyController } from "../../controller/party_controller";
import { MageAttackStrategy, DEFAULT_ENERGIZE } from "../../strategies/mage/mage_attack_strategy";
import { BaseMoveStrategy, SpecialMonsterKiteStrategy } from "../../strategies/move_strategies";
import { MAGE_DPS } from "../equipment_setups";
import { EventConfig } from "../event_configs";

export function getJrConfig(partyController: PartyController): EventConfig {
    return {
        targets: ["jr"],
        scheduled: false,
        override: false,
        strategies: {
            mage: {
                attack: new MageAttackStrategy(partyController, {
                    type: "jr",
                    equipmentSet: MAGE_DPS,
                    energize: DEFAULT_ENERGIZE
                }),
                move: new SpecialMonsterKiteStrategy({ partyController: partyController, typeList: ["jr"] })
            }
        }
    };
}
