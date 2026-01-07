import { BankPackName, CharacterType, ItemName } from "alclient";


export type PotionName = "hpot0" | "hpot1" | "hpotx" | "mpot0" | "mpot1" | "mpotx";

export type SpotName = "cave_first" | "cave_second" | "stoneworm" | "booboo" | "bees" | "crabs" | "crabxs" | 
                        "squigs" | "tortoise" | "croc" | "armadillo" | "rats" | "moles" | "porcupine" | "goos" | 
                        "snakes" | "cgoo" | "iceroamer" | "osnake" | "minimush" | "bigbird" | "scorpion" | "spider";
export type EventName = "goobrawl" | "dragold" | "icegolem" | "valentines" | "snowman" | "mrpumpkin" | "mrgreen";
export type SpecialName = "phoenix" | "frog" | "fvampire" | "mvampire" | "jr" | "greenjr" | "skeletor" | "stompy";


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

export const KEEP_GOLD: number = 1_000_000;
export const SEND_GOLD_AT: number = 1.5;
export const KEEP_ITEMS: Set<ItemName> = new Set<ItemName>([
    "hpot0", "hpot1", "mpot0", "mpot1", "tracker", "computer", "elixirluck",
    "luckbooster", "supercomputer", "xpbooster", "xptome"
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