import { CharacterType, ItemData, ItemName } from "alclient";
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

export const SPECIAL_MONSTERS: Set<SpecialName> = new Set(["phoenix", "frog", "fvampire", "mvampire", "jr", "greenjr", "skeletor"]);
export const EVENTS: Set<EventName> = new Set(["goobrawl", "dragold", "icegolem", "valentines", "snowman"]);

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
export const REPLENISH_RATIO: number = 0.3;
export const REPLENISHABLES: Map<ItemName, number> = new Map<ItemName, number>([
    ["elixirluck", 20],
    ["xptome", 1]
]);

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