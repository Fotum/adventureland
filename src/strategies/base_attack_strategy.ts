import { ActionData, Constants, EntitiesData, Entity, Game, GetEntityFilters, ItemName, LocateItemFilters, Mage, MonsterName, PingCompensatedCharacter, Player, SkillName, SlotType, Tools, Warrior, WeaponType } from "alclient"
import { Loop, LoopName, Loops, Strategy, StrategyExecutor, StrategyName } from "./strategy_executor"
import { sortPriority, sleep, filterExecutors, ignoreExceptions } from "../base/functions"
import FastPriorityQueue from "fastpriorityqueue"
import { generateEquipmentSetup } from "../configs/equipment_setups"
import { Ranger } from "alclient";


export type EquipInSlot = {
    name: ItemName
    filters?: LocateItemFilters
    unequip?: boolean
}

export type EnsureEquipped = {
    [T in SlotType]?: EquipInSlot
}

export type BaseAttackConfig = GetEntityFilters & {
    disableBasicAttack?: boolean
    disableIdleAttack?: boolean
    disableScare?: boolean
    disableZapper?: boolean
    disableKillSteal?: boolean
    enableGreedyAggro?: boolean | MonsterName[]
    ensureEquipped?: EnsureEquipped
    maximumTargets?: number
}

export const KILL_AVOID_MONSTERS: MonsterName[] = ["kitty1", "kitty2", "kitty3", "kitty4", "puppy1", "puppy2", "puppy3", "puppy4"];
export const IDLE_ATTACK_MONSTERS: MonsterName[] = ["cutebee", "goldenbat", "frog", "wabbit", "rooster"];

export class BaseAttackStrategy<T extends PingCompensatedCharacter> implements Strategy<T> {
    public loops: Loops<T> = new Map<LoopName, Loop<T>>;

    protected executors: StrategyExecutor<PingCompensatedCharacter>[];
    protected options: BaseAttackConfig;
    protected botSort: (a: Entity, b: Entity) => boolean;

    protected ensureEquipped = new Map<string, EnsureEquipped>();
    protected interval: SkillName[] = ["attack"];

    private _name: StrategyName = "attack";
    private greedyOnEntities: (data: EntitiesData) => Promise<unknown>;
    private stealOnAction: (data: ActionData) => Promise<unknown>;

    public constructor(executors: StrategyExecutor<PingCompensatedCharacter>[], config: BaseAttackConfig) {
        this.executors = executors;
        this.options = config;

        if (this.options.willDieToProjectiles === undefined)
            this.options.willDieToProjectiles = false;

        if (!this.options.disableZapper)
            this.interval.push("zapperzap");

        if (this.options.type) {
            this.options.typeList = [this.options.type];
            delete this.options.type;
        }

        this.loops.set("attack", {
            fn: async (bot: T) => {
                if (this.shouldScare(bot)) await this.scare(bot);
                await this.attack(bot).catch(ignoreExceptions)
            },
            interval: this.interval
        });
    }

