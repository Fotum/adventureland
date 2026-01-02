import { Character, Constants, GItem, Game, IPosition, Item, ItemData, ItemName, Merchant, Pathfinder, PingCompensatedCharacter, Player, Tools } from "alclient";
import { BUY_FROM_PONTY, DISMANTLE_ITEMS, EXCHANGE_ITMES, KEEP_GOLD, KEEP_ITEMS, MAGE_KEEP_ITEMS, MERCHANT_KEEP_ITEMS, MERCHANT_REPLENISHABLES, MERCHANT_REPLENISH_RATIO, PRIEST_KEEP_ITEMS, SELL_ITMES, WARRIOR_KEEP_ITEMS } from "../../base/constants";
import { filterExecutors, ignoreExceptions } from "../../base/functions";
import { CharacterRunner, Loop, LoopName, Strategy, StrategyName } from "../character_runner";


export type MerchantConfig = {
    defaultPosition?: IPosition
    enableExchange?: boolean
    enableDismantle?: boolean
    enableFishing?: boolean
    enableMining?: boolean
    enablePonty?: boolean
    enableOffload?: boolean
    enableMluck?: {
        executors?: boolean
        others?: boolean
        travel?: boolean
    }
    goldToHold: number
    itemsToHold: Set<ItemName>
}

export const DEFAULT_MERCHANT_CONFIG: MerchantConfig = {
    enableExchange: true,
    enableDismantle: true,
    enablePonty: true,
    enableOffload: true,
    enableMluck: {
        executors: true,
        others: true
    },
    goldToHold: KEEP_GOLD,
    itemsToHold: MERCHANT_KEEP_ITEMS
};

export class MerchantStrategy implements Strategy<Merchant> {
    public loops = new Map<LoopName, Loop<Merchant>>;

    private options: MerchantConfig;
    private _name: StrategyName = "utility";

    protected executors: CharacterRunner<PingCompensatedCharacter>[];

    public constructor(executors: CharacterRunner<PingCompensatedCharacter>[], options: MerchantConfig = DEFAULT_MERCHANT_CONFIG) {
        this.executors = executors;
        this.options = options;

        if (this.options.enableMluck) {
            this.loops.set("mluck", {
                fn: async (bot: Merchant) => {
                    await this.mluck(bot).catch(ignoreExceptions);
                },
                interval: ["mluck"]
            });
        }
        if (this.options.enablePonty) {
            this.loops.set("ponty", {
                fn: async (bot: Merchant) => {
                    await this.buyFromPonty(bot).catch(ignoreExceptions);
                },
                interval: 3000
            });
        }
        this.loops.set("inventory", {
            fn: async (bot: Merchant) => {
                this.handleInventory(bot).catch(ignoreExceptions);
                await this.restockScrolls(bot).catch(ignoreExceptions);
                await this.handleOtherInventories(bot).catch(ignoreExceptions)
            },
            interval: 1000
        });
    }

    public get name() {
        return this._name;
    }

    protected async mluck(bot: Merchant): Promise<unknown> {
        if (!bot.canUse("mluck")) return;

        let canMluck = (target: Character | Player): boolean => {
            if (Tools.squaredDistance(bot, target) > Game.G.skills.mluck.range) return false;
            if (!target.s.mluck) return true;
            if (!target.s.mluck.strong) return true;
            if (bot.rip) return false;
            if (target.s.invis) return false;
            return target.s.mluck.f === bot.id;
        };

        let shouldMluck = (target: Character | Player): boolean => {
            if (!canMluck(target)) return false;
            if (target.s.mluck.f == bot.id && target.s.mluck.ms > Game.G.skills.mluck.duration / 2) return false;
            return true;
        };

        let mluckTargets = [
            ...(this.options.enableMluck.executors ? filterExecutors(this.executors, { serverData: bot.serverData }).map((v) => v.bot) : []),
            ...(this.options.enableMluck.others ? bot.getPlayers({ isNPC: false, withinRange: "mluck" }) : [])
        ];

        for (let target of mluckTargets) {
            if (!shouldMluck(target)) continue;
            return bot.mluck(target.id);
        }
    }

