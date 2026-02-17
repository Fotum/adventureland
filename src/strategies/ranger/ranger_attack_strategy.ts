import { Entity, Game, GetEntityFilters, Ranger } from "alclient";
import FastPriorityQueue from "fastpriorityqueue";
import { ignoreExceptions } from "../../base/functions/general";
import { PartyController } from "../../controller/party_controller";
import logger from "../../logger";
import { BaseAttackConfig, BaseAttackStrategy, IDLE_ATTACK_MONSTERS } from "../base_attack_strategy";

export type RangerAttackConfig = BaseAttackConfig & {
    disableHuntersMark?: boolean;
    disableMultiShot?: boolean;
    disableSuperShot?: boolean;
};

export class RangerAttackStrategy extends BaseAttackStrategy<Ranger> {
    protected config: RangerAttackConfig;

    public constructor(partyController: PartyController, config: RangerAttackConfig) {
        super(partyController, config);

        if (!this.config.disableHuntersMark) this.interval.push("huntersmark");
        if (!this.config.disableSuperShot) this.interval.push("supershot");
    }

    protected async attack(bot: Ranger) {
        if (!this.shouldAttack(bot)) {
            this.defensiveAttack(bot).catch(ignoreExceptions);
            return;
        }

        let priority = this.botSort;

        await this.equipItems(bot).catch(logger.error);

        await this.multiAttack(bot, priority).catch(ignoreExceptions);
        if (!this.config.disableSuperShot) await this.superShot(bot, priority).catch(ignoreExceptions);
        if (!this.config.disableZapper) await this.zapperAttack(bot, priority).catch(ignoreExceptions);
        if (!this.config.disableIdleAttack) await this.idleAttack(bot, priority).catch(ignoreExceptions);

        await this.equipItems(bot).catch(logger.error);
    }

    protected async multiAttack(bot: Ranger, priority: (a: Entity, b: Entity) => boolean): Promise<unknown> {
        if (!bot.canUse("attack")) return;

        let entityFilter: GetEntityFilters = {
            ...this.config,
            canDamage: "attack",
            withinRange: "attack"
        };

        return this.multiAttackLogic(bot, entityFilter, priority).catch(ignoreExceptions);
    }

    protected async idleAttack(bot: Ranger, priority: (a: Entity, b: Entity) => boolean): Promise<unknown> {
        if (!bot.canUse("attack")) return;
        if (bot.s.town) return;

        let entityFilter: GetEntityFilters = {
            canDamage: "attack",
            couldGiveCredit: true,
            typeList: IDLE_ATTACK_MONSTERS,
            willBurnToDeath: false,
            willDieToProjectiles: false,
            withinRange: "attack"
        };

        return this.multiAttackLogic(bot, entityFilter, priority).catch(ignoreExceptions);
    }

    protected async superShot(bot: Ranger, priority: (a: Entity, b: Entity) => boolean): Promise<unknown> {
        if (!bot.canUse("supershot")) return;

        let entities: Entity[] = bot.getEntities({
            ...this.config,
            canDamage: "supershot",
            withinRange: "supershot"
        });
        if (entities.length == 0) return;

        let targets: FastPriorityQueue<Entity> = new FastPriorityQueue<Entity>(priority);
        for (let entity of entities) {
            if (bot.canKillInOneShot(entity, "supershot")) {
                this.preventOverkill(bot, entity);
                return bot.superShot(entity.id).catch(ignoreExceptions);
            }

            targets.add(entity);
        }

        let targetingMe = bot.calculateTargets();

        while (targets.size) {
            let entity: Entity = targets.poll();

            if (!entity.target) {
                // We're going to be tanking this monster, don't attack if it pushes us over our limit
                if (bot.targets >= this.config.maximumTargets) continue;
                switch (entity.damage_type) {
                    case "magical":
                        if (bot.mcourage <= targetingMe.magical) continue;
                        break;
                    case "physical":
                        if (bot.courage <= targetingMe.physical) continue;
                        break;
                    case "pure":
                        if (bot.courage <= targetingMe.pure) continue;
                        break;
                }
            }

            return bot.superShot(entity.id).catch(ignoreExceptions);
        }
    }

    protected async applyHuntersMark(bot: Ranger, entity: Entity): Promise<unknown> {
        if (!entity) return;
        if (entity.immune && Game.G.skills.huntersmark.pierces_immunity) return;
        if (!bot.canUse("huntersmark")) return;
        if (bot.mp < bot.mp_cost + Game.G.skills.huntersmark.mp) return;
        if (
            bot.canKillInOneShot(entity) ||
            entity.willBurnToDeath() ||
            entity.willDieToProjectiles(bot, bot.projectiles, bot.players, bot.entities)
        )
            return;

        return bot.huntersMark(entity.id).catch(ignoreExceptions);
    }

