import { type BankPackName, type CharacterType, type ItemName, type MonsterName } from "alclient";

export const PLAYER_MIN_DISTANCE: number = 5;
export const HEAL_RETREAT_RATIO: number = 0.5;

export const MY_CHARACTERS: Map<string, CharacterType> = new Map<string, CharacterType>([
    ["Shalfey", "warrior"],
    ["Flamme", "priest"],
    ["MagicFotum", "mage"],
    ["RangeFotum", "ranger"],
    ["Momental", "merchant"]
]);

export const KEEP_GOLD: number = 5_000_000;
export const SEND_GOLD_AT: number = 1.5;
export const KEEP_ITEMS: Set<ItemName> = new Set<ItemName>([
    "hpot0",
    "hpot1",
    "mpot0",
    "mpot1",
    "tracker",
    "computer",
    "elixirluck",
    "pumpkinspice",
    "luckbooster",
    "supercomputer",
    "xpbooster",
    "xptome"
]);

export const REPLENISH_RATIO: number = 0.3;
export const REPLENISHABLES: Map<ItemName, number> = new Map<ItemName, number>([
    ["elixirluck", 20],
    ["xptome", 1]
]);

export const MERCHANT_KEEP_GOLD: number = 500_000_000;
export const MERCHANT_KEEP_ITEMS: Set<ItemName> = new Set<ItemName>([
    ...KEEP_ITEMS,
    "cscroll0",
    "cscroll1",
    "cscroll2",
    "scroll0",
    "scroll1",
    "scroll2",
    "pickaxe",
    "rod",
    "offeringp",
    "offering"
]);
export const MERCHANT_REPLENISH_RATIO: number = 0.5;
export const MERCHANT_REPLENISHABLES: Map<ItemName, number> = new Map<ItemName, number>([
    ["scroll0", 90],
    ["scroll1", 50],
    ["scroll2", 20],
    ["cscroll0", 50],
    ["cscroll1", 30],
    ["cscroll2", 0]
]);

export const FRIENDLY_CHARACTERS: string[] = [
    "arMAGEdon",
    "aRanDonDon",
    "Archealer",
    "MerchanDiser",
    "Warious",
    "DonWar"
];

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
    ["pinkgoo", true],
    ["snowman", true],
    ["wabbit", false]
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
    "weaponbox",
    "armorbox",
    "gem0",
    "gem1",
    "greenenvelope",
    "brownenvelope",
    "goldenegg",
    "candycane",
    "mistletoe",
    "candy0",
    "candy1",
    "basketofeggs",
    "ornament",
    "xbox",
    "candypop",
    "5bucks"
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

    // Wanderer
    ["wcap", 2_000_000],
    ["wattire", 2_000_000],
    ["wgloves", 2_000_000],

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
export const DISMANTLE_ITEMS: Set<ItemName> = new Set<ItemName>([]);
export const SELL_ITMES: Set<ItemName> = new Set<ItemName>([
    "basher",
    "bowofthedead",
    "candycanesword",
    "carrotsword",
    "cclaw",
    "coat",
    "coat1",
    "crossbow",
    "dagger",
    "daggerofthedead",
    "dexamulet",
    "dexbelt",
    "dexearring",
    "dexring",
    "firecrackers",
    "glolipop",
    "gloves",
    "gloves1",
    "gphelmet",
    "gslime",
    "hbow",
    "hdagger",
    "helmet",
    "helmet1",
    "hhelmet",
    "harmor",
    "hpants",
    "hgloves",
    "hboots",
    "hpamulet",
    "hpbelt",
    "iceskates",
    "maceofthedead",
    "merry",
    "mushroomstaff",
    "pants",
    "pants1",
    "phelmet",
    "pmace",
    "pmaceofthedead",
    "pstem",
    "quiver",
    "rapier",
    "rednose",
    "ringsj",
    "santasbelt",
    "shield",
    "shoes",
    "shoes1",
    "skullamulet",
    "smush",
    "snowball",
    "snowflakes",
    "spear",
    "spores",
    "sstinger",
    "staffofthedead",
    "stinger",
    "swifty",
    "sword",
    "swordofthedead",
    "t2bow",
    "throwingstars",
    "vitearring",
    "vitring",
    "vitscroll",
    "warmscarf",
    "wbook0",
    // "wcap",
    // "wgloves",
    // "wattire",
    "wbreeches",
    "whiteegg",
    "wshoes",
    "xmace",
    "xmashat",
    "xmaspants",
    "xmasshoes",
    "xmassweater",

    "mcape",
    "pclaw",
    "elixirpnres"
]);
type StoreItemInfo = {
    level?: number;
    bankTab: BankPackName;
};
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
    ["cupid", { bankTab: "items3", level: 6 }],

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

    ["horsecapeg", { bankTab: "items3", level: 5 }],

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
    ["essenceofnature", { bankTab: "items1" }],

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
    level: number;
    primlingAt?: number;
    offeringAt?: number;
};
export const MERCHANT_UPGRADE: Map<ItemName, UpgradeConfig> = new Map<ItemName, UpgradeConfig>([
    // --- UPGRADE SECTION --- \\
    ["staff", { level: 8 }],
    ["slimestaff", { level: 8 }],
    ["angelwings", { level: 6 }],
    ["cape", { level: 5 }],
    ["sshield", { level: 7 }],
    ["mshield", { level: 7, primlingAt: 6 }],

    // Wanderer
    // ["wbreeches", { level: 8 }],
    ["wcap", { level: 8 }],
    ["wgloves", { level: 8 }],
    ["wattire", { level: 8 }],

    // Cupid
    ["cupid", { level: 6 }],

    // Darkforge set
    ["xhelmet", { level: 4, primlingAt: 0 }],
    ["xarmor", { level: 4, primlingAt: 0 }],
    ["xpants", { level: 4, primlingAt: 0 }],

    ["firestaff", { level: 8, primlingAt: 7 }],
    ["fireblade", { level: 8, primlingAt: 7 }],
    ["firebow", { level: 8, primlingAt: 7 }],

    ["harbringer", { level: 6 }],
    ["oozingterror", { level: 6 }],
    ["t2quiver", { level: 6 }],

    ["sweaterhs", { level: 6 }],

    // Halloween
    ["ololipop", { level: 8, primlingAt: 6 }],
    ["glolipop", { level: 8, primlingAt: 6 }],

    // Bunny stuff
    ["eears", { level: 7 }],
    ["ecape", { level: 7 }],
    ["epyjamas", { level: 7 }],
    ["pinkie", { level: 7 }],
    ["eslippers", { level: 7 }],

    // ["mcape", { level: 7, primlingAt: 6 }],
    ["horsecapeg", { level: 6, primlingAt: 4 }],
    ["wingedboots", { level: 7 }],
    ["lmace", { level: 3, primlingAt: 0 }],
    ["handofmidas", { level: 5 }],
    ["bataxe", { level: 5 }],
    ["frankypants", { level: 7, primlingAt: 3 }],

    // Winter holidays
    ["gcape", { level: 6 }],
    ["mittens", { level: 8, primlingAt: 7 }],
    ["ornamentstaff", { level: 8 }],
    ["supermittens", { level: 5, primlingAt: 3 }],

    // --- COMPOUND SECTION --- \\
    // Offhands
    ["wbookhs", { level: 3 }],

    // Earrings
    ["strearring", { level: 4, primlingAt: 3 }],
    ["intearring", { level: 4, primlingAt: 3 }],
    ["lostearring", { level: 2 }],

    // Rings
    ["strring", { level: 4, primlingAt: 3 }],
    ["intring", { level: 4, primlingAt: 3 }],

    // Amulets
    ["intamulet", { level: 4, primlingAt: 3 }],
    ["stramulet", { level: 4, primlingAt: 3 }],

    ["t2stramulet", { level: 3, primlingAt: 2 }],
    ["t2intamulet", { level: 3, primlingAt: 2 }],
    ["t2dexamulet", { level: 3, primlingAt: 2 }],

    // Belts
    ["intbelt", { level: 4, primlingAt: 3 }],
    ["strbelt", { level: 4, primlingAt: 3 }],

    // Orbs
    ["orbg", { level: 3 }],
    ["jacko", { level: 4, primlingAt: 3 }],
    ["talkingskull", { level: 3 }],

    ["orbofstr", { level: 4, primlingAt: 2 }],
    ["orbofdex", { level: 4, primlingAt: 2 }],
    ["orbofint", { level: 4, primlingAt: 2 }]
]);