    public onApply(bot: T): void {
        if (this.options.ensureEquipped) {
            let currentSetup: EnsureEquipped = generateEquipmentSetup(bot, this.options.ensureEquipped);
            this.ensureEquipped.set(bot.id, currentSetup);
        }

        this.botSort = sortPriority(bot, this.options.typeList);
        if (!this.options.disableKillSteal && !this.options.disableZapper) {
            this.stealOnAction = (data: ActionData) => {
                if (!bot.canUse("zapperzap")) return;
                if (bot.c.town) return;

                let attacker: Player = bot.players.get(data.attacker);
                if (!attacker) return;

                let target: Entity = bot.entities.get(data.target);
                if (!target || target.target || target.immune) return;
                if (KILL_AVOID_MONSTERS.includes(target.type)) return;
                if (Tools.distance(bot, target) > Game.G.skills.zapperzap.range) return;
                if (!target.willDieToProjectiles(bot, bot.projectiles, bot.players, bot.entities)) return;

                this.preventOverkill(bot, target);
                return bot.zapperZap(data.target).catch(ignoreExceptions);
            }

            bot.socket.on("action", this.stealOnAction);
        }

        if (this.options.enableGreedyAggro) {
            this.greedyOnEntities = (data: EntitiesData) => {
                if (data.monsters.length == 0) return;
                if (this.options.maximumTargets !== undefined && bot.targets >= this.options.maximumTargets) return;
                if (!this.shouldAttack(bot)) return;

                if (!this.options.disableZapper && bot.canUse("zapperzap")) {
                    for (let monster of data.monsters) {
                        if (monster.target) continue;
                        // Check if target is in array of greedyAggro targets
                        if (Array.isArray(this.options.enableGreedyAggro) && !this.options.enableGreedyAggro.includes(monster.type)) continue;
                        // Check if target is in typeList of monsters we want to farm
                        if (this.options.typeList && !this.options.typeList.includes(monster.type)) continue;
                        if (Game.G.monsters[monster.type].immune) continue;
                        // Check if not out of range
                        if (Tools.distance(bot, monster) > Game.G.skills.zapperzap.range) continue;

                        return bot.zapperZap(monster.id).catch(ignoreExceptions);
                    }
                }

                // TODO: Refactor so this can be put in attack_warrior
                if (bot.ctype == "warrior" && bot.canUse("taunt")) {
                    for (const monster of data.monsters) {
                        if (monster.target) continue;
                        if (Array.isArray(this.options.enableGreedyAggro) && !this.options.enableGreedyAggro.includes(monster.type)) continue;
                        if (this.options.typeList && !this.options.typeList.includes(monster.type)) continue;
                        if (Tools.distance(bot, monster) > Game.G.skills.taunt.range) continue;

                        bot.nextSkill.set("taunt", new Date(Date.now() + bot.ping * 2));
                        return (bot as unknown as Warrior).taunt(monster.id).catch(ignoreExceptions);
                    }
                }

                // TODO: Refactor so this can be put in attack_mage
                if (bot.ctype == "mage" && bot.canUse("cburst")) {
                    const cbursts: [string, number][] = [];
                    for (const monster of data.monsters) {
                        if (monster.target) continue;
                        if (Array.isArray(this.options.enableGreedyAggro) && !this.options.enableGreedyAggro.includes(monster.type)) continue;
                        if (this.options.typeList && !this.options.typeList.includes(monster.type)) continue;
                        if (Tools.distance(bot, monster) > Game.G.skills.cburst.range) continue;

                        cbursts.push([monster.id, 1]);
                    }

                    for (const monster of bot.getEntities({
                        hasTarget: false,
                        typeList: this.options.typeList,
                        withinRange: "cburst"
                    })) {
                        if (cbursts.some((cburst) => cburst[0] == monster.id)) continue;
                        cbursts.push([monster.id, 1]);
                    }

                    if (cbursts.length) {
                        bot.nextSkill.set("cburst", new Date(Date.now() + bot.ping * 2));
                        return (bot as unknown as Mage).cburst(cbursts).catch(ignoreExceptions);
                    }
                }

                if (bot.canUse("attack")) {
                    for (const monster of data.monsters) {
                        if (monster.target) continue;
                        if (Array.isArray(this.options.enableGreedyAggro) && !this.options.enableGreedyAggro.includes(monster.type)) continue;
                        if (this.options.typeList && !this.options.typeList.includes(monster.type)) continue;
                        if (Tools.distance(bot, monster) > bot.range) continue;

                        bot.nextSkill.set("attack", new Date(Date.now() + bot.ping * 2));
                        return bot.basicAttack(monster.id).catch(ignoreExceptions);
                    }
                }
            }

            bot.socket.on("entities", this.greedyOnEntities)
        }
    }

    public onRemove(bot: T): void {
        if (this.greedyOnEntities) bot.socket.off("entities", this.greedyOnEntities);
    }

    public get name() {
        return this._name;
    }

