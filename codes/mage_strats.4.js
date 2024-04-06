class MageController {
    #actionCheckerLoopFlg = false;
    #actionExecutorLoopFlg = false;

    // Current action
    #current_task = null;

    constructor(options, strategy) {
        if (!character.action_queue) character.action_queue = [];

        this.options = options;
        this.strategy = strategy;

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

        // Check and push return to spot
        if (character.current_state === "farming" && !character.action_queue.some((t) => t.name === "return") && this.strategy.options.farm_area) {
            let farm_area = this.strategy.options.farm_area;
            if (!get_targeted_monster() && farm_area.position && (farm_area.position.map !== character.map || distance(character, farm_area.area) > (farm_area.area.d * 2))) {
                game_log(`Pushing "return to spot" task to queue`, LOG_COLORS.blue);
                
                let returnTask = Task.getReturnTask(farm_area);
                character.action_queue.push(returnTask);
            }
        }

        if ((!character.current_state || character.current_state !== "farming") && character.action_queue.length === 0) {
            game_log(`Pushing "farming" task to queue`, LOG_COLORS.blue);

            let farmStateTask = new Task("farming");
            farmStateTask.pushAction("change_state", null, "farming");
            character.action_queue.push(farmStateTask);
        }

        setTimeout(this.actionCheckerLoop.bind(this), 1000);
    }

    async actionExecutorLoop() {
		if (!this.#actionExecutorLoopFlg || character.rip) {
			setTimeout(this.actionExecutorLoop.bind(this), 500);
			return;
		}

		// Execute from queue
		if (!this.#current_task && character.action_queue.length > 0) {
            this.#current_task = character.action_queue[0];
            try {
                while (!this.#current_task.isComplete()) {
                    try {
                        let action = this.#current_task.getCurrentAction();
                        game_log(`Executing "${action.type}" step`, LOG_COLORS.blue);
                        await this.executeActionStep(action);
                        game_log(`Finished "${action.type}" step`, LOG_COLORS.blue);
                    } catch (ex) {
                        console.error("actionExecutorLoop.action", ex);
                    } finally {
                        this.#current_task.actionComplete();
                    }
                }
            } catch (ex) {
                console.error("actionExecutorLoop", ex);
            } finally {
                character.action_queue.splice(0, 1);
                this.#current_task = null;
            }
		}

		setTimeout(this.actionExecutorLoop.bind(this), 100);
	}

    async executeActionStep(action) {
        let actionType = action.type;
        if (actionType === "change_state") {
            game_log(`Changing state to: ${action.arg}`, LOG_COLORS.blue);
            character.current_state = action.arg;
            return set_message(action.arg);
        }

        if (actionType === "call") {
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
    }

    // ------------------------ ACTION ROUTINES ------------------------- //
    pushFarmBossActions(event) {
        if (character.action_queue.some((t) => t.id === event.id)) return;

        game_log(`Pushing "boss_farm" event to queue`, LOG_COLORS.blue);
        let bossFarmTask = Task.getFarmBossTask(event);

        if (event.type === "global" && character.action_queue.length > 0) character.action_queue.splice(1, 0, bossFarmTask);
        else character.action_queue.push(bossFarmTask);
    }

    async changeOptions(event) {
        if (event && event.name) {
            let bossInfo = BOSS_INFO[event.type][event.name];
            let bossFarmArea = FARM_AREAS.event;
            bossFarmArea.farm_monsters = [...bossInfo.targets];
    
            let bossFarmOptions = bossInfo.characters[character.name];
            bossFarmOptions.farm_area = bossFarmArea;

            event.targets = bossInfo.targets;
            event.options = bossFarmOptions;
    
            this.strategy.options = bossFarmOptions;
            character.current_event = event;
        } else {
            this.strategy.options = character.farm_options;
            character.current_event = null;
        }
    }

    async callPartyForEvent() {
        let currEvent = character.current_event;
        let targets = currEvent.targets;

        let targetsAround = await waitForTargets(targets, 5);
        if (targetsAround.length === 0) return;

        let bossInfo = BOSS_INFO[currEvent.type][currEvent.name];
        let eventCharacters = Object.keys(bossInfo.characters);
        if (eventCharacters.length > 2) {
            let onServer = getOnlineCharacters();
            let summonNames = eventCharacters.filter((c) => c !== character.name && onServer.includes(c));
            let toSummon = [];
            for (let summonNm of summonNames) {
                let summonEntity = parent.entities[summonNm];
                if (!summonEntity || parent.simple_distance(character, summonEntity) >= 300) toSummon.push(summonNm);
            }

            await this.strategy.massMagiport(toSummon, true);
            for (let name of summonNames) {
                send_cm(name, currEvent);
            }
        }
    }

    async awaitCompletion() {
        let targets = character.current_event.targets;
        let targetsAround = await waitForTargets(targets, 5);
        if (targetsAround.length === 0) return;

        let waitForRespawn = character.current_event && character.current_event.wait_resp;
        let lastCheckTs = Date.now();

        let lastHpChange = Date.now();
        let targetsHp = targetsAround.reduce((partial, t) => partial + t.hp, 0);
        while (ts_msince(lastHpChange) < 1) {
            await sleep(1000);

            targetsAround = Object.values(parent.entities).filter((m) => m.type === "monster" && targets.includes(m.mtype));
            let targetsLastHp = targetsAround.reduce((partial, t) => partial + t.hp, 0);
            let isFullGuard = targetsAround.some((t) => t.s.fullguardx);
            if (targetsHp !== targetsLastHp || isFullGuard) {
                lastHpChange = Date.now();
                targetsHp = targetsLastHp;
            }
            // Nowait respawn logic
            if (targetsAround.length === 0 && !waitForRespawn) return;

            // Wait respawn logic
            if (targetsAround.length > 0) lastCheckTs = Date.now();
            if (targetsAround.length === 0 && ts_ssince(lastCheckTs) >= 10) return;
        }
    }

    // #TODO: Доделать возврат пати на спот через суммон
    // async callPartyBackToSpot() {
    //     let partyNames = parent.party_list;
    //     let summonList = [];
    //     for (let partyNm of partyNames) {
    //         let partyMemberInfo = get(partyNm);
    //         if (!partyMemberInfo) continue;

    //         let partyMemberOpts = partyMemberInfo.farmOptions;
    //         if (!partyMemberOpts) continue;

    //         let canSummon = !partyMemberOpts.is_solo
    //                         && partyMemberInfo.currState === "farming"
    //                         && partyMemberOpts.farm_area?.name === this.options.farm_area?.name
    //                         && distance(character, partyMemberInfo) >= 400;

    //         console.log(partyMemberOpts, canSummon);
    //         if (canSummon) summonList.push(partyNm);
    //     }

    //     await this.strategy.massMagiport(summonList, true);
    // }
}


class MageBehaviour {
    #USE_HP_AT_RATIO = 0.75;
    #USE_MP_AT_RATIO = 0.9;

    // General settings
    #USE_BURST_AT_MP_RATIO = 0.8;
    #KEEP_MP = character.mp_cost * 6;

    // States
    #move_by_graph = false;

    // Skill flags
    #useSkilsFlag = false;
    #attackFlag = false;
    #targetChooseFlag = false;
    #moveFlag = false;

    constructor(options) {
        this.options = options;
        character.farm_options = options;

        if (character.current_event) this.options = character.current_event.options;

        this.regenLoop();
        this.lootLoop();

        this.useSkillsLoop();
        this.targetChooseLoop();
        this.attackLoop();
        this.moveLoop();
    }

    // Enables all loops
    enable() {
        this.#useSkilsFlag = true;
        this.#attackFlag = true;
        this.#targetChooseFlag = true;
        this.#moveFlag = true;
    }

    // Disables all loops
    disable() {
        this.#useSkilsFlag = false;
        this.#attackFlag = false;
        this.#targetChooseFlag = false;
        this.#moveFlag = false;

        change_target(undefined);
    }

    // --------------------- GENERAL COMBAT SECTION --------------------- //
    async attackLoop() {
        if (!this.#attackFlag || smart.moving || character.rip) {
            setTimeout(this.attackLoop.bind(this), Math.max(1, ms_to_next_skill("attack")));
            return;
        }

        try {
            let target = get_targeted_monster();
            if (target && can_attack(target) && character.mp >= character.mp_cost) {
                await attack(target).catch(() => {});
                reduce_cooldown("attack", Math.min(...parent.pings));
            }
        } catch (ex) {
            console.error("attackLoop", ex);
        }

        setTimeout(this.attackLoop.bind(this), Math.max(1, ms_to_next_skill("attack")));
    }

    async targetChooseLoop() {
        if (!this.#targetChooseFlag || smart.moving || character.rip) {
            setTimeout(this.targetChooseLoop.bind(this), 100);
            return;
        }

        try {
            if (!this.options.is_solo) {
                await this.targetChooseParty();
            } else {
                await this.targetChooseSolo();
            }
        } catch(ex) {
            console.error("targetChooseLoop", ex);
        }

        setTimeout(this.targetChooseLoop.bind(this), 100);
    }
    
    async targetChooseParty() {
        let tank_character = parent.entities["Shalfey"];
        let target = get_targeted_monster();
        let tanks_target = get_target_of(tank_character);
        let targetingMe = Object.values(parent.entities).find((e) => e.type === "monster" && e.target === character.name);

        if (target && tanks_target && target.id !== tanks_target.id) {
            await change_target(tanks_target);
        } else if (tanks_target) {
            await change_target(tanks_target);
        } else if (targetingMe) {
            await change_target(targetingMe);
        } else {
            await change_target(tank_character);
        }
    }
    
    async targetChooseSolo() {
        // Check if we have some monster in target
        let target = get_targeted_monster();
        if (target && !parent.entities[target.id]) {
            await change_target(null);
            target = null;
        }

        // If not, find viable monster to attack and select target
        if (!target) {
            target = this.find_viable_targets()[0];
            if (target) await change_target(target);
        }
    }

    async moveLoop() {
        try {
            if (!this.#moveFlag || smart.moving || character.rip) {
                setTimeout(this.moveLoop.bind(this), 200);
                return;
            }

            // Avoidance parameters
            let entityScale = 20;
            let rangeBuffer = 50;
            let characterMaxRange = character.range - 10;

            let target = get_target();
            let characterVector = new Vector(character.real_x, character.real_y);
            let avoidanceVector = getEntityAvoidanceVector(characterVector, rangeBuffer, characterMaxRange, entityScale);
            if (target && target.name !== character.name) {
                let targetVector = getTargetVector(target, target.range + 50, characterMaxRange);
                let moveVector = targetVector.clone().add(avoidanceVector).limit(50);
                let pathVector = characterVector.clone().add(moveVector);

                let secondAvoidanceVector = getEntityAvoidanceVector(pathVector, rangeBuffer, characterMaxRange, entityScale);
                if (Math.abs(avoidanceVector.toAngles() - secondAvoidanceVector.toAngles()) > 0.087266) moveVector.add(avoidanceVector).limit(50);

                pathVector = characterVector.clone().add(moveVector);

                let canMoveTo = can_move_to(pathVector.x, pathVector.y);
                if (distance2D(pathVector.x, pathVector.y) > 10 && canMoveTo) {
                    this.#move_by_graph = false;
                    move(pathVector.x, pathVector.y);
                } else if (!this.#move_by_graph && !canMoveTo) {
                    this.#move_by_graph = true;
                    this.moveByGraph(characterVector.add(targetVector));
                }
            } else if (avoidanceVector.length() > 10) {
                let evadeMove = characterVector.add(avoidanceVector.limit(50));
                move(evadeMove.x, evadeMove.y);
            }
        } catch (ex) {
            this.#move_by_graph = false;
            console.error("moveLoop", ex);
        }

        setTimeout(this.moveLoop.bind(this), 200);
    }

    async moveByGraph(target) {
        if (this.#move_by_graph) {
            if (!target) {
                this.#move_by_graph = false;
                return;
            }

            let from = {x: character.real_x, y: character.real_y};
            let to = {x: target.x, y: target.y};
            let path = plotPath(from, to);

            for (let node of path) {
                if (this.#move_by_graph) {
                    await move(node.x, node.y);
                }
            }
            this.#move_by_graph = false;
        }
    }

    // ------------------------- SKILLS SECTION ------------------------- //
    async useSkillsLoop() {
        if (!this.#useSkilsFlag || smart.moving || character.rip) {
            setTimeout(this.useSkillsLoop.bind(this), 100);
            return;
        }

        try {
            await this.mageSkills();
        } catch (ex) {
            console.error("useSkillsLoop", ex);
        }

        setTimeout(this.useSkillsLoop.bind(this), 100);
    }

    mageSkills() {
        let allPromises = [];

        if (this.options?.use_burst) allPromises.push(this.manaBurst());
        if (this.options?.energize) allPromises.push(this.energize("Shalfey"));

        return Promise.allSettled(allPromises);
    }

    manaBurst() {
        let mpRatio = character.mp / character.max_mp;
        if (mpRatio <= this.#USE_BURST_AT_MP_RATIO || is_on_cooldown("cburst")) return;

        const manaToSpend = character.mp - this.#KEEP_MP;

        let targets = this.find_viable_targets();
        if (!this.options.is_solo) targets = targets.filter((mob) => mob.target === "Shalfey");

        if (targets.length > 0) {
            if (targets.length > 1) {
                targets = targets
                    .filter((trg) => is_in_range(trg, "cburst") && !trg.immune)
                    .map((trg) => {
                        let manaToKill = trg.hp / G.skills.cburst.ratio + 100;
                        return {id: trg.id, manaToKill: manaToKill};
                    })
                    .sort(function (current, next) {
                        if (current.manaToKill !== next.manaToKill) return (current.manaToKill < next.manaToKill) ? -1 : 1;

                        return 0;
                    });
            }

            let currTarget = get_targeted_monster();
            let tmpManaToSpend = manaToSpend;
            let burstList = [];
            for (let trg of targets) {
                if (trg.manaToKill <= tmpManaToSpend) {
                    if (trg.id === currTarget) currTarget = undefined;

                    burstList.push([trg.id, trg.manaToKill]);
                    tmpManaToSpend -= trg.manaToKill;
                } else if (currTarget) {
                    if (!currTarget.immune) burstList.push([currTarget.id, tmpManaToSpend]);
                    break;
                }
                else {
                    break;
                }
            }

            if (burstList.length > 0) {
                return use_skill("cburst", burstList)
                    .then(reduce_cooldown("cburst", Math.min(...parent.pings)));
            } 
        }
    }

    energize(targetNm) {
        let target = parent.entities[targetNm];
        if (!target) target = character;

        if (target && !is_on_cooldown("energize") && is_in_range(target, "energize") && !is_disabled(character)) {
            // use_skill("energize",target,optional_mp)
            return use_skill("energize", target, 1)
                .then(reduce_cooldown("energize", Math.min(...parent.pings)));
        }
    }

    magiport(targetNm) {
        if (character.mp >= (G.skills.magiport.mp + this.#KEEP_MP)) {
            return use_skill("magiport", targetNm);
        }
    }

    massMagiport(toSummon, shouldWait) {
        if (!toSummon || toSummon.length === 0) return;
        let mpNeeded = toSummon.length * G.skills.magiport.mp + this.#KEEP_MP;

        let task = async function(toSummon, mpNeeded, shouldWait) {
            while (character.mp < mpNeeded && shouldWait) {
                await sleep(500);
            }

            for (let trg of toSummon) {
                await use_skill("magiport", trg);
            }
        };

        return task(toSummon, mpNeeded, shouldWait);
    }
    
    // ------------------------- UTILITY SECTION ------------------------ //
    async regenLoop() {
        try {
            // Don't heal if we're dead or using teleport to town
            if (!can_use("regen_hp") || character.rip || smart.curr_step?.town) {
                setTimeout(this.regenLoop.bind(this), Math.max(100, ms_to_next_skill("use_hp")));
                return;
            }
    
            const hpRatio = character.hp / character.max_hp;
            const mpRatio = character.mp / character.max_mp;
            const minPing = Math.min(...parent.pings);
            
            if ((hpRatio < mpRatio && hpRatio <= this.#USE_HP_AT_RATIO) || (hpRatio <= 0.55 && mpRatio >= character.mp_cost)) {
                // Let's regen hp
                let hpPot0 = locate_item("hpot0");
                let hpPot1 = locate_item("hpot1");
    
                if (hpPot1 !== -1) {
                    await equip(hpPot1);
                    reduce_cooldown("use_hp", minPing);
                } else if (hpPot0 !== -1) {
                    await equip(hpPot0);
                    reduce_cooldown("use_hp", minPing);
                } else {
                    await use_skill("regen_hp");
                    reduce_cooldown("regen_hp", minPing);
                }
            } else if (mpRatio <= this.#USE_MP_AT_RATIO) {
                // Let's regen mp
                let mpPot0 = locate_item("mpot0");
                let mpPot1 = locate_item("mpot1");

                if (mpPot1 !== -1) {
                    await equip(mpPot1);
                    reduce_cooldown("use_mp", minPing);
                } else if (mpPot0 !== -1) {
                    await equip(mpPot0);
                    reduce_cooldown("use_mp", minPing);
                } else {
                    await use_skill("regen_mp");
                    reduce_cooldown("regen_mp", minPing);
                }
            }
        } catch (ex) {
            console.error("regenLoop", ex);
        }
    
        setTimeout(this.regenLoop.bind(this), Math.max(100, ms_to_next_skill("use_hp")));
    }

    async lootLoop() {
        try {
            let looterNm = this.options.looter;
            if (this.options.is_solo || !looterNm || looterNm === character.name || !parent.party_list.includes(looterNm) || get(looterNm).map !== character.map) {
                loot();
            }
        } catch (ex) {
            console.error("lootLoop", ex);
        }
        
        setTimeout(this.lootLoop.bind(this), 250);
    }

    find_viable_targets() {
        let monsters = Object.values(parent.entities).filter((e) => e.type === "monster");
        monsters.forEach((e) => {
                e.targeting_party = e.target !== character.name && parent.party_list.includes(e.target);
                e.is_boss_target = FARM_BOSSES.includes(e.mtype);
            });

        if (this.options.farm_area) {
            let farmable = this.options.farm_area.farm_monsters;
            let blacklist = this.options.farm_area.blacklist_monsters;

            // Area filter
            let area = this.options.farm_area.area;
            if (area) monsters = monsters.filter((mob) => (!this.options.is_solo && mob.targeting_party) || mob.is_boss_target || parent.simple_distance(area, mob) <= area.d);

            // Whitelist/Blacklist filter
            monsters = monsters.filter((mob) => mob.targeting_party || mob.is_boss_target || (farmable.includes(mob.mtype) && !blacklist.includes(mob.mtype)));
        }
    
        if (monsters.length > 0) {
            monsters.sort(
                function (current, next) {
                    // If mob targeting our party member - prioritize it
                    if (current.targeting_party !== next.targeting_party) {
                        return (current.targeting_party && !next.targeting_party) ? -1 : 1;
                    }
    
                    let dist_current = parent.simple_distance(character, current);
                    let dist_next = parent.simple_distance(character, next);
                    // If mob is boss - prioritize it and sort em by distance (if more than one)
                    if (current.is_boss_target !== next.is_boss_target) {
                        return (current.is_boss_target && !next.is_boss_target) ? -1 : 1;
                    } else if (current.is_boss_target && next.is_boss_target) {
                        return (dist_current < dist_next) ? -1 : 1;
                    }
    
                    // If mob is not boss - sort em by distance
                    if (dist_current !== dist_next) {
                        return (dist_current < dist_next) ? -1 : 1;
                    }
                    
                    return 0;
                }
            );
        }
    
        return monsters;
    }
}