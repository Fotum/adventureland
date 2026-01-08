import { PingCompensatedCharacter } from "alclient";
import { STORE_ITEMS } from "../settings";


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