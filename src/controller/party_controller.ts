import { CharacterType, MonsterName, PingCompensatedCharacter, ServerIdentifier, ServerRegion } from "alclient";
import { SpotName } from "../base/constants";
import { shouldGoBank } from "../base/functions/characters";
import { generateRandomId, msince } from "../base/functions/general";
import { PreparedScheduleEvent, PreparedSpecialMonster, getActiveScheduleEvents, getBossesAroundCharacters } from "../base/functions/monsters";
import { QUESTS } from "../base/settings";
import { getQuestConfig } from "../configs/quest_configs";
import { getSpotConfig } from "../configs/spot_configs";
import { CharacterRunner, Strategy } from "../strategies/character_runner";
import { RunnerTask, RunnerTaskName } from "./runner_task";
import { getBankStoreTask, getChangeSpotTask, getCheckBossesTask, getCheckCyberlandTask, getEventTask, getHolidayBuffTask, getInteractWithQuestNpcTask, getSpecialMonsterTask } from "./runner_task_collection";


export type PartyControllerConfig = {
    homeServerName: ServerRegion
    homeServerId: ServerIdentifier
    defaultSpot: SpotName
    partyLeader: string
    partyAllow: string[]
    mainTank?: string
    sendToName?: string

    doQuests: Set<CharacterType>
    doBosses?: boolean
    doCyberland?: boolean
    doBanking?: boolean
}
type RunnerState = {
    currTask: RunnerTask
    taskQueue: RunnerTask[]
    merchantTimers?: Map<RunnerTaskName, number>
}
export class PartyController {
    public static BOSS_TIMERS: Map<MonsterName, number> = new Map<MonsterName, number>();

    public config: PartyControllerConfig;

    private isRunning: boolean = false;

    private activeRunners: Map<string, CharacterRunner<PingCompensatedCharacter>>;
    private runnerStates: Map<string, RunnerState>;

    constructor(config: PartyControllerConfig) {
        this.config = config;

        this.activeRunners = new Map<string, CharacterRunner<PingCompensatedCharacter>>();
        this.runnerStates = new Map<string, RunnerState>();

        // #TODO: Restore states and populte state map
        this.taskManagerLoop();

        process.on("SIGINT", this.saveAndExit);
        process.on("SIGTERM", this.saveAndExit);
    }

    private async taskManagerLoop(): Promise<void> {
        try {
            if (!this.isRunning) return;

            for (const [name, runner] of this.activeRunners) {
                if (!runner.isReady() || runner.bot.rip) continue;

                let currState: RunnerState = this.runnerStates.get(name);
                // Check if we have something to execute from queue
                if (currState.currTask.isComplete && currState.taskQueue.length > 0) {
                    let execTask: RunnerTask = currState.taskQueue.shift();
                    currState.currTask = execTask;
                    execTask.execute();
                }

                // Holiday buff task
                if (runner.bot.S.holidayseason && !runner.bot.s.holidayspirit && currState.currTask.name != "holiday" && !currState.taskQueue.some((task) => task.name == "holiday")) {
                    currState.taskQueue.push(getHolidayBuffTask(runner));
                }

                // Push get/complete quest task
                if (this.config.doQuests.has(runner.bot.ctype) && !currState.taskQueue.some((task) => task.name == "quest")) {
                    if (!runner.bot.s.monsterhunt) {
                        let questTask: RunnerTask | undefined = getInteractWithQuestNpcTask(runner, "get");
                        if (questTask) { currState.taskQueue.push(questTask); }
                    } else if (runner.bot.s.monsterhunt && runner.bot.s.monsterhunt.c == 0) {
                        let questTask: RunnerTask | undefined = getInteractWithQuestNpcTask(runner, "complete");
                        if (questTask) { currState.taskQueue.push(questTask); }
                    }
                }

                // Merchant tasks
                if (runner.bot.ctype == "merchant") {
                    let merchantTimers = currState.merchantTimers;
                    // Go default merchant route checking bosses
                    if (this.config.doBosses && currState.currTask.name != "bcheck" && (!merchantTimers.get("bcheck") || msince(merchantTimers.get("bcheck")) >= 3) && !currState.taskQueue.some((task) => task.name == "bcheck")) {
                        let checkBossesTask: RunnerTask = getCheckBossesTask(runner);
                        if (checkBossesTask) { currState.taskQueue.push(checkBossesTask); }
                    }

                    // Check cyberland
                    if (this.config.doCyberland && currState.currTask.name != "cyberland" && (!merchantTimers.get("cyberland") || msince(merchantTimers.get("cyberland")) >= 5) && !currState.taskQueue.some((task) => task.name == "cyberland")) {
                        currState.taskQueue.push(getCheckCyberlandTask(runner));
                    }

                    // Do banking
                    if (this.config.doBanking && currState.currTask.name != "bank" && (!merchantTimers.get("bank") || msince(merchantTimers.get("bank")) >= 5) && !currState.taskQueue.some((task) => task.name == "bank")) {
                        if (shouldGoBank(runner.bot)) { currState.taskQueue.push(getBankStoreTask(runner)); }
                    }
                }

                // Return to farm or quest if there is nothing else to do
                if (currState.currTask.isComplete && currState.taskQueue.length == 0) {
                    // If we have some active quest -> do it
                    if (this.config.doQuests.has(runner.bot.ctype) && runner.bot.s.monsterhunt && currState.currTask.name != "quest") {
                        // Check if we can complete it
                        let questTarget: MonsterName = runner.bot.s.monsterhunt.id;
                        if (QUESTS.has(questTarget) && QUESTS.get(questTarget)) {
                            let strategies: { attack?: Strategy<PingCompensatedCharacter>, move?: Strategy<PingCompensatedCharacter> } = getQuestConfig(this, questTarget)[runner.bot.ctype];
                            currState.taskQueue.push(getChangeSpotTask("quest", runner, strategies));
                        }
                    }

                    if (currState.currTask.name != "farming" && currState.currTask.name != "quest") {
                        // Go back to farm
                        let strategies: { attack?: Strategy<PingCompensatedCharacter>, move?: Strategy<PingCompensatedCharacter> } = getSpotConfig(this)[runner.bot.ctype];
                        currState.taskQueue.push(getChangeSpotTask("farming", runner, strategies));
                    }
                }
            }

            // Check bosses and push boss task
            if (this.config.doBosses) {
                // Check bosses around characters
                let preparedSpecials: PreparedSpecialMonster[] = getBossesAroundCharacters(this);
                // Check global events
                let preparedEvents: PreparedScheduleEvent[] = getActiveScheduleEvents(this);

                if (preparedSpecials.length == 0 && preparedEvents.length == 0) { return; }

                for (const [name, runner] of this.activeRunners) {
                    if (!runner.isReady()) continue;
                    if (runner.bot.ctype == "merchant") continue;

                    let currState: RunnerState = this.runnerStates.get(name);
                    for (let preparedSpecial of preparedSpecials) {
                        if (currState.currTask.id == preparedSpecial.id) continue;
                        if (currState.taskQueue.some((task) => task.id == preparedSpecial.id)) continue;

                        currState.taskQueue.push(getSpecialMonsterTask(runner, {
                            id: preparedSpecial.id,
                            name: preparedSpecial.name,
                            moveTo: preparedSpecial.moveTo,
                            targets: preparedSpecial.targets,
                            strategies: preparedSpecial.strategies[runner.bot.ctype]
                        }));
                    }

                    for (let preparedEvent of preparedEvents) {
                        if (currState.currTask.id == preparedEvent.id) continue;
                        if (currState.taskQueue.some((task) => task.id == preparedEvent.id)) continue;

                        // Override current
                        if (preparedEvent.override && currState.currTask.canOverride) {
                            currState.currTask.abortTask(`Overriden by ${preparedEvent.name}`);

                            // Push overriden task back to queue
                            // #TODO: If multiple events came (dunno if possible) queue will be incorrect
                            let redoTask: RunnerTask = Object.assign({}, currState.currTask);
                            redoTask.reset();
                            currState.taskQueue.splice(1, 0, redoTask);
                        }

                        let eventTask: RunnerTask = getEventTask(runner, {
                            id: preparedEvent.id,
                            name: preparedEvent.name,
                            targets: preparedEvent.targets,
                            destination: preparedEvent.destination,
                            waitForRespawnMs: preparedEvent.waitForRespawnMs,
                            strategies: preparedEvent.strategies[runner.bot.ctype]
                        });
                        if (preparedEvent.override) { eventTask.canOverride = false; }

                        currState.taskQueue.splice(1, 0, eventTask);
                    }
                }
            }
        } catch (ex) {
            console.error(ex);
        } finally {
            setTimeout(() => { this.taskManagerLoop() }, 1000);
        }
    }

    public startControler(): void {
        if (!this.isRunning) {
            this.isRunning = true;
        }
    }

    public stopController(): void {
        if (this.isRunning) {
            this.isRunning = false;
        }
    }

    public getRunners(): CharacterRunner<PingCompensatedCharacter>[] {
        return Array.from(this.activeRunners.values());
    }

    public addRunner(runner: CharacterRunner<PingCompensatedCharacter>): void {
        this.activeRunners.set(runner.bot.id, runner);
        // #TODO: Temporary debug, should use loadFromFile
        this.runnerStates.set(runner.bot.id, {
            currTask: new RunnerTask(generateRandomId(), "farming", runner).setComplete("COMPLETE"),
            taskQueue: [],
            merchantTimers: runner.bot.ctype == "merchant" ? new Map<RunnerTaskName, number>() : undefined
        });
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
    }

    public saveAndExit(): void {
        process.exit(0);
    }

    public getRunnerState(name: string): RunnerTaskName {
        return this.runnerStates.has(name)
            ? this.runnerStates.get(name).currTask.name
            : "unknown";
    }
}