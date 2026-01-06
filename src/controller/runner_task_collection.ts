import { Constants, Entity, GItem, Game, IPosition, MonsterName, PingCompensatedCharacter } from "alclient";
import { KEEP_GOLD, MERCHANT_KEEP_GOLD, SEND_GOLD_AT, SPECIAL_MONSTERS, STORE_ITEMS } from "../base/constants";
import { generateRandomNumber, mssince, sleep, ssince } from "../base/functions";
import { SpotConfig } from "../configs/spot_configs";
import { NoAttackScareStrategy } from "../strategies/base_attack_strategy";
import { CharacterRunner } from "../strategies/character_runner";
import { RunnerTask } from "./runner_task";


export function getSpotChangeTask(runner: CharacterRunner<PingCompensatedCharacter>, config: SpotConfig): RunnerTask {
    return undefined;
}

export function getBankStoreTask(runner: CharacterRunner<PingCompensatedCharacter>): RunnerTask {
    let storeItemsFunction = async (runner: CharacterRunner<PingCompensatedCharacter>, signal: AbortSignal) => {
        if (runner.bot.map != "bank") return;

        let itemsToStore = [];
        for (const [invIx, invItem] of runner.bot.getItems()) {
            for (let [itemName, itemInfo] of STORE_ITEMS) {
                if (invItem.name == itemName && (invItem.level === itemInfo.level || invItem.level > itemInfo.level)) {
                    let gItem: GItem = Game.G.items[itemName];
                    itemsToStore.push({
                        name: itemName,
                        invIx: invIx,
                        bankTab: itemInfo.bankTab,
                        max_stack: gItem.s || undefined,
                        curr_stack: invItem.q || undefined
                    });
                }
            }
        }
        if (itemsToStore.length == 0) return;

        let toDepostGold: number = 0;
        if (runner.bot.ctype == "merchant" && runner.bot.gold >= (MERCHANT_KEEP_GOLD * SEND_GOLD_AT)) {
            toDepostGold = runner.bot.gold - MERCHANT_KEEP_GOLD;
        } else if (runner.bot.gold >= (KEEP_GOLD * SEND_GOLD_AT)) {
            toDepostGold = runner.bot.gold - KEEP_GOLD;
        }

        // Deposit gold
        if (toDepostGold > 0) {
            await runner.bot.depositGold(toDepostGold);
        }

        // Deposit items
        for (let toStore of itemsToStore) {
            try {
                await runner.bot.depositItem(toStore.invIx, toStore.bankTab);
            } catch (ex) {
                console.error("bank_store", ex);
            }
        }
    };

    let bankStoreTask: RunnerTask = new RunnerTask(generateRandomNumber(), "bank", runner);
    bankStoreTask
        .pushStep({
            name: "move_to_bank",
            fn: async (runner: CharacterRunner<PingCompensatedCharacter>, signal: AbortSignal) => {
                runner.removeStrategy("move");

                await runner.bot.smartMove("bank", {
                    stopIfTrue: async () => { return signal.aborted; }
                });
                signal.throwIfAborted();
            }
        })
        .pushStep({
            name: "deposit_items",
            fn: storeItemsFunction
        })
        .pushStep({
            name: "leave_bank",
            fn: async (runner: CharacterRunner<PingCompensatedCharacter>, signal: AbortSignal) => { await runner.bot.smartMove("main"); }
        });

    return bankStoreTask;
}

const BOSS_CHECK_ROUTE: ({ name: MonsterName } & IPosition)[] = [
    {name: "phoenix", map: "main", x: -1184,  y: 781}, // Beach
    {name: "phoenix", map: "main", x: 641,  y: 1803},  // Tunnel
    {name: "phoenix", map: "main", x: 1188,  y: -193}, // Scorps
    {name: "phoenix", map: "halloween", x: 8,  y: 631},
    {name: "greenjr", map: "halloween", x: -569,  y: -512},
    {name: "fvampire", map: "halloween", x: -406,  y: -1643},
    {name: "phoenix", map: "cave", x: -181,  y: -1164},
    {name: "mvampire", map: "cave", x: -181,  y: -1164},
    {name: "mvampire", map: "cave", x: 1244,  y: -23},
    {name: "jr", map: "spookytown", x: -784,  y: -301},
    {name: "skeletor", map: "arena", x: 191, y: -348}
];
export function getCheckBossesTask(runner: CharacterRunner<PingCompensatedCharacter>): RunnerTask | undefined {
    const bossesToCheck: Set<MonsterName> = new Set<MonsterName>();
    for (const [specialName, specialInfo] of SPECIAL_MONSTERS) {
        if (!specialInfo.isActive) continue;
        if (!specialInfo.lastCheck || ssince(specialInfo.lastCheck) >= specialInfo.respawn) {
            bossesToCheck.add((specialName as MonsterName));
        }
    }
    if (bossesToCheck.size == 0) { return undefined; }
    let route: ({ name: MonsterName } & IPosition)[] = BOSS_CHECK_ROUTE.filter((spawn) => bossesToCheck.has(spawn.name));
    
    let checkBossesTask: RunnerTask = new RunnerTask(generateRandomNumber(), "bcheck", runner);
    checkBossesTask.pushStep({
        name: "rem_strategy",
        fn: async (runner: CharacterRunner<PingCompensatedCharacter>, signal: AbortSignal) => {
            runner.removeStrategy("move");
        }
    });

    for (const node of route) {
        checkBossesTask.pushStep({
            name: node.name,
            fn: async (runner: CharacterRunner<PingCompensatedCharacter>, signal: AbortSignal) => {
                await runner.bot.smartMove(node, {
                    getWithin: 150,
                    stopIfTrue: async () => { return signal.aborted; }
                });
                signal.throwIfAborted();
            }
        });
    }

    return checkBossesTask;
}

