import type { PingCompensatedCharacter } from "alclient";
import { PartyController } from "../../controller/party_controller.js";
import type { Strategy } from "../../strategies/character_runner.js";
import { MageAttackStrategy } from "../../strategies/mage/mage_attack_strategy.js";
import { BaseMoveStrategy } from "../../strategies/move_strategies.js";
import { MAGE_AOE } from "../equipment_setups.js";
import { type SpotConfig } from "../spot_configs.js";

export function getCrabxQuestConfig(partyController: PartyController): SpotConfig {
    return {
        mage: {
            attack: new MageAttackStrategy(partyController, {
                typeList: ["crabx", "phoenix"],
                notType: "crabxx",
                enableGreedyAggro: ["phoenix"],
                equipmentSet: MAGE_AOE
            }) as unknown as Strategy<PingCompensatedCharacter>,
            move: new BaseMoveStrategy(["crabx"])
        }
    };
}
