import { type MonsterName } from "alclient";

export type PotionName = "hpot0" | "hpot1" | "hpotx" | "mpot0" | "mpot1" | "mpotx";

export type SpotName = "cave_first" | "cave_second" | MonsterName;
export type EventName = "goobrawl" | "dragold" | "icegolem" | "valentines" | "snowman" | "mrpumpkin" | "mrgreen";
export type SpecialName = "phoenix" | "frog" | "fvampire" | "mvampire" | "jr" | "greenjr" | "skeletor" | "stompy";

export const SAVE_FILES_LOCATION: string = "./settings";

export const INFINITE_PAST: Date = new Date("1900-01-01Z00:00:00:000");
export const INFINITE_FUTURE: Date = new Date("2100-01-01Z00:00:00:000");
