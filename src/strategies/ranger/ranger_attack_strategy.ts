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

        if (!this.options.disableMark) await this.mark(bot).catch(ignoreExceptions);
        if (!this.options.disableMultishots) await this.multishot(bot).catch(ignoreExceptions);
        if (!this.options.disablePierceshot) await this.piercingshot(bot).catch(ignoreExceptions);
        if (this.options.disableMultishots) await this.supershot(bot).catch(ignoreExceptions);
        if (!this.options.disableBasicAttack) await this.basicAttack(bot, priority).catch(ignoreExceptions);
        if (!this.options.disableIdleAttack) await this.idleAttack(bot, priority).catch(ignoreExceptions);

        await this.equipItems(bot);
    }

    protected async mark(bot: Ranger): Promise<unknown> {
        if (!bot.canUse("huntersmark", { ignoreMP: false })) return;

        let entities: Entity[] = bot.getEntities({
            withinRange: "attack",
        });
        if (entities.length === 0) return;
        let target = entities.find(e => e.s.cursed) || entities[0];
        await bot.huntersMark(target.id).catch(ignoreExceptions);
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
            withinRange: "attack",
            canDamage: "attack",
            willBurnToDeath: false,
            willDieToProjectiles: false
        });
        if (entities.length < 2) return;

        if(entities.length >3 && bot.canUse("5shot"))
        {
            let targets_for_shot: string[] = (entities as unknown as Entity[]).map((target) => target.id).slice(0, 5);
            await bot .fiveShot(targets_for_shot[0], targets_for_shot[1], targets_for_shot[2], targets_for_shot[3], targets_for_shot[4]).catch(ignoreExceptions);
        }
        else if(entities.length > 1 && bot.canUse("3shot"))
        {
            let targets_for_shot: string[] = (entities as unknown as Entity[]).map((target) => target.id).slice(0, 3);
            await bot.threeShot(targets_for_shot[0], targets_for_shot[1], targets_for_shot[2]).catch(ignoreExceptions);
        }
        
    }

    protected async piercingshot(bot: Ranger): Promise<unknown> {
        if (!bot.canUse("piercingshot", { ignoreMP: false })) return;

        let target = bot.getTargetEntity();
        if (!target) 
        {
            let entities: Entity[] = bot.getEntities({
                withinRange: "attack",
                canDamage: "attack",
            });
            if(entities.length === 0) return;
            target = entities[0];
        }
        await bot.piercingShot(target.id).catch(ignoreExceptions);
    }

    protected async supershot(bot: Ranger): Promise<unknown> {
        if (!bot.canUse("supershot", { ignoreMP: false })) return;

        let target = bot.getTargetEntity();
        if (!target) 
        {

            let entities: Entity[] = bot.getEntities({
                withinRange: "attack",
                canDamage: "attack",
            });
            if(entities.length === 0) return;
            target = entities[0];
        }
        
        await bot.superShot(target.id).catch(ignoreExceptions);
    }
        
}