    private async multiAttackLogic(
        bot: Ranger,
        entityFilter: GetEntityFilters,
        priority: (a: Entity, b: Entity) => boolean
    ): Promise<unknown> {
        let entities: Entity[] = bot.getEntities(entityFilter);
        if (entities.length == 0) return;

        let targetingMe = bot.calculateTargets();
        let targets: FastPriorityQueue<Entity> = new FastPriorityQueue<Entity>(priority);
        let threeShotTargets: FastPriorityQueue<Entity> = new FastPriorityQueue<Entity>(priority);
        let fiveShotTargets: FastPriorityQueue<Entity> = new FastPriorityQueue<Entity>(priority);

        for (let entity of entities) {
            targets.add(entity);

            if (this.config.disableMultiShot) continue;
            if (entity.target) {
                threeShotTargets.add(entity);
                fiveShotTargets.add(entity);
                continue;
            }

            let addedToThreeShotTargets: boolean = false;
            if (entity.hp <= bot.calculateDamageRange(bot, "5shot")[0]) {
                threeShotTargets.add(entity);
                fiveShotTargets.add(entity);
                continue;
            } else if (entity.hp <= bot.calculateDamageRange(bot, "3shot")[0]) {
                threeShotTargets.add(entity);
                addedToThreeShotTargets = true;
            }

            if (this.config.maximumTargets <= targetingMe.magical + targetingMe.physical + targetingMe.pure) continue;
            switch (entity.damage_type) {
                case "magical":
                    if (bot.mcourage > targetingMe.magical) {
                        // We can tank one more magical monster
                        if (!addedToThreeShotTargets) threeShotTargets.add(entity);
                        fiveShotTargets.add(entity);
                        targetingMe.magical += 1;
                        continue;
                    }
                    break;
                case "physical":
                    if (bot.courage > targetingMe.physical) {
                        // We can tank one more physical monster
                        if (!addedToThreeShotTargets) threeShotTargets.add(entity);
                        fiveShotTargets.add(entity);
                        targetingMe.physical += 1;
                        continue;
                    }
                    break;
                case "pure":
                    if (bot.pcourage > targetingMe.pure) {
                        // We can tank one more pure monster
                        if (!addedToThreeShotTargets) threeShotTargets.add(entity);
                        fiveShotTargets.add(entity);
                        targetingMe.pure += 1;
                        continue;
                    }
                    break;
            }
        }

        if (!this.config.disableHuntersMark) this.applyHuntersMark(bot, targets.peek()).catch(ignoreExceptions);

        if (!this.config.disableMultiShot && fiveShotTargets.size >= 5 && bot.canUse("5shot")) {
            let entities: Entity[] = [];
            while (entities.length < 5) {
                let entity: Entity = fiveShotTargets.poll();
                entities.push(entity);
                if (bot.canKillInOneShot(entity, "5shot")) {
                    this.preventOverkill(bot, entity);
                }
            }

            return bot.fiveShot(entities[0].id, entities[1].id, entities[2].id, entities[3].id, entities[4].id).catch(ignoreExceptions);
        } else if (!this.config.disableMultiShot && threeShotTargets.size >= 3 && bot.canUse("3shot")) {
            let entities: Entity[] = [];
            while (entities.length < 3) {
                let entity: Entity = threeShotTargets.poll();
                entities.push(entity);
                if (bot.canKillInOneShot(entity, "3shot")) {
                    this.preventOverkill(bot, entity);
                }
            }

            return bot.threeShot(entities[0].id, entities[1].id, entities[2].id).catch(ignoreExceptions);
        }

        targetingMe = bot.calculateTargets();

        let canUsePiercingShot: boolean = bot.canUse("piercingshot");
        while (targets.size) {
            let entity = targets.poll();

            if (bot.canKillInOneShot(entity)) {
                this.preventOverkill(bot, entity);
                return bot.basicAttack(entity.id).catch(ignoreExceptions);
            }

            if (canUsePiercingShot && bot.canKillInOneShot(entity, "piercingshot")) {
                this.preventOverkill(bot, entity);
                return bot.piercingShot(entity.id).catch(ignoreExceptions);
            }

            if (!entity.target) {
                if (bot.targets >= this.config.maximumTargets) continue;
                switch (entity.damage_type) {
                    case "magical":
                        if (bot.mcourage <= targetingMe.magical) continue;
                        break;
                    case "physical":
                        if (bot.courage <= targetingMe.physical) continue;
                        break;
                    case "pure":
                        if (bot.courage <= targetingMe.pure) continue;
                        break;
                }
            }

            if (!canUsePiercingShot) {
                return bot.basicAttack(entity.id).catch(ignoreExceptions);
            }

            let damage: [number, number] = bot.calculateDamageRange(entity);
            let piercingDamage = bot.canUse("piercingshot") ? bot.calculateDamageRange(entity, "piercingshot") : [0, 0];
            if (damage[0] >= piercingDamage[0]) {
                return bot.basicAttack(entity.id).catch(ignoreExceptions);
            } else {
                return bot.piercingShot(entity.id).catch(ignoreExceptions);
            }
        }
    }
}
