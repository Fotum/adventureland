class WarriorController {
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


class WarriorBehaviour {
    #USE_HP_AT_RATIO = 0.75;
    #USE_MP_AT_RATIO = 0.6;

    // General settings
    #USE_HS_AT_HP_RATIO = 0.5;
    #KEEP_MP = character.mp_cost * 5;

    // Skill items
    #mainhandItem = {name: "fireblade", level: 9};
    #offhandItem = {name: "ololipop", level: 8};
    #alterOffhandItem = {name: "fireblade", level: 9};
    #cleaveItem = {name: "bataxe", level: 8};

    // States
    #move_by_graph = false;
    // #circle_around = false;
    #last_cleave = new Date();
    #last_equip = new Date();

    // Skill flags
    #useSkillsFlag = false;
    #attackFlag = false;
    #targetChooseFlag = false;
    #moveFlag = false;

    constructor(options) {
        this.options = options;
        character.farm_options = options;

        if (character.current_event) this.options = character.current_event.options;

        this.lootLoop();
        this.regenLoop();

        this.useSkillsLoop();
        this.targetChooseLoop();
        this.attackLoop();
        this.moveLoop();
    }

    // Enables all loops
    enable() {
        this.#useSkillsFlag = true;
        this.#attackFlag = true;
        this.#targetChooseFlag = true;
        this.#moveFlag = true;
    }

    // Disables all loops
    disable() {
        this.#useSkillsFlag = false;
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
            if (target && is_monster(target) && can_attack(target) && target.hp > 0 && character.mp >= character.mp_cost && !target.s.fullguardx) {
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
            // Check if we have some monster in target
            let target = get_targeted_monster();
            if (target && !parent.entities[target.id]) {
                await change_target(null);
                target = null;
            }

            // If not, find viable monster to attack and select target
            if (!target) {
                let healerEntity = parent.entities[this.options.healer];
                let healerNearby = this.options.is_solo || !this.options.healer || (healerEntity && healerEntity.map === character.map && parent.simple_distance(character, healerEntity) <= 300);

                if (healerNearby) {
                    target = this.find_viable_targets()[0];
                    if (target) await change_target(target);
                } else {
                    let targetingMe = Object.values(parent.entities).find((e) => e.type === "monster" && e.target === character.name);
                    if (targetingMe) await change_target(targetingMe);
                }
            }
        } catch (ex) {
            console.error("targetChooseLoop", ex);
        }

        setTimeout(this.targetChooseLoop.bind(this), 100);
    }

    async moveLoop() {
        try {
            if (!this.#moveFlag || smart.moving || character.rip) {
                setTimeout(this.moveLoop.bind(this), 200);
                return;
            }

            let target = get_targeted_monster();
            if (target && target.name !== character.name) {
                let isInRange = is_in_range(target, "attack");
                let kitingRange = character.range - 5;

                let targetPositionVector = new Vector(target.real_x, target.real_y);
                let charTrgDiffVector = new Vector(character.real_x - target.real_x, character.real_y - target.real_y).normalize().multiply(kitingRange);
                // If in range - run around and attack
                if (isInRange) {
                    this.#move_by_graph = false;

                    let newPositionVec = targetPositionVector.clone();
                    if (this.options.do_circle) {
                        let rndAngle = get_random_angle();
                        let rotatedVector = charTrgDiffVector.clone().rotate(rndAngle);
                        newPositionVec.add(rotatedVector);

                        while (!can_move_to(newPositionVec.x, newPositionVec.y)) {
                            rndAngle = get_random_angle();
                            rotatedVector.rotate(rndAngle);
                            newPositionVec = targetPositionVector.clone().add(rotatedVector);
                        }
                    } else {
                        newPositionVec.add(charTrgDiffVector);
                    }

                    if (distance2D(newPositionVec.x, newPositionVec.y) > 15) await move(newPositionVec.x, newPositionVec.y);

                // If moving by graph and can already use our normal movement
                } else if (this.#move_by_graph && can_move_to(targetPositionVector.x, targetPositionVector.y)) {
                    this.#move_by_graph = false;

                    let newPositionVec = targetPositionVector.clone().add(charTrgDiffVector);
                    move(newPositionVec.x, newPositionVec.y);

                // Cannot reach target so move by graph
                } else if (!this.#move_by_graph) {
                    this.#move_by_graph = true;
                    this.moveByGraph(target);
                }
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

    // async circleTarget(target) {
    //     let debugDraw = false;

    //     let targetId = target.id;
    //     let startAngle = get_angle_between(target, character);
    //     let inclination = degrees_to_radian(this.#CIRCLE_ANGLE) * get_random_sign();
    //     let i = 0;
    //     let quotient = (360 / this.#CIRCLE_ANGLE >> 0) - 1;

    //     let retries = 0;
    //     let j = 0;

    //     this.#circle_around = true;
    //     while (target && target.id === targetId && target.hp > 0 && this.#circle_around && this.options.do_circle && j <= 100) {
    //         j++;

    //         let centreX = target.x;
    //         let centreY = target.y;
    //         let centreR = character.range - 1;

    //         let angle = startAngle + inclination * i;
    //         let newX = centreX + this.#CIRCLE_AT_RANGE * Math.cos(angle);
    //         let newY = centreY + this.#CIRCLE_AT_RANGE * Math.sin(angle);

    //         if (debugDraw) {
    //             clear_drawings();
    //             // Kite circle
    //             draw_circle(centreX, centreY, centreR, 2, 0x2B97FF);
    //             draw_line(centreX, centreY, newX, newY, 2, 0x2B97FF);
    //         }

    //         if (!can_move_to(newX, newY)) {
    //             startAngle = angle;
    //             inclination *= -1;
    //             i = 2;

    //             retries++;
    //             if (retries >= 2) {
    //                 startAngle *= -1;
    //                 retries = 0;
    //             }

    //             continue;
    //         }

    //         await move(newX, newY);
    //         await sleep(250);

    //         retries = 0;
    //         i++;
    //         if (i > quotient) i = 0;
    //         target = get_targeted_monster();
    //     }

    //     if (debugDraw) clear_drawings();
    //     this.#circle_around = false;
    // }

    // ------------------------- SKILLS SECTION ------------------------- //
    async useSkillsLoop() {
        if (!this.#useSkillsFlag || smart.moving || character.rip) {
            setTimeout(this.useSkillsLoop.bind(this), 100);
            return;
        }

        try {
            await this.warriorSkills();
        } catch (ex) {
            console.error("useSkillsLoop", ex);
        }

        setTimeout(this.useSkillsLoop.bind(this), 100);
    }

    warriorSkills() {
        let healerEntity = parent.entities[this.options.healer];
        let healerNearby = this.options.is_solo || !this.options.healer || (healerEntity && healerEntity.map === character.map && parent.simple_distance(character, healerEntity) <= 300);
        
        let allPromises = [];

        if (this.options?.use_taunt) allPromises.push(this.taunt());
        if (this.options?.use_agitate && healerNearby) allPromises.push(this.massTaunt());
        if (this.options?.use_cleave && healerNearby) allPromises.push(this.cleave());

        allPromises.push(this.ensureEquipped());
        allPromises.push(this.hardShell());
        allPromises.push(this.warCry());

        return Promise.allSettled(allPromises);
    }
    
    taunt() {
        let target = this.find_viable_targets().find((mob) => mob.targeting_party);
        if (target && !is_on_cooldown("taunt")
            && is_in_range(target, "taunt")
            && !is_disabled(character)
            && character.mp > (G.skills.taunt.mp + this.#KEEP_MP))
        {
            return use_skill("taunt", target)
                .then(reduce_cooldown("taunt", Math.min(...parent.pings)));
        }
    }
    
    hardShell() {
        let hpRatio = character.hp / character.max_hp;
        if (!is_on_cooldown("hardshell")
             && hpRatio < this.#USE_HS_AT_HP_RATIO
             && !character.moving
             && !is_disabled(character)
             && G.skills["hardshell"].mp <= character.mp)
        {
            return use_skill("hardshell", character)
                .then(reduce_cooldown("hardshell", Math.min(...parent.pings)));
        }
    }
    
    warCry() {
        if (get_targeted_monster()
            && !is_on_cooldown("warcry")
            && !is_disabled(character)
            && character.mp > (G.skills.warcry.mp + this.#KEEP_MP))
        {
            return use_skill("warcry")
                .then(reduce_cooldown("warcry", Math.min(...parent.pings)));
        }
    }

    massTaunt() {
        if (!is_on_cooldown("agitate")
            && !is_disabled(character)
            && character.mp > (G.skills.agitate.mp + this.#KEEP_MP))
        {
            const monstersInRange = this.find_viable_targets().filter((mob) => is_in_range(mob, "agitate"));
            let shouldCast = monstersInRange.length >= 3
                    && monstersInRange.every((m) => m?.attack <= 800 /*&& m?.level <= 10*/)
                    && monstersInRange.filter((m) => m?.target !== character.name).length >= 4;
            
            if (shouldCast) {
                return use_skill("agitate")
                    .then(reduce_cooldown("agitate", Math.min(...parent.pings)));
            }
        }
    }

    cleave() {
        // Maybe it should not be there
        if (!this.#cleaveItem) return;

        const cleaveItem = this.#cleaveItem;
        if (cleaveItem && !is_on_cooldown("cleave") && !is_disabled(character) && character.mp > (G.skills.cleave.mp + this.#KEEP_MP)) {
            let monstersToCleave = this.find_viable_targets().filter((mob) => is_in_range(mob, "cleave"));
            if (monstersToCleave.length >= 3) {

                let currMainhand = character.slots.mainhand;
                let currOffhand = character.slots.offhand;

                let shouldChangeMain = currMainhand.name !== cleaveItem.name || currMainhand.level !== cleaveItem.level;
                let shouldUnequipOffhand = !!currOffhand;

                this.#last_cleave = new Date();
                let task = async function(shouldChangeMain, shouldUnequipOffhand) {
                    if (shouldChangeMain) {
                        if (shouldUnequipOffhand) await unequip("offhand");

                        let cleaveItemIndex = find_desired_item(cleaveItem)[0];
                        if (cleaveItemIndex > -1) await equip(cleaveItemIndex);
                    }

                    await use_skill("cleave").then(reduce_cooldown("cleave", Math.min(...parent.pings)));
                };

                return task(shouldChangeMain, shouldUnequipOffhand);
            }
        } 
    }

    ensureEquipped() {
        const currMainhand = character.slots.mainhand;
        const currOffHand = character.slots.offhand;

        const desiredMainhand = this.#mainhandItem;
        const desiredOffhand = (this.options.use_explosion) ? this.#offhandItem : this.#alterOffhandItem;

        if (mssince(this.#last_cleave) > 300 && mssince(this.#last_equip) > 300) {
            let wrongMainhand = (currMainhand?.name !== desiredMainhand.name || currMainhand?.level !== desiredMainhand.level);
            let wrongOffhand = (currOffHand?.name !== desiredOffhand.name || currOffHand?.level !== desiredOffhand.level);
            let somethingWrong = wrongMainhand || wrongOffhand;

            if (somethingWrong) {
                let desiredMainhandIx = -1;
                if (wrongMainhand) desiredMainhandIx = find_desired_item(desiredMainhand)[0];

                let desiredOffhandIx = -1;
                if (wrongOffhand) {
                    let indexes = find_desired_item(desiredOffhand);
                    desiredOffhandIx = indexes.length > 1 ? indexes[1] : indexes[0];
                }

                let equipArray = [];
                if (desiredMainhandIx > -1) equipArray.push({num: desiredMainhandIx, slot: "mainhand"});
                if (desiredOffhandIx > -1) equipArray.push({num: desiredOffhandIx, slot: "offhand"});

                if (equipArray.length > 0) {
                    this.#last_equip = new Date();
                    return equip_batch(equipArray);
                }            
            }
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
            monsters = monsters.filter(
                (mob) => (!this.options.is_solo && mob.targeting_party)
                        || mob.target === character.name
                        || mob.is_boss_target
                        || (farmable.includes(mob.mtype) && !blacklist.includes(mob.mtype))
            );
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
    
        return monsters.filter((m) => m.mtype !== "wabbit");
    }
}