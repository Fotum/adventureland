import { Attribute, Character, ChestData, ChestOpenedData, Constants, GItem, Game, ItemName, PingCompensatedCharacter, Tools } from "alclient";
import { Loop, LoopName, Loops, Strategy, StrategyExecutor, StrategyName } from "./strategy_executor";
import { LRUCache } from "lru-cache";
import { ignoreExceptions } from "../base/functions";
import { PotionName } from "../base/constants";


export type RestorationConfig = {
    hpPotType: PotionName
    mpPotType: PotionName
    useHpAt: number
    useMpAt: number
}

export class BaseStrategy<T extends PingCompensatedCharacter> implements Strategy<T> {
    public loops: Loops<T> = new Map<LoopName, Loop<T>>();

    protected static recentlyLooted = new LRUCache<string, boolean>({ max: 10 });

    private _name: StrategyName = "base";
    private executors: StrategyExecutor<T>[];
    private options: RestorationConfig;
    private chestCache = new Map<string, Map<string, Map<string, ChestData>>>();

    private lootOnDrop: (data: ChestData) => void;

    public constructor(executors: StrategyExecutor<T>[], config: RestorationConfig) {
        this.executors = executors;
        this.options = config;

        this.loops.set("respawn", {
            fn: async (bot: T) => {
                await this.respawnIfDead(bot).catch(ignoreExceptions);
            },
            interval: 5000
        })
        this.loops.set("use_pots", {
            fn: async (bot: T) => {
                await this.usePotions(bot).catch(ignoreExceptions);
            },
            interval: ["use_hp"]
        });
        this.loops.set("loot", {
            fn: async (bot: T) => {
                for (let [, chest] of bot.chests) {
                    await this.lootChest(bot, chest).catch(ignoreExceptions);
                }
            },
            interval: 250
        });
    }

    public onApply(bot: T): void {
        if (!this.chestCache.has(bot.id)) {
            this.chestCache.set(bot.id, new Map());
        }

        let myChestCache = this.chestCache.get(bot.id);
        let server = `${bot.serverData.region}${bot.serverData.name}`;
        if (myChestCache.has(server)) {
            for (let [chestId, chestData] of myChestCache.get(server)) {
                bot.chests.set(chestId, chestData);
            }

            myChestCache.delete(server);
        }

        this.lootOnDrop = (data: ChestData) => {
            this.lootChest(bot, data).catch(console.error);
        };
        bot.socket.on("drop", this.lootOnDrop);
    }

    public onRemove(bot: T): void {
        if (bot.chests.size) {
            let myChestCache = this.chestCache.get(bot.id);
            let server = `${bot.serverData.region}${bot.serverData.name}`;
            myChestCache.set(server, bot.chests);
        }

        if (this.lootOnDrop) bot.socket.off("drop", this.lootOnDrop);
    }

    public get name() {
        return this._name;
    }

    private async respawnIfDead(bot: T) {
        if (!bot.rip) return;
        await bot.respawn().catch(console.error);
    }

    private async usePotions(bot: T): Promise<void> {
        if (bot.rip) return;

        const missingHP: number = bot.max_hp - bot.hp;
        const missingMP: number = bot.max_mp - bot.mp;

        // We are at full hp and mp, no need to heal
        if (missingHP == 0 && missingMP == 0) return;

        const hpRatio: number = bot.hp / bot.max_hp;
        const mpRatio: number = bot.mp / bot.max_mp;

        // Just regen hp, since we are still pretty good
        if ((bot.c.town || bot.c.fishing || bot.c.mining || bot.c.pickpocket) ||
            (hpRatio < this.options.useHpAt && mpRatio < this.options.useMpAt)
        ) {
            if (hpRatio <= mpRatio) return bot.regenHP();
            else return bot.regenMP();
        }

        let maxGiveHp: number = Math.min(50, missingHP);
        let maxGiveMp: number = Math.min(100, missingMP);
        let maxGiveBoth: number = Math.max(maxGiveHp, maxGiveMp);

        let maxGiveHpPotion: ItemName | "regen_hp" = "regen_hp";
        let maxGiveMpPotion: ItemName | "regen_mp" = "regen_mp";
        let maxGiveBothPotion: ItemName;

        for (let potion of [this.options.hpPotType, this.options.mpPotType]) {
            let gItem: GItem = Game.G.items[potion];
            if (!gItem.gives) continue; // Not a potions
            if (!bot.hasItem(potion)) continue; // No potions

            let couldGiveHp: number = 0;
            let couldGiveMp: number = 0;

            for (let give of [
                ...gItem.gives,
                ...(((gItem[bot.map] as unknown as any)?.gives as [Attribute, number][]) ?? []),
                ...(((gItem[bot.ctype] as unknown as any)?.gives as [Attribute, number][]) ?? [])
            ]) {
                if (give[0] === "hp") couldGiveHp += Math.max(0, Math.min(give[1], missingHP));
                else if (give[0] === "mp") couldGiveMp += Math.max(0, Math.min(give[1], missingMP));
            }

            if (couldGiveHp > maxGiveHp) {
                maxGiveHp = couldGiveHp;
                maxGiveHpPotion = potion;
            }

            if (couldGiveMp > maxGiveMp) {
                maxGiveMp = couldGiveMp;
                maxGiveMpPotion = potion;
            }

            let couldGiveBoth: number = couldGiveHp + couldGiveMp;
            if (couldGiveBoth > maxGiveBoth) {
                maxGiveBoth = couldGiveBoth;
                maxGiveBothPotion = potion;
            }
        }

        if (maxGiveBothPotion && Math.abs(hpRatio - mpRatio) < 0.25) {
            return bot.usePotion(bot.locateItem(maxGiveBothPotion, bot.items, { returnLowestQuantity: true }));
        }

        if (hpRatio <= mpRatio) {
            if (maxGiveHpPotion === "regen_hp") return bot.regenHP();
            else return bot.usePotion(bot.locateItem(maxGiveHpPotion, bot.items, { returnLowestQuantity: true }));
        }

        if (maxGiveMpPotion === "regen_mp") return bot.regenMP();
        else return bot.usePotion(bot.locateItem(maxGiveMpPotion, bot.items, { returnLowestQuantity: true }));
    }

    private async lootChest(bot: T, chest: ChestData): Promise<ChestOpenedData> {
        if (bot.rip) return;
        if (Tools.squaredDistance(chest, bot) > Constants.NPC_INTERACTION_DISTANCE_SQUARED) return;
        if (BaseStrategy.recentlyLooted.has(chest.id)) return;

        let mf: number = 0;
        let mfer: Character;
        for (const myBot of this.executors) {
            const friend = myBot.bot;
            if (friend.serverData.region !== bot.serverData.region || friend.serverData.name !== bot.serverData.name) continue;
            if (!friend.chests.has(chest.id)) continue; // Friend dont have this chest
            if (Tools.squaredDistance(chest, friend) > Constants.NPC_INTERACTION_DISTANCE_SQUARED) continue; // Chest is too far away from him
            if (friend.goldm > mf) {
                mf = friend.goldm;
                mfer = friend;
            }
        }

        if (mfer && mfer !== bot) return; // Someone with better mf is around, let them loot

        // Loot it
        BaseStrategy.recentlyLooted.set(chest.id, true);
        return bot.openChest(chest.id);
    }
}