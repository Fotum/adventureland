import { Entity, IPosition, PingCompensatedCharacter, Tools } from "alclient";
import { ignoreExceptions } from "../../base/functions/general";
import { PartyController } from "../../controller/party_controller";
import { DEFAULT_ENERGIZE, MageAttackStrategy } from "../../strategies/mage/mage_attack_strategy";
import { SpecialMonsterKiteStrategy } from "../../strategies/move_strategies";
import { PriestAttackStrategy } from "../../strategies/priest/priest_attack_strategy";
import { WarriorAttackStrategy } from "../../strategies/warrior/warrior_attack_strategy";
import { MAGE_DPS, PRIEST_MF, WARRIOR_DPS } from "../equipment_setups";
import { EventConfig } from "../event_configs";

class PhoenixMoveStrategy<T extends PingCompensatedCharacter> extends SpecialMonsterKiteStrategy<T> {
    protected async move(bot: T): Promise<void | IPosition> {
        let target: Entity = bot.getEntity({ returnNearest: true, typeList: this.config.typeList });
        if (target) {
            return Tools.distance(bot, target) > bot.range
                ? bot
                      .smartMove(target, {
                          getWithin: bot.range - 10,
                          stopIfTrue: async (): Promise<boolean> => {
                              let target: Entity = bot.getEntity({ returnNearest: true, typeList: this.config.typeList });
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
                }),
                move: new PhoenixMoveStrategy({ partyController: partyController, typeList: ["phoenix", "frog"] })
            },
            mage: {
                attack: new MageAttackStrategy(partyController, {
                    type: "phoenix",
                    equipmentSet: MAGE_DPS,
                    energize: DEFAULT_ENERGIZE,
                    disableCburst: true
                }),
                move: new PhoenixMoveStrategy({ partyController: partyController, typeList: ["phoenix", "frog"] })
            },
            priest: {
                attack: new PriestAttackStrategy(partyController, {
                    type: "phoenix",
                    equipmentSet: PRIEST_MF,
                    startHealingAtRatio: 0.8
                }),
                move: new PhoenixMoveStrategy({ partyController: partyController, typeList: ["phoenix", "frog"] })
            }
        }
    };
}
