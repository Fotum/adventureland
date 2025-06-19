import { PingCompensatedCharacter } from "alclient";
import { Task } from "../controller/bot_task";
import { StrategyExecutor } from "./strategy_executor";


class TaskExecutor  {

    private _tasks: Map<string,Task[]>;
    private _current_tasks;
    // {
    //     char_name: Task
    // }
    private _executors: StrategyExecutor<PingCompensatedCharacter>[] = []

    public constructor(executors: StrategyExecutor<PingCompensatedCharacter>[]) {
        this._executors = executors
        this.restoreTasks()
        setInterval(this.checkCurrentTask, 1000)
        for(let executor of this._executors) {
            this.executeTask(executor.bot.name)
        }
    }

    public addTask(character: string | string[], task: Task) {
        if (character instanceof Array)
        {
            for(let char of character)
            {
                this._tasks[char].push(task)
            }
        }
        else {
            this._tasks[character].push(task)
        }
    }

    public restoreTasks() {
        //logic for load tasks from json
    }

    private async executeTask(name) {

        if(!this._current_tasks) return setTimeout(this.executeTask, 500)
        
        let current_task = this._current_tasks[name]

        while(!current_task.isComplete()) {
            let current_step = current_task.getCurrentActionStep()
            await current_step.fn()
            current_task.setStepComplete(current_step)
            if(current_task != this._current_tasks[name]) return this.executeTask(name)
            if(current_task.isComplete()) return this.executeTask(name)
            
        }

    }

    // Logic for set current tasks
    private checkCurrentTask() {
        for(let name of Object.keys(this._tasks)) {
            if(this._tasks[name].length>0) {
                let current_task = this.getPriorityTask(name)
                if(!current_task) continue
                this._current_tasks[name] = current_task
            }
        }
    }

    private getPriorityTask(name: string) : Task {
        if(this._tasks[name].length<1) return null //have no tasks
        if(this._tasks[name].length == 1) return this._tasks[name][0] //only one task
        let priority_task: Task
        for(let task of this._tasks[name]) {
            if(!priority_task || priority_task.getTaskPriority() < task.getTaskPriority()) priority_task = task
        }
        if(this._current_tasks[name].getTaskPriority()>priority_task.getTaskPriority()) priority_task = null
        return priority_task
    }

}