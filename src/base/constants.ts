import { BankPackName, CharacterType, IPosition, ItemData, ItemName, MonsterName } from "alclient";
import { EventName, SpecialName } from "../configs/boss_configs";


export type PotionName = "hpot0" | "hpot1" | "hpotx" | "mpot0" | "mpot1" | "mpotx";

export const INFINITE_PAST: Date = new Date("1900-01-01Z00:00:00:000");
export const INFINITE_FUTURE: Date = new Date("2100-01-01Z00:00:00:000");

export const PLAYER_MIN_DISTANCE: number = 15;
export const HEAL_RETREAT_RATIO: number = 0.5;

// export const MY_CHARACTERS: Map<string, CharacterType> = new Map<string, CharacterType>([
//     ["Shalfey", "warrior"],
//     ["Flamme", "priest"],
//     ["MagicFotum", "mage"],
//     ["Momental", "merchant"]
// ]);
export const MY_CHARACTERS: Map<string, CharacterType> = new Map<string, CharacterType>([
    ["Ardy", "warrior"],
    ["NIami", "priest"],
    ["Memph1s", "mage"],
    ["Fotum", "merchant"]
]);
export const FRIENDLY_CHARACTERS: string[] = [];

export type BossInfo = {
    isActive: boolean
    lastCheck?: number
    respawn?: number
}
export const SPECIAL_MONSTERS: Map<SpecialName, BossInfo> = new Map<SpecialName, BossInfo>([
    ["phoenix", { isActive: true }],
    ["frog", { isActive: true }],
    ["mvampire", { isActive: true }],
    ["fvampire", { isActive: true }],
    ["jr", { isActive: true }],
    ["greenjr", { isActive: true }],
    ["skeletor", { isActive: true }],
    ["stompy", { isActive: false }]
]);
export type EventInfo = {
    isActive: boolean
    respawn?: number
}
export const EVENTS: Map<EventName, EventInfo> = new Map<EventName, EventInfo>([
    ["goobrawl", { isActive: true }],
    ["dragold", { isActive: true }],
    ["icegolem", { isActive: true }],
    ["valentines", { isActive: true }],
    ["snowman", { isActive: true }]
]);

export const KEEP_GOLD: number = 1_000_000;
export const SEND_GOLD_AT: number = 1.5;
export const KEEP_ITEMS: Set<ItemName> = new Set<ItemName>([
    "hpot0", "hpot1", "mpot0", "mpot1", "tracker", "computer", "elixirluck",
    "luckbooster", "supercomputer", "xpbooster", "xptome"
]);

