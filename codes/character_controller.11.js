class CharacterController {
    #actionCheckerLoopFlg = false;
    #actionExecutorLoopFlg = false;

    // Current action
    #current_task = null;
    // Default character state
    #default_state = null;
    // Quest state
    #quest_state = null;

    constructor(options, strategy) {
        this.options = options;
        this.strategy = strategy;

        this.#default_state = {
            name: "farming",
            solo: strategy.solo,
            farm_area: strategy.farm_area,
            farm_options: strategy.farm_options
        };

        if (character.state && character.state.name !== "farming") this.applyState(character.state);
        if (!character.action_queue) character.action_queue = [];

        if (this.options.do_quests && character.s.monsterhunt) this.prepareQuestState();

        this.actionCheckerLoop();
        this.actionExecutorLoop();
    }

    enable() {
        this.#actionCheckerLoopFlg = true;
        this.#actionExecutorLoopFlg = true;
    }

    disable() {
        this.#actionCheckerLoopFlg = false;
        this.#actionExecutorLoopFlg = false;
    }

    // ----------------- ACTION QUEUE HANDLERS SECTION ------------------ //
    async actionCheckerLoop() {
        if (!this.#actionCheckerLoopFlg || character.rip) {
            setTimeout(this.actionCheckerLoop.bind(this), 1000);
            return;
        }

        // Push holiday buff task
        if (!character.s.holidayspirit && !character.action_queue.some((t) => t.name === "holiday")) {
            let holidayTask = Task.getHolidayBuffTask();
            character.action_queue.push(holidayTask);
        }

        // Push quest handling task
        if (this.options.do_quests && !character.action_queue.some((t) => t.name === "quest")) {
            if (!character.s.monsterhunt) this.pushHandleQuestTask("get");
            else if (character.s.monsterhunt && character.s.monsterhunt?.c === 0) this.pushHandleQuestTask("complete");
        }

        if (!character.state && character.action_queue.length === 0) {
            if (this.options.do_quests && character.s.monsterhunt && this.#quest_state) {
                let questTaskState = new Task("quest");
                questTaskState.pushAction("call", "this.applyState", this.#quest_state);
                character.action_queue.push(questTaskState);
            } else {
                let farmingTask = new Task("farming");
                farmingTask.pushAction("call", "this.applyState", this.#default_state);
                character.action_queue.push(farmingTask);
            }
        }

        // Check and push return to spot
        if (character.state && character.action_queue.length === 0) {
            let farm_area = this.strategy.farm_area;
            if (farm_area && !get_targeted_monster() && farm_area.position && (farm_area.position.map !== character.map || distance(character, farm_area.area) > (farm_area.area.d * 2))) {
                game_log(`Pushing "return to spot" task to queue`, LOG_COLORS.blue);
                
                let returnTask = Task.getReturnTask(farm_area);
                character.action_queue.push(returnTask);
            }
        }

        setTimeout(this.actionCheckerLoop.bind(this), 500);
    }

    async actionExecutorLoop() {
        if (!this.#actionExecutorLoopFlg || character.rip) {
            setTimeout(this.actionExecutorLoop.bind(this), 1000);
            return;
        }

        // Execute from queue
        if (!this.#current_task && character.action_queue.length > 0) {
            this.#current_task = character.action_queue[0];
            try {
                while (!this.#current_task.is_complete) {
                    try {
                        let action = this.#current_task.getCurrentStep();
                        if (action.is_complete) continue;

                        game_log(`Executing "${action.type}" step`, LOG_COLORS.blue);
                        await this.executeActionStep(action);
                        game_log(`Finished "${action.type}" step`, LOG_COLORS.blue);
                    } catch (ex) {
                        console.error("actionExecutorLoop.action", ex);
                    } finally {
                        this.#current_task.stepComplete();
                    }
                }
            } catch (ex) {
                console.error("actionExecutorLoop", ex);
            } finally {
                character.action_queue.splice(0, 1);
                this.#current_task = null;
            }
        }

        setTimeout(this.actionExecutorLoop.bind(this), 200);
    }

    async executeActionStep(action) {
        let splitted = action.name.split(".");
        let context = splitted[0];
        let funcName = splitted[1];
        let arg = action.arg;

        game_log(`Calling ${action.name} function`, LOG_COLORS.blue);
        console.log("Function call: ", action.name, arg);
        if (context === "window") {
            if (arg) return window[funcName](arg);
            else return window[funcName]();
        }

        if (context === "this") {
            if (arg) return this[funcName](arg);
            else return this[funcName]();
        }

        if (context === "strat") {
            if (arg) return this.strategy[funcName](arg);
            else return this.strategy[funcName]();
        }
    }

    resetTask() {
        if (this.#current_task !== null) {
            this.#current_task.resetTask();
            console.log(`Task "${this.#current_task.name}" has been reset`);
        }
    }

    applyState(state) {
        character.state = state;

        if (state) {
            this.strategy.solo = state.solo;
            this.strategy.farm_area = state.farm_area;
            this.strategy.farm_options = state.farm_options;

            set_message(state.name);
        }
    }

    // ------------------------ ACTION ROUTINES ------------------------- //
    pushFarmBossActions(event) {
        if (character.action_queue.some((t) => t.id === event.id)) return;
        game_log(`Pushing "boss_farm" event to queue`, LOG_COLORS.blue);

        let bossInfo = BOSS_INFO[event.type][event.name];
        let eventState = {
            name: event.name,
            solo: Object.keys(bossInfo.characters).length === 1,
            farm_area: {
                position: event.destination,
                farm_monsters: [...bossInfo.targets]
            },
            farm_options: bossInfo.characters[character.name],
            event_options: {
                id: event.id,
                type: event.type,
                name: event.name,
                wait_resp: event.wait_resp
            }
        };

        let distanceCheck = !event.destination.to && parent.simple_distance(character, event.destination) > 200;

        let bossFarmTask = new Task(event.name, event.id);
        bossFarmTask.pushAction("call", "this.applyState", eventState);
        if ((!event.summon || character.ctype === "mage") && distanceCheck) bossFarmTask.pushAction("call", "window.smart_move", event.destination);
        if (event.summon && character.ctype === "mage") bossFarmTask.pushAction("call", "this.callPartyForEvent", null);
        bossFarmTask.pushAction("call", "this.awaitCompletion", null);
        bossFarmTask.pushAction("call", "this.applyState", null);

        if (event.type === "global" && character.action_queue.length > 0) character.action_queue.splice(1, 0, bossFarmTask);
        else character.action_queue.push(bossFarmTask);
    }

    async awaitCompletion() {
        let targets = character.state.farm_area.farm_monsters;
        let targetsAround = await waitForTargets(targets, 5);
        if (targetsAround.length === 0) return;

        let waitForRespawn = character.state.event_options.wait_resp;

        let lastCheckTs = Date.now();
        let lastHpChange = Date.now();
        let targetsLastHp = 0;
        while (ts_msince(lastHpChange) < 1) {
            await sleep(1000);

            // Nowait respawn logic
            targetsAround = Object.values(parent.entities).filter((m) => m.type === "monster" && targets.includes(m.mtype));
            if (targetsAround.length === 0 && !waitForRespawn) return;

            let targetsHp = targetsAround.reduce((partial, t) => partial + t.hp, 0);
            let isFullGuard = targetsAround.some((t) => t.s.fullguardx);
            if (targetsHp !== targetsLastHp || isFullGuard) {
                lastHpChange = Date.now();
                targetsLastHp = targetsHp;
            }

            // Wait respawn logic
            if (targetsAround.length > 0) lastCheckTs = Date.now();
            if (targetsAround.length === 0 && ts_ssince(lastCheckTs) >= 10) return;
        }
    }

    // ------------------------- QUEST ROUTINES ------------------------- //
    pushHandleQuestTask(action) {
        game_log(`Pushing "${action} quest" task to queue`, LOG_COLORS.blue);

        let questHandleTask = new Task("quest");
        questHandleTask.pushAction("call", "window.smart_move", MONSTERHUNT_NPC_LOC);
        questHandleTask.pushAction("call", "this.interactWithQuestNPC", action);
        if (action === "get") questHandleTask.pushAction("call", "this.prepareQuestState", null);
        questHandleTask.pushAction("call", "this.applyState", this.#quest_state);

        character.action_queue.push(questHandleTask);
    }

    async interactWithQuestNPC(action) {
        if (character.map !== "main" || distance2D(MONSTERHUNT_NPC_LOC.x, MONSTERHUNT_NPC_LOC.y) > 150) return;
        if (action === "get" && character.s.monsterhunt) return;
        if (action === "complete" && (!character.s.monsterhunt || character.s.monsterhunt?.c !== 0)) return;

        this.#quest_state = null;
        let actionStart = Date.now();
        while (ts_ssince(actionStart) < 5) {
            parent.socket.emit("monsterhunt");
            await sleep(1000);

            // Received quest, return
            if (action === "get" && character.s.monsterhunt) return;
            // Turned in quest, return
            if (action === "complete" && !character.s.monsterhunt) return;
        }
    }

    prepareQuestState() {
        if (!character.s.monsterhunt) return;

        let monsterHuntArea = MONSTERHUNT_AREAS[character.s.monsterhunt.id];
        let shouldComplete = monsterHuntArea && monsterHuntArea.characters.includes(character.name);
        let questState = this.#default_state;

        if (shouldComplete) {
            questState = {
                name: "quest",
                solo: monsterHuntArea.characters.length === 1,
                farm_area: monsterHuntArea.spot.farm_area,
                farm_options: monsterHuntArea.spot.farm_options[character.name]
            };
        }

        this.#quest_state = questState;
    }
}