export function getCheckCyberlandTask(runner: CharacterRunner<PingCompensatedCharacter>): RunnerTask {
    let taskFunction = async (runner: CharacterRunner<PingCompensatedCharacter>, signal: AbortSignal) => {
        runner.removeStrategy("move");

        await runner.bot.smartMove("cyberland", {
            stopIfTrue: async () => { return signal.aborted; }
        });
        signal.throwIfAborted();

        runner.bot.socket.emit("eval", { command: "give spares" });
        await sleep(2000)

        for (let [chestId, ] of runner.bot.chests) {
            await runner.bot.openChest(chestId);
        }
        await runner.bot.smartMove("main");
    };

    return new RunnerTask(generateRandomNumber(), "cyberland", runner).pushStep({ name: "check_cyberland", fn: taskFunction });
}

export function getHolidayBuffTask(runner: CharacterRunner<PingCompensatedCharacter>): RunnerTask {
    let taskFunction = async (runner: CharacterRunner<PingCompensatedCharacter>, signal: AbortSignal) => {
        runner.removeStrategy("attack");
        runner.removeStrategy("move");

        runner.applyStrategy(new NoAttackScareStrategy());

        await runner.bot.smartMove("newyear_tree", {
            getWithin: Constants.NPC_INTERACTION_DISTANCE_SQUARED - 50,
            stopIfTrue: async () => { return signal.aborted; }
        });
        signal.throwIfAborted();

        await runner.bot.getHolidaySpirit();
    };

    return new RunnerTask(generateRandomNumber(), "holiday", runner).pushStep({ name: "get_holiday_buff", fn: taskFunction });
}

async function checkCompletionForMs(bot: PingCompensatedCharacter, targets: MonsterName[], signal: AbortSignal, waitForRespawnMs?: number, checkFreqMs?: number, timeoutAfterMs?: number): Promise<void> {
    let targetsAround: Entity[] = await checkTargetsForMs(bot, targets, 5000, signal);
    if (targetsAround.length == 0) return;

    if (!timeoutAfterMs) { timeoutAfterMs = 60_000; }
    if (!checkFreqMs) { checkFreqMs = 1000; }

    let lastCheckTs: number = Date.now();
    let lastHpChange: number = Date.now();
    let targetsLastHp: number = 0;
    while (mssince(lastHpChange) < timeoutAfterMs) {
        signal.throwIfAborted();
        await sleep(checkFreqMs);
        signal.throwIfAborted();

        // Nowait respawn logic
        targetsAround = bot.getEntities({ typeList: targets });
        if (targetsAround.length == 0 && !waitForRespawnMs) return;

        let targetsCurrHp: number = targetsAround.reduce((partial, curr) => partial + curr.hp, 0);
        let isFullGuard: boolean = targetsAround.some((entity) => entity.s.fullguard || entity.s.fullguardx);
        if (targetsCurrHp != targetsLastHp || isFullGuard) {
            lastHpChange = Date.now();
            targetsLastHp = targetsCurrHp;
        }

        // Wait respawn logic
        if (targetsAround.length > 0) lastCheckTs = Date.now();
        if (targetsAround.length == 0 && waitForRespawnMs && mssince(lastCheckTs) >= waitForRespawnMs) return;
    }
}

async function checkTargetsForMs(bot: PingCompensatedCharacter, targets: MonsterName[], waitForMs: number, signal: AbortSignal): Promise<Entity[]> {
    let awaitStart: number = Date.now();
    let targetsAround: Entity[] = bot.getEntities({ typeList: targets });
    while (targetsAround.length == 0 && mssince(awaitStart) < waitForMs) {
        signal.throwIfAborted();
        await sleep(500);
        signal.throwIfAborted();

        targetsAround = bot.getEntities({ typeList: targets });
    }

    return targetsAround;
}