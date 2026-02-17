import {
    Character,
    CharacterType,
    Game,
    IPosition,
    Mage,
    MapName,
    Merchant,
    MonsterName,
    Paladin,
    PingCompensatedCharacter,
    Priest,
    Ranger,
    Rogue,
    ServerData,
    ServerIdentifier,
    ServerRegion,
    Warrior
} from "alclient";
import * as fs from "fs";
import { EventConfig, getEventConfig } from "../../configs/event_configs";
import { PartyController, RunnerState } from "../../controller/party_controller";
import { RunnerTask, RunnerTaskName } from "../../controller/runner_task";
import { getCheckBossesTask, getEmptyTask, getEventTask } from "../../controller/runner_task_collection";
import { RunnerException } from "../../exceptions/exceptions";
import { AdminCommandStrategy } from "../../strategies/admin_command_strategy";
import { NoAttackScareStrategy } from "../../strategies/base_attack_strategy";
import { BaseInventoryStrategy, BaseStrategy } from "../../strategies/base_strategy";
import { CharacterRunner } from "../../strategies/character_runner";
import { MagiportSmartMovingStrategy } from "../../strategies/mage/magiport_strategy";
import { MerchantStrategy } from "../../strategies/merchant/merchant_strategy";
import { MerchantUpgradeStrategy } from "../../strategies/merchant/merchant_upgrade_strategy";
import { AcceptPartyRequest, RequestParty } from "../../strategies/party_strategy";
import { PartyHealStrategy } from "../../strategies/priest/party_heal_strategy";
import { UnstackStrategy } from "../../strategies/unstack_strategy";
import { EventName, MY_CHARACTERS, SAVE_FILES_LOCATION } from "../constants";
import logger from "../../logger";
import { EVENTS } from "../settings";

export type FilterRunnersOptions = {
    owner?: string;
    serverData?: ServerData;
};
export function filterRunners(
    runners: CharacterRunner<PingCompensatedCharacter>[],
    filters: FilterRunnersOptions = {}
): CharacterRunner<PingCompensatedCharacter>[] {
    let filteredRunners: CharacterRunner<PingCompensatedCharacter>[] = [];
    for (let runner of runners) {
        if (!runner.isReady()) continue;
        if (filters.owner && runner.bot.owner !== filters.owner) continue;
        if (
            filters.serverData &&
            (filters.serverData.region !== runner.bot.serverData.region || filters.serverData.name !== runner.bot.serverData.name)
        )
            continue;

        filteredRunners.push(runner);
    }

    return filteredRunners;
}

export async function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export function ignoreExceptions(): void {
    return;
}

type ConsoleLogType = "info" | "warn" | "error";
export function consoleLog(bot: Character, message: string, type?: ConsoleLogType): void {
    if (!message) return;

    if (!type) type = "info";
    let toSend: string = `[${bot.ctype}]: ${message}`;

    if (type == "info") logger.info(toSend);
    else if (type == "error") logger.error(toSend);
    else if (type == "warn") logger.warn(toSend);
}

export function generateRandomId(idLength?: number): string {
    if (!idLength) {
        idLength = 0xffff;
    }
    return (Date.now() & idLength).toString();
}

export function mssince(tsFrom: number, tsTo?: number): number {
    if (!tsTo) {
        tsTo = Date.now();
    }
    return tsTo - tsFrom;
}

export function ssince(tsFrom: number, tsTo?: number): number {
    return Math.round(mssince(tsFrom, tsTo) / 1000);
}

export function msince(tsFrom: number, tsTo?: number): number {
    return Math.round(mssince(tsFrom, tsTo) / 60000);
}

