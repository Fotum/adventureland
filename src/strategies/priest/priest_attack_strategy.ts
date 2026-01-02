import { Entity, Game, PingCompensatedCharacter, Player, Priest, Tools } from "alclient";
import FastPriorityQueue from "fastpriorityqueue";
import { ignoreExceptions } from "../../base/functions";
import { PartyController } from "../../controller/party_controller";
import { BaseAttackConfig, BaseAttackStrategy } from "../base_attack_strategy";


export type PriestAttackConfig = BaseAttackConfig & {
    startHealingAtRatio: number
    disableAbsorb?: true
    disableCurse?: true
    disableDarkBlessing?: true
    enableAbsorbToTank?: true
    enableHealStrangers?: true
}

export class PriestAttackStrategy extends BaseAttackStrategy<Priest> {
    protected config: PriestAttackConfig;
    protected healPriority: (a: PingCompensatedCharacter, b: PingCompensatedCharacter) => boolean;
    
    public constructor(partyController: PartyController, options: PriestAttackConfig) {
        super(partyController, options);

        if (!this.config.disableCurse) this.interval.push("curse");
        if (!this.config.disableDarkBlessing) this.interval.push("darkblessing");
    }

    public onApply(bot: Priest): void {
        super.onApply(bot);

        this.healPriority = (a: PingCompensatedCharacter | Player, b: PingCompensatedCharacter | Player) => {
            let firstIsOurs = a.owner && a.owner == bot.owner;
            let scndIsOurs = b.owner && b.owner == bot.owner;
            if (firstIsOurs && !scndIsOurs) return true;
            else if (scndIsOurs && !firstIsOurs) return false;

            let firstParty = a.party && bot.party && a.party == bot.party;
            let scndParty = b.party && bot.party && b.party == bot.party;
            if (firstParty && !scndParty) return true;
            else if (firstParty && !scndParty) return false;

            let firstHpRatio = a.hp / a.max_hp;
            let scndHpRatio = b.hp / b.max_hp;
            if (firstHpRatio < scndHpRatio) return true;
            else if (scndHpRatio < firstHpRatio) return false;

            return Tools.squaredDistance(a, bot) < Tools.squaredDistance(b, bot);
        };
    }

    protected async attack(bot: Priest): Promise<void> {
        await this.healSomeone(bot).catch(ignoreExceptions);
        if (!this.config.disableDarkBlessing) this.applyDarkBlessing(bot).catch(ignoreExceptions);

        if (!this.shouldAttack(bot)) {
            this.defensiveAttack(bot).catch(ignoreExceptions);
            return;
        }

        await this.equipItems(bot);

        if (!this.config.disableBasicAttack) await this.basicAttack(bot, this.botSort).catch(ignoreExceptions);
        if (!this.config.disableIdleAttack) await this.idleAttack(bot, this.botSort).catch(ignoreExceptions);
        if (!this.config.disableAbsorb) await this.absorbTargets(bot).catch(ignoreExceptions);

        await this.equipItems(bot);
    }

    protected async basicAttack(bot: Priest, priority: (a: Entity, b: Entity) => boolean): Promise<unknown> {
        if (!bot.canUse("attack")) return;

        let entities: Entity[] = bot.getEntities({
            ...this.config,
            canDamage: "attack",
            withinRange: "attack"
        });
        if (entities.length == 0) return;

        let targets = new FastPriorityQueue<Entity>(priority);
        for (let entity of entities) targets.add(entity);

        let targetingMe = bot.calculateTargets();
        if (!this.config.disableCurse) this.applyCurse(bot, targets.peek()).catch(ignoreExceptions);

        while (targets.size) {
            let target: Entity = targets.poll();
            if (!target.target) {
                if (bot.targets >= this.config.maximumTargets) continue;
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

            let canKill: boolean = bot.canKillInOneShot(target);
            if (canKill) this.preventOverkill(bot, target);

            return bot.basicAttack(target.id);
        }
    }

    protected async healSomeone(bot: Priest): Promise<unknown> {
        if (!bot.canUse("heal")) return;

        let players = new FastPriorityQueue<PingCompensatedCharacter | Player>(this.healPriority);
        if (bot.hp / bot.max_hp <= this.config.startHealingAtRatio) players.add(bot);

        let viablePlayers: Player[] = bot.getPlayers({
            isDead: false,
            isFriendly: this.config.enableHealStrangers ? undefined : true,
            isNPC: false,
            withinRange: "heal"
        });
        for (let player of viablePlayers) {
            if (player.hp / player.max_hp > this.config.startHealingAtRatio) continue;
            players.add(player);
        }

        let toHeal = players.peek();
        if (toHeal) return bot.healSkill(toHeal.id);
    }

    protected async absorbTargets(bot: Priest): Promise<unknown> {
        if (!bot.canUse("absorb")) return;

        let entity: Entity = null;
        if (this.config.enableGreedyAggro) {
            entity = bot.getEntity({
                ...this.config,
                isCooperative: true,
                targetingPartyMember: false
            });
        }

        if (this.config.enableAbsorbToTank && !entity) {
            entity = bot.getEntity({
                ...this.config,
                targetingMe: false,
                targetingPartyMember: true
            });
        }

        // Noone to absort
        if (!entity) return;

        let player: Player = bot.players.get(entity.target);
        if (player && Tools.distance(bot, player) < Game.G.skills["absorb"].range) {
            return bot.absorbSins(player.id);
        }
    }

    protected async applyCurse(bot: Priest, target: Entity): Promise<unknown> {
        if (!target) return;
        if (target.s.curse) return;
        if (target.immune && !Game.G.skills["curse"].pierces_immunity) return;
        if (!bot.canUse("curse")) return;
        if (bot.canKillInOneShot(target) || target.willBurnToDeath() || target.willDieToProjectiles(bot, bot.projectiles, bot.players, bot.entities)) return;

        return bot.curse(target.id);
    }

    protected async applyDarkBlessing(bot: Priest): Promise<unknown> {
        if (bot.s.darkblessing) return;
        if (!bot.canUse("darkblessing")) return;
        if (!bot.getEntity(this.config)) return;

        return bot.darkBlessing();
    }
}