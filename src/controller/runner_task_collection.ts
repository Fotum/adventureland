import { Constants, Entity, GItem, Game, IPosition, MonsterName, PingCompensatedCharacter } from "alclient";
import { EventName, KEEP_GOLD, MERCHANT_KEEP_GOLD, SEND_GOLD_AT, SpecialName } from "../base/constants";
import { generateRandomId, mssince, sleep, ssince } from "../base/functions/general";
import { SPECIAL_MONSTERS, STORE_ITEMS } from "../base/settings";
import { NoAttackScareStrategy } from "../strategies/base_attack_strategy";
import { CharacterRunner, Strategy } from "../strategies/character_runner";
import { PartyController } from "./party_controller";
import { RunnerTask, RunnerTaskName } from "./runner_task";


export function getChangeSpotTask(taskName: RunnerTaskName, runner: CharacterRunner<PingCompensatedCharacter>, config: { attack?: Strategy<PingCompensatedCharacter>, move?: Strategy<PingCompensatedCharacter> }): RunnerTask {
    if (!config) return;
    if (!config.attack && !config.move) return;

    let taskFunction = async (runner: CharacterRunner<PingCompensatedCharacter>, signal: AbortSignal) => {
        if (config.attack) { runner.removeStrategy("attack"); }
        if (config.move) { runner.removeStrategy("move"); }

        runner.applyStrategies([config.attack, config.move]);
    };

    return new RunnerTask(generateRandomId(), taskName, runner)
                .pushStep({ name: "spot_change", fn: taskFunction });
}

type TaskSpecialMonsterInfo = {
    id: string
    name: SpecialName
    targets: MonsterName[]
    moveTo: IPosition
    strategies: {
        attack?: Strategy<PingCompensatedCharacter>
        move?: Strategy<PingCompensatedCharacter>
    }
}
export function getSpecialMonsterTask(runner: CharacterRunner<PingCompensatedCharacter>, specialInfo: TaskSpecialMonsterInfo): RunnerTask {
    return new RunnerTask(specialInfo.id, specialInfo.name, runner, specialInfo.moveTo)
                .pushStep({
                    name: "move_to_target",
                    fn: async (runner: CharacterRunner<PingCompensatedCharacter>, signal: AbortSignal) => {
                        runner.removeStrategy("move");

                        if (runner.bot.isEquipped("jacko") || runner.bot.hasItem("jacko")) {
                            runner.applyStrategy(new NoAttackScareStrategy());
                        }

                        await runner.bot.smartMove(specialInfo.moveTo, {
                            useBlink: (runner.bot.ctype == "mage"),
                            stopIfTrue: async () => { return signal.aborted; }
                        }).catch((ex) => { throw new Error(`Smart move error: ${ex}`); });
                        signal.throwIfAborted();
                    }
                })
                .pushStep({
                    name: "kill_special",
                    fn: async (runner: CharacterRunner<PingCompensatedCharacter>, signal: AbortSignal) => {
                        runner.applyStrategies([specialInfo.strategies.attack, specialInfo.strategies.move]);
                        // Remove move strategy so character wont go to new random spawn
                        await checkCompletionForMs(runner.bot, specialInfo.targets, signal).finally(() => { runner.removeStrategy("move"); });
                        signal.throwIfAborted();
                    }
                });
}

type TaskEventInfo = {
    id: string
    name: EventName
    targets: MonsterName[]
    destination: IPosition | keyof typeof Game.G.events
    waitForRespawnMs?: number
    strategies: {
        attack?: Strategy<PingCompensatedCharacter>
        move?: Strategy<PingCompensatedCharacter>
    }
}
export function getEventTask(runner: CharacterRunner<PingCompensatedCharacter>, eventInfo: TaskEventInfo): RunnerTask {
    return new RunnerTask(eventInfo.id, eventInfo.name, runner, eventInfo.destination)
                .pushStep({
                    name: "move_to_event",
                    fn: async (runner: CharacterRunner<PingCompensatedCharacter>, signal: AbortSignal) => {
                        runner.removeStrategy("move");

                        if (runner.bot.isEquipped("jacko") || runner.bot.hasItem("jacko")) {
                            runner.applyStrategy(new NoAttackScareStrategy());
                        }

                        await runner.bot.smartMove(eventInfo.destination, {
                            useBlink: (runner.bot.ctype == "mage"),
                            stopIfTrue: async () => { return signal.aborted; }
                        }).catch((ex) => { throw new Error(`Smart move error: ${ex}`); });
                        signal.throwIfAborted();
                    }
                })
                .pushStep({
                    name: "do_event",
                    fn: async (runner: CharacterRunner<PingCompensatedCharacter>, signal: AbortSignal) => {
                        runner.applyStrategies([eventInfo.strategies.attack, eventInfo.strategies.move]);
                        // Remove move strategy so character wont go to new random spawn
                        await checkCompletionForMs(runner.bot, eventInfo.targets, signal, eventInfo.waitForRespawnMs).finally(() => { runner.removeStrategy("move"); });
                        signal.throwIfAborted();
                    }
                });
}

