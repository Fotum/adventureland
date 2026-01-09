import { Game, Mage, PingCompensatedCharacter } from "alclient";
import { STORE_ITEMS } from "../settings";
import { ignoreExceptions, sleep } from "./general";


export function shouldGoBank(bot: PingCompensatedCharacter): boolean {
    for (const [, item] of bot.getItems()) {
        if (item.l) continue;
        for (let [name, storeInfo] of STORE_ITEMS) {
            if (item.name == name && (!item.level || item.level >= storeInfo.level)) {
                return true;
            }
        }
    }

    return false;
}

export async function massMagiport(summoner: PingCompensatedCharacter, toSummon: string[], shouldWait?: boolean, signal?: AbortSignal): Promise<void> {
    if (summoner.ctype != "mage") { return; }
    if (!toSummon || toSummon.length == 0) { return; }

    if (shouldWait === undefined) { shouldWait = false; }
    if (signal === undefined) { signal = new AbortController().signal; }

    let needMp: number = toSummon.length * Game.G.skills.magiport.mp;

    while (summoner.mp < needMp && shouldWait && !signal.aborted)  {
        await sleep(1000);
    }
    signal.throwIfAborted();

    for (let target of toSummon) {
        await (summoner as Mage).magiport(target).catch(ignoreExceptions);
    }
}