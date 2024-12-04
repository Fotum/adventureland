class Task {
    constructor(name, id) {
        this.name = name;
        this.id = id || name;

        this.step = 0;
        this.length = 0;
        this.is_complete = false;

        this.action_list = [];
    }

    static getReturnTask(farm_area) {
        let returnTask = new Task("return");

        returnTask.pushAction("call", "window.set_message", "return");
        returnTask.pushAction("call", "strat.disable", null);
        returnTask.pushAction("call", "window.moveTo", farm_area.position);
        if (character.ctype === "mage") returnTask.pushAction("call", "this.callPartyBackToSpot", null);
        returnTask.pushAction("call", "strat.enable", null);
        returnTask.pushAction("call", "window.set_message", character.state.name);

        return returnTask;
    }

    static getHolidayBuffTask() {
        let aquireBuffTask = new Task("holiday");

        aquireBuffTask.pushAction("call", "window.set_message", "holiday");
        aquireBuffTask.pushAction("call", "strat.disable", null);
        aquireBuffTask.pushAction("call", "window.smart_move", "main");
        aquireBuffTask.pushAction("call", "window.acquireHolidayBuff", null);
        aquireBuffTask.pushAction("call", "strat.enable", null);

        return aquireBuffTask;
    }

    pushAction(type, action, arg) {
        this.action_list.push({
            type: type,
            name: action,
            arg: arg,
            is_complete: false
        });

        this.length++;
    }

    setComplete() {
        this.is_complete = true;
    }

    stepComplete() {
        this.setStepComplete(this.step);
        this.step++;
    }

    setStepComplete(i) {
        if (!this.is_complete && i < this.length) {
            this.action_list[i].is_complete = true;
            this.is_complete = this.action_list.every((s) => s.is_complete);
        }
    }

    getCurrentStep() {
        if (this.is_complete) return null;
        let action = this.action_list[this.step];

        return action;
    }

    reset() {
        this.is_complete = false;
        this.step = 0;
        this.action_list.forEach((a) => a.is_complete = false);
    }
}