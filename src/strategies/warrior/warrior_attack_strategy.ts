import { EntitiesData, Entity, Game, ItemData, PingCompensatedCharacter, Player, SlotType, Tools, Warrior } from "alclient";
import { BaseAttackConfig, BaseAttackStrategy, IDLE_ATTACK_MONSTERS } from "../base_attack_strategy";
import { ignoreExceptions, sleep } from "../../base/functions";
import { FILTER_HIGHEST } from "../../configs/equipment_setups";
import { CharacterRunner } from "../character_runner";


export type WarriorAttackConfig = BaseAttackConfig & {
    disableAgitate?: boolean
    disableCleave?: boolean
    disableHardshell?: boolean
    disableStomp?: boolean
    disableWarCry?: boolean
    enableEquipForCleave?: boolean
    enableEquipForStomp?: boolean
}

export class WarriorAttackStrategy extends BaseAttackStrategy<Warrior> {
    protected config: WarriorAttackConfig;

    public constructor(executors: CharacterRunner<PingCompensatedCharacter>[], options?: WarriorAttackConfig) {
        super(executors, options);

        if (!options.disableCleave) this.interval.push("cleave");
        if (!options.disableWarCry) this.interval.push("warcry");

        this.loops.set("attack", {
            fn: async (bot: Warrior) => {
                if (this.shouldHardShell(bot)) await bot.hardshell().catch(ignoreExceptions);
                if (this.shouldScare(bot)) await this.scare(bot).catch(ignoreExceptions);

                await this.attack(bot).catch(ignoreExceptions);
            },
            interval: this.interval
        });
    }