    protected async restockScrolls(bot: Merchant): Promise<void> {
        if (bot.rip || bot.map == "bank") return;

        for (let [item, amount] of MERCHANT_REPLENISHABLES) {
            let replenishWhen: number = Math.round(amount * MERCHANT_REPLENISH_RATIO);
            let currScrolls: number = bot.countItem(item, bot.items);
            if (currScrolls > replenishWhen) continue;

            if (bot.esize <= 0 && currScrolls == 0) continue;
            let needToBuy: number = amount - currScrolls;
            if (!bot.canBuy(item, { quantity: needToBuy })) continue;

            await bot.buy(item, needToBuy);
        }
    }

    protected async handleInventory(bot: Merchant): Promise<void> {
        if (bot.rip || bot.map == "bank") return;

        for (let [slot, item] of bot.getItems()) {
            if ((!item.level || item.level == 0) && !item.l && SELL_ITMES.has(item.name))
                bot.sell(slot, item.q || 1).catch(ignoreExceptions);
            else if (this.options.enableExchange && bot.esize > 1 && this.checkExchange(item) && !bot.isExchanging())
                bot.exchange(slot).catch(ignoreExceptions);
            else if (this.options.enableDismantle && DISMANTLE_ITEMS.has(item.name))
                bot.dismantle(slot).catch(ignoreExceptions);
        }
    }

    protected async buyFromPonty(bot: Merchant): Promise<void> {
        if (Pathfinder.locateNPC("secondhands").every((loc) => { return Tools.squaredDistance(bot, loc) > Constants.NPC_INTERACTION_DISTANCE_SQUARED })) return;
        let pontyItems = await bot.getPontyItems();

        for (let item of pontyItems) {
            if (!BUY_FROM_PONTY.has(item.name)) continue;
            let buyPrice: number = BUY_FROM_PONTY.get(item.name);
            
            let itemData: Item = new Item(item, Game.G);
            let pontyPrice: number = itemData.calculateNpcValue() * Game.G.multipliers.lostandfound_mult;
            if (bot.gold < ((item.q ?? 1) * pontyPrice)) continue;
            if (buyPrice < pontyPrice) continue;

            if (bot.esize <= 0) {
                if (!item.q) continue;
                let gItem: GItem = Game.G.items[item.name];
                if (!bot.hasItem(item.name, bot.items, { quantityLessThan: 1 + gItem.s - item.q })) continue;
            }

            await bot.buyFromPonty(item);
        }
    }

    protected async handleOtherInventories(bot: Merchant): Promise<void> {
        // TODO: Remove esize check, coz we can still send stackable items
        if (bot.rip || bot.map == "bank" || bot.esize <= 0) return;

        let filteredExecs: CharacterRunner<PingCompensatedCharacter>[] = filterExecutors(this.executors, { serverData: bot.serverData });
        for (let executor of filteredExecs) {
            let myBot: PingCompensatedCharacter = executor.bot;
            if (myBot.id == bot.id) continue;
            if (Tools.squaredDistance(myBot, bot) > Constants.NPC_INTERACTION_DISTANCE_SQUARED) continue;

            if (myBot.gold > KEEP_GOLD * 1.1)
                await myBot.sendGold(bot.id, myBot.gold - KEEP_GOLD);

            let classKeepItems: ItemData[] = [];
            if (myBot.ctype == "warrior") classKeepItems = WARRIOR_KEEP_ITEMS;
            else if (myBot.ctype == "mage") classKeepItems = MAGE_KEEP_ITEMS;
            else if (myBot.ctype == "priest") classKeepItems = PRIEST_KEEP_ITEMS;

            for (let [slot, item] of myBot.getItems()) {
                if (bot.esize <= 0) return;
                if (item.l) continue;
                if (KEEP_ITEMS.has(item.name)) continue;
                if (classKeepItems.find((i) => i.name == item.name && i.level <= item.level)) continue;

                await myBot.sendItem(bot.id, slot, item.q ?? 1);
            }
        }
    }

    private checkExchange(item: Item): boolean {
        if (item.l) return false;
        if (!item.e) return false;
        if (!EXCHANGE_ITMES.has(item.name)) return false;
        if ((item.e ?? 1) > (item.q ?? 1)) return false;

        return true;
    }
}