import { ActionData, ActionDataRay, EntitiesData, Entity, GItem, Game, Mage, MonsterName, PingCompensatedCharacter, Player, SlotType, Tools, TradeItemInfo, TradeSlotType } from "alclient";
import { BaseAttackConfig, BaseAttackStrategy } from "../base_attack_strategy";
import { filterExecutors, ignoreExceptions } from "../../base/functions";
import FastPriorityQueue from "fastpriorityqueue";
import { CharacterRunner } from "../character_runner";


export type MageAttackConfig = BaseAttackConfig & {
    disableCburst?: boolean,
    disableKillSteal?: boolean
    energize?: {
        onMpRatio: number,
        when: {
            mpRatio?: number
            mp?: number
            mpMissing?: number
        }
    }
}

export const DO_NOT_KILL_STEAL: MonsterName[] = ["kitty1", "kitty2", "kitty3", "kitty4", "puppy1", "puppy2", "puppy3", "puppy4"];

export class MageAttackStrategy extends BaseAttackStrategy<Mage> {
    protected config: MageAttackConfig;
    protected stealOnActionCburst: (data: ActionData) => void

    public constructor(executors: CharacterRunner<PingCompensatedCharacter>[], options?: MageAttackConfig) {
        super(executors, options);

        if (this.config.disableCburst) this.interval.push("cburst");
        if (this.config.energize) this.interval.push("energize");
    }

    public onApply(bot: Mage): void {
        super.onApply(bot);

        if (this.config.enableGreedyAggro) {
            // Remove old listener, just in case
            bot.socket.off("entities", this.greedyOnEntities);

            this.greedyOnEntities = async (data: EntitiesData) => {
                if (data.monsters.length == 0) return;
                if (this.config.maximumTargets !== undefined && bot.targets >= this.config.maximumTargets) return;
                if (!this.shouldAttack(bot)) return;

                if (!this.config.disableZapper && bot.canUse("zapperzap")) {
                    for (let monster of data.monsters) {
                        if (monster.target) continue;
                        // Check if target is in array of greedyAggro targets
                        if (Array.isArray(this.config.enableGreedyAggro) && !this.config.enableGreedyAggro.includes(monster.type)) continue;
                        // Check if target is in typeList of monsters we want to farm
                        if (this.config.typeList && !this.config.typeList.includes(monster.type)) continue;
                        if (Game.G.monsters[monster.type].immune) continue;
                        // Check if not out of range
                        if (Tools.distance(bot, monster) > Game.G.skills.zapperzap.range) continue;

                        bot.nextSkill.set("zapperzap", new Date(Date.now() - bot.ping * 2));
                        return bot.zapperZap(monster.id).catch(console.error);
                    }
                }

                if (bot.canUse("cburst")) {
                    const cbursts: [string, number][] = [];
                    for (const monster of data.monsters) {
                        if (monster.target) continue;
                        if (Array.isArray(this.config.enableGreedyAggro) && !this.config.enableGreedyAggro.includes(monster.type)) continue;
                        if (this.config.typeList && !this.config.typeList.includes(monster.type)) continue;
                        if (Tools.distance(bot, monster) > Game.G.skills.cburst.range) continue;

                        cbursts.push([monster.id, 1]);
                    }

                    for (const monster of bot.getEntities({
                        hasTarget: false,
                        typeList: this.config.typeList,
                        withinRange: "cburst"
                    })) {
                        if (cbursts.some((cburst) => cburst[0] == monster.id)) continue;
                        cbursts.push([monster.id, 1]);
                    }

                    if (cbursts.length) {
                        bot.nextSkill.set("cburst", new Date(Date.now() + bot.ping * 2));
                        return bot.cburst(cbursts).catch(console.error);
                    }
                }

                if (bot.canUse("attack")) {
                    for (const monster of data.monsters) {
                        if (monster.target) continue;
                        if (Array.isArray(this.config.enableGreedyAggro) && !this.config.enableGreedyAggro.includes(monster.type)) continue;
                        if (this.config.typeList && !this.config.typeList.includes(monster.type)) continue;
                        if (Tools.distance(bot, monster) > bot.range) continue;

                        bot.nextSkill.set("attack", new Date(Date.now() + bot.ping * 2));
                        return bot.basicAttack(monster.id).catch(console.error);
                    }
                }
            }

            bot.socket.on("entities", this.greedyOnEntities)
        }

        if (!this.config.disableCburst && !this.config.disableKillSteal) {
            this.stealOnActionCburst = (data: ActionData) => {
                if (!bot.canUse("cburst")) return;
                if ((data as ActionDataRay).instant) return;

                let attacker: Player = bot.players.get(data.attacker);
                if (!attacker) return;
                if (attacker.isFriendly(bot)) return;

                let target: Entity = bot.entities.get(data.target);
                if (!target) return;
                if (target.target) return;
                if (target.immune) return;
                if (DO_NOT_KILL_STEAL.includes(target.type)) return;
                if (Tools.squaredDistance(bot, target) > Game.G.skills.cburst.range) return;
                if (!target.willDieToProjectiles(bot, bot.projectiles, bot.players, bot.entities)) return;

                this.preventOverkill(bot, target);
                bot.cburst([[data.target, 5]]).catch(ignoreExceptions);
            }
            bot.socket.on("action", this.stealOnActionCburst);
        }
    }

    public onRemove(bot: Mage): void {
        super.onRemove(bot);
        if (this.stealOnActionCburst) bot.socket.off("action", this.stealOnActionCburst);
    }

