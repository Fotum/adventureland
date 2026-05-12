import { type PingCompensatedCharacter } from "alclient";
import { PartyController } from "../../controller/party_controller.js";
import { type Strategy } from "../../strategies/character_runner.js";
import { DEFAULT_ENERGIZE, MageAttackStrategy } from "../../strategies/mage/mage_attack_strategy.js";
import { BaseMoveStrategy } from "../../strategies/move_strategies.js";
import { PriestAttackStrategy } from "../../strategies/priest/priest_attack_strategy.js";
import { WarriorAttackStrategy } from "../../strategies/warrior/warrior_attack_strategy.js";
import { MAGE_AOE, PRIEST_MF, WARRIOR_AOE } from "../equipment_setups.js";
import { type SpotConfig } from "../spot_configs.js";

export function getSquigSpotConfig(partyController: PartyController): SpotConfig {
    return {
        warrior: {
            attack: new WarriorAttackStrategy(partyController, {
                typeList: ["squig", "squigtoad", "frog", "phoenix"],
                enableGreedyAggro: true,
                maximumTargets: 5,
                equipmentSet: WARRIOR_AOE,
                enableEquipForCleave: true,
                enableEquipForStomp: true
            }) as unknown as Strategy<PingCompensatedCharacter>,
            move: new BaseMoveStrategy(["squig", "squigtoad", "frog", "phoenix"])
        },
        mage: {
            attack: new MageAttackStrategy(partyController, {
                typeList: ["squig", "squigtoad", "frog", "phoenix"],
                enableGreedyAggro: true,
                maximumTargets: 5,
                equipmentSet: MAGE_AOE,
                energize: DEFAULT_ENERGIZE
            }) as unknown as Strategy<PingCompensatedCharacter>,
            move: new BaseMoveStrategy(["squig", "squigtoad", "frog", "phoenix"])
        },
        priest: {
            attack: new PriestAttackStrategy(partyController, {
                typeList: ["squig", "squigtoad", "frog", "phoenix"],
                enableGreedyAggro: true,
                maximumTargets: 10,
                equipmentSet: PRIEST_MF,
                enableAbsorbToTank: true,
                startHealingAtRatio: 0.8
            }) as unknown as Strategy<PingCompensatedCharacter>,
            move: new BaseMoveStrategy(["squig", "squigtoad", "frog", "phoenix"])
        }
    };
}
