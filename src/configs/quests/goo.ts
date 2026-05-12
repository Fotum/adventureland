import type { PingCompensatedCharacter } from "alclient";
import { PartyController } from "../../controller/party_controller.js";
import type { Strategy } from "../../strategies/character_runner.js";
import { MageAttackStrategy } from "../../strategies/mage/mage_attack_strategy.js";
import { BaseMoveStrategy } from "../../strategies/move_strategies.js";
import { MAGE_FAST } from "../equipment_setups.js";
import { type SpotConfig } from "../spot_configs.js";

export function getGooQuestConfig(partyController: PartyController): SpotConfig {
    return {
        mage: {
            attack: new MageAttackStrategy(partyController, {
                type: "goo",
                equipmentSet: MAGE_FAST,
                disableCburst: true
            }) as unknown as Strategy<PingCompensatedCharacter>,
            move: new BaseMoveStrategy("goo")
        }
    };
}