    protected async attack(bot: Mage): Promise<void> {
        if (!this.shouldAttack(bot)) {
            this.defensiveAttack(bot).catch(ignoreExceptions);
            return;
        }

        let priority = this.botSort;
        
        await this.equipItems(bot);

        if (!this.config.disableCburst) {
            await this.cburstHumanoids(bot).catch(ignoreExceptions);
            await this.cburstAttack(bot, priority).catch(ignoreExceptions);
        }
        if (!this.config.disableBasicAttack) await this.basicAttack(bot, priority).catch(ignoreExceptions);
        if (!this.config.disableIdleAttack) await this.idleAttack(bot, priority).catch(ignoreExceptions);
        if (this.config.energize) await this.energizePartyMember(bot);

        await this.equipItems(bot);
    }

    protected async cburstHumanoids(bot: Mage): Promise<unknown> {
        if (!bot.canUse("cburst")) return;

        let humanoidRestore: number = 0;
        for (let slotName in bot.slots) {
            let slot = bot.slots[slotName as SlotType | TradeSlotType];
            if (!slot || (slot as TradeItemInfo).price != undefined) continue;

            let gItem: GItem = bot.G.items[slot.name];
            if (gItem.ability == "restore_mp") {
                humanoidRestore += gItem.attr0 * 5;
            }
        }

        let entities: Entity[] = bot.getEntities({
            ...this.config,
            canDamage: "cburst",
            withinRange: "cburst"
        });

        let targets = new Map<string, number>();
        let mpNeeded: number = bot.G.skills.cburst.mp + bot.mp_cost;
        for (let entity of entities) {
            if (!entity.humanoid) continue;
            if (targets.has(entity.id)) continue;

            let extraMp: number = 100;
            if (mpNeeded + extraMp > bot.mp) break;
            targets.set(entity.id, extraMp);
            mpNeeded += extraMp;
        }

        return bot.cburst([...targets.entries()]);
    }

    protected async cburstAttack(bot: Mage, priority: (a: Entity, b: Entity) => boolean) {
        if (!bot.canUse("cburst")) return;

        let mpPool = bot.mp - Game.G.skills.cburst.mp - bot.max_mp / 2;
        if (mpPool <= 0) return;

        let toCburst = new Map<string, number>();
        if (this.config.enableGreedyAggro) {
            let entities: Entity[] = bot.getEntities({
                canDamage: "cburst",
                hasTarget: false,
                typeList: Array.isArray(this.config.enableGreedyAggro)
                    ? this.config.enableGreedyAggro
                    : this.config.typeList,
                withinRange: "cburst"
            });

            if (entities.length && !(this.config.maximumTargets && bot.targets >= this.config.maximumTargets)) {
                for (let entity of entities) {
                    if ((mpPool - 5) < 0) break;
                    mpPool -= 5;
                    toCburst.set(entity.id, 5);
                }
            }
        }

        let entities: Entity[] = bot.getEntities({
            ...this.config,
            canDamage: "cburst",
            withinRange: "cburst",
            couldDieToProjectiles: false
        });

        let targets = new FastPriorityQueue<Entity>(priority);
        for (let entity of entities) {
            targets.add(entity);
        }

        targets.forEach((entity) => {
            let mpToKill: number = ((entity.hp * 1.1) / Game.G.skills.cburst.ratio) * Tools.damage_multiplier(bot.rpiercing - entity.resistance);
            if (mpToKill > mpPool) return;

            if (toCburst.has(entity.id)) mpPool += toCburst.get(entity.id);
            toCburst.set(entity.id, mpToKill);

            this.preventOverkill(bot, entity);
            mpPool == mpToKill;
        });

        if (bot.mp > (bot.max_mp - 500) && mpPool >= 0) {
            while (targets.size) {
                let target = targets.poll();
                if (target.willDieToProjectiles(bot, bot.projectiles, bot.players, bot.entities)) continue;
                if (toCburst.has(target.id)) continue;

                toCburst.set(target.id, mpPool);
                break;
            }
        }

        if (toCburst.size == 0) return;
        return bot.cburst([...toCburst.entries()]);
    }

    protected async energizePartyMember(bot: Mage): Promise<unknown> {
        if (bot.rip) return;
        if ((bot.mp / bot.max_mp) < this.config.energize.onMpRatio) return;

        let executors = filterExecutors(this.runners, { serverData: bot.serverData });

        if (bot.s.energized) return;
        for (let executor of executors) {
            let friend: PingCompensatedCharacter = executor.bot;

            if (friend.rip) continue;
            if (friend == bot) continue;
            if (Tools.squaredDistance(bot, friend) > bot.G.skills.energize.range) continue;
            if (bot.isOnCooldown("energize")) continue;

            if ((this.config.energize.when.mp && friend.mp < this.config.energize.when.mp) ||
                (this.config.energize.when.mpMissing && (friend.max_mp - friend.mp) > this.config.energize.when.mpMissing) ||
                (this.config.energize.when.mpRatio && (friend.mp / friend.max_mp) < this.config.energize.when.mpRatio)
            ) {
                let rechargeAmount: number = friend.max_mp - friend.mp;
                let canRechargeAmount: number = bot.mp - (bot.max_mp * this.config.energize.onMpRatio);
                return bot.energize(friend.id, Math.min(canRechargeAmount, rechargeAmount));
            }
        }
    }
}