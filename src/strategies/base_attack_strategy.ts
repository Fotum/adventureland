import {
    ActionData,
    Constants,
    EntitiesData,
    Entity,
    Game,
    GetEntityFilters,
    ItemData,
    ItemName,
    LocateItemFilters,
    MonsterName,
    PingCompensatedCharacter,
    Player,
    SkillName,
    SlotType,
    Tools,
    WeaponType
} from "alclient";
import FastPriorityQueue from "fastpriorityqueue";
import { filterRunners, ignoreExceptions, sleep } from "../base/functions/general";
import { sortPriority } from "../base/functions/sort";
import { generateEquipmentSet } from "../configs/equipment_setups";
import { PartyController } from "../controller/party_controller";
import { Loop, LoopName, Loops, Strategy, StrategyName } from "./character_runner";

export type EquipInSlot = {
    name: ItemName;
    filters?: LocateItemFilters;
    unequip?: boolean;
};

export type EquipmentSet = {
    [T in SlotType]?: EquipInSlot;
};

export type BaseAttackConfig = GetEntityFilters & {
    disableBasicAttack?: boolean;
    disableIdleAttack?: boolean;
    disableDefensiveAttack?: boolean;
    disableZapperAttack?: boolean;
    disableScare?: boolean;
    disableZapper?: boolean;
    disableKillSteal?: boolean;
    enableGreedyAggro?: boolean | MonsterName[];
    equipmentSet?: EquipmentSet;
    maximumTargets?: number;
};

export const KILL_AVOID_MONSTERS: MonsterName[] = ["kitty1", "kitty2", "kitty3", "kitty4", "puppy1", "puppy2", "puppy3", "puppy4"];
export const IDLE_ATTACK_MONSTERS: MonsterName[] = ["cutebee", "goldenbat", "frog", "wabbit", "rooster"];

export class BaseAttackStrategy<T extends PingCompensatedCharacter> implements Strategy<T> {
    public loops: Loops<T> = new Map<LoopName, Loop<T>>();

    protected partyController: PartyController;
    protected config: BaseAttackConfig;
    protected botSort: (a: Entity, b: Entity) => boolean;

    protected equipmentSet = new Map<string, EquipmentSet>();
    protected interval: SkillName[] = ["attack"];

    protected greedyOnEntities: (data: EntitiesData) => Promise<unknown>;
    protected stealOnAction: (data: ActionData) => Promise<unknown>;

    private _name: StrategyName = "attack";

    public constructor(partyController: PartyController, config: BaseAttackConfig) {
        this.partyController = partyController;
        this.config = config;

        if (this.config.willDieToProjectiles === undefined) this.config.willDieToProjectiles = false;

        if (!this.config.disableZapper) this.interval.push("zapperzap");

        if (this.config.type) {
            this.config.typeList = [this.config.type];
            delete this.config.type;
        }

        this.loops.set("attack", {
            fn: async (bot: T) => {
                if (bot.rip) return;

                if (this.shouldScare(bot)) await this.scare(bot);
                await this.attack(bot).catch(ignoreExceptions);
            },
            interval: this.interval
        });
    }

