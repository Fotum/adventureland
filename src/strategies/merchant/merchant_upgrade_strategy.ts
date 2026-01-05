import { GItem, Game, Item, ItemName, Merchant } from "alclient";
import { MERCHANT_UPGRADE, UpgradeConfig } from "../../base/constants";
import { Loop, LoopName, Strategy, StrategyName } from "../character_runner";


export class MerchantUpgradeStrategy implements Strategy<Merchant> {
    public loops? = new Map<LoopName, Loop<Merchant>>;

    private _name: StrategyName = "upgrade";
    
    public constructor() {
        this.loops.set("upgrade", {
            fn: async (bot: Merchant) => {
                if (bot.rip) return;

                this.upgradeItems(bot).catch(console.error);
                this.compoundItems(bot).catch(console.error);
            },
            interval: 500
        });
    }

    public get name() {
        return this._name;
    }

    protected async upgradeItems(bot: Merchant): Promise<boolean> {
        if (bot.isUpgrading() || bot.map.startsWith("bank")) return;
        
        let itemsToUpgrade: [number, Item][] = [];
        for (let [slot, item] of bot.getItems()) {
            if (!item.upgrade || item.l || !MERCHANT_UPGRADE.has(item.name)) continue;
            itemsToUpgrade.push([slot, item]);
        }

        if (itemsToUpgrade.length == 0) return;
        itemsToUpgrade.sort((a, b) => a[1].level - b[1].level);

        for (let [slot, item] of itemsToUpgrade) {
            let upgradeConfig: UpgradeConfig = MERCHANT_UPGRADE.get(item.name);

            let offering: ItemName;
            if (item.level >= upgradeConfig.offeringAt) offering = "offering";
            else if (item.level >= upgradeConfig.primlingAt) offering = "offeringp";

            if (offering && !bot.hasItem(offering)) continue;

            let scroll: ItemName = (`scroll${item.calculateGrade()}` as ItemName);
            let scrollSlot: number = bot.locateItem(scroll, bot.items, { returnLowestQuantity: true });
            if (scrollSlot === undefined) return;

            let offeringSlot = offering ? bot.locateItem(offering) : undefined;
            if (!bot.canUpgrade(slot, scrollSlot, offeringSlot)) return;

            if (bot.canUse("massproduction")) await bot.massProduction();
            if (bot.canUse("massproductionpp")) await bot.massProductionPP();

            return bot.upgrade(slot, scrollSlot, offeringSlot);
        }
    }

    protected async compoundItems(bot: Merchant): Promise<boolean> {
        if (bot.isCompounding() || bot.map.startsWith("bank")) return;

        for (let [, item] of bot.getItems()) {
            let gItem: GItem = Game.G.items[item.name];
            if (!gItem.compound) continue;

            if (item.l || !MERCHANT_UPGRADE.has(item.name)) continue;
            let items: number[] = bot.locateItems(item.name, bot.items, { level: item.level, locked: false });
            if (items.length < 3) continue;

            let compoundConfg = MERCHANT_UPGRADE.get(item.name);
            let offering: ItemName;
            if (item.level >= compoundConfg.offeringAt) offering = "offering";
            else if (item.level >= compoundConfg.primlingAt) offering = "offeringp";

            if (offering && !bot.hasItem(offering)) continue;

            let cscroll: ItemName = (`cscroll${item.calculateGrade()}` as ItemName);
            let cscrollSlot: number = bot.locateItem(cscroll);
            if (cscrollSlot === undefined) return;

            let offeringSlot = offering ? bot.locateItem(offering) : undefined;
            if (!bot.canCompound(items[0], items[1], items[2], cscrollSlot, offeringSlot)) continue;

            if (bot.canUse("massproduction")) await bot.massProduction();
            if (bot.canUse("massproductionpp")) await bot.massProductionPP();

            return bot.compound(items[0], items[1], items[2], cscrollSlot, offeringSlot);
        }
    }
}