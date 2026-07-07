import type { PingCompensatedCharacter } from "alclient";
import { PartyController } from "../../controller/party_controller.js";
import type { Strategy } from "../../strategies/character_runner.js";
import { MageAttackStrategy } from "../../strategies/mage/mage_attack_strategy.js";
import { HoldPositionStrategy } from "../../strategies/move_strategies.js";
import { MAGE_AOE } from "../equipment_setups.js";
import { type SpotConfig } from "../spot_configs.js";

export function getMinimushQuestConfig(partyController: PartyController): SpotConfig {
    return {
        mage: {
            attack: new MageAttackStrategy(partyController, {
                typeList: ["minimush", "phoenix"],
                notType: "greenfairy",
                maximumTargets: 3,
                equipmentSet: MAGE_AOE
            }) as unknown as Strategy<PingCompensatedCharacter>,
            move: new HoldPositionStrategy({ position: { map: "halloween", x: 14, y: 440 } })
        }
    };
}
