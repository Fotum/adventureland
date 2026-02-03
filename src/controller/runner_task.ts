import { Game, IPosition, PingCompensatedCharacter } from "alclient";
import { EventName, SpecialName } from "../base/constants";
import { sleep } from "../base/functions/general";
import logger from "../logger";
import { CharacterRunner } from "../strategies/character_runner";

export type RunnerTaskName =
    | "unknown"
    | "afk"
    | "return"
    | "farming"
    | "quest"
    | "quest_npc"
    | "holiday"
    | "bcheck"
    | "cyberland"
    | "bank"
    | EventName
    | SpecialName;

type RunnerTaskStep = {
    name: string;
    fn: (runner: CharacterRunner<PingCompensatedCharacter>, signal: AbortSignal) => Promise<unknown>;
};
type ExecutableRunnerTaskStep = RunnerTaskStep & { isComplete: boolean };
type RunnerTaskStatus = "CREATED" | "RUNNING" | "COMPLETE" | "ABORTED" | "ERROR";
export class RunnerTask {
    private _id: string;
    private _name: RunnerTaskName;
    private _targetPosition: IPosition | keyof typeof Game.G.events;
    private _runner: CharacterRunner<PingCompensatedCharacter>;

    private _step: number = 0;

    private _canOverride: boolean = true;
    private _status: RunnerTaskStatus = "CREATED";
    private _isComplete: boolean = false;

    private taskSteps: ExecutableRunnerTaskStep[] = [];
    private abortController: AbortController = new AbortController();

    constructor(
        id: string,
        name: RunnerTaskName,
        runner: CharacterRunner<PingCompensatedCharacter>,
        targetPosition?: IPosition | keyof typeof Game.G.events
    ) {
        this._id = id;
        this._name = name;
        this._runner = runner;

        this._targetPosition = targetPosition;
    }

    public async execute(): Promise<void> {
        let step: ExecutableRunnerTaskStep = undefined;
        this._status = "RUNNING";

        while (this._status == "RUNNING" && this._step != this.taskSteps.length) {
            try {
                while (!this._runner.isReady() || this._runner.bot.rip) {
                    // Wait for bot to reconnect
                    await sleep(1000);
                    this.abortController.signal.throwIfAborted();
                }

                step = this.taskSteps[this._step];
                if (step.isComplete) continue;

                logger.info(`[${this._runner.bot.id}]: Executing step ${step.name}(${this._step})`);
                await step.fn(this._runner, this.abortController.signal);
                logger.info(`[${this._runner.bot.id}]: Step execution finished ${step.name}(${this._step})`);

                step.isComplete = true;
                this._step++;
            } catch (ex: any) {
                // Workaround because throwIfAborted does not getting caught
                if (typeof ex == "string" && ex.startsWith("Abort request received")) {
                    logger.warn(ex);
                    this.setComplete("ABORTED");
                    // #TODO: Properly rethrow error
                } else if (ex.message && ex.message.startsWith("Smart move error:")) {
                    // Just redo step, do nothing
                    logger.warn(ex);
                } else {
                    logger.error(ex);
                    this.setComplete("ERROR");
                    // #TODO: Properly rethrow error
                }
            }
        }

        // #TODO: Temporary workaround, there should be external try catch
        if (this._status == "RUNNING") {
            this._status = "COMPLETE";
            this._isComplete = true;
        }
    }

    public abortTask(reason?: string): void {
        if (reason) {
            reason = `, reason: ${reason}`;
        }
        this.abortController.abort(`Abort request received${reason}`);
    }

    public pushStep(step: RunnerTaskStep): RunnerTask {
        let executableStep: ExecutableRunnerTaskStep = { ...step, isComplete: false };
        this.taskSteps.push(executableStep);

        return this;
    }

    public setCurrentStepComplete(): void {
        this.setStepComplete(this._step);
        this._step++;
    }

    public setStepComplete(stepNum: number): void {
        if (stepNum < this.taskSteps.length) {
            this.taskSteps[stepNum].isComplete = true;
            this._step++;

            if (this.taskSteps.every((step) => step.isComplete)) {
                this._status = "COMPLETE";
                this._isComplete = true;
            }
        }
    }

    public getCurrentStep(): ExecutableRunnerTaskStep | undefined {
        return this._isComplete ? undefined : this.taskSteps[this._step];
    }

    public get currentStepNumber(): number {
        return this._isComplete ? -1 : this._step;
    }

    public reset(): void {
        this._status = "CREATED";
        this._step = 0;

        this.abortController = new AbortController();
        this.taskSteps.forEach((step) => (step.isComplete = false));
        this._isComplete = false;
    }

    public get id(): string {
        return this._id;
    }

    public get name(): RunnerTaskName {
        return this._name;
    }

    public get currentStep(): number {
        return this._step;
    }

    public get length(): number {
        return this.taskSteps.length;
    }

    public setComplete(status: RunnerTaskStatus): RunnerTask {
        this._status = status;
        this._step = this.taskSteps.length - 1;
        this.taskSteps.forEach((step) => (step.isComplete = true));
        this._isComplete = true;

        return this;
    }

    public get status(): RunnerTaskStatus {
        return this._status;
    }

    public get isComplete(): boolean {
        return this._isComplete;
    }

    public get targetPosition(): IPosition | keyof typeof Game.G.events {
        return this._targetPosition;
    }

    public set canOverride(canOverride: boolean) {
        this._canOverride = canOverride;
    }

    public get canOverride(): boolean {
        return this._canOverride;
    }
}
