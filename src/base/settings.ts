import { BankPackName, ItemName, MonsterName } from "alclient";


export const FRIENDLY_CHARACTERS: string[] = [];

export const SPECIAL_MONSTERS: Map<MonsterName, boolean> = new Map<MonsterName, boolean>([
    ["phoenix", true],
    ["frog", false],
    ["mvampire", true],
    ["fvampire", true],
    ["jr", true],
    ["greenjr", true],
    ["skeletor", true],
    ["stompy", false]
]);
export const EVENTS: Map<string, boolean> = new Map<string, boolean>([
    ["goobrawl", true],
    ["dragold", true],
    ["icegolem", true],
    ["valentines", true],
    ["snowman", true]
]);
export const QUESTS: Map<MonsterName, boolean> = new Map<MonsterName, boolean>([
    ["porcupine", true],
    ["bee", true],
    ["goo", true],
    ["snake", true],
    ["crab", true],
    ["rat", true],
    ["squig", true],
    ["cgoo", false],
    ["stoneworm", true],
    ["crabx", true],
    ["osnake", true],
    ["minimush", true],
    ["bat", true],
    ["armadillo", true],
    ["iceroamer", false]
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
type StoreItemInfo = {
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