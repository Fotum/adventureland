import { Constants, Mage, PingCompensatedCharacter, Player, Tools, Warrior } from "alclient";
import { PartyController } from "../../controller/party_controller.js";
import { NoAttackScareStrategy } from "../../strategies/base_attack_strategy.js";
import type { Strategy } from "../../strategies/character_runner.js";
import { DEFAULT_ENERGIZE, MageAttackStrategy } from "../../strategies/mage/mage_attack_strategy.js";
import { HoldPositionStrategy, KiteInCircleStrategy } from "../../strategies/move_strategies.js";
import { PriestAttackStrategy } from "../../strategies/priest/priest_attack_strategy.js";
import { WarriorAttackStrategy } from "../../strategies/warrior/warrior_attack_strategy.js";
import { MAGE_AOE, PRIEST_TANKY_MAGIC, WARRIOR_AOE } from "../equipment_setups.js";
import { type SpotConfig } from "../spot_configs.js";

const MAIN_TANK: string = "Archealer";
const MAX_DISTANCE: number = Constants.NPC_INTERACTION_DISTANCE_SQUARED;
class FireroamerWarriorAttackStrategy extends WarriorAttackStrategy {
    protected async attack(bot: Warrior): Promise<void> {
        let tankEntity: Player = bot.getPlayers({ isDead: false }).find((player) => player.id == MAIN_TANK);
        if (!tankEntity || Tools.squaredDistance(bot, tankEntity) > MAX_DISTANCE) {
            return;
        }

        return super.attack(bot);
    }
}

class FireroamerMageAttackStrategy extends MageAttackStrategy {
    protected async attack(bot: Mage): Promise<void> {
        let tankEntity: Player = bot.getPlayers({ isDead: false }).find((player) => player.id == MAIN_TANK);
        if (!tankEntity || Tools.squaredDistance(bot, tankEntity) > MAX_DISTANCE) {
            return;
        }

        return super.attack(bot);
    }
}

export function getFireroamerSpotConfig(partyController: PartyController): SpotConfig {
    return {
        warrior: {
            attack: new FireroamerWarriorAttackStrategy(partyController, {
                type: "fireroamer",
                notType: "ent",
                maximumTargets: 2,
                equipmentSet: WARRIOR_AOE,
                enableEquipForCleave: true,
                enableEquipForStomp: true
            }) as unknown as Strategy<PingCompensatedCharacter>,
            move: new KiteInCircleStrategy({
                centre: { map: "desertland", x: 221, y: -804 },
                radius: 150,
                typeList: ["fireroamer"]
            })
        },
        mage: {
            attack: new FireroamerMageAttackStrategy(partyController, {
                type: "fireroamer",
                notType: "ent",
                maximumTargets: 2,
                enableGreedyAggro: false,
                equipmentSet: MAGE_AOE,
                disableCburst: true,
                energize: DEFAULT_ENERGIZE
            }) as unknown as Strategy<PingCompensatedCharacter>,
            move: new KiteInCircleStrategy({
                centre: { map: "desertland", x: 221, y: -804 },
                radius: 150,
                typeList: ["fireroamer"]
            })
        },
        priest: {
            attack: new PriestAttackStrategy(partyController, {
                type: "fireroamer",
                notType: "ent",
                maximumTargets: 2,
                equipmentSet: PRIEST_TANKY_MAGIC,
                startHealingAtRatio: 0.8,
                disableZapper: true,
                disableAbsorb: true
            }) as unknown as Strategy<PingCompensatedCharacter>,
            move: new KiteInCircleStrategy({
                centre: { map: "desertland", x: 241, y: -835 },
                radius: 35,
                typeList: ["fireroamer"]
            })
        },
        merchant: {
            attack: new NoAttackScareStrategy(),
            move: new HoldPositionStrategy({ position: { map: "desertland", x: 102, y: -621 } })
        }
    };
}
