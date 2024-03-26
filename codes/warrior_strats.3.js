class WarriorController {
    #actionCheckerLoopFlg = false;
    #actionExecutorLoopFlg = false;

    // Current action
	#current_action = undefined;
    #current_event = undefined;

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
		if (!this.#actionCheckerLoopFlg) {
			setTimeout(this.actionCheckerLoop.bind(this), 1000);
			return;
		}

        if (!this.#current_event && character.current_state === "event") {
            game_log(`Pushing "change_state" event to queue`, "#2b97ff");
            character.action_queue.push({
                task: "return",
                type: "change_state",
                arg: "farming"
            });
        }

        // Check and push return to spot
        if (character.current_state === "farming" && this.strategy.options.farm_area && character.action_queue.length === 0) {
            const farm_area = this.strategy.options.farm_area;
            if (!get_targeted_monster() && farm_area.position && (farm_area.position.map !== character.map || distance(character, farm_area.area) > (farm_area.area.d * 2))) {
                game_log(`Pushing "return to spot" task to queue`, "#2b97ff");
                character.action_queue.push({
                    task: "return",
					type: "call",
					name: "strat.disable",
					arg: undefined
                });
                character.action_queue.push({
                    task: "return",
					type: "call",
					name: "window.moveTo",
					arg: farm_area.position
                });
                character.action_queue.push({
                    task: "return",
					type: "call",
					name: "strat.enable",
					arg: undefined
                });
            }
        }

        if (!character.current_state) {
            character.action_queue.push({
                task: "farming",
                type: "change_state",
                arg: "farming"
            });
        }

		setTimeout(this.actionCheckerLoop.bind(this), 1000);
	}

	async actionExecutorLoop() {
		if (!this.#actionExecutorLoopFlg) {
			setTimeout(this.actionExecutorLoop.bind(this), 500);
			return;
		}

		// Execute from queue
		if (!this.#current_action && character.action_queue.length > 0) {
			let queued_action = character.action_queue[0];

			this.#current_action = queued_action;
			try {
				game_log(`Executing "${queued_action.type}" step`, "#2b97ff");
                await this.executeActionStep(queued_action);
				game_log(`Finished "${queued_action.type}" step`, "#2b97ff");
			} catch (ex) {
				game_log(`[${queued_action.action}] - ${ex.name}: ${ex.message}`, "#cf5b5b");
				console.error(ex);
			} finally {
				character.action_queue.splice(0, 1);
				this.#current_action = null;
			}
		}

		setTimeout(this.actionExecutorLoop.bind(this), 100);
	}

	async executeActionStep(action) {
		let actionType = action.type;
		if (actionType === "change_state") {
			game_log(`Changing state to: ${action.arg}`, "#2b97ff");
			character.current_state = action.arg;
			return set_message(action.arg);
		}

		if (actionType === "call") {
			let splitted = action.name.split(".");
			let context = splitted[0];
			let funcName = splitted[1];
			let arg = action.arg;

			game_log(`Calling ${action.name} function`, "#2b97ff");
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

        if (actionType === "change_options") {
            // game_log(`Changing options`, "#2b97ff");
            // this.prev_options = this.options;
            // this.options = action.arg;
            // return;
        }
    }

    // ------------------------ ACTION ROUTINES ------------------------- //
    pushFarmBossActions(event) {
        let bossFarmArea = FARM_AREAS.event;
        bossFarmArea.position = {map: event.map, x: event.x, y: event.y};
        bossFarmArea.farm_monsters = [event.target];

        let bossFarmOptions = {
            is_solo: false,
            looter: character.name,
            farm_area: bossFarmArea,
            do_circle: true,
            use_taunt: true,
            use_agitate: false,
            use_cleave: false
        };

        game_log(`Pushing "boss_farm" event to queue`, "#2b97ff");
        character.action_queue.push({
            task: "event",
            type: "change_state",
            arg: "event"
        });
        character.action_queue.push({
            task: "event",
            type: "call",
            name: "this.changeOptions",
            arg: [bossFarmOptions, event]
        });
        character.action_queue.push({
            task: "event",
            type: "call",
            name: "this.awaitCompletion",
            arg: event
        });
        character.action_queue.push({
            task: "event",
            type: "call",
            name: "this.changeOptions",
            arg: [character.farm_options, null]
        });
    }

    async changeOptions(newOptions) {
        this.strategy.disable();
        this.strategy.options = newOptions[0];
        this.strategy.enable();

        this.#current_event = newOptions[1];
    }

    async awaitCompletion(event) {
        await sleep(1000);

        let target = Object.values(parent.entities).find((m) => m.mtype === event.target);
        if (!target) return;

        await change_target(target);
        while (target && target.hp > 0) {
            await sleep(2000);
            target = Object.values(parent.entities).find((m) => m.mtype === event.target);
        }
    }
}


class WarriorBehaviour {
    #USE_HP_AT_RATIO = 0.75;
    #USE_MP_AT_RATIO = 0.8;

    // General settings
    #USE_HS_AT_HP_RATIO = 0.5;
    #KEEP_MP = character.mp_cost * 5;
    #CIRCLE_AT_RANGE = character.range - 1;
    #CIRCLE_ANGLE = 45;

    // Skill items
    #mainhandItem = {name: "fireblade", level: 9};
    #offhandItem = {name: "ololipop", level: 8};
    #alterOffhandItem = {name: "fireblade", level: 8};
    #cleaveItem = {name: "bataxe", level: 8};

    // States
    #move_by_graph = false;
    #circle_around = false;
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
        if (!this.#attackFlag) {
            setTimeout(this.attackLoop.bind(this), Math.max(1, ms_to_next_skill("attack")));
            return;
        }

        try {
            const target = get_targeted_monster();
            if (target && is_monster(target) && can_attack(target) && target.hp > 0 && character.mp >= character.mp_cost && !target.s.fullguardx) {
                await attack(target)
                    .catch(
                        (reason) => game_log(`Attack failed: ${reason.reason}`)
                    );
                reduce_cooldown("attack", Math.min(...parent.pings));
            }
        } catch (e) {
            game_log(`[attackLoop] - ${e.name}: ${e.message}`);
        }

        setTimeout(this.attackLoop.bind(this), Math.max(1, ms_to_next_skill("attack")));
    }

    async targetChooseLoop() {
        if (!this.#targetChooseFlag || smart.moving) {
            setTimeout(this.targetChooseLoop.bind(this), 100);
            return;
        }

        try {
            // Check if we have some monster in target
            let target = get_targeted_monster();
            // If not, find viable monster to attack and select target
            if (!target) {
                target = this.find_viable_targets()[0];
                if (target) await change_target(target);
            }

            // // Update class target field if our current target differs with it
            // if (this.#target?.id !== target?.id) this.#target = target;
        } catch (e) {
            game_log(`[targetChooseLoop] - ${e.name}: ${e.message}`);
        }

        setTimeout(this.targetChooseLoop.bind(this), 100);
    }

    async moveLoop() {
        try {
            if (!this.#moveFlag || this.#circle_around || smart.moving) {
                setTimeout(this.moveLoop.bind(this), 250);
                return;
            }

            const target = get_targeted_monster();
            const isInRange = is_in_range(target, "attack");

            if (target && target.name !== character.name) {
                if (isInRange) {
                    try {
                        // No need to move, we are already in range
                        if (this.#move_by_graph) this.#move_by_graph = false;
                        if (this.options.do_circle) this.circleTarget(target);
                    } catch (ex) {
                        console.log(ex);
                    }
                } else {
                    // We are not in range, so we have to move
                    let canMoveTo = can_move_to(target);
                    // If we cant move straight then move by graph
                    if (!canMoveTo && !this.#move_by_graph) {
                        this.#move_by_graph = true;
                        this.moveByGraph(target);
                    } else if (canMoveTo) {
                        // If we can move straight then turn off graph moving
                        this.#move_by_graph = false;
                        if (!isInRange) {
                            move(
                                character.x + (target.x - character.x) / 4,
                                character.y + (target.y - character.y) / 4
                            )
                        }
                    }
                }
            }
        } catch (e) {
            game_log(`${e.name}: ${e.message}`);
        }
        
        setTimeout(this.moveLoop.bind(this), 250);
    }

    async moveByGraph(target) {
        try {
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
        } catch (e) {
            game_log(`${e.name}: ${e.message}`);
        }
    }

    async circleTarget(target) {
        let debugDraw = false;

        let targetId = target.id;
        let startAngle = get_angle_between(target, character);
        let inclination = degrees_to_radian(this.#CIRCLE_ANGLE) * get_random_sign();
        let i = 0;
        let quotient = (360 / this.#CIRCLE_ANGLE >> 0) - 1;

        let retries = 0;
        let j = 0;

        this.#circle_around = true;
        while (target && target.id === targetId && target.hp > 0 && this.#circle_around && this.options.do_circle && j <= 100) {
            j++;

            let centreX = target.x;
            let centreY = target.y;
            let centreR = character.range - 1;

            let angle = startAngle + inclination * i;
            let newX = centreX + this.#CIRCLE_AT_RANGE * Math.cos(angle);
            let newY = centreY + this.#CIRCLE_AT_RANGE * Math.sin(angle);

            if (debugDraw) {
                clear_drawings();
                // Kite circle
                draw_circle(centreX, centreY, centreR, 2, 0x2B97FF);
                draw_line(centreX, centreY, newX, newY, 2, 0x2B97FF);
            }

            if (!can_move_to(newX, newY)) {
                startAngle = angle;
                inclination *= -1;
                i = 2;

                retries++;
                if (retries >= 2) {
                    startAngle *= -1;
                    retries = 0;
                }

                continue;
            }

            await move(newX, newY);
            await sleep(250);

            retries = 0;
            i++;
            if (i > quotient) i = 0;
            target = get_targeted_monster();
        }

        if (debugDraw) clear_drawings();
        this.#circle_around = false;
    }

    // ------------------------- SKILLS SECTION ------------------------- //
    async useSkillsLoop() {
        if (!this.#useSkillsFlag) {
            setTimeout(this.useSkillsLoop.bind(this), 100);
            return;
        }

        try {
            if (!smart.moving) await this.warriorSkills();
        } catch (ex) {
            console.log(ex);
        }

        setTimeout(this.useSkillsLoop.bind(this), 100);
    }

    warriorSkills() {
        let allPromises = [];
        if (!character.rip) {
            if (this.options?.use_taunt) allPromises.push(this.taunt());
            if (this.options?.use_agitate) allPromises.push(this.massTaunt());
            if (this.options?.use_cleave) {
                allPromises.push(this.cleave());
            }

            allPromises.push(this.ensureEquipped());
            allPromises.push(this.hardShell());
            allPromises.push(this.warCry());
        }

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
            const monstersToCleave = this.find_viable_targets().filter((mob) => is_in_range(mob, "cleave"));
            if (monstersToCleave.length >= 3) {

                this.#last_cleave = new Date();
                let task = async function() {
                    let currMainhand = character.slots.mainhand;
                    let currOffhand = character.slots.offhand;

                    if (currMainhand.name !== cleaveItem.name && currMainhand.level !== cleaveItem.level) {
                        let cleaveItemIx = find_desired_item(cleaveItem);
                        if (cleaveItemIx < 0) return;

                        if (currOffhand) await unequip("offhand");
                        await equip(cleaveItemIx);
                    }
                    
                    await use_skill("cleave").then(reduce_cooldown("cleave", Math.min(...parent.pings)));
                };

                return task();
            }
        } 
    }

    // ------------------------- UTILITY SECTION ------------------------ //
    async regenLoop() {
		try {
			// Don't heal if we're dead or using teleport to town
			if ((!can_use("regen_hp") && !can_use("regen_mp")) || character.rip || is_transporting(character)) {
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
		} catch (e) {
			game_log(`${e.name}: ${e.message}`);
		}
	
		setTimeout(this.regenLoop.bind(this), Math.max(100, ms_to_next_skill("use_hp")));
	}

    async lootLoop() {
        try {
            let looterNm = this.options.looter;
            if (this.options.is_solo || !looterNm || looterNm === character.name || !parent.party_list.includes(looterNm) || get(looterNm).map !== character.map) {
                loot();
            }
        } catch (e) {
            game_log(`${e.name}: ${e.message}`);
        }
        
        setTimeout(this.lootLoop.bind(this), 250);
    }

    ensureEquipped() {
        const currMainhand = character.slots.mainhand;
        const currOffHand = character.slots.offhand;

        const desiredMainhand = this.#mainhandItem;
        const desiredOffhand = (this.options.use_cleave) ? this.#offhandItem : this.#alterOffhandItem;

        if (mssince(this.#last_cleave) > 300 && mssince(this.#last_equip) > 300) {
            let somethingWrong = (currMainhand?.name !== desiredMainhand.name || currMainhand?.level !== desiredMainhand.level)
                              || (currOffHand?.name !== desiredOffhand.name || currOffHand?.level !== desiredOffhand.level);

            if (somethingWrong) {
                this.#last_equip = new Date();
                let task = async function() {
                    if (currMainhand) await unequip("mainhand");
                    if (currOffHand) await unequip("offhand");

                    await sleep(50);

                    let desiredMainhandIx = find_desired_item(desiredMainhand);
                    let desiredOffhandIx = find_desired_item(desiredOffhand);

                    if (desiredMainhandIx > -1) await equip(desiredMainhandIx);
                    if (desiredOffhandIx > -1) await equip(desiredOffhandIx);
                };
                
                return task();
            }
        }
    }

    find_viable_targets() {
        let monsters = Object.values(parent.entities);
        monsters.filter((e) => e.type === "monster")
            .forEach((e) => {
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
    
        return monsters || [];
    }
}