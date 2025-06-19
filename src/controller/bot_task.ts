import { IPosition, PingCompensatedCharacter } from "alclient";
import { EventName, SpecialName } from "../configs/boss_configs";


export type TaskName = "afk" | "farming" | "return" | "quest" | "holiday" | EventName | SpecialName;
export type TaskTarget = {
    name: TaskName
    position?: IPosition
}
export type TaskStep = {
    fn: (bot: PingCompensatedCharacter, task: Task, cancelToken: { cancelled: boolean }) => Promise<unknown>
    needWait: boolean
    isComplete: boolean
}

export class Task {
    private _name: TaskName;
    private _target: TaskTarget;

    private _step: number = 0;
    private _length: number = 0;
    private _isComplete: boolean = false;

    private actionList: TaskStep[] = [];
    private currentCancelToken: { cancelled: boolean } | null = null;

    private _priority: number;

    constructor(name: TaskName, target: TaskTarget = { name: name }, priority: number) {
        this._name = name;
        this._target = target;
        this._priority = priority;
    }

    public getTaskPriority() : number {
        return this._priority
    }

    public pushActionStep(step: TaskStep): void {
        this.actionList.push(step);
        this._length++;
    }

    public getCurrentActionStep(): TaskStep {
        if (this._isComplete) return null;
        return this.actionList[this._step];
    }

    public stepComplete(): void {
        this.setStepComplete(this._step);
        this._step++;
    }

    public setStepComplete(stepNum: number): void {
        if (!this._isComplete && stepNum < this._length) {
            this.actionList[stepNum].isComplete = true;
            this._isComplete = this.actionList.every((s) => s.isComplete);
        }
    }

    public reset(): void {
        this._isComplete = false;
        this._step = 0;
        this.actionList.forEach((s) => s.isComplete = false);
    }

    public get name(): TaskName {
        return this._name;
    }

    public get target(): TaskTarget {
        return this._target;
    }

    public get step(): number {
        return this._step;
    }

    public get length(): number {
        return this._length;
    }

    public setComplete(): void {
        this._isComplete = true;
    }

    public get isComplete(): boolean {
        return this._isComplete;
    }

    /**
     * Запускает текущий шаг задачи и возвращает cancelToken для отмены.
     */
    public async runCurrentStep(bot: PingCompensatedCharacter): Promise<{ cancelToken: { cancelled: boolean }, result: Promise<unknown> }> {
        const step = this.getCurrentActionStep();
        if (!step) throw new Error("No current step");
        // Создаём новый токен отмены
        const cancelToken = { cancelled: false };
        this.currentCancelToken = cancelToken;
        // Запускаем fn с токеном
        const result = step.fn(bot, this, cancelToken);
        return { cancelToken, result };
    }

    /**
     * Отменяет выполнение текущего шага (если он ещё выполняется)
     */
    public cancelCurrentStep(): void {
        if (this.currentCancelToken) {
            this.currentCancelToken.cancelled = true;
        }
    }
}