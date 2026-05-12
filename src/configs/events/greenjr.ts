import type { PingCompensatedCharacter } from "alclient";
import { PartyController } from "../../controller/party_controller.js";
import type { Strategy } from "../../strategies/character_runner.js";
import { DEFAULT_ENERGIZE, MageAttackStrategy } from "../../strategies/mage/mage_attack_strategy.js";
import { SpecialMonsterKiteStrategy } from "../../strategies/move_strategies.js";
import { MAGE_DPS } from "../equipment_setups.js";
import { type EventConfig } from "../event_configs.js";

export function getGreenjrConfig(partyController: PartyController): EventConfig {
    return {
        targets: ["greenjr"],
        scheduled: false,
        override: false,
        strategies: {
            mage: {
                attack: new MageAttackStrategy(partyController, {
                    type: "greenjr",
                    equipmentSet: MAGE_DPS,
                    energize: DEFAULT_ENERGIZE
                }) as unknown as Strategy<PingCompensatedCharacter>,
                move: new SpecialMonsterKiteStrategy({ partyController: partyController, typeList: ["greenjr"] })
            }
        }
    };
}
