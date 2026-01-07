import { Character, Constants, GItem, Game, Item, ItemDataTrade, Merchant, Pathfinder, Player, Tools } from "alclient";
import { MERCHANT_KEEP_ITEMS, MERCHANT_REPLENISHABLES, MERCHANT_REPLENISH_RATIO } from "../../base/constants";
import { filterRunners, ignoreExceptions } from "../../base/functions";
import { BUY_FROM_PONTY, DISMANTLE_ITEMS, EXCHANGE_ITMES, SELL_ITMES } from "../../base/settings";
import { PartyController } from "../../controller/party_controller";
import { Loop, LoopName, Strategy, StrategyName } from "../character_runner";


export type MerchantConfig = {
    enableExchange?: boolean
    enableDismantle?: boolean
    enableFishing?: boolean
    enableMining?: boolean
    enablePonty?: boolean
    enableMluck?: {
        runners?: boolean
        others?: boolean
        travel?: boolean
        when?: number
    }
}

export const DEFAULT_MERCHANT_CONFIG: MerchantConfig = {
    enableExchange: true,
    enableDismantle: true,
    enablePonty: true,
    enableMluck: {
        runners: true,
        others: true,
        when: 0.75
    }
};

export class MerchantStrategy implements Strategy<Merchant> {
    public loops = new Map<LoopName, Loop<Merchant>>;

    private config: MerchantConfig;
    private _name: StrategyName = "utility";

    protected partyController: PartyController;

    public constructor(partyController: PartyController, config: MerchantConfig = DEFAULT_MERCHANT_CONFIG) {
        this.partyController = partyController;
        this.config = config;

        if (this.config.enableMluck) {
            this.loops.set("mluck", {
                fn: async (bot: Merchant) => {
                    await this.mluck(bot).catch(ignoreExceptions);
                },
                interval: ["mluck"]
            });
        }
        if (this.config.enablePonty) {
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
            },
            interval: 1000
        });
    }

    public get name() {
        return this._name;
    }

    protected async mluck(bot: Merchant): Promise<unknown> {
        if (!bot.canUse("mluck")) return;

        if (!bot.s.mluck || bot.s.mluck.f != bot.id) {
            return bot.mluck(bot.id).catch(ignoreExceptions);
        }

        let canMluck = (target: Character | Player): boolean => {
            if (Tools.distance(bot, target) > Game.G.skills.mluck.range) return false;
            if (!target.s.mluck) return true;
            if (!target.s.mluck.strong) return true;
            if (target.s.invis) return false;
            return target.s.mluck.f == bot.id;
        };

        let shouldMluck = (target: Character | Player): boolean => {
            let mluckWhen: number = this.config.enableMluck?.when ? this.config.enableMluck.when : 0.75;

            if (!canMluck(target)) return false;
            if (target.s.mluck.f == bot.id && target.s.mluck.ms > Game.G.skills.mluck.duration * mluckWhen) return false;
            return true;
        };

        if (this.config.enableMluck?.runners) {
            for (let runner of filterRunners(this.partyController.getRunners(), { serverData: bot.serverData })) {
                if (!shouldMluck(runner.bot)) continue;
                return bot.mluck(runner.bot.id).catch(ignoreExceptions);
            }
        }

        if (this.config.enableMluck?.others) {
            for (let player of bot.getPlayers({ isNPC: false, withinRange: "mluck" })) {
                if (!shouldMluck(player)) continue;
                return bot.mluck(player.id).catch(ignoreExceptions);
            }
        }
    }

    protected async restockScrolls(bot: Merchant): Promise<void> {
        if (bot.rip) return;
        if (bot.map.startsWith("bank")) return;

        for (let [scroll, amount] of MERCHANT_REPLENISHABLES) {
            if (!amount || amount == 0) continue;

            let replenishWhen: number = Math.round(amount * MERCHANT_REPLENISH_RATIO);
            let currScrolls: number = bot.countItem(scroll);
            if (currScrolls > replenishWhen) continue;

            if (bot.esize <= 0 && currScrolls == 0) {
                console.warn(`[${bot.ctype}]: Cannot buy scrolls of type "${scroll}". No inventory space left`);
                continue;
            }
            let needToBuy: number = amount - currScrolls;
            if (!bot.canBuy(scroll, { quantity: needToBuy })) continue;

            await bot.buy(scroll, needToBuy).catch(console.error);
        }
    }

    protected async handleInventory(bot: Merchant): Promise<void> {
        if (bot.rip) return;
        if (bot.map.startsWith("bank")) return;

        for (const [ix, item] of bot.getItems()) {
            if (item.l) continue;
            if (MERCHANT_KEEP_ITEMS.has(item.name)) continue;

            let isLeveled: boolean = (item.level && item.level > 0);
            if (!isLeveled && bot.canSell() && SELL_ITMES.has(item.name)) {
                bot.sell(ix, item.q ?? 1).catch(console.error);
            } else if (this.config.enableExchange && bot.esize > 0 && bot.canExchange(item.name) && EXCHANGE_ITMES.has(item.name)) {
                bot.exchange(ix).catch(console.error);
            } else if (this.config.enableDismantle && !isLeveled && DISMANTLE_ITEMS.has(item.name) && bot.canDismantle(item.name)) {
                bot.dismantle(ix).catch(console.error);
            }
        }
    }

    protected async buyFromPonty(bot: Merchant): Promise<void> {
        if (Pathfinder.locateNPC("secondhands").every((loc) => { return Tools.squaredDistance(bot, loc) > Constants.NPC_INTERACTION_DISTANCE_SQUARED })) return;
        let pontyItems: ItemDataTrade[] = await bot.getPontyItems();

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

            await bot.buyFromPonty(item).catch(console.error);
        }
    }
}