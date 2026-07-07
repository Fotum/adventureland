import {
    PingCompensatedCharacter,
    type CharacterType,
    type MonsterName,
    type ServerIdentifier,
    type ServerRegion
} from "alclient";
import { type SpotName } from "../base/constants.js";
import { shouldGoBank } from "../base/functions/characters.js";
import { msince } from "../base/functions/general.js";
import { getPreparedEvents, type PreparedEvent } from "../base/functions/monsters.js";
import {
    loadBossTimersFromFile,
    loadStateFromFile,
    saveBossTimersToFile,
    saveStateToFile
} from "../base/functions/persistance.js";
import { QUESTS } from "../base/settings.js";
import { getQuestConfig } from "../configs/quest_configs.js";
import { getSpotConfig } from "../configs/spot_configs.js";
import logger from "../logger.js";
import { CharacterRunner, type Strategy } from "../strategies/character_runner.js";
import { RunnerTask, type RunnerTaskName } from "./runner_task.js";
import {
    getBankStoreTask,
    getChangeSpotTask,
    getCheckBossesTask,
    getCheckCyberlandTask,
    getEventTask,
    getHolidayBuffTask,
    getInteractWithQuestNpcTask
} from "./runner_task_collection.js";

export type PartyControllerConfig = {
    homeServerName: ServerRegion;
    homeServerId: ServerIdentifier;
    defaultSpot: SpotName;
    partyLeader: string;
    partyAllow: string[];
    mainTank?: string;
    sendToName?: string;

    looter?: string;
    doQuests?: Set<CharacterType>;
    defSpotOverride?: Map<String, SpotName>;

    enableBosses?: boolean;
    enableCyberland?: boolean;
    enableBanking?: boolean;
};
export type RunnerState = {
    currTask: RunnerTask;
    taskQueue: RunnerTask[];
    taskTimers: Map<RunnerTaskName, number>;
};
export class PartyController {
    public config: PartyControllerConfig;

    private isRunning: boolean = false;

    private activeRunners: Map<string, CharacterRunner<PingCompensatedCharacter>>;
    private runnerStates: Map<string, RunnerState>;
    private _bossTimers: Map<MonsterName, number>;

    constructor(config: PartyControllerConfig) {
        this.config = config;

        this.activeRunners = new Map<string, CharacterRunner<PingCompensatedCharacter>>();
        this.runnerStates = new Map<string, RunnerState>();

        let loadedBossTimers: Map<MonsterName, number> = loadBossTimersFromFile();
        if (loadedBossTimers) {
            this._bossTimers = loadedBossTimers;
        } else {
            this._bossTimers = new Map<MonsterName, number>();
        }

        this.logicLoop();

        process.on("SIGINT", this.saveAndExit.bind(this));
        process.on("SIGTERM", this.saveAndExit.bind(this));
    }

    private async logicLoop(): Promise<void> {
        try {
            if (!this.isRunning) return;

            for (const [name, runner] of this.activeRunners) {
                if (!runner.isReady() || runner.bot.rip) continue;

                let currState: RunnerState = this.runnerStates.get(name);
                // Check if we have something to execute from queue
                if (currState.currTask.isComplete && currState.taskQueue.length > 0) {
                    // Save time when last task finished
                    currState.taskTimers.set(currState.currTask.name, Date.now());

                    let execTask: RunnerTask = currState.taskQueue.shift();
                    currState.currTask = execTask;
                    execTask.execute();
                }

                // Holiday buff task
                if (
                    runner.bot.S.holidayseason &&
                    !runner.bot.s.holidayspirit &&
                    currState.currTask.name != "holiday" &&
                    !currState.taskQueue.some((task) => task.name == "holiday")
                ) {
                    currState.taskQueue.push(getHolidayBuffTask(runner));
                }

                // Push get/complete quest task
                if (
                    this.config.doQuests?.has(runner.bot.ctype) &&
                    !currState.taskQueue.some((task) => task.name == "quest_npc")
                ) {
                    if (!runner.bot.s.monsterhunt) {
                        let questTask: RunnerTask | undefined = getInteractWithQuestNpcTask(runner, "get");
                        if (questTask) {
                            currState.taskQueue.push(questTask);
                        }
                    } else if (runner.bot.s.monsterhunt && runner.bot.s.monsterhunt.c == 0) {
                        let questTask: RunnerTask | undefined = getInteractWithQuestNpcTask(runner, "complete");
                        if (questTask) {
                            currState.taskQueue.push(questTask);
                        }
                    }
                }

                // Merchant tasks
                if (runner.bot.ctype == "merchant") {
                    let taskTimers = currState.taskTimers;
                    // Go default merchant route checking bosses
                    if (
                        this.config.enableBosses &&
                        currState.currTask.name != "bcheck" &&
                        (!taskTimers.get("bcheck") || msince(taskTimers.get("bcheck")) >= 3) &&
                        !currState.taskQueue.some((task) => task.name == "bcheck")
                    ) {
                        let checkBossesTask: RunnerTask = getCheckBossesTask(this, runner);
                        if (checkBossesTask) {
                            currState.taskQueue.push(checkBossesTask);
                        }
                    }

                    // Check cyberland
                    if (
                        this.config.enableCyberland &&
                        currState.currTask.name != "cyberland" &&
                        (!taskTimers.get("cyberland") || msince(taskTimers.get("cyberland")) >= 5) &&
                        !currState.taskQueue.some((task) => task.name == "cyberland")
                    ) {
                        currState.taskQueue.push(getCheckCyberlandTask(runner));
                    }

                    // Do banking
                    if (
                        this.config.enableBanking &&
                        currState.currTask.name != "bank" &&
                        (!taskTimers.get("bank") || msince(taskTimers.get("bank")) >= 5) &&
                        !currState.taskQueue.some((task) => task.name == "bank")
                    ) {
                        if (shouldGoBank(runner.bot)) {
                            currState.taskQueue.push(getBankStoreTask(runner));
                        }
                    }
                }

                // Return to farm or quest if there is nothing else to do
                if (currState.currTask.isComplete && currState.taskQueue.length == 0) {
                    // If we have some active quest -> do it
                    if (
                        this.config.doQuests?.has(runner.bot.ctype) &&
                        runner.bot.s.monsterhunt &&
                        currState.currTask.name != "quest"
                    ) {
                        // Check if we can complete it
                        let questTarget: MonsterName = runner.bot.s.monsterhunt.id;
                        if (QUESTS.get(questTarget)) {
                            let strategies: {
                                attack?: Strategy<PingCompensatedCharacter>;
                                move?: Strategy<PingCompensatedCharacter>;
                            } = getQuestConfig(this, questTarget)[runner.bot.ctype];
                            currState.taskQueue.push(getChangeSpotTask("quest", runner, strategies));
                        }
                    }

                    if (
                        currState.currTask.name != "farming" &&
                        currState.currTask.name != "quest" &&
                        !currState.taskQueue.some((task) => task.name == "quest")
                    ) {
                        // Go back to farm
                        let spotName: SpotName =
                            this.config.defSpotOverride?.get(runner.bot.name) ?? this.config.defaultSpot;
                        let strategies: {
                            attack?: Strategy<PingCompensatedCharacter>;
                            move?: Strategy<PingCompensatedCharacter>;
                        } = getSpotConfig(this, spotName)[runner.bot.ctype];
                        currState.taskQueue.push(getChangeSpotTask("farming", runner, strategies));
                    }
                }
            }

            // Check bosses and push boss task
            if (this.config.enableBosses) {
                // Prepare events
                let preparedEvents: PreparedEvent[] = getPreparedEvents(this);
                if (preparedEvents.length == 0) return;

                // #TODO: set boss check steps complete for found boss. In bcheck step.name == bossName
                for (const [name, runner] of this.activeRunners) {
                    if (!runner.isReady()) continue;
                    if (runner.bot.ctype == "merchant") continue;

                    let currState: RunnerState = this.runnerStates.get(name);
                    let overrideEvents: RunnerTask[] = [];
                    let nonOverrideEvents: RunnerTask[] = [];
                    for (const preparedEvent of preparedEvents) {
                        if (currState.currTask.id == preparedEvent.id) continue;
                        if (currState.taskQueue.some((task) => task.id == preparedEvent.id)) continue;
                        // Get strategies for current special, if no strategies provided -> skip
                        if (!preparedEvent.strategies[runner.bot.ctype]) continue;

                        let eventTask: RunnerTask = getEventTask(runner, preparedEvent);
                        if (preparedEvent.scheduled) {
                            if (preparedEvent.override) {
                                eventTask.canOverride = false;
                                overrideEvents.push(eventTask);
                            } else {
                                nonOverrideEvents.push(eventTask);
                            }
                        } else {
                            currState.taskQueue.push(eventTask);
                        }
                    }

                    // Handle basic events
                    if (nonOverrideEvents.length > 0) {
                        currState.taskQueue = nonOverrideEvents.concat(currState.taskQueue);
                    }

                    // Handle overrides
                    if (overrideEvents.length > 0) {
                        // Override current task
                        if (
                            currState.currTask.name != "farming" &&
                            currState.currTask.name != "quest" &&
                            currState.currTask.canOverride
                        ) {
                            // let redoTask: RunnerTask = currState.currTask;

                            currState.currTask.abortTask(`Overriden by ${overrideEvents[0].name}`);
                            // currState.currTask = getEmptyTask(runner).setComplete("COMPLETE");

                            // redoTask.reset();
                            // currState.taskQueue.splice(0, 0, redoTask);
                        }
                        currState.taskQueue = overrideEvents.concat(currState.taskQueue);
                    }
                }
            }
        } catch (ex) {
            logger.error(ex);
        } finally {
            setTimeout(() => {
                this.logicLoop();
            }, 1000);
        }
    }

    public startController(): void {
        if (!this.isRunning) {
            this.isRunning = true;
        }
    }

    public stopController(): void {
        if (this.isRunning) {
            this.isRunning = false;
        }
    }

    public getRunners(onlyActive: boolean = false): CharacterRunner<PingCompensatedCharacter>[] {
        return Array.from(this.activeRunners.values()).filter((r) => !onlyActive || r.isReady());
    }

    public addRunner(runner: CharacterRunner<PingCompensatedCharacter>): void {
        let runnerState: RunnerState = loadStateFromFile(this, runner);

        this.activeRunners.set(runner.bot.id, runner);
        this.runnerStates.set(runner.bot.id, runnerState);
    }

    public getRunner(botId: string): CharacterRunner<PingCompensatedCharacter> | undefined {
        return this.activeRunners.get(botId);
    }

    public removeRunner(botId: string): void {
        let runner: CharacterRunner<PingCompensatedCharacter> = this.activeRunners.get(botId);
        if (runner && !runner.isStopped()) {
            runner.stop();
        }
        this.activeRunners.delete(botId);

        saveStateToFile(botId, this.runnerStates.get(botId));
        this.runnerStates.delete(botId);
    }

    public saveAndExit(): void {
        for (const [name] of this.activeRunners) {
            this.removeRunner(name);
        }
        saveBossTimersToFile(this._bossTimers);

        process.exit(0);
    }

    public getRunnerState(name: string): RunnerTaskName {
        return this.runnerStates.has(name) ? this.runnerStates.get(name).currTask.name : "unknown";
    }

    public get bossTimers(): Map<MonsterName, number> {
        return this._bossTimers;
    }
}