    public onApply(bot: Warrior): void {
        super.onApply(bot);
       
        if (this.config.enableGreedyAggro) {
            // Remove old listener, just in case
            bot.socket.off("entities", this.greedyOnEntities);

            this.greedyOnEntities = (data: EntitiesData) => {
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

                if (bot.canUse("taunt")) {
                    for (const monster of data.monsters) {
                        if (monster.target) continue;
                        if (Array.isArray(this.config.enableGreedyAggro) && !this.config.enableGreedyAggro.includes(monster.type)) continue;
                        if (this.config.typeList && !this.config.typeList.includes(monster.type)) continue;
                        if (Tools.distance(bot, monster) > Game.G.skills.taunt.range) continue;

                        bot.nextSkill.set("taunt", new Date(Date.now() + bot.ping * 2));
                        return bot.taunt(monster.id).catch(console.error);
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

            bot.socket.on("entities", this.greedyOnEntities);
        }
    }

    protected async attack(bot: Warrior): Promise<void> {
        if (!this.config.disableWarCry) this.applyWarcry(bot).catch(ignoreExceptions);

        if (!this.shouldAttack(bot)) {
            this.defensiveAttack(bot).catch(ignoreExceptions);
            return;
        }

        let priority = this.botSort;

        await this.equipItems(bot);

        if (!this.config.disableAgitate) await this.agitateTargets(bot).catch(ignoreExceptions);
        if (!this.config.disableStomp) await this.stomp(bot).catch(ignoreExceptions);
        if (!this.config.disableBasicAttack) await this.basicAttack(bot, priority).catch(ignoreExceptions);
        if (!this.config.disableCleave) await this.cleave(bot).catch(ignoreExceptions);
        if (!this.config.disableIdleAttack) await this.idleAttack(bot, priority).catch(ignoreExceptions);

        await this.equipItems(bot);
    }

    protected async agitateTargets(bot: Warrior): Promise<unknown> {
        if (!this.config.enableGreedyAggro) return;

        if (bot.canUse("cleave", { ignoreEquipped: this.config.enableEquipForCleave ?? false })) {
            let unwantedEntity: Entity = bot.getEntity({
                hasTarget: false,
                notTypeList: [
                    ...(this.config.typeList ?? []),
                    ...(this.config.disableIdleAttack ? [] : IDLE_ATTACK_MONSTERS)
                ],
                withinRange: "cleave"
            });
            if (unwantedEntity) return;

            let numIfAgitate: number = bot.getEntities({
                hasTarget: false,
                hasIncomingProjectile: false,
                typeList: Array.isArray(this.config.enableGreedyAggro)
                    ? this.config.enableGreedyAggro
                    : this.config.typeList,
                withinRange: "agitate"
            }).length;

            let numIfCleave: number = bot.getEntities({
                hasTarget: false,
                hasIncomingProjectile: false,
                typeList: Array.isArray(this.config.enableGreedyAggro)
                    ? this.config.enableGreedyAggro
                    : this.config.typeList,
                withinRange: "cleave"
            }).length

            if (numIfAgitate >= numIfCleave) return this.cleave(bot);
        }

        if (!bot.canUse("agitate")) return;

        let unwantedEntity: Entity = bot.getEntity({
            hasTarget: false,
            notTypeList: [
                ...(this.config.typeList ?? []),
                ...(this.config.disableIdleAttack ? [] : IDLE_ATTACK_MONSTERS)
            ],
            withinRange: "agitate"
        });
        if (unwantedEntity) return;

        let agitateTargets: Entity[] = bot.getEntities({
            hasTarget: false,
            hasIncomingProjectile: false,
            typeList: Array.isArray(this.config.enableGreedyAggro)
                    ? this.config.enableGreedyAggro
                    : this.config.typeList,
            withinRange: "agitate"
        });
        if (agitateTargets.length == 0) return;

        if (agitateTargets.length == 1 &&
            bot.canUse("taunt") &&
            Game.G.skills.taunt.range >= Tools.squaredDistance(bot, agitateTargets[0])
        ) {
            return bot.taunt(agitateTargets[0].id);
        }

        return bot.agitate();
    }

    protected async cleave(bot: Warrior): Promise<unknown> {
        if (!bot.canUse("cleave", { ignoreEquipped: this.config.enableEquipForCleave ?? false })) return;
        if (this.config.enableEquipForCleave && !(bot.isEquipped("bataxe") || bot.isEquipped("scythe") || bot.hasItem(["bataxe", "scythe"]))) return;

        if (bot.isPVP()) {
            let nearbyPlayers: Player[] = bot.getPlayers({
                isFriendly: true,
                isNPC: false,
                withinRange: "cleave"
            });
            if (nearbyPlayers.length > 0) return;
        }

        let unwantedEntity: Entity = bot.getEntity({
            hasTarget: false,
            notTypeList: [
                ...(this.config.typeList ?? []),
                ...(this.config.disableIdleAttack ? [] : IDLE_ATTACK_MONSTERS)
            ],
            withinRange: "cleave"
        });
        if (unwantedEntity) return;

        let entities: Entity[] = bot.getEntities({
            withinRange: "cleave",
            canDamage: "cleave"
        });
        if (entities.length == 0) return;
        if (entities.length == 1 && bot.canKillInOneShot(entities[0])) return;

        let targetingMe = bot.calculateTargets();
        let newTargets = 0;
        for (let entity of entities) {
            if ((this.config.targetingPartyMember || this.config.targetingPlayer) && !entity.target) return;
            if (this.config.typeList && !this.config.typeList.includes(entity.type)) return;

            if (entity.target) continue;
            if (bot.canKillInOneShot(entity, "cleave")) continue;
            switch (entity.damage_type) {
                case "magical":
                    if (bot.mcourage > targetingMe.magical) targetingMe.magical += 1;
                    else return;
                    break;
                case "physical":
                    if (bot.courage > targetingMe.physical) targetingMe.physical += 1;
                    else return;
                    break;
                case "pure":
                    if (bot.pcourage > targetingMe.pure) targetingMe.pure += 1;
                    else return;
                    break;
            }
            newTargets += 1;

            if (this.config.maximumTargets && (newTargets + bot.targets) > this.config.maximumTargets) return;
        }

        for (let entity of entities) {
            if (bot.canKillInOneShot(entity, "cleave")) this.preventOverkill(bot, entity);
        }

        let mainhand: ItemData;
        let offhand: ItemData;
        if (this.config.enableEquipForCleave && !bot.isEquipped(["bataxe", "scythe"])) {
            if (bot.slots.offhand) {
                if (bot.esize <= 0) return;
                offhand = { ...bot.slots.offhand };
                await bot.unequip("offhand");
            }

            if (bot.slots.mainhand) mainhand = { ...bot.slots.mainhand };
            await bot.equip(bot.locateItem(["bataxe", "scythe"], bot.items, FILTER_HIGHEST));
            if (bot.s.penalty_cd) await sleep(bot.s.penalty_cd.ms);
        }

        await bot.cleave().catch(ignoreExceptions);

        if (this.config.enableEquipForCleave) {
            let equipBatch: { num: number; slot: SlotType }[] = [];

            if (this.config.ensureEquipped.mainhand && !this.config.ensureEquipped.mainhand.unequip) {
                let num: number = bot.locateItem(
                    this.config.ensureEquipped.mainhand.name,
                    bot.items,
                    this.config.ensureEquipped.mainhand.filters
                );
                if (num !== undefined) equipBatch.push({ num, slot: "mainhand" });
            } else if (mainhand) {
                let num: number = bot.locateItem(mainhand.name, bot.items, {
                    level: mainhand.level,
                    special: mainhand.p,
                    statType: mainhand.stat_type
                });
                if (num !== undefined) equipBatch.push({ num, slot: "mainhand" });
            } else {
                await bot.unequip("mainhand");
            }

            if (this.config.ensureEquipped.offhand && !this.config.ensureEquipped.offhand.unequip) {
                let num: number = bot.locateItem(
                    this.config.ensureEquipped.offhand.name,
                    bot.items,
                    this.config.ensureEquipped.offhand.filters
                );
                if (num !== undefined) equipBatch.push({ num, slot: "offhand" });
            } else if (offhand) {
                let num = bot.locateItem(offhand.name, bot.items, {
                    level: offhand.level,
                    special: offhand.p,
                    statType: offhand.stat_type
                });
                if (num !== undefined) equipBatch.push({ num, slot: "offhand" });
            }

            if (equipBatch.length) await bot.equipBatch(equipBatch);
        }
    }

    protected async stomp(bot: Warrior): Promise<unknown> {
        if (!bot.canUse("stomp", { ignoreEquipped: this.config.enableEquipForStomp ?? false })) return;
        if (this.config.enableEquipForStomp && !(bot.isEquipped("basher") || bot.isEquipped("wbasher") || bot.hasItem(["basher", "wbasher"]))) return;

        if (bot.isPVP()) {
            let nearbyPlayers: Player[] = bot.getPlayers({
                isFriendly: true,
                isNPC: false,
                withinRange: "stomp"
            });
            if (nearbyPlayers.length > 0) return;
        }

        let entities: Entity[] = bot.getEntities({
            typeList: [
                ...this.config.typeList,
                ...(this.config.disableAgitate ? [] : IDLE_ATTACK_MONSTERS)
            ],
            withinRange: "stomp"
        });
        if (entities.length == 0) return;

        let mainhand: ItemData;
        let offhand: ItemData;
        if (this.config.enableEquipForStomp && !bot.isEquipped(["basher", "wbasher"])) {
            if (bot.slots.offhand) {
                if (bot.esize <= 0) return;
                offhand = { ...bot.slots.offhand };
                await bot.unequip("offhand");
            }
            if (bot.slots.mainhand) mainhand = { ...bot.slots.mainhand };
            await bot.equip(bot.locateItem(["basher", "wbasher"], bot.items, FILTER_HIGHEST));
            if (bot.s.penalty_cd) await sleep(bot.s.penalty_cd.ms);
        }

        await bot.stomp().catch(ignoreExceptions);

        if (this.config.enableEquipForStomp) {
            // Re-equip items
            let equipBatch: { num: number; slot: SlotType }[] = [];

            if (this.config.ensureEquipped.mainhand && !this.config.ensureEquipped.mainhand.unequip) {
                let num: number = bot.locateItem(
                    this.config.ensureEquipped.mainhand.name,
                    bot.items,
                    this.config.ensureEquipped.mainhand.filters,
                );
                if (num !== undefined) equipBatch.push({ num, slot: "mainhand" });
            } else if (mainhand) {
                let num: number = bot.locateItem(mainhand.name, bot.items, {
                    level: mainhand.level,
                    special: mainhand.p,
                    statType: mainhand.stat_type,
                });
                if (num !== undefined) equipBatch.push({ num, slot: "mainhand" });
            } else {
                await bot.unequip("mainhand");
            }

            if (this.config.ensureEquipped.offhand && !this.config.ensureEquipped.offhand.unequip) {
                let num: number = bot.locateItem(
                    this.config.ensureEquipped.offhand.name,
                    bot.items,
                    this.config.ensureEquipped.offhand.filters,
                );
                if (num !== undefined) equipBatch.push({ num, slot: "offhand" });
            } else if (offhand) {
                let num: number = bot.locateItem(offhand.name, bot.items, {
                    level: offhand.level,
                    special: offhand.p,
                    statType: offhand.stat_type,
                });
                if (num !== undefined) equipBatch.push({ num, slot: "offhand" });
            }

            if (equipBatch.length) await bot.equipBatch(equipBatch);
        }
    }

    protected async applyWarcry(bot: Warrior): Promise<unknown> {
        if (!bot.canUse("warcry")) return;
        if (bot.s.warcry) return;
        if (!bot.getEntity(this.config)) return;

        return bot.warcry();
    }

    protected shouldHardShell(bot: Warrior): boolean {
        if (this.config.disableHardshell) return false;
        if (!bot.canUse("hardshell")) return false;

        let incomingDamage = 0;
        for (let entity of bot.getEntities({ targetingMe: true })) {
            if (entity.damage_type !== "physical") continue;
            if (Tools.squaredDistance(bot, entity) > (entity.range + entity.speed)) continue;

            incomingDamage += entity.calculateDamageRange(bot)[1];
        }

        return (incomingDamage * 3) >= bot.hp;
    }
}