import { Entity, PingCompensatedCharacter, Tools, type IPosition } from "alclient";
import { ignoreExceptions } from "../../base/functions/general.js";
import { PartyController } from "../../controller/party_controller.js";
import type { Strategy } from "../../strategies/character_runner.js";
import { DEFAULT_ENERGIZE, MageAttackStrategy } from "../../strategies/mage/mage_attack_strategy.js";
import { SpecialMonsterKiteStrategy } from "../../strategies/move_strategies.js";
import { PriestAttackStrategy } from "../../strategies/priest/priest_attack_strategy.js";
import { RangerAttackStrategy } from "../../strategies/ranger/ranger_attack_strategy.js";
import { WarriorAttackStrategy } from "../../strategies/warrior/warrior_attack_strategy.js";
import { MAGE_DPS, PRIEST_MF, RANGER_DPS, WARRIOR_DPS } from "../equipment_setups.js";
import { type EventConfig } from "../event_configs.js";

class PhoenixMoveStrategy<T extends PingCompensatedCharacter> extends SpecialMonsterKiteStrategy<T> {
    protected async move(bot: T): Promise<void | IPosition> {
        let target: Entity = bot.getEntity({ returnNearest: true, typeList: this.config.typeList });
        if (target) {
            return Tools.distance(bot, target) > bot.range
                ? bot
                      .smartMove(target, {
                          getWithin: bot.range - 10,
                          stopIfTrue: async (): Promise<boolean> => {
                              let target: Entity = bot.getEntity({
                                  returnNearest: true,
                                  typeList: this.config.typeList
                              });
                              if (!target) return false;
                              return Tools.distance(target, bot.smartMoving) > bot.range;
                          },
                          useBlink: true,
                          avoidTownWarps: bot.targets > 0
                      })
                      .catch(ignoreExceptions)
                : undefined;
        }
    }
}

export function getPhoenixConfig(partyController: PartyController): EventConfig {
    return {
        targets: ["phoenix", "frog"],
        scheduled: false,
        override: false,
        strategies: {
            warrior: {
                attack: new WarriorAttackStrategy(partyController, {
                    type: "phoenix",
                    equipmentSet: WARRIOR_DPS,
                    disableAgitate: true,
                    disableCleave: true,
                    enableEquipForStomp: true
                }) as unknown as Strategy<PingCompensatedCharacter>,
                move: new PhoenixMoveStrategy({ partyController: partyController, typeList: ["phoenix", "frog"] })
            },
            mage: {
                attack: new MageAttackStrategy(partyController, {
                    type: "phoenix",
                    equipmentSet: MAGE_DPS,
                    energize: DEFAULT_ENERGIZE,
                    disableCburst: true
                }) as unknown as Strategy<PingCompensatedCharacter>,
                move: new PhoenixMoveStrategy({ partyController: partyController, typeList: ["phoenix", "frog"] })
            },
            priest: {
                attack: new PriestAttackStrategy(partyController, {
                    type: "phoenix",
                    equipmentSet: PRIEST_MF,
                    startHealingAtRatio: 0.8
                }) as unknown as Strategy<PingCompensatedCharacter>,
                move: new PhoenixMoveStrategy({ partyController: partyController, typeList: ["phoenix", "frog"] })
            },
            ranger: {
                attack: new RangerAttackStrategy(partyController, {
                    type: "phoenix",
                    equipmentSet: RANGER_DPS,
                    disableMultiShot: true
                }) as unknown as Strategy<PingCompensatedCharacter>,
                move: new SpecialMonsterKiteStrategy({
                    partyController: partyController,
                    typeList: ["phoenix", "frog"]
                })
            }
        }
    };
}
