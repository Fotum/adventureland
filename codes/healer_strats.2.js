class HealerController {
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
            use_curse: true,
            use_mass_heal: true
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
        if (!this.#attackHealFlag) {
            setTimeout(this.attackHealLoop.bind(this), Math.max(1, ms_to_next_skill("attack")));
            return;
        }

        try {
            const lowest_health = this.lowest_health_partymember();
            const target = get_targeted_monster();
            
            if (can_attack(lowest_health) && lowest_health.health_ratio < this.#USE_HEAL_AT_RATIO) {
                await heal(lowest_health)
                    .catch(
                        (reason) => game_log(`Heal failed: ${reason.reason}`)
                    );
                reduce_cooldown("attack", Math.min(...parent.pings));
            } else if (can_attack(target) && character.mp >= character.mp_cost) {
                await attack(target)
                    .catch(
                        (reason) => game_log(`Attack failed: ${reason.reason}`)
                    );
                reduce_cooldown("attack", Math.min(...parent.pings));
            }
        } catch (e) {
            game_log(`[attackHealLoop] - ${e.name}: ${e.message}`);
        }

        setTimeout(this.attackHealLoop.bind(this), Math.max(1, ms_to_next_skill("attack")));
    }

    async targetChooseLoop() {
        if (!this.#targetChooseFlag || smart.moving) {
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
            game_log(`[targetChooseLoop] - ${e.name}: ${e.message}`);
        }

        setTimeout(this.targetChooseLoop.bind(this), 100);
    }
    
    async targetChooseParty() {
        let tank_character = parent.entities["Shalfey"];
        let target = get_targeted_monster();
        let tanks_target = get_target_of(tank_character);

        if (target && tanks_target && target.id !== tanks_target.id) {
            target = tanks_target;
            await change_target(tanks_target);
        } else if (tanks_target) {
            target = tanks_target;
            await change_target(tanks_target);
        }
    }
    
    async targetChooseSolo() {
        // Check if we have some monster in target
        let target = get_targeted_monster();
        // If not, find viable monster to attack and select target
        if (!target) {
            target = this.find_viable_targets()[0];
            if (target) await change_target(target);
        }
    }

    async moveLoop() {
        try {
            if (!this.#moveFlag || smart.moving) {
                setTimeout(this.moveLoop.bind(this), 250);
                return;
            }

            const target = get_targeted_monster();
            const isInRange = is_in_range(target, "attack");

            if (target && target.name !== character.name) {
                if (isInRange && this.#move_by_graph) {
                    // No need to move, we are already in range
                    this.#move_by_graph = false;
                    move(character.real_x, character.real_y);
                } else if (!isInRange) {
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
    
    // ------------------------- SKILLS SECTION ------------------------- //
    async useSkillsLoop() {
        if (!this.#useSkillsFlag || smart.moving) {
            setTimeout(this.useSkillsLoop.bind(this), 100);
            return;
        }

        try {
            await this.priestSkills();
        } catch (ex) {
            console.log(ex);
        }

        setTimeout(this.useSkillsLoop.bind(this), 100);
    }

    priestSkills() {
        let allPromises = [];
        if (!character.rip) {
            if (this.options?.use_curse) allPromises.push(this.curse());
            if (this.options?.use_mass_heal) allPromises.push(this.partyHeal());

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
			if (!can_use("regen_hp") || character.rip || is_transporting(character)) {
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
    
        return monsters || [];
    }
}