export function getBankStoreTask(runner: CharacterRunner<PingCompensatedCharacter>): RunnerTask {
    let storeItemsFunction = async (runner: CharacterRunner<PingCompensatedCharacter>, signal: AbortSignal) => {
        if (runner.bot.map != "bank") return;

        let itemsToStore = [];
        for (const [invIx, invItem] of runner.bot.getItems()) {
            for (let [itemName, itemInfo] of STORE_ITEMS) {
                if (invItem.name == itemName && (!invItem.level || invItem.level >= itemInfo.level)) {
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

    return new RunnerTask(generateRandomId(), "bank", runner)
                .pushStep({
                    name: "move_to_bank",
                    fn: async (runner: CharacterRunner<PingCompensatedCharacter>, signal: AbortSignal) => {
                        runner.removeStrategy("move");

                        await runner.bot.smartMove("bank", {
                            stopIfTrue: async () => { return signal.aborted; }
                        }).catch((ex) => { throw new Error(`Smart move error: ${ex}`); });
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
export function getCheckBossesTask(partyController: PartyController, runner: CharacterRunner<PingCompensatedCharacter>): RunnerTask | undefined {
    const bossesToCheck: Set<MonsterName> = new Set<MonsterName>();
    for (const [specialName, isActive] of SPECIAL_MONSTERS) {
        if (!isActive) continue;

        let lastCheck: number = partyController.bossTimers.get(specialName);
        if (!lastCheck || ssince(lastCheck) >= Game.G.monsters[specialName].respawn) {
            bossesToCheck.add((specialName as MonsterName));
        }
    }
    if (bossesToCheck.size == 0) { return undefined; }
    let route: ({ name: MonsterName } & IPosition)[] = BOSS_CHECK_ROUTE.filter((spawn) => bossesToCheck.has(spawn.name));
    
    let checkBossesTask: RunnerTask = new RunnerTask(generateRandomId(), "bcheck", runner);
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
                }).catch((ex) => { throw new Error(`Smart move error: ${ex}`); });
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
        }).catch((ex) => { throw new Error(`Smart move error: ${ex}`); });
        signal.throwIfAborted();

        runner.bot.socket.emit("eval", { command: "give spares" });
        await sleep(2000)

        for (let [chestId, ] of runner.bot.chests) {
            await runner.bot.openChest(chestId);
        }
        await runner.bot.smartMove("main");
    };

    return new RunnerTask(generateRandomId(), "cyberland", runner).pushStep({ name: "check_cyberland", fn: taskFunction });
}

export function getHolidayBuffTask(runner: CharacterRunner<PingCompensatedCharacter>): RunnerTask {
    let taskFunction = async (runner: CharacterRunner<PingCompensatedCharacter>, signal: AbortSignal) => {
        runner.removeStrategy("move");

        runner.applyStrategy(new NoAttackScareStrategy());

        await runner.bot.smartMove("newyear_tree", {
            getWithin: Constants.NPC_INTERACTION_DISTANCE - 50,
            useBlink: (runner.bot.ctype == "mage"),
            stopIfTrue: async () => { return signal.aborted; }
        }).catch((ex) => { throw new Error(`Smart move error: ${ex}`); });
        signal.throwIfAborted();

        await runner.bot.getHolidaySpirit();
    };

    return new RunnerTask(generateRandomId(), "holiday", runner).pushStep({ name: "get_holiday_buff", fn: taskFunction });
}

export function getInteractWithQuestNpcTask(runner: CharacterRunner<PingCompensatedCharacter>, action: string): RunnerTask | undefined {
    if (action == "get" && runner.bot.s.monsterhunt) return undefined;
    if (action == "complete" && (!runner.bot.s.monsterhunt || runner.bot.s.monsterhunt.c !== 0)) return undefined;

    let interactTask = async (runner: CharacterRunner<PingCompensatedCharacter>, signal: AbortSignal) => {
        runner.removeStrategy("move");

        runner.applyStrategy(new NoAttackScareStrategy());
        await runner.bot.smartMove("monsterhunter", {
            getWithin: Constants.NPC_INTERACTION_DISTANCE - 50,
            useBlink: (runner.bot.ctype == "mage"),
            stopIfTrue: async () => { return signal.aborted; }
        }).catch((ex) => { throw new Error(`Smart move error: ${ex}`); });
        signal.throwIfAborted();

        if (action == "get") { await runner.bot.getMonsterHuntQuest(); }
        else if (action == "complete") { await runner.bot.finishMonsterHuntQuest(); }
    }

    return new RunnerTask(generateRandomId(), "quest_npc", runner)
                .pushStep({
                    name: "get_or_turn_in",
                    fn: interactTask
                });
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