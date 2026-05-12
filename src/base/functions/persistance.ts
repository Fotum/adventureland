import { Game, PingCompensatedCharacter, type IPosition, type MapName, type MonsterName } from "alclient";
import * as fs from "fs";
import { getEventConfig, type EventConfig } from "../../configs/event_configs.js";
import type { PartyController, RunnerState } from "../../controller/party_controller.js";
import type { RunnerTask, RunnerTaskName } from "../../controller/runner_task.js";
import { getCheckBossesTask, getEmptyTask, getEventTask } from "../../controller/runner_task_collection.js";
import logger from "../../logger.js";
import type { CharacterRunner } from "../../strategies/character_runner.js";
import type { EventName } from "../constants.js";
import { SAVE_FILES_LOCATION } from "../constants.js";
import { EVENTS } from "../settings.js";

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

export function loadStateFromFile(
    partyController: PartyController,
    runner: CharacterRunner<PingCompensatedCharacter>
): RunnerState {
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
                // @ts-ignore: state.taskName will always be MapName or MonsterName
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
