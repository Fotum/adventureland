class HealerController {
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
}


class HealerBehaviour {
    #USE_HP_AT_RATIO = 0.75;
    #USE_MP_AT_RATIO = 0.9;

    // General settings
    #USE_HEAL_AT_RATIO = 0.8;
    #USE_MASS_HEAL_AT_RATIO = 0.5;
    #KEEP_MP = character.mp_cost * 15;

    // States
    #move_by_graph = false;

    // Skill flags
    #useSkillsFlag = false;
    #attackHealFlag = false;
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
        this.attackHealLoop();
        this.moveLoop();
    }

    // Enables all loops
    enable() {
        this.#attackHealFlag = true;
        this.#targetChooseFlag = true;
        this.#useSkillsFlag = true;
        this.#moveFlag = true;
    }

    // Disables all loops
    disable() {
        this.#attackHealFlag = false;
        this.#targetChooseFlag = false;
        this.#useSkillsFlag = false;
        this.#moveFlag = false;

        change_target(undefined);
    }
    
    // --------------------- GENERAL COMBAT SECTION --------------------- //
    async attackHealLoop() {
        if (!this.#attackHealFlag || character.rip) {
            setTimeout(this.attackHealLoop.bind(this), Math.max(1, ms_to_next_skill("attack")));
            return;
        }

        try {
            let target = get_target();
            if (target) {
                let isPlayer = (target.player || target.id === character.name) && target.type === "character";
                let shouldHeal = isPlayer && target.health_ratio <= this.#USE_HEAL_AT_RATIO;
                if (shouldHeal && can_attack(target)) {
                    await heal(target).catch(() => {});
                    reduce_cooldown("attack", Math.min(...parent.pings));
                } else if (!isPlayer && can_attack(target) && character.mp >= character.mp_cost) {
                    await attack(target).catch(() => {});
                    reduce_cooldown("attack", Math.min(...parent.pings));
                }
            }
        } catch (ex) {
            console.error("attackHealLoop", ex);
        }

        setTimeout(this.attackHealLoop.bind(this), Math.max(1, ms_to_next_skill("attack")));
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
        let lowestHealth = this.lowest_health_partymember();
        let targetingMe = Object.values(parent.entities).find((e) => e.type === "monster" && e.target === character.name);

        if (lowestHealth.health_ratio < this.#USE_HEAL_AT_RATIO) {
            await change_target(lowestHealth);
        } else if (target && tanks_target && target.id !== tanks_target.id) {
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
        // Check if we have some party member with low hp
        let lowestHealth = this.lowest_health_partymember();

        if (target && !parent.entities[target.id]) {
            await change_target(null);
            target = null;
        }

        if (lowestHealth.health_ratio < this.#USE_HEAL_AT_RATIO) {
            await change_target(lowestHealth);
        } else if (!target) {
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
        if (!this.#useSkillsFlag || character.rip) {
            setTimeout(this.useSkillsLoop.bind(this), 100);
            return;
        }

        try {
            await this.priestSkills();
        } catch (ex) {
            console.log("useSkillsLoop", ex);
        }

        setTimeout(this.useSkillsLoop.bind(this), 100);
    }

    priestSkills() {
        let allPromises = [];

        if (this.options?.use_mass_heal) allPromises.push(this.partyHeal());

        if (!smart.moving) {
            if (this.options?.use_curse) allPromises.push(this.curse());

            allPromises.push(this.darkBlessing());
        }

        return Promise.allSettled(allPromises);
    }

    curse() {
        const target = get_targeted_monster();
        if (target && !target.immune) {
            if (!is_on_cooldown("curse") && is_in_range(target, "curse") && !is_disabled(character) && !target.s?.cursed && character.mp > this.#KEEP_MP) {
                return use_skill("curse", target)
                    .then(reduce_cooldown("curse", Math.min(...parent.pings)));
            }
        }
    }

    darkBlessing() {
        let target = get_targeted_monster();
        if (target && !is_on_cooldown("darkblessing") && !is_disabled(character) && character.mp > this.#KEEP_MP) {
            return use_skill("darkblessing")
                .then(reduce_cooldown("darkblessing", Math.min(...parent.pings)));
        }
    }

    partyHeal() {
        const lowest_health = this.lowest_health_partymember();
        const lowest_my_character = MY_CHARACTERS
            .filter((nm) => nm !== character.name && parent.party_list.includes(nm))
            .map((nm) => {
                let my_char = get(nm);
                let health_ratio = my_char.hp / my_char.max_hp;

                return {name: nm, health_ratio: health_ratio, rip: my_char.rip};
            }).sort(function (current, next) {
                return current.health_ratio - next.health_ratio;
            })[0];

        let useMassHeal = (lowest_health && !lowest_health.rip && lowest_health.health_ratio < this.#USE_MASS_HEAL_AT_RATIO) ||
                        (lowest_my_character && !lowest_my_character.rip && lowest_my_character.health_ratio < this.#USE_MASS_HEAL_AT_RATIO);

        if (!is_on_cooldown("partyheal") && useMassHeal && character.mp > this.#KEEP_MP) {
            return use_skill("partyheal")
                .then(reduce_cooldown("partyheal", Math.min(...parent.pings)));
        }
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
            
            if (mpRatio < hpRatio && mpRatio < this.#USE_MP_AT_RATIO) {
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
            } else if (hpRatio < this.#USE_HP_AT_RATIO) {
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

    lowest_health_partymember() {
        let self = character;
        self.health_ratio = self.hp / self.max_hp;

        let party_names = [...parent.party_list];
        for (let char_nm of MY_CHARACTERS) {
            if (char_nm !== character.name && !party_names.includes(char_nm)) party_names.push(char_nm);
        }

        let party = [self];
        for (let member_name of party_names) {
            if (member_name === character.name) continue;

            let entity = parent.entities[member_name];
            if (entity && !entity.rip) {
                entity.health_ratio = entity.hp / entity.max_hp;
                party.push(entity)
            }
        }
    
        //Order our party array by health percentage
        party.sort(function (current, next) {
            return current.health_ratio - next.health_ratio;
        });
    
        //Return the lowest health
        return party[0];
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