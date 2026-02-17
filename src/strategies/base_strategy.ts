import {
    Attribute,
    ChestData,
    ChestOpenedData,
    Constants,
    GItem,
    Game,
    IPosition,
    Item,
    ItemData,
    ItemName,
    Merchant,
    PingCompensatedCharacter,
    Player,
    Tools
} from "alclient";
import {
    KEEP_GOLD,
    KEEP_ITEMS,
    MERCHANT_KEEP_GOLD,
    MERCHANT_KEEP_ITEMS,
    MERCHANT_REPLENISHABLES,
    MERCHANT_REPLENISH_RATIO,
    PotionName,
    REPLENISHABLES,
    REPLENISH_RATIO,
    SEND_GOLD_AT
} from "../base/constants";
import { filterRunners, ignoreExceptions } from "../base/functions/general";
import logger from "../logger";
import { DISMANTLE_ITEMS, EXCHANGE_ITMES, SELL_ITMES } from "../base/settings";
import { PartyController } from "../controller/party_controller";
import { Loop, LoopName, Loops, Strategy, StrategyName } from "./character_runner";

export type BaseStrategyConfig = {
    hpPotType: PotionName;
    mpPotType: PotionName;
    useHpAt: number;
    useMpAt: number;
    keepPotions: {
        max: number;
        min: number;
    };
};
export class BaseStrategy<T extends PingCompensatedCharacter> implements Strategy<T> {
    public loops: Loops<T> = new Map<LoopName, Loop<T>>();

    // protected static recentlyLooted = new LRUCache<string, boolean>({ max: 10 });

    private _name: StrategyName = "base";
    private partyController: PartyController;
    private config: BaseStrategyConfig;
    private chestCache = new Map<string, Map<string, Map<string, ChestData>>>();

    private lootOnDrop: (data: ChestData) => void;