    protected async attack(bot: T): Promise<void> {
        if (!this.shouldAttack(bot)) {
            this.defensiveAttack(bot).catch(ignoreExceptions);
            return;
        }

        await this.equipItems(bot);

        if (!this.options.disableBasicAttack) await this.basicAttack(bot, this.botSort).catch(ignoreExceptions);
        if (!this.options.disableIdleAttack) await this.idleAttack(bot, this.botSort).catch(ignoreExceptions);

        await this.equipItems(bot);
    }

    protected async basicAttack(bot: T, priority: (a: Entity, b: Entity) => boolean): Promise<unknown> {
        if (!bot.canUse("attack")) return;

        if (this.options.enableGreedyAggro) {
            let entities: Entity[] = bot.getEntities({
                canDamage: "attack",
                hasTarget: false,
                typeList: Array.isArray(this.options.enableGreedyAggro)
                    ? this.options.enableGreedyAggro
                    : this.options.typeList,
                withinRange: "attack"
            });

            if (entities.length && !(this.options.maximumTargets !== undefined && bot.targets >= this.options.maximumTargets)) {
                let targets: FastPriorityQueue<Entity> = new FastPriorityQueue<Entity>(priority);
                for (let entity of entities) {
                    targets.add(entity);
                }

                let target = targets.peek();
                let canKill = bot.canKillInOneShot(target);
                if (canKill) this.preventOverkill(bot, target);

                return bot.basicAttack(target.id);
            }
        }

        let entities: Entity[] = bot.getEntities({
            ...this.options,
            canDamage: "attack",
            withinRange: "attack"
        });
        if (entities.length == 0) return;

        let targets: FastPriorityQueue<Entity> = new FastPriorityQueue<Entity>(priority);
        for (let entity of entities) {
            targets.add(entity);
        }

        let targetingMe = bot.calculateTargets();
        let week_target = entities.find(e => e.s.marked || e.s.cursed);
        if (week_target) return bot.basicAttack(week_target.id);
        while (targets.size) {
            let target: Entity = targets.poll();

            if (!target.target) {
                if (this.options.maximumTargets !== undefined && bot.targets >= this.options.maximumTargets) continue;
                switch (target.damage_type) {
                    case "magical":
                        if (bot.mcourage <= targetingMe.magical) continue;
                        break;
                    case "physical":
                        if (bot.pcourage <= targetingMe.physical) continue;
                        break;
                    case "pure":
                        if (bot.courage <= targetingMe.pure) continue;
                        break;
                }
            }

            let canKill: boolean = bot.canKillInOneShot(target);
            if (canKill) this.preventOverkill(bot, target);

            return bot.basicAttack(target.id);
        }
    }

