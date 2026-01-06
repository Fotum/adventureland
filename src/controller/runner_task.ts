import { PingCompensatedCharacter } from "alclient";
import { EventName, SpecialName } from "../configs/boss_configs";
import { CharacterRunner } from "../strategies/character_runner";
import { sleep } from "../base/functions";


export type RunnerTaskName = "afk" | "return" | "farming" | "quest" | "holiday" | "bcheck" | "cyberland" | "bank" | EventName | SpecialName;
export type RunnerTaskStep = {
    name: string
    fn: (runner: CharacterRunner<PingCompensatedCharacter>, signal: AbortSignal) => Promise<unknown>
}

type ExecutableRunnerTaskStep = {
    name: string
    isComplete: boolean
    fn: (runner: CharacterRunner<PingCompensatedCharacter>, signal: AbortSignal) => Promise<unknown>
}
type RunnerTaskStatus = "CREATED" | "RUNNING" | "COMPLETE" | "ABORTED" | "ERROR";
export class RunnerTask {
    private _id: number;
    private _name: RunnerTaskName;
    private runner: CharacterRunner<PingCompensatedCharacter>;

    private _step: number = 0;
    private _length: number = 0;
    private _status: RunnerTaskStatus = "CREATED";

    private taskSteps: ExecutableRunnerTaskStep[] = [];
    private abortController: AbortController = new AbortController();

    constructor(id: number, name: RunnerTaskName, runner: CharacterRunner<PingCompensatedCharacter>) {
        this._id = id;
        this._name = name;
        this.runner = runner;
    }

    public async execute(): Promise<void> {
        let step: ExecutableRunnerTaskStep = undefined;
        this._status = "RUNNING";

        while (this._status == "RUNNING" && this._step != this._length) {
            try {
                while (!this.runner.isReady()) {
                    // Wait for bot to reconnect
                    await sleep(1000);
                    this.abortController.signal.throwIfAborted();
                }

                step = this.taskSteps[this._step];
                if (step.isComplete) continue;
    
                console.log(`Executing step ${step.name}(${this._step})`);
                await step.fn(this.runner, this.abortController.signal);
                console.log(`Step execution finished ${step.name}(${this._step})`);

                step.isComplete = true;
                this._step++;
            } catch (ex: any) {
                // #TODO: Catch disconnection and reset step with isComplete = false, this._step--
    
                // Workaround because throwIfAborted does not getting caught
                if (typeof ex == "string" && ex.startsWith("Abort request received")) {
                    console.warn(ex);
                    this.setComplete("ABORTED");
                    // #TODO: Properly rethrow error
                    return;
                } else {
                    console.error(ex);
                    this.setComplete("ERROR");
                    // #TODO: Properly rethrow error
                    return;
                }
            }
        }

        this._status = "COMPLETE";
    }

    public abortTask(reason?: string): void {
        if (reason) { reason = `, reason: ${reason}`; }
        this.abortController.abort(`Abort request received${reason}`);
    }

    public pushStep(step: RunnerTaskStep): RunnerTask {
        let executableStep: ExecutableRunnerTaskStep = { ...step, isComplete: false };

        this.taskSteps.push(executableStep);
        this._length++;

        return this;
    }

    public setCurrentStepComplete(): void {
        this.setStepComplete(this._step);
        this._step++;
    }

    public setStepComplete(stepNum: number): void {
        if (stepNum < this._length) {
            this.taskSteps[stepNum].isComplete = true;
            if (this.taskSteps.every((step) => step.isComplete)) {
                this._status = "COMPLETE";
            }
        }
    }

    public getCurrentStep(): ExecutableRunnerTaskStep | undefined {
        if (["COMPLETE", "INTERRUPTED", "ERROR"].includes(this._status)) return undefined;
        return this.taskSteps[this._step];
    }

    public reset(): void {
        this._status = "CREATED";
        this._step = 0;

        this.abortController = new AbortController();
        this.taskSteps.forEach((step) => step.isComplete = false);
    }

    public get id(): number {
        return this._id;
    }

    public get name(): RunnerTaskName {
        return this._name;
    }

    public get currentStep(): number {
        return this._step;
    }

    public get length(): number {
        return this._length;
    }

    public setComplete(status: RunnerTaskStatus): void {
        this._status = status;
        this._step = this.taskSteps.length - 1;
        this.taskSteps.forEach((step) => step.isComplete = true);
    }

    public get status(): RunnerTaskStatus {
        return this._status;
    }
}