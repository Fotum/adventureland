import { CharacterType, MonsterName, PingCompensatedCharacter, ServerIdentifier, ServerRegion } from "alclient";
import { SpotName } from "../base/constants";
import { generateRandomId, sleep } from "../base/functions";
import { QUESTS } from "../base/settings";
import { getQuestConfig } from "../configs/quest_configs";
import { getSpotConfig } from "../configs/spot_configs";
import { CharacterRunner, Strategy } from "../strategies/character_runner";
import { RunnerTask, RunnerTaskName } from "./runner_task";
import { getChangeSpotTask, getHolidayBuffTask, getInteractWithQuestNpcTask } from "./runner_task_collection";


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
}
type RunnerState = {
    currTask: RunnerTask
    taskQueue: RunnerTask[]
}
export class PartyController {
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

                // Check bosses and push boss task

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
                    sleep(500);
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
        // #TODO: Temporary debug
        this.runnerStates.set(runner.bot.id, { currTask: new RunnerTask(generateRandomId(), "farming", runner).setComplete("COMPLETE"), taskQueue: [] });
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