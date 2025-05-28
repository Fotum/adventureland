import { Entity, Game, ItemData, PingCompensatedCharacter, Player, SlotType, Tools, Ranger } from "alclient";
import { BaseAttackConfig, BaseAttackStrategy, IDLE_ATTACK_MONSTERS } from "../base_attack_strategy";
import { ignoreExceptions, sleep } from "../../base/functions";
import { FILTER_HIGHEST } from "../../configs/equipment_setups";
import { StrategyExecutor } from "../strategy_executor";


export type RangerAttackConfig = BaseAttackConfig & {
    disableMultishots?: boolean
    disablePierceshot?: boolean
    disableMark?: boolean
}

export class RangerAttackStrategy extends BaseAttackStrategy<Ranger> {
    protected options: RangerAttackConfig;

    public constructor(executors: StrategyExecutor<PingCompensatedCharacter>[], options?: RangerAttackConfig) {
        super(executors, options);

        if (!options.disableMark) this.interval.push("huntersmark");

        this.loops.set("attack", {
            fn: async (bot: Ranger) => {
                if (this.shouldScare(bot)) await this.scare(bot).catch(ignoreExceptions);

                await this.attack(bot).catch(ignoreExceptions);
            },
            interval: this.interval
        });
    }

    protected async attack(bot: Ranger): Promise<void> {

        if (!this.shouldAttack(bot)) {
            this.defensiveAttack(bot).catch(ignoreExceptions);
            return;
        }

        let priority = this.botSort;

        await this.equipItems(bot);

        if (!this.options.disableMultishots) await this.multishot(bot).catch(ignoreExceptions);
        if (!this.options.disableBasicAttack) await this.basicAttack(bot, priority).catch(ignoreExceptions);
        if (!this.options.disableIdleAttack) await this.idleAttack(bot, priority).catch(ignoreExceptions);

        await this.equipItems(bot);
    }

    protected async multishot(bot: Ranger): Promise<unknown> {
        if (!bot.canUse("5shot", { ignoreMP: false }) && !bot.canUse("3shot", { ignoreMP: false })) return;

        if (bot.isPVP()) {
            let nearbyPlayers: Player[] = bot.getPlayers({
                isFriendly: true,
                isNPC: false,
                withinRange: "attack"
            });
            if (nearbyPlayers.length > 0) return;
        }

        
        ///???
        let entities: Entity[] = bot.getEntities({
            withinRange: "cleave",
            canDamage: "cleave"
        });
        if (entities.length == 0) return;
        if (entities.length == 1 && bot.canKillInOneShot(entities[0])) return;

        let targetingMe = bot.calculateTargets();
        let newTargets = 0;
        for (let entity of entities) {
            if ((this.options.targetingPartyMember || this.options.targetingPlayer) && !entity.target) return;
            if (this.options.typeList && !this.options.typeList.includes(entity.type)) return;

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

            if (this.options.maximumTargets && (newTargets + bot.targets) > this.options.maximumTargets) return;
        }

        for (let entity of entities) {
            if (bot.canKillInOneShot(entity, "cleave")) this.preventOverkill(bot, entity);
        }

        let mainhand: ItemData;
        let offhand: ItemData;
        if (this.options.enableEquipForCleave && !bot.isEquipped(["bataxe", "scythe"])) {
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

        if (this.options.enableEquipForCleave) {
            let equipBatch: { num: number; slot: SlotType }[] = [];

            if (this.options.ensureEquipped.mainhand && !this.options.ensureEquipped.mainhand.unequip) {
                let num: number = bot.locateItem(
                    this.options.ensureEquipped.mainhand.name,
                    bot.items,
                    this.options.ensureEquipped.mainhand.filters
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

            if (this.options.ensureEquipped.offhand && !this.options.ensureEquipped.offhand.unequip) {
                let num: number = bot.locateItem(
                    this.options.ensureEquipped.offhand.name,
                    bot.items,
                    this.options.ensureEquipped.offhand.filters
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


}