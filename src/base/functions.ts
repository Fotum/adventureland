import { Character, Entity, Game, IPosition, MonsterName, PingCompensatedCharacter, ServerData, Tools } from "alclient"
import { StrategyExecutor } from "../strategies/strategy_executor"
import { SPECIAL_MONSTERS } from "./constants"
import { SpecialName } from "../configs/boss_configs"


export type FilterBotsOptions = {
    owner?: string
    serverData?: ServerData
}

export function filterExecutors(executors: StrategyExecutor<PingCompensatedCharacter>[], filters: FilterBotsOptions = {}): StrategyExecutor<PingCompensatedCharacter>[] {
    let filteredExecutors: StrategyExecutor<PingCompensatedCharacter>[] = [];
    for (let executor of executors) {
        if (!executor.isReady()) continue;
        if (filters.owner && executor.bot.owner !== filters.owner) continue;
        if (filters.serverData &&
            (filters.serverData.region !== executor.bot.serverData.region ||
                filters.serverData.name !== executor.bot.serverData.name)
        ) continue;

        filteredExecutors.push(executor);
    }

    return filteredExecutors;
}

export function sortPriority(bot: Character, types?: MonsterName[]): (a: Entity, b: Entity) => boolean {
    return (a: Entity, b: Entity): boolean => {
        const mainhand = Game.G.items[bot.slots.mainhand?.name]
        const offhand = Game.G.items[bot.slots.offhand?.name]
        const aoe = mainhand?.blast || mainhand?.explosion || offhand?.blast || offhand?.explosion

        if (aoe) {
            // 1hp -> lower priority
            const a_1hp = a["1hp"]
            const b_1hp = b["1hp"]
            if (!a_1hp && b_1hp) return true
            else if (a_1hp && !b_1hp) return false

            // Prioritize lower evasion
            const a_evasion = a.evasion
            const b_evasion = b.evasion
            if (a_evasion < b_evasion) return true
            else if (a_evasion > b_evasion) return false
        }

        // Lower index in array -> higher priority
        if (types?.length) {
            const a_special = SPECIAL_MONSTERS.has((a.type as SpecialName));
            const b_special = SPECIAL_MONSTERS.has((b.type as SpecialName));

            if (a_special && !b_special) return true
            else if (!a_special && b_special) return false;
            // const a_index = types.indexOf(a.type)
            // const b_index = types.indexOf(b.type)
            // if (a_index < b_index) return true
            // else if (a_index > b_index) return false
        }

        // Has a target -> higher priority
        if (a.target && !b.target) return true
        else if (!a.target && b.target) return false

        // Will die -> lower priority
        const a_willDie = a.willDieToProjectiles(bot, bot.projectiles, bot.players, bot.entities)
        const b_willDie = b.willDieToProjectiles(bot, bot.projectiles, bot.players, bot.entities)
        if (!a_willDie && b_willDie) return true
        else if (a_willDie && !b_willDie) return false

        // Will burn to death -> lower priority
        const a_willBurn = a.willBurnToDeath()
        const b_willBurn = b.willBurnToDeath()
        if (!a_willBurn && b_willBurn) return true
        else if (a_willBurn && !b_willBurn) return false

        // Could die -> lower priority
        const a_couldDie = a.couldDieToProjectiles(bot, bot.projectiles, bot.players, bot.entities)
        const b_couldDie = b.couldDieToProjectiles(bot, bot.projectiles, bot.players, bot.entities)
        if (!a_couldDie && b_couldDie) return true
        else if (a_couldDie && !b_couldDie) return false

        // If we have a splash weapon, prioritize monsters with other monsters around them
        if (aoe) {
            const a_nearby = bot.getEntities({ withinRangeOf: a, withinRange: 50 }).length
            const b_nearby = bot.getEntities({ withinRangeOf: b, withinRange: 50 }).length
            if (a_nearby > b_nearby) return true
            else if (b_nearby > a_nearby) return false
        }

        // Higher HP -> higher priority
        if (a.hp > b.hp) return true
        else if (a.hp < b.hp) return false

        // Further from other party members -> higher priority
        const players = bot.getPlayers({ isPartyMember: true })
        if (players.length) {
            const a_party_distance = players
                .map((player) => {
                    const distance = Tools.squaredDistance(a, player)
                    const moving = player.moving
                        ? Tools.squaredDistance(a, { x: player.going_x, y: player.going_y })
                        : 0
                    return distance + moving
                })
                .reduce((sum, distance) => sum + distance, 0)
            const b_party_distance = players
                .map((player) => {
                    const distance = Tools.squaredDistance(b, player)
                    const moving = player.moving
                        ? Tools.squaredDistance(b, { x: player.going_x, y: player.going_y })
                        : 0
                    return distance + moving
                })
                .reduce((sum, distance) => sum + distance, 0)
            return a_party_distance > b_party_distance
        }

        // Closer -> higher priority
        return Tools.distance(a, bot) < Tools.distance(b, bot)
    }
}

export function sortTypeThenClosest(to: Character, types: MonsterName[]) {
    return (a: IPosition & { type: MonsterName }, b: IPosition & { type: MonsterName }) => {
        // const a_index = types.indexOf(a.type);
        // const b_index = types.indexOf(b.type);
        // if (a_index < b_index) return -1;
        // else if (a_index > b_index) return 1;

        const a_special: boolean = SPECIAL_MONSTERS.has((a.type as SpecialName));
        const b_special: boolean = SPECIAL_MONSTERS.has((b.type as SpecialName));
        if (a_special && !b_special) return -1;
        else if (!a_special && b_special) return 1;

        const d_a: number = Tools.squaredDistance(to, a);
        const d_b: number = Tools.squaredDistance(to, b);

        return d_a - d_b;
    }
}

export async function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export function ignoreExceptions(): void {
    return;
}