export const EXCHANGE_ITMES: Set<ItemName> = new Set<ItemName>([
    "weaponbox", "armorbox", "gem0", "gem1", "greenenvelope", "goldenegg", "candycane", "mistletoe",
    "candy0", "candy1", "basketofeggs", "ornament", "xbox", "candypop"
]);
export const BUY_FROM_PONTY: Map<ItemName, number> = new Map<ItemName, number>([
    ["5bucks", 100_000_000],

    // Darkforge set
    ["xhelmet", 23_500_000],
    ["xarmor", 31_000_000],
    ["xpants", 25_000_000],

    // Amulets
    ["intamulet", 10_000_000],
    ["stramulet", 10_000_000],

    // Rings
    ["intring", 7_000_000],
    ["strring", 7_000_000],
    ["cring", 23_000_000],

    // Earrings
    ["intearring", 11_000_000],
    ["strearring", 11_000_000],
    ["cearring", 10_500_000],

    // Rare items
    ["ololipop", 4_000_000],
    ["glolipop", 4_000_000],
    ["oozingterror", 10_000_000],
    ["mittens", 8_000_000],
    ["frankypants", 30_000_000],

    // Super rare items
    ["starkillers", 90_000_000],
    ["fury", 100_000_000],
    ["essenceofgreed", 32_259_224],
    ["zapper", 60_000_000],

    // Event items
    ["lmace", 80_000_000],
    ["mistletoe", 48_000],
    ["candycane", 57_600],
    ["ornament", 7_200],
    ["supermittens", 20_000_000]
]);
export const DISMANTLE_ITEMS: Set<ItemName> = new Set<ItemName>([
    "firebow"
]);
export const SELL_ITMES: Set<ItemName> = new Set<ItemName>([
    "basher", "bowofthedead", "candycanesword", "carrotsword", "cclaw", "coat", "coat1", "crossbow", "cupid", "dagger", "daggerofthedead", "dexamulet", "dexbelt", "dexearring", "dexring", "firecrackers",
    "glolipop", "gloves", "gloves1", "gphelmet", "gslime", "hboots", "hbow", "hdagger", "helmet", "helmet1", "hgloves", "hhelmet", "hpamulet", "hpants", "hpbelt", "iceskates", "maceofthedead", "merry",
    "mushroomstaff", "pants", "pants1", "phelmet", "pmace", "pmaceofthedead", "pstem", "quiver", "rapier", "rednose", "ringsj", "santasbelt", "shield", "shoes", "shoes1", "skullamulet", "smoke", "smush",
    "snowball", "snowflakes", "spear", "spores", "sstinger", "staffofthedead", "stinger", "swifty", "sword", "swordofthedead", "t2bow", "throwingstars", "vitearring", "vitring", "vitscroll", "warmscarf",
    "wattire", "wbook0", "wcap", "wgloves", "whiteegg", "wshoes", "xmace", "xmashat", "xmaspants", "xmasshoes", "xmassweater"
]);
export type StoreItemInfo = {
    level?: number
    bankTab: BankPackName
}
export const STORE_ITEMS: Map<ItemName, StoreItemInfo> = new Map<ItemName, StoreItemInfo>([
    ["fireblade", { bankTab: "items3", level: 6 }],
    ["firestaff", { bankTab: "items3", level: 6 }],
    ["firebow", { bankTab: "items3", level: 6 }],
    ["ololipop", { bankTab: "items3", level: 5 }],
    ["glolipop", { bankTab: "items3", level: 5 }],
    ["oozingterror", { bankTab: "items3", level: 5 }],
    ["harbringer", { bankTab: "items3", level: 5 }],
    ["bataxe", { bankTab: "items3", level: 5 }],
    ["mshield", { bankTab: "items3", level: 5 }],
    ["ornamentstaff", { bankTab: "items3", level: 6 }],

    // Armor
    ["hhelmet", { bankTab: "items3", level: 5 }],
    ["harmor", { bankTab: "items3", level: 5 }],
    ["hpants", { bankTab: "items3", level: 5 }],

    ["xhelmet", { bankTab: "items3" }],
    ["xarmor", { bankTab: "items3" }],
    ["xpants", { bankTab: "items3" }],

    ["mittens", { bankTab: "items3", level: 6 }],
    ["mcape", { bankTab: "items3", level: 6 }],
    ["angelwings", { bankTab: "items3", level: 5 }],

    // Jewelry
    ["intamulet", { bankTab: "items3", level: 3 }],
    ["stramulet", { bankTab: "items3", level: 3 }],

    ["intearring", { bankTab: "items3", level: 3 }],
    ["strearring", { bankTab: "items3", level: 3 }],

    // Materials and keys
    ["cryptkey", { bankTab: "items0" }],
    ["frozenkey", { bankTab: "items0" }],
    ["seashell", { bankTab: "items0" }],
    ["carrot", { bankTab: "items0" }],
    ["bwing", { bankTab: "items0" }],
    ["beewings", { bankTab: "items0" }],
    ["essenceoffrost", { bankTab: "items0" }],
    ["essenceoffire", { bankTab: "items0" }],
    ["lotusf", { bankTab: "items0" }],
    ["bfur", { bankTab: "items0" }],
    ["pleather", { bankTab: "items0" }],
    ["crabclaw", { bankTab: "items0" }],
    ["rattail", { bankTab: "items0" }],
    ["snakefang", { bankTab: "items0" }],
    ["shadowstone", { bankTab: "items0" }],
    ["smoke", { bankTab: "items0" }],
    ["cscale", { bankTab: "items0" }],
    ["spidersilk", { bankTab: "items0" }],
    ["poison", { bankTab: "items0" }],

    ["offeringp", { bankTab: "items0" }],
    ["offering", { bankTab: "items0" }],

    ["vitscroll", { bankTab: "items0" }],
    ["forscroll", { bankTab: "items0" }],

    ["electronics", { bankTab: "items1" }],
    ["funtoken", { bankTab: "items1" }],
    ["monstertoken", { bankTab: "items1" }],
    ["candypop", { bankTab: "items1" }],

    // Consumables
    ["hotchocolate", { bankTab: "items1" }],
    ["pumpkinspice", { bankTab: "items1" }],
    ["eggnog", { bankTab: "items1" }],

    // Event items
    // xbox
    ["x0", { bankTab: "items6" }],
    ["x1", { bankTab: "items6" }],
    ["x2", { bankTab: "items6" }],
    ["x3", { bankTab: "items6" }],
    ["x4", { bankTab: "items6" }],
    ["x5", { bankTab: "items6" }],
    ["x6", { bankTab: "items6" }],
    ["x7", { bankTab: "items6" }],
    ["x8", { bankTab: "items6" }],

    // Basket
    ["egg0", { bankTab: "items6" }],
    ["egg1", { bankTab: "items6" }],
    ["egg2", { bankTab: "items6" }],
    ["egg3", { bankTab: "items6" }],
    ["egg4", { bankTab: "items6" }],
    ["egg5", { bankTab: "items6" }],
    ["egg6", { bankTab: "items6" }],
    ["egg7", { bankTab: "items6" }],
    ["egg8", { bankTab: "items6" }]
]);

export const REPLENISH_RATIO: number = 0.3;
export const REPLENISHABLES: Map<ItemName, number> = new Map<ItemName, number>([
    ["elixirluck", 20],
    ["xptome", 1]
]);

export const MERCHANT_KEEP_GOLD: number = 500_000_000;
export const MERCHANT_KEEP_ITEMS: Set<ItemName> = new Set<ItemName>([
    ...KEEP_ITEMS, "cscroll0", "cscroll1", "cscroll2", "scroll0", "scroll1", "scroll2", "pickaxe", "rod", "offeringp", "offering"
]);
export const MERCHANT_REPLENISH_RATIO: number = 0.5;
export const MERCHANT_REPLENISHABLES: Map<ItemName, number> = new Map<ItemName, number>([
    ["scroll0", 50],
    ["scroll1", 30],
    ["scroll2", 20],
    ["cscroll0", 50],
    ["cscroll1", 30],
    ["cscroll2", 0]
]);

export type UpgradeConfig = {
    level: number,
    primlingAt?: number
    offeringAt?: number
}
export const MERCHANT_UPGRADE: Map<ItemName, UpgradeConfig> = new Map<ItemName, UpgradeConfig>([
    // --- UPGRADE SECTION --- \\
    ["staff", { level: 8 }],
    ["slimestaff", { level: 8 }],
    ["angelwings", { level: 5 }],
    ["cape", { level: 5 }],
    ["sshield", { level: 7 }],
    ["mshield", { level: 6 }],
    ["wbreeches", { level: 8 }],
    
    // Heavy set
    ["hhelmet", { level: 5 }],
    ["harmor", { level: 5 }],
    ["hpants", { level: 5 }],

    // Darkforge set
    ["xhelmet", { level: 3, primlingAt: 0 }],
    ["xarmor", { level: 3, primlingAt: 0 }],
    ["xpants", { level: 3, primlingAt: 0 }],

    ["firestaff", { level: 8, primlingAt: 7 }],
    ["fireblade", { level: 8, primlingAt: 7 }],

    ["harbringer", { level: 6 }],
    ["oozingterror", { level: 6 }],

    ["sweaterhs", { level: 6 }],

    // Halloween
    ["phelmet", { level: 6 }],
    ["gphelmet", { level: 3 }],
    ["ololipop", { level: 8, primlingAt: 6 }],
    ["glolipop", { level: 8, primlingAt: 6 }],

    // Bunny stuff
    ["eears", { level: 7 }],
    ["ecape", { level: 7 }],
    ["epyjamas", { level: 7 }],
    ["pinkie", { level: 7 }],
    ["eslippers", { level: 7 }],

    ["mcape", { level: 7, primlingAt: 6 }],
    ["wingedboots", { level: 7 }],
    ["lmace", { level: 3, primlingAt: 0 }],
    ["handofmidas", { level: 5 }],
    ["bataxe", { level: 5 }],
    ["frankypants", { level: 5, primlingAt: 0 }],

    // Winter holidays
    ["gcape", { level: 6 }],
    ["mittens", { level: 7 }],
    ["ornamentstaff", { level: 7 }],
    ["supermittens", { level: 3, primlingAt: 0 }],

    // --- COMPOUND SECTION --- \\
    // Offhands
    ["wbookhs", { level: 3 }],

    // Earrings
    ["strearring", { level: 4, offeringAt: 3 }],
    ["intearring", { level: 4, offeringAt: 3 }],
    ["lostearring", { level: 2 }],

    // Rings
    ["strring", { level: 4, offeringAt: 3 }],
    ["intring", { level: 4, offeringAt: 3 }],

    // Amulets
    ["intamulet", { level: 4, offeringAt: 3 }],
    ["stramulet", { level: 4, offeringAt: 3 }],

    ["t2stramulet", { level: 3, offeringAt: 2 }],
    ["t2intamulet", { level: 3, offeringAt: 2 }],
    ["t2dexamulet", { level: 3, offeringAt: 2 }],

    // Belts
    ["intbelt", { level: 4, offeringAt: 3 }],
    ["strbelt", { level: 4, offeringAt: 3 }],

    // Orbs
    ["orbg", { level: 3 }],
    ["jacko", { level: 3 }]
]);