    protected async idleAttack(bot: T, priority: (a: Entity, b: Entity) => boolean): Promise<unknown> {
        if (!bot.canUse("attack")) return;
        if (bot.s.town) return;

        let entities = bot.getEntities({
            canDamage: "attack",
            couldGiveCredit: true,
            typeList: IDLE_ATTACK_MONSTERS,
            willBurnToDeath: false,
            willDieToProjectiles: false,
            withinRange: "attack"
        });
        if (entities.length == 0) return;

        let targets = new FastPriorityQueue<Entity>(priority);
        for (let entity of entities) {
            targets.add(entity);
        }

        let targetingMe = bot.calculateTargets();
        while (targets.size) {
            let target = targets.poll();
            if (!target.target) {
                if (this.options.maximumTargets !== undefined && bot.targets >= this.options.maximumTargets) continue;
                switch (target.damage_type) {
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

            let canKill = bot.canKillInOneShot(target);
            if (canKill) this.preventOverkill(bot, target);

            return bot.basicAttack(target.id);
        }
    }

    protected async defensiveAttack(bot: T): Promise<unknown> {
        if (!bot.canUse("attack")) return;

        let entity = bot.getEntity({
            ...this.options,
            canDamage: "attack",
            targetingMe: true,
            withinRange: "attack",
            returnLowestHP: true
        });
        if (!entity) return;

        return bot.basicAttack(entity.id);
    }

    protected shouldAttack(bot: T): boolean {
        if (bot.c.town) return false;
        if (bot.c.fishing || bot.c.mining) return false;
        if (!this.options.disableScare && bot.isOnCooldown("scare")) return false;

        return true;
    }

    protected async scare(bot: T): Promise<string[]> {
        if (this.options.disableScare) return;
        if (!(bot.hasItem("jacko") || bot.isEquipped("jacko"))) return;
        if (!bot.isEquipped("jacko") && bot.canUse("scare", { ignoreEquipped: true })) {
            await bot.equip(bot.locateItem("jacko"), "orb");
            if (bot.s.penalty_cd) await sleep(bot.s.penalty_cd.ms);
        }

        if (!bot.canUse("scare")) return;
        return bot.scare();
    }

    protected shouldScare(bot: T): boolean {
        if (bot.targets == 0 || this.options.disableScare) return false;

        if (this.options.typeList) {
            let targetingMe = bot.getEntities({
                notTypeList: [
                    ...this.options.typeList,
                    ...(this.options.disableIdleAttack ? [] : IDLE_ATTACK_MONSTERS)
                ],
                targetingMe: true,
                willDieToProjectiles: false
            });

            if (targetingMe.length) {
                return true;
            }
        }

        if (this.options.maximumTargets !== undefined && this.options.maximumTargets < bot.targets) return true;
        if (this.options.enableGreedyAggro) return false;

        return bot.isScared();
    }

    protected async equipItems(bot: T): Promise<unknown> {
        const equipSetup: EnsureEquipped = this.ensureEquipped.get(bot.id);
        if (!equipSetup) return;

        let equipBatch: { num: number, slot: SlotType }[] = [];
        for (let sType in equipSetup) {
            let slotType: SlotType = (sType as SlotType);
            let equipInSlot: EquipInSlot = equipSetup[slotType];

            if (equipInSlot.unequip) {
                if (bot.slots[slotType]) await bot.unequip(slotType);
                continue;
            }

            if (!bot.slots[slotType] ||
                bot.slots[slotType].name !== equipInSlot.name ||
                (equipInSlot.filters?.returnHighestLevel &&
                    bot.hasItem(equipInSlot.name, bot.items, {
                        ...equipInSlot.filters,
                        levelGreaterThan: bot.slots[slotType].level
                    })
                )
            ) {
                let toEquip: number = bot.locateItem(equipInSlot.name, bot.items, equipInSlot.filters);
                if (toEquip === undefined) {
                    console.error(`Could not find item to equip: "${equipInSlot.name}"`);
                }

                let doubleHandTypes = Game.G.classes[bot.ctype].doublehand;
                if (slotType == "mainhand") {
                    let weaponType: WeaponType = Game.G.items[equipInSlot.name].wtype;
                    if (weaponType && doubleHandTypes && doubleHandTypes[weaponType] && bot.slots.offhand && bot.esize > 0) {
                        await bot.unequip("offhand");
                    }
                } else if (slotType == "offhand" && bot.slots["mainhand"]) {
                    let equippedName: ItemName = bot.slots["mainhand"].name;
                    let weaponType = Game.G.items[equippedName].wtype;
                    if (weaponType && doubleHandTypes && doubleHandTypes[weaponType] && bot.slots.offhand && bot.esize > 0) {
                        await bot.unequip("mainhand");
                    }
                }

                equipBatch.push({ num: toEquip, slot: slotType });
            }
        }

        if (equipBatch.length) await bot.equipBatch(equipBatch).catch(console.error);
    }

    protected preventOverkill(bot: PingCompensatedCharacter, target: Entity): void {
        let executors = filterExecutors(this.executors, { serverData: bot.serverData });
        for (let myBotExecutor of executors) {
            let myBot: PingCompensatedCharacter = myBotExecutor.bot;
            if (bot == myBot) continue;
            if (Constants.SPECIAL_MONSTERS.includes(target.type)) continue;

            myBot.deleteEntity(target.id);
        }
    }
}