export async function startCharacter(
    partyController: PartyController,
    name: string,
    ctype?: CharacterType,
    serverName?: ServerRegion,
    serverId?: ServerIdentifier
): Promise<CharacterRunner<PingCompensatedCharacter> | undefined> {
    try {
        if (!serverName) serverName = partyController.config.homeServerName;
        if (!serverId) serverId = partyController.config.homeServerId;

        if (!ctype) {
            if (!MY_CHARACTERS.has(name)) {
                throw new RunnerException("InitializationException", `Could not find character with name ${name} in list of MY_CHARACTERS`);
            }
            ctype = MY_CHARACTERS.get(name);
        }

        let baseStrategy: BaseStrategy<PingCompensatedCharacter> = new BaseStrategy(partyController, {
            hpPotType: "hpot1",
            mpPotType: "mpot1",
            useHpAt: 0.8,
            useMpAt: 0.5,
            keepPotions: { max: 5000, min: 3000 }
        });
        let runner: CharacterRunner<PingCompensatedCharacter> = undefined;

        switch (ctype) {
            case "warrior": {
                let character: Warrior = await Game.startWarrior(name, serverName, serverId);
                runner = new CharacterRunner(character, baseStrategy);
                checkRunner(runner, name, ctype);

                break;
            }
            case "mage": {
                let character: Mage = await Game.startMage(name, serverName, serverId);
                runner = new CharacterRunner(character, baseStrategy);
                checkRunner(runner, name, ctype);

                runner.applyStrategy(new MagiportSmartMovingStrategy(partyController));
                break;
            }
            case "priest": {
                let character: Priest = await Game.startPriest(name, serverName, serverId);
                runner = new CharacterRunner(character, baseStrategy);
                checkRunner(runner, name, ctype);

                runner.applyStrategy(new PartyHealStrategy(partyController));
                break;
            }
            case "merchant": {
                let character: Merchant = await Game.startMerchant(name, serverName, serverId);
                runner = new CharacterRunner(character, baseStrategy);
                checkRunner(runner, name, ctype);

                runner.applyStrategy(new NoAttackScareStrategy());
                runner.applyStrategy(new MerchantStrategy(partyController));
                runner.applyStrategy(new MerchantUpgradeStrategy());
                break;
            }
            case "ranger": {
                let character: Ranger = await Game.startRanger(name, serverName, serverId);
                runner = new CharacterRunner(character, baseStrategy);
                checkRunner(runner, name, ctype);

                break;
            }
            case "paladin": {
                let character: Paladin = await Game.startPaladin(name, serverName, serverId);
                runner = new CharacterRunner(character, baseStrategy);
                checkRunner(runner, name, ctype);

                break;
            }
            case "rogue": {
                let character: Rogue = await Game.startRogue(name, serverName, serverId);
                runner = new CharacterRunner(character, baseStrategy);
                checkRunner(runner, name, ctype);

                break;
            }
            default: {
                logger.warn(`No handler for character ${name} of ctype ${ctype} found`);
                return undefined;
            }
        }

        if (runner.bot.id == partyController.config.partyLeader) {
            runner.applyStrategy(new AcceptPartyRequest({ accept: partyController.config.partyAllow }));
        } else {
            runner.applyStrategy(new RequestParty(partyController.config.partyLeader));
        }

        if (runner.bot.ctype != "merchant") {
            runner.applyStrategy(new BaseInventoryStrategy(partyController, { enableSend: true, enableSell: true }));
        } else {
            runner.applyStrategy(
                new BaseInventoryStrategy(partyController, { enableSell: true, enableExchange: true, enableDismantle: true })
            );
        }

        runner.applyStrategy(new UnstackStrategy());
        runner.applyStrategy(new AdminCommandStrategy(partyController));

        return runner;
    } catch (ex) {
        logger.error(ex);

        if (!(ex instanceof RunnerException)) {
            // Reconnect again
            await sleep(5000);
            return startCharacter(partyController, name, ctype, serverName, serverId);
        } else if (ex.message.includes("wait_")) {
            await sleep(5000);
            return startCharacter(partyController, name, ctype, serverName, serverId);
        }
    }
}

function checkRunner(runner: CharacterRunner<PingCompensatedCharacter>, name: string, ctype: CharacterType): void {
    if (!runner)
        throw new RunnerException("InitializationException", `Failed to initialize runner for character ${name} of ctype ${ctype}`);
}

export function saveBossTimersToFile(bossTimers: Map<MonsterName, number>): void {
    try {
        let filePath: string = `${SAVE_FILES_LOCATION}/boss_timers.json`;

        let saveToFile: [string, number][] = [];
        for (const [name, timer] of bossTimers) {
            saveToFile.push([name, timer]);
        }

        if (saveToFile.length == 0) {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        } else {
            fs.writeFileSync(filePath, JSON.stringify(saveToFile), { encoding: "utf8" });
        }
    } catch (ex) {
        logger.error(ex);
    }
}

export function loadBossTimersFromFile(): Map<MonsterName, number> | undefined {
    try {
        let filePath: string = `${SAVE_FILES_LOCATION}/boss_timSers.json`;

        if (!fs.existsSync(filePath)) {
            return undefined;
        }

        let dataFromFile: [string, number][] = JSON.parse(fs.readFileSync(filePath, { encoding: "utf8" }));
        let bossTimers: Map<MonsterName, number> = new Map<MonsterName, number>();
        for (const [name, timer] of dataFromFile) {
            bossTimers.set(name as MonsterName, timer);
        }

        return bossTimers;
    } catch (ex) {
        logger.error(ex);
        return undefined;
    }
}

type StateSaveJson = {
    taskId: string;
    taskName: RunnerTaskName;
    taskStep?: number;
    position?: IPosition;
};
export function saveStateToFile(botName: string, state: RunnerState): void {
    try {
        let filePath: string = `${SAVE_FILES_LOCATION}/${botName}.json`;

        let queueToSave: StateSaveJson[] = [];
        if (EVENTS.has(state.currTask.name) || state.currTask.name == "bcheck") {
            queueToSave.push({
                taskId: state.currTask.id,
                taskName: state.currTask.name,
                taskStep: state.currTask.currentStepNumber,
                position: isValidIPosition(state.currTask.targetPosition) ? state.currTask.targetPosition : undefined
            });
        }

        for (const task of state.taskQueue) {
            if (EVENTS.has(task.name) || task.name == "bcheck") {
                queueToSave.push({
                    taskId: task.id,
                    taskName: task.name,
                    taskStep: task.currentStepNumber,
                    position: isValidIPosition(task.targetPosition) ? task.targetPosition : undefined
                });
            }
        }

        if (queueToSave.length == 0) {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        } else {
            fs.writeFileSync(filePath, JSON.stringify(queueToSave), { encoding: "utf8" });
        }
    } catch (ex) {
        logger.error(ex);
    }
}

export function loadStateFromFile(partyController: PartyController, runner: CharacterRunner<PingCompensatedCharacter>): RunnerState {
    let placeHolder: RunnerTask = getEmptyTask(runner).setComplete("COMPLETE");
    try {
        let filePath: string = `${SAVE_FILES_LOCATION}/${runner.bot.id}.json`;

        if (!fs.existsSync(filePath)) {
            return { currTask: placeHolder, taskQueue: [], taskTimers: new Map<RunnerTaskName, number>() };
        }

        let dataFromFile: string = fs.readFileSync(filePath, { encoding: "utf8" });
        let stateSave: StateSaveJson[] = JSON.parse(dataFromFile);

        let restoredQueue: RunnerTask[] = [];
        for (const state of stateSave) {
            let restoredTask: RunnerTask = undefined;
            let taskName: RunnerTaskName = state.taskName;

            if (EVENTS.has(taskName)) {
                let canJoin: boolean = Game.G.events[state.taskName]?.join ?? false;
                let joinTo: MonsterName | MapName = undefined;
                if (canJoin) {
                    if (state.taskName in Game.G.maps) {
                        joinTo = state.taskName as MapName;
                    } else if (state.taskName in Game.G.monsters) {
                        joinTo = state.taskName as MonsterName;
                    }
                }

                let eventConfig: EventConfig = getEventConfig(taskName, partyController);
                restoredTask = getEventTask(runner, {
                    id: state.taskId,
                    name: state.taskName as EventName,
                    targets: eventConfig.targets,
                    scheduled: true,
                    destination: joinTo ? joinTo : state.position,
                    waitForRespawnMs: eventConfig.waitForRespawnMs,
                    strategies: eventConfig.strategies
                });
            } else if (taskName == "bcheck") {
                restoredTask = getCheckBossesTask(partyController, runner);
            }

            if (state.taskStep !== undefined) {
                for (let i = 0; i < state.taskStep; i++) {
                    restoredTask.setStepComplete(i);
                }
            }
            restoredQueue.push(restoredTask);
        }

        return { currTask: placeHolder, taskQueue: restoredQueue, taskTimers: new Map<RunnerTaskName, number>() };
    } catch (ex) {
        logger.error(ex);
        return { currTask: placeHolder, taskQueue: [], taskTimers: new Map<RunnerTaskName, number>() };
    }
}

function isValidIPosition(value: unknown): value is Omit<IPosition, "map"> {
    return (
        typeof value === "object" &&
        value !== null &&
        (!("map" in value) || ("map" in value && typeof (value as any).map === "string")) &&
        "x" in value &&
        typeof (value as any).x === "number" &&
        "y" in value &&
        typeof (value as any).y === "number"
    );
}
