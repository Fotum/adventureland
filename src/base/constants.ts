import { CharacterType, ItemData, ItemName, MonsterName, PingCompensatedCharacter } from "alclient";
import { EventName, SpecialName } from "../configs/boss_configs";


export const INFINITE_PAST: Date = new Date("1900-01-01Z00:00:00:000");
export const INFINITE_FUTURE: Date = new Date("2100-01-01Z00:00:00:000");

export const MY_CHARACTERS: Map<string, CharacterType> = new Map<string, CharacterType>([
    ["Warious", "warrior"],
    ["arMAGEdon", "mage"],
    ["Archealer", "priest"],
    ["MerchanDiser", "merchant"],
    ["aRanDonDon", "ranger"],
    ["aRogDonDon", "rogue"],
    ["RangerOver", "ranger"]

]);

export const SPECIAL_MONSTERS: Set<SpecialName> = new Set(["phoenix", "frog", "fvampire", "mvampire", "jr", "greenjr", "skeletor"]);
export const EVENTS: Set<EventName> = new Set(["goobrawl", "dragold", "icegolem", "valentines", "snowman"]);

export const KEEP_GOLD: number = 100_000_000;
export const KEEP_ITEMS: Set<ItemName> = new Set<ItemName>([
    "hpot0", "hpot1", "mpot0", "mpot1", "tracker", "computer", "elixirluck",
    "luckbooster", "goldbooster", "supercomputer", "xpbooster", "xptome"
]);
export type PotionName = "hpot0" | "hpot1" | "hpotx" | "mpot0" | "mpot1" | "mpotx";
export const POTIONS_REPLENISH_RATIO: number = 0.9;
export const KEEP_POTIONS: Map<PotionName, number> = new Map<PotionName, number>([
    ["hpot1", 5000],
    ["mpot1", 5000]
]);

export const EXCHANGE_ITMES: Set<ItemName> = new Set<ItemName>([
    "weaponbox", "armorbox", "gem0", "gem1", "greenenvelope", "goldenegg", "candycane", "mistletoe",
    "candy0", "candy1", "basketofeggs", "ornament", "xbox", "candypop"
]);
export const BUY_FROM_PONTY: Map<ItemName, number> = new Map<ItemName, number>([
    ["5bucks", 100_000_000],

    // Heavy set
    ["hhelmet", 20_000_000],
    ["harmor", 23_000_000],
    ["hpants", 18_000_000],

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
    ["dexearring", 11_000_000],
    ["cearring", 10_500_000],

    // Rare items
    ["firestaff", 14_000_000],
    ["fireblade", 10_000_000],
    ["ololipop", 4_000_000],
    ["glolipop", 4_000_000],
    ["oozingterror", 10_000_000],
    ["mittens", 8_000_000],
    ["lmace", 80_000_000],
    ["frankypants", 30_000_000],

    // Super rare items
    ["starkillers", 90_000_000],
    ["fury", 100_000_000],
    ["essenceofgreed", 32_259_224],
    ["zapper", 60_000_000],

    // Event items
    ["mistletoe", 48_000],
    ["candycane", 57_600],
    ["ornament", 7_200],
    ["supermittens", 20_000_000]
]);
export const DISMANTLE_ITEMS: Set<ItemName> = new Set<ItemName>([
    "firebow"
]);
export const SELL_ITMES: Set<ItemName> = new Set<ItemName>([
    "xmassweater", "rednose", "warmscarf", "dexamulet",  "vitring", "vitearring", "snowball", "coat", "pants",
    "snowflakes", "hpbelt", "hpamulet", "cclaw", "iceskates", "hbow", "santasbelt", "candycanesword", "xmaspants", "xmashat", "xmasshoes",
    "stinger", "quiver", "sstinger", "merry", "ringsj", "t2bow", "firecrackers", "throwingstars", "sword", "rapier", "dagger", "xmace",
    "pstem", "spear", "cupid", "swifty", "dexbelt", "shield", "whiteegg", "carrotsword", "spores", "smoke", "gslime", "mushroomstaff",
    "smush", "wbook0", "hgloves", "hboots", "basher", "pmaceofthedead", "daggerofthedead", "bowofthedead", "swordofthedead", "staffofthedead",
    "maceofthedead", "wcap", "wgloves", "wattire", "wshoes", "helmet1", "coat1", "pants1", "gloves1", "shoes1", "helmet", "shoes", "gloves"
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
    ["strearring", { level: 4, primlingAt: 3 }],
    ["intearring", { level: 4, primlingAt: 3 }],
    ["lostearring", { level: 2 }],

    // Rings
    ["strring", { level: 4, primlingAt: 3 }],
    ["intring", { level: 4, primlingAt: 3 }],
    ["dexring", { level: 4, primlingAt: 3 }],

    // Amulets
    ["intamulet", { level: 4, primlingAt: 3 }],
    ["stramulet", { level: 4, primlingAt: 3 }],


    ["t2stramulet", { level: 3, primlingAt: 2 }],
    ["t2intamulet", { level: 3, primlingAt: 2 }],
    ["t2dexamulet", { level: 3, primlingAt: 2 }],

    // Belts
    ["intbelt", { level: 4, offeringAt: 3 }],
    ["strbelt", { level: 4, offeringAt: 3 }],

    ["crossbow", { level: 5, primlingAt: 3 }],

    // Orbs
    ["orbg", { level: 3 }],
    ["jacko", { level: 3 }]
]);

export const WARRIOR_KEEP_ITEMS: ItemData[] = [
    {name: "scythe", level: 5},
    {name: "fireblade", level: 9},
    {name: "ololipop", level: 9},
    {name: "candycanesword", level: 9},
    {name: "rapier", level: 4},
    // {name: "molesteeth", level: 2},
    // {name: "strearring", level: 4},
    {name: "basher", level: 7}
];
export const MAGE_KEEP_ITEMS: ItemData[] = [
    {name: "firestaff", level: 9},
	{name: "gstaff", level: 6},
	{name: "exoarm", level: 1},
	// {name: "orbg", level: 2},
	// {name: "jacko", level: 2},
	{name: "wand", level: 7}
];
export const PRIEST_KEEP_ITEMS: ItemData[] = [
	{name: "wbookhs", level: 2},
	{name: "exoarm", level: 1},
	{name: "mshield", level: 7},
	// {name: "handofmidas", level: 7},
	{name: "wgloves", level: 9} //need add whole wanderers set
];