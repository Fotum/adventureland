class Task {
    constructor(name, id) {
        this.name = name;
        this.id = id || name;

        this.step = 0;
        this.length = 0;

        this.action_list = [];
    }

    static getReturnTask(farm_area) {
        let returnTask = new Task("return");

        returnTask.pushAction("change_state", null, "return");
        returnTask.pushAction("call", "strat.disable", null);
        returnTask.pushAction("call", "window.moveTo", farm_area.position);
        returnTask.pushAction("call", "strat.enable", null);
        returnTask.pushAction("change_state", null, null);

        return returnTask;
    }

    static getFarmBossTask(event) {
        let task = new Task(event.name, event.id);

        task.pushAction("change_state", null, "event");
        task.pushAction("call", "this.changeOptions", event);
        if (!event.summon || character.ctype === "mage") task.pushAction("call", "window.smart_move", event);
        if (event.summon && character.ctype === "mage") task.pushAction("call", "this.callPartyForEvent", null);
        task.pushAction("call", "this.awaitCompletion", null);
        task.pushAction("call", "this.changeOptions", null);
        task.pushAction("change_state", null, null);

        return task;
    }

    pushAction(type, action, arg) {
        this.action_list.push({
            type: type,
            name: action,
            arg: arg
        });

        this.length++;
    }

    removeAction(i) {
        if (this.length > 0) {
            this.action_list.splice(i, 1);
            this.length--;

            if (i <= this.step) this.step--;
        }
    }

    getCurrentAction() {
        if (this.isComplete()) return null;
        let action = this.action_list[this.step];

        return action;
    }

    actionComplete() {
        this.step++;
    }

    reset() {
        this.step = 0;
    }

    isComplete() {
        return this.step >= this.length;
    }
}