    public onApply(bot: T): void {
        if (this.config.equipmentSet) {
            let currentSetup: EquipmentSet = generateEquipmentSet(bot, this.config.equipmentSet);
            this.equipmentSet.set(bot.id, currentSetup);
        }

        this.botSort = sortPriority(bot, this.config.typeList);
        if (!this.config.disableKillSteal && !this.config.disableZapper) {
            this.stealOnAction = async (data: ActionData) => {
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
                return bot.zapperZap(data.target).catch(console.error);
            };

            bot.socket.on("action", this.stealOnAction);
        }

        if (this.config.enableGreedyAggro) {
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
            };

            bot.socket.on("entities", this.greedyOnEntities);
        }
    }

    public onRemove(bot: T): void {
        if (this.greedyOnEntities) bot.socket.off("entities", this.greedyOnEntities);
    }

    public get name(): StrategyName {
        return this._name;
    }

    protected async attack(bot: T): Promise<void> {
        if (!this.config.disableDefensiveAttack && !this.shouldAttack(bot)) {
            this.defensiveAttack(bot).catch(ignoreExceptions);
            return;
        }

        await this.equipItems(bot).catch(console.error);

        if (!this.config.disableBasicAttack) await this.basicAttack(bot, this.botSort).catch(ignoreExceptions);
        if (!this.config.disableZapperAttack) await this.zapperAttack(bot, this.botSort).catch(ignoreExceptions);
        if (!this.config.disableIdleAttack) await this.idleAttack(bot, this.botSort).catch(ignoreExceptions);

        await this.equipItems(bot).catch(console.error);
    }

    protected async basicAttack(bot: T, priority: (a: Entity, b: Entity) => boolean): Promise<unknown> {
        if (!bot.canUse("attack")) return;

        if (this.config.enableGreedyAggro) {
            let entities: Entity[] = bot.getEntities({
                canDamage: "attack",
                hasTarget: false,
                typeList: Array.isArray(this.config.enableGreedyAggro) ? this.config.enableGreedyAggro : this.config.typeList,
                withinRange: "attack"
            });

            if (entities.length && !(this.config.maximumTargets !== undefined && bot.targets >= this.config.maximumTargets)) {
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
            ...this.config,
            canDamage: "attack",
            withinRange: "attack"
        });
        if (entities.length == 0) return;

        let targets: FastPriorityQueue<Entity> = new FastPriorityQueue<Entity>(priority);
        for (let entity of entities) {
            targets.add(entity);
        }

        let targetingMe = bot.calculateTargets();
        while (targets.size) {
            let target: Entity = targets.poll();

            if (!target.target) {
                if (this.config.maximumTargets !== undefined && bot.targets >= this.config.maximumTargets) continue;
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
                if (this.config.maximumTargets !== undefined && bot.targets >= this.config.maximumTargets) continue;
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
            ...this.config,
            canDamage: "attack",
            targetingMe: true,
            withinRange: "attack",
            returnLowestHP: true
        });
        if (!entity) return;

        return bot.basicAttack(entity.id);
    }

    protected async zapperAttack(bot: T, priority: (a: Entity, b: Entity) => boolean): Promise<unknown> {
        if (this.config.disableZapper) return;
        if (!bot.canUse("zapperzap")) return;

        if (this.config.enableGreedyAggro) {
            let entities: Entity[] = bot.getEntities({
                canDamage: "zapperzap",
                hasTarget: false,
                typeList: Array.isArray(this.config.enableGreedyAggro) ? this.config.enableGreedyAggro : this.config.typeList,
                withinRange: "zapperzap"
            });

            if (entities.length && !(this.config.maximumTargets !== undefined && bot.targets >= this.config.maximumTargets)) {
                let targets: FastPriorityQueue<Entity> = new FastPriorityQueue<Entity>(priority);
                for (let entity of entities) {
                    targets.add(entity);
                }

                return bot.zapperZap(targets.peek().id);
            }
        }

        let entities: Entity[] = bot.getEntities({
            ...this.config,
            canDamage: "zapperzap",
            withinRange: "zapperzap"
        });
        if (entities.length == 0) return;

        if (bot.mp < bot.max_mp - 500) {
            for (let i = 0; i < entities.length; i++) {
                let entity: Entity = entities[i];
                if (!bot.canKillInOneShot(entity, "zapperzap")) {
                    entities.splice(i, 1);
                    i--;
                    continue;
                }
            }
        }
        if (entities.length == 0) return;

        let targets: FastPriorityQueue<Entity> = new FastPriorityQueue<Entity>(priority);
        for (let entity of entities) {
            targets.add(entity);
        }

        let targetingMe = bot.calculateTargets();
        while (targets.size) {
            let target: Entity = targets.poll();

            if (!target.target) {
                if (this.config.maximumTargets !== undefined && bot.targets >= this.config.maximumTargets) continue;
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

            return bot.zapperZap(target.id);
        }
    }

    protected shouldAttack(bot: T): boolean {
        if (bot.c.town) return false;
        if (bot.c.fishing || bot.c.mining) return false;
        if (!this.config.disableScare && bot.isOnCooldown("scare")) return false;

        return true;
    }

    protected async scare(bot: T): Promise<unknown> {
        if (this.config.disableScare) return;
        if (!(bot.hasItem("jacko") || bot.isEquipped("jacko"))) return;
        if (!bot.isEquipped("jacko") && bot.canUse("scare", { ignoreEquipped: true })) {
            await bot.equip(bot.locateItem("jacko"), "orb");
            if (bot.s.penalty_cd) await sleep(bot.s.penalty_cd.ms);
        }

        if (!bot.canUse("scare")) return;
        return bot.scare().catch(ignoreExceptions);
    }

    protected shouldScare(bot: T): boolean {
        if (bot.targets == 0 || this.config.disableScare) return false;

        if (this.config.typeList) {
            let targetingMe: Entity[] = bot.getEntities({
                notTypeList: [...this.config.typeList, ...(this.config.disableIdleAttack ? [] : IDLE_ATTACK_MONSTERS)],
                targetingMe: true,
                willDieToProjectiles: false
            });

            if (targetingMe.length) {
                return true;
            }
        }

        if (this.config.maximumTargets !== undefined && this.config.maximumTargets < bot.targets) return true;
        if (this.config.enableGreedyAggro) return false;

        return bot.isScared();
    }

    protected async equipItems(bot: T): Promise<void> {
        const equipmentSet: EquipmentSet = this.equipmentSet.get(bot.id);
        if (!equipmentSet) return;

        let equipBatch: { num: number; slot: SlotType }[] = [];
        for (let sType in equipmentSet) {
            let slotType: SlotType = sType as SlotType;
            let equipInSlot: EquipInSlot = equipmentSet[slotType];

            if (equipInSlot.unequip) {
                if (bot.slots[slotType]) await bot.unequip(slotType);
                continue;
            }

            if (
                !bot.slots[slotType] ||
                bot.slots[slotType].name != equipInSlot.name ||
                (equipInSlot.filters?.returnHighestLevel &&
                    bot.hasItem(equipInSlot.name, bot.items, {
                        ...equipInSlot.filters,
                        levelGreaterThan: bot.slots[slotType].level
                    }))
            ) {
                let toEquip: number = bot.locateItem(equipInSlot.name, bot.items, equipInSlot.filters);
                if (toEquip === undefined) {
                    if (
                        slotType == "mainhand" &&
                        bot.slots["offhand"]?.name == equipInSlot.name &&
                        (!equipmentSet["offhand"] || equipmentSet["offhand"].name != equipInSlot.name) &&
                        bot.esize > 0
                    ) {
                        toEquip = await bot.unequip("offhand");
                    } else if (
                        slotType == "offhand" &&
                        bot.slots["mainhand"]?.name == equipInSlot.name &&
                        (!equipmentSet["mainhand"] || equipmentSet["mainhand"].name != equipInSlot.name) &&
                        bot.esize > 0
                    ) {
                        toEquip = await bot.unequip("mainhand");
                    } else if (slotType == "ring1" && bot.slots["ring2"]?.name == equipInSlot.name && bot.esize > 0) {
                        toEquip = await bot.unequip("ring2");
                    } else if (slotType == "ring2" && bot.slots["ring1"]?.name == equipInSlot.name && bot.esize > 0) {
                        toEquip = await bot.unequip("ring1");
                    } else if (slotType == "earring1" && bot.slots["earring2"]?.name == equipInSlot.name && bot.esize > 0) {
                        toEquip = await bot.unequip("earring2");
                    } else if (slotType == "earring2" && bot.slots["earring1"]?.name == equipInSlot.name && bot.esize > 0) {
                        toEquip = await bot.unequip("earring1");
                    } else if (slotType == "elixir") {
                        // #TODO: this should not try to find elixir if there is no such in toEquip
                        continue;
                    } else {
                        throw new Error(`[${bot.id}]: Could not find ${equipInSlot.name} to equip in slot ${slotType}`);
                    }
                }

                let doubleHandTypes = Game.G.classes[bot.ctype].doublehand;
                if (slotType == "mainhand") {
                    let weaponType: WeaponType = Game.G.items[equipInSlot.name].wtype;

                    // Double hand logic for mainhand
                    if (weaponType && doubleHandTypes && doubleHandTypes[weaponType]) {
                        if (equipmentSet.offhand && !equipmentSet.offhand.unequip) {
                            throw new Error(
                                `[${bot.id}]: ${equipInSlot.name} is a doublehand for ${bot.ctype}. We can't equip ${equipmentSet.offhand.name} in our offhand`
                            );
                        }

                        if (bot.slots.offhand) {
                            if (bot.esize <= 0) continue;
                            await bot.unequip("offhand");
                        }
                    }
                } else if (slotType == "offhand" && bot.slots["mainhand"]) {
                    let equippedName: ItemName = bot.slots["mainhand"].name;
                    let weaponType = Game.G.items[equippedName].wtype;

                    if (weaponType && doubleHandTypes && doubleHandTypes[weaponType]) {
                        if (bot.esize <= 0) continue;
                        await bot.unequip("mainhand");
                    }
                }

                // Dual wield check
                if (equipBatch.some((item) => item.num == toEquip)) {
                    let newSearch: ItemData[] = [...bot.items];
                    newSearch[toEquip] = undefined;

                    toEquip = bot.locateItem(equipInSlot.name, newSearch, equipInSlot.filters);
                    if (toEquip == undefined) {
                        throw new Error(`[${bot.id}]: Could not find ${equipInSlot.name} for dualwield`);
                    }
                }

                equipBatch.push({ num: toEquip, slot: slotType });
            }
        }

        if (equipBatch.length) await bot.equipBatch(equipBatch).catch(console.error);
    }

    protected preventOverkill(bot: PingCompensatedCharacter, target: Entity): void {
        let runners = filterRunners(this.partyController.getRunners(), { serverData: bot.serverData });
        for (let runner of runners) {
            let myBot: PingCompensatedCharacter = runner.bot;
            if (bot == myBot) continue;
            if (Constants.SPECIAL_MONSTERS.includes(target.type)) continue;

            myBot.deleteEntity(target.id);
        }
    }
}

export class NoAttackScareStrategy<T extends PingCompensatedCharacter> implements Strategy<T> {
    public loops: Loops<T> = new Map<LoopName, Loop<T>>();

    private _name: StrategyName = "attack";

    public constructor() {
        this.loops.set("attack", {
            fn: async (bot: T) => {
                if (bot.rip) return;

                if (this.shouldScare(bot)) {
                    this.scare(bot).catch(ignoreExceptions);
                }
            },
            interval: 250
        });
    }

    public get name(): StrategyName {
        return this._name;
    }

    protected shouldScare(bot: T): boolean {
        if (bot.targets == 0) return false;
        if (bot.hp > bot.max_hp * 0.5) return false;

        let targetingMe: Entity[] = bot.getEntities({ targetingMe: true });
        if (targetingMe.length > 0) return true;

        return bot.isScared();
    }

    protected async scare(bot: T): Promise<void> {
        if (!(bot.hasItem("jacko") || bot.isEquipped("jacko"))) return;

        let currentOrb: ItemData = undefined;
        if (!bot.isEquipped("jacko") && bot.canUse("scare", { ignoreEquipped: true })) {
            if (bot.slots.orb) {
                currentOrb = { ...bot.slots.orb };
            }

            await bot.equip(bot.locateItem("jacko"), "orb");
            if (bot.s.penalty_cd) await sleep(bot.s.penalty_cd.ms);
        }

        if (bot.canUse("scare")) bot.scare().catch(ignoreExceptions);

        if (currentOrb) {
            let orbIx: number = bot.locateItem(currentOrb.name, bot.items, {
                level: currentOrb.level,
                special: currentOrb.p
            });
            if (orbIx !== undefined) {
                await bot.equip(orbIx).catch(ignoreExceptions);
                if (bot.s.penalty_cd) await sleep(bot.s.penalty_cd.ms);
            }
        }
    }
}