    public constructor(partyController: PartyController, config: BaseStrategyConfig) {
        this.partyController = partyController;
        this.config = config;

        this.loops.set("respawn", {
            fn: async (bot: T) => {
                await this.respawnIfDead(bot).catch(ignoreExceptions);
            },
            interval: 5000
        });
        this.loops.set("use_pots", {
            fn: async (bot: T) => {
                await this.usePotions(bot).catch(ignoreExceptions);
            },
            interval: ["use_hp"]
        });
        this.loops.set("loot", {
            fn: async (bot: T) => {
                for (const [, chest] of bot.chests) {
                    await this.lootChest(bot, chest)
                        // .then((data) => {
                        //     logger.log(`[${bot.ctype}]: Successfully looted simple ${data.id}`);
                        //     let lootData: ChestLootData = data as unknown as ChestLootData;
                        //     logger.log(`[${bot.ctype}]: Gold: ${lootData.gold}\nItems: ${lootData.items.map((item) => item.name)}`);
                        // })
                        .catch(ignoreExceptions);
                }
            },
            interval: 250
        });
        this.loops.set("buy_pots", {
            fn: async (bot: T) => {
                await this.restockPotions(bot).catch(logger.error);
            },
            interval: 60_000
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
            this.lootChest(bot, data)
                // .then((data) => () => {
                //     logger.log(`[${bot.ctype}]: Successfully looted onDrop ${data.id}`);
                //     let lootData: ChestLootData = data as unknown as ChestLootData;
                //     logger.log(`[${bot.ctype}]: Gold: ${lootData.gold}\nItems: ${lootData.items.map((item) => item.name)}`);
                // })
                .catch(ignoreExceptions);
        };
        bot.socket.on("drop", this.lootOnDrop);
    }

    public onRemove(bot: T): void {
        if (bot.chests.size) {
            let myChestCache = this.chestCache.get(bot.id);
            let server = `${bot.serverData.region}${bot.serverData.name}`;
            myChestCache.set(server, bot.chests);
        }

        if (this.lootOnDrop) bot.socket.off("drop", this.lootOnDrop.bind(this));
    }

    public get name(): StrategyName {
        return this._name;
    }

    private async respawnIfDead(bot: T): Promise<IPosition> {
        if (!bot.rip) return;
        await bot.respawn().catch(logger.error);
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
        if (bot.c.town || bot.c.fishing || bot.c.mining || bot.c.pickpocket) {
            if (hpRatio <= mpRatio) return bot.regenHP();
            else return bot.regenMP();
        }

        let maxGiveHp: number = Math.min(50, missingHP);
        let maxGiveMp: number = Math.min(100, missingMP);
        let maxGiveBoth: number = Math.max(maxGiveHp, maxGiveMp);

        let maxGiveHpPotion: ItemName | "regen_hp" = "regen_hp";
        let maxGiveMpPotion: ItemName | "regen_mp" = "regen_mp";
        let maxGiveBothPotion: ItemName;

        for (let potion of [this.config.hpPotType, this.config.mpPotType]) {
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

        let looter: PingCompensatedCharacter | Player = bot.players.get(this.partyController.config.looter);
        if (!looter || Tools.squaredDistance(chest, looter) > Constants.NPC_INTERACTION_DISTANCE_SQUARED || looter.rip) {
            looter = bot;
        }
        if (looter.id != bot.id) return;

        if (Tools.squaredDistance(chest, looter) > Constants.NPC_INTERACTION_DISTANCE_SQUARED) return;

        return bot.openChest(chest.id);
    }

    private async restockPotions(bot: T): Promise<void> {
        if (bot.rip) return;
        if (bot.map.startsWith("bank")) return;

        let currHpPots: number = bot.countItem(this.config.hpPotType);
        if (currHpPots <= this.config.keepPotions.min) {
            let toBuy: number = this.config.keepPotions.max - currHpPots;
            if (bot.canBuy(this.config.hpPotType, { quantity: toBuy })) {
                await bot.buy(this.config.hpPotType, toBuy).catch(logger.error);
            } else {
                logger.warn(`[${bot.id}]: Cannot buy HP potions`);
            }
        }

        let currMpPots: number = bot.countItem(this.config.mpPotType);
        if (currMpPots <= this.config.keepPotions.min) {
            let toBuy: number = this.config.keepPotions.max - currMpPots;
            if (bot.canBuy(this.config.mpPotType, { quantity: toBuy })) {
                await bot.buy(this.config.mpPotType, toBuy).catch(logger.error);
            } else {
                logger.warn(`[${bot.id}]: Cannot buy MP potions`);
            }
        }
    }
}

export type BaseInventoryConfig = {
    enableSend?: boolean;
    enableSell?: boolean;
    enableExchange?: boolean;
    enableDismantle?: boolean;
};
export class BaseInventoryStrategy<T extends PingCompensatedCharacter> implements Strategy<T> {
    public loops = new Map<LoopName, Loop<T>>();

    private _name: StrategyName = "inventory";

    protected partyController: PartyController;
    protected config: BaseInventoryConfig;

    public constructor(partyController: PartyController, config: BaseInventoryConfig) {
        this.partyController = partyController;
        this.config = config;

        this.loops.set("inventory", {
            fn: async (bot: T) => {
                if (bot.rip) return;

                await this.moveOverflowItems(bot).catch(ignoreExceptions);
                await this.stackItems(bot).catch(ignoreExceptions);
                await this.sendItems(bot).catch(ignoreExceptions);
                await this.sellItems(bot).catch(ignoreExceptions);
                await this.dismantleItems(bot).catch(ignoreExceptions);
            },
            interval: 5000
        });
        this.loops.set("resuppply", {
            fn: async (bot: T) => {
                if (bot.rip) return;
                if (bot.map.startsWith("bank")) return;

                if (bot.ctype != "merchant") await this.restockReplenishables(bot).catch(ignoreExceptions);
                else await this.restockScrolls(bot).catch(ignoreExceptions);
            },
            interval: 60_000
        });
        this.loops.set("exchange", {
            fn: async (bot: T) => {
                if (bot.rip) return;

                await this.exchangeItems(bot).catch(ignoreExceptions);
            },
            interval: 250
        });
    }

    public get name(): StrategyName {
        return this._name;
    }

    private async restockReplenishables(bot: T): Promise<void> {
        for (const [item, amount] of REPLENISHABLES) {
            let currHave: number = bot.countItem(item);

            if (currHave == 0 && bot.esize == 0) continue;
            if (currHave > amount * REPLENISH_RATIO) continue;

            let toBuy: number = amount - currHave;
            if (bot.canBuy(item, { quantity: toBuy })) {
                await bot.buy(item, toBuy).catch(ignoreExceptions);
            }
        }
    }

    private async restockScrolls(bot: T): Promise<void> {
        for (const [scroll, amount] of MERCHANT_REPLENISHABLES) {
            if (!amount || amount == 0) continue;

            let replenishWhen: number = Math.round(amount * MERCHANT_REPLENISH_RATIO);
            let currScrolls: number = bot.countItem(scroll);
            if (currScrolls > replenishWhen) continue;

            if (bot.esize <= 0 && currScrolls == 0) {
                logger.warn(`[${bot.ctype}]: Cannot buy scrolls of type "${scroll}". No inventory space left`);
                continue;
            }
            let needToBuy: number = amount - currScrolls;
            if (!bot.canBuy(scroll, { quantity: needToBuy })) continue;

            await bot.buy(scroll, needToBuy).catch(logger.error);
        }
    }

    private async moveOverflowItems(bot: T): Promise<void> {
        for (let i = bot.isize; i < bot.items.length; i++) {
            let item1: ItemData = bot.items[i];
            if (!item1) continue;

            for (let j = 0; j < bot.isize; j++) {
                let item2: ItemData = bot.items[j];
                if (item2) continue;

                await bot.swapItems(i, j).catch(ignoreExceptions);
                break;
            }
        }
    }

    private async stackItems(bot: T): Promise<void> {
        for (let i = 0; i < bot.isize - 1; i++) {
            let item1: ItemData = bot.items[i];
            if (!item1 || !item1.q) continue;

            let gItem: GItem = Game.G.items[item1.name];
            if (item1.q == gItem.s) continue;

            for (let j = i + 1; j < bot.isize; j++) {
                let item2: ItemData = bot.items[j];
                if (!item2) continue;
                if (item2.v && !item1.v) continue;

                if (item2.name != item1.name || item2.p != item1.p || item2.q == gItem.s) continue;

                if (item1.q + item2.q <= gItem.s) {
                    await bot.swapItems(j, i).catch(ignoreExceptions);
                } else if (bot.esize) {
                    let newSlot: number = await bot.splitItem(j, gItem.s - item1.q);
                    await bot.swapItems(newSlot, i).catch(ignoreExceptions);
                }
            }
        }
    }

    private async sendItems(bot: T): Promise<void> {
        if (!this.config.enableSend) return;
        if (!this.partyController.config.sendToName) return;
        if (bot.id == this.partyController.config.sendToName) return;

        const sendToName: string = this.partyController.config.sendToName;
        let sendTo: PingCompensatedCharacter | Player = bot.players.get(sendToName);
        if (!sendTo || Tools.squaredDistance(bot, sendTo) >= Constants.NPC_INTERACTION_DISTANCE_SQUARED) return;

        for (const runner of filterRunners(this.partyController.getRunners(), { serverData: bot.serverData })) {
            if (runner.bot.id != sendToName) continue;
            sendTo = runner.bot;
            break;
        }

        // Send gold
        let sendGoldAmt: number = 0;
        if (bot.ctype != "merchant" && bot.gold >= KEEP_GOLD * SEND_GOLD_AT) {
            sendGoldAmt = bot.gold - KEEP_GOLD;
        } else if (bot.ctype == "merchant" && bot.gold >= MERCHANT_KEEP_GOLD * SEND_GOLD_AT) {
            sendGoldAmt = bot.gold - MERCHANT_KEEP_GOLD;
        }
        if (sendGoldAmt > 0) await bot.sendGold(sendToName, bot.gold - KEEP_GOLD).catch(ignoreExceptions);

        // Send items
        let keepItems: Set<ItemName> = bot.ctype != "merchant" ? KEEP_ITEMS : MERCHANT_KEEP_ITEMS;
        for (const [ix, item] of bot.getItems()) {
            if (item.l) continue;
            if (item.level && item.level > 0) continue;
            if (keepItems.has(item.name)) continue;

            if (SELL_ITMES.has(item.name) && bot.canSell()) continue;

            if (sendTo instanceof PingCompensatedCharacter && sendTo.esize == 0) {
                if (!item.q) continue;
                if (
                    !sendTo.hasItem(item.name, sendTo.items, {
                        pvpMarked: item.v !== undefined,
                        quantityLessThan: Game.G.items[item.name].s + 1 - item.q
                    })
                )
                    continue;
            }

            await bot.sendItem(sendToName, ix, item.q ?? 1).catch(ignoreExceptions);
        }
    }

    private async sellItems(bot: T): Promise<void> {
        if (!this.config.enableSell) return;
        if (bot.map.startsWith("bank")) return;

        let keepItems: Set<ItemName> = bot.ctype != "merchant" ? KEEP_ITEMS : MERCHANT_KEEP_ITEMS;
        for (const [ix, item] of bot.getItems()) {
            if (item.l) continue;
            if (item.level && item.level > 0) continue;
            if (keepItems.has(item.name)) continue;
            if (!SELL_ITMES.has(item.name)) continue;
            if (!bot.canSell()) continue;

            await bot.sell(ix, item.q ?? 1).catch(ignoreExceptions);
        }
    }

    private async exchangeItems(bot: T): Promise<unknown> {
        if (!this.config.enableExchange) return;
        if (bot.map.startsWith("bank")) return;
        if (bot.esize <= 1) return;

        let keepItems: Set<ItemName> = bot.ctype != "merchant" ? KEEP_ITEMS : MERCHANT_KEEP_ITEMS;
        const itemsToExchange: [number, Item][] = [];
        for (const [ix, item] of bot.getItems()) {
            if (item.l) continue;
            if (keepItems.has(item.name)) continue;
            if (!EXCHANGE_ITMES.has(item.name)) continue;
            if (!bot.canExchange(item.name)) continue;

            itemsToExchange.push([ix, item]);
        }
        if (itemsToExchange.length == 0) return;

        itemsToExchange.sort((a, b) => (a[1].q ?? 1) - (b[1].q ?? 1));
        if (bot instanceof Merchant) {
            if (bot.canUse("massexchange")) await bot.massExchange();
            if (bot.canUse("massexchangepp")) await bot.massExchangePP();
        }

        return bot.exchange(itemsToExchange[0][0]).catch(ignoreExceptions);
    }

    private async dismantleItems(bot: T): Promise<void> {
        if (!this.config.enableDismantle) return;
        if (bot.map.startsWith("bank")) return;

        let keepItems: Set<ItemName> = bot.ctype != "merchant" ? KEEP_ITEMS : MERCHANT_KEEP_ITEMS;
        for (const [ix, item] of bot.getItems()) {
            if (item.l) continue;
            if (item.level && item.level > 0) continue;
            if (keepItems.has(item.name)) continue;
            if (!DISMANTLE_ITEMS.has(item.name)) continue;
            if (!bot.canDismantle(item.name)) continue;

            await bot.dismantle(ix).catch(ignoreExceptions);
        }
    }
}
