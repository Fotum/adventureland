import { Character, CharacterType, Entity, Game, IPosition, Mage, Merchant, MonsterName, Paladin, PingCompensatedCharacter, Priest, Ranger, Rogue, ServerData, ServerIdentifier, ServerRegion, Tools, Warrior } from "alclient"
import { SpecialName } from "../configs/boss_configs"
import { PartyController } from "../controller/party_controller"
import { CharacterRunner } from "../strategies/character_runner"
import { SPECIAL_MONSTERS } from "./constants"
import { BaseStrategy } from "../strategies/base_strategy"


export type FilterBotsOptions = {
    owner?: string
    serverData?: ServerData
}

export function filterRunners(executors: CharacterRunner<PingCompensatedCharacter>[], filters: FilterBotsOptions = {}): CharacterRunner<PingCompensatedCharacter>[] {
    let filteredExecutors: CharacterRunner<PingCompensatedCharacter>[] = [];
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

export async function startCharacter(partyController: PartyController, name: string, ctype: CharacterType, serverName: ServerRegion, serverId: ServerIdentifier): Promise<CharacterRunner<PingCompensatedCharacter>> {
    let baseStrategy: BaseStrategy<PingCompensatedCharacter> = new BaseStrategy(partyController, { hpPotType: "hpot0", mpPotType: "mpot0", useHpAt: 0.8, useMpAt: 0.5, keepPotions: { max: 5000, min: 3000 }});

    try {
        let runner: CharacterRunner<PingCompensatedCharacter>;
        switch (ctype) {
            case "warrior": {
                let character: Warrior = await Game.startWarrior(name, serverName, serverId);
                runner = new CharacterRunner(character, baseStrategy);
                break;
            }
            case "mage": {
                let character: Mage = await Game.startMage(name, serverName, serverId);
                runner = new CharacterRunner(character, baseStrategy);
                break;
            }
            case "priest": {
                let character: Priest = await Game.startPriest(name, serverName, serverId);
                runner = new CharacterRunner(character, baseStrategy);
                break;
            }
            case "merchant": {
                let character: Merchant = await Game.startMerchant(name, serverName, serverId);
                runner = new CharacterRunner(character, baseStrategy);
                break;
            }
            case "ranger": {
                let character: Ranger = await Game.startRanger(name, serverName, serverId);
                runner = new CharacterRunner(character, baseStrategy);
                break;
            }
            case "paladin": {
                let character: Paladin = await Game.startPaladin(name, serverName, serverId);
                runner = new CharacterRunner(character, baseStrategy);
                break;
            }
            case "rogue": {
                let character: Rogue = await Game.startRogue(name, serverName, serverId);
                runner = new CharacterRunner(character, baseStrategy);
                break;
            }
            default:
                console.warn(`No handler for character ${name} of ctype ${ctype} found`);
        }

        return runner;
    } catch (ex) {
        console.error(ex);
    }
}