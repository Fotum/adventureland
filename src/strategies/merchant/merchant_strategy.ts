import { Character, Constants, GItem, Game, Item, ItemDataTrade, Merchant, Pathfinder, Player, Tools } from "alclient";
import { filterRunners, ignoreExceptions } from "../../base/functions/general";
import { BUY_FROM_PONTY } from "../../base/settings";
import { PartyController } from "../../controller/party_controller";
import { Loop, LoopName, Strategy, StrategyName } from "../character_runner";

export type MerchantConfig = {
    enableFishing?: boolean;
    enableMining?: boolean;
    enablePonty?: boolean;
    enableMluck?: {
        runners?: boolean;
        others?: boolean;
        travel?: boolean;
        when?: number;
    };
};

export const DEFAULT_MERCHANT_CONFIG: MerchantConfig = {
    enablePonty: true,
    enableMluck: {
        runners: true,
        others: true,
        when: 0.75
    }
};

export class MerchantStrategy implements Strategy<Merchant> {
    public loops = new Map<LoopName, Loop<Merchant>>();

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

    protected async buyFromPonty(bot: Merchant): Promise<void> {
        if (
            Pathfinder.locateNPC("secondhands").every((loc) => {
                return Tools.squaredDistance(bot, loc) > Constants.NPC_INTERACTION_DISTANCE_SQUARED;
            })
        )
            return;
        let pontyItems: ItemDataTrade[] = await bot.getPontyItems();

        for (const item of pontyItems) {
            if (!BUY_FROM_PONTY.has(item.name)) continue;
            let buyPrice: number = BUY_FROM_PONTY.get(item.name);

            let itemData: Item = new Item(item, Game.G);
            let pontyPrice: number = itemData.calculateNpcValue() * Game.G.multipliers.lostandfound_mult;
            if (bot.gold < (item.q ?? 1) * pontyPrice) continue;
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
