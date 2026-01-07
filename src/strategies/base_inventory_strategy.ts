import { Constants, Game, PingCompensatedCharacter, Tools } from "alclient";
import { KEEP_GOLD, KEEP_ITEMS, REPLENISHABLES, REPLENISH_RATIO, SEND_GOLD_AT } from "../base/constants";
import { ignoreExceptions } from "../base/functions";
import { SELL_ITMES } from "../base/settings";
import { PartyController } from "../controller/party_controller";
import { Loop, LoopName, Strategy, StrategyName } from "./character_runner";


export class BaseInventoryStrategy<T extends PingCompensatedCharacter> implements Strategy<T> {
    public loops = new Map<LoopName, Loop<T>>;

    private _name: StrategyName = "inventory";

    protected partyController: PartyController;

    public constructor(partyController: PartyController) {
        this.partyController = partyController;

        this.loops.set("inventory", {
            fn: async (bot: T) => {
                await this.handleInventory(bot).catch(ignoreExceptions);
            },
            interval: 1000
        });
        this.loops.set("resuppply", {
            fn: async (bot: T) => {
                await this.handleReplenishables(bot).catch(ignoreExceptions);
            },
            interval: 60_000
        });
    }

    public get name(): StrategyName {
        return this._name;
    }

    protected async handleInventory(bot: T): Promise<void> {
        if (bot.rip) return;
        if (bot.map.startsWith("bank")) return;

        const sendToName: string = this.partyController.config.sendToName;
        if (!sendToName) return;

        const sendToBot: PingCompensatedCharacter | undefined = this.partyController.getRunners().find((runner) => runner.bot.name == sendToName)?.bot;
        const hasDistance: boolean = sendToBot && Tools.squaredDistance(bot, sendToBot) < Constants.NPC_INTERACTION_DISTANCE_SQUARED;
        
        if (hasDistance && bot.gold >= (KEEP_GOLD * SEND_GOLD_AT)) {
            bot.sendGold(sendToName, bot.gold - KEEP_GOLD).catch(console.error);
        }

        for (const [ix, item] of bot.getItems()) {
            if (item.l) continue;
            if (item.level && item.level !== 0) continue;
            if (KEEP_ITEMS.has(item.name)) continue;

            if (SELL_ITMES.has(item.name) && bot.canSell()) {
                bot.sell(ix, item.q ?? 1).catch(console.error);
            } else if (hasDistance) {
                let canSend: boolean = true;
                if (sendToBot.esize == 0) {
                    if (item.q) {
                        let maxStack: number = Game.G.items[item.name].s ?? 1;
                        let targetHas: number = sendToBot.countItem(item.name, sendToBot.items, { pvpMarked: (item.v !== undefined) });
                        canSend = targetHas > 0 && (targetHas + item.q) <= maxStack;
                    } else {
                        canSend = false;
                    }
                }

                if (canSend) await bot.sendItem(sendToName, ix, item.q ?? 1).catch(ignoreExceptions);
            }
        }
    }

    protected async handleReplenishables(bot: T): Promise<void> {
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
}