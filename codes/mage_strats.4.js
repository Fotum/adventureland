class MageController {
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
					arg: null
                });
                character.action_queue.push({
                    task: "return",
					type: "call",
					name: "window.moveTo",
					arg: farm_area.position
                });

                // if (!this.options.is_solo) {
                //     character.action_queue.push({
                //         task: "return",
                //         type: "call",
                //         name: "this.callPartyBackToSpot",
                //         arg: null
                //     });
                // }

                character.action_queue.push({
                    task: "return",
					type: "call",
					name: "strat.enable",
					arg: null
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

        // if (actionType === "change_options") {
            // game_log(`Changing options`, "#2b97ff");
            // this.prev_options = this.options;
            // this.options = action.arg;
            // return;
        // }
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
            use_burst: true,
            energize: true
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
            name: "window.smart_move",
            arg: event
        });
        character.action_queue.push({
            task: "event",
            type: "call",
            name: "this.callPartyForEvent",
            arg: event
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
        character.current_state = "event";
    }

    async callPartyForEvent(event) {
        await sleep(1000);
        let target = Object.values(parent.entities).find((m) => m.mtype === event.target);
        if (!target) return;

        if (event.characters.length > 2) {
            let onServer = getOnlineCharacters();
            let toSummon = event.characters.filter((c) => c !== character.name && onServer.includes(c));

            await this.strategy.massMagiport(toSummon, true);
            notifyCharactersOfEvent(event, toSummon);
        }
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
        if (!this.#attackFlag) {
            setTimeout(this.attackLoop.bind(this), Math.max(1, ms_to_next_skill("attack")));
            return;
        }

        try {
            const target = get_targeted_monster();
            if (target && can_attack(target) && character.mp >= character.mp_cost) {
                await attack(target).catch((reason) => {});
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
        if (!this.#useSkilsFlag || smart.moving) {
            setTimeout(this.useSkillsLoop.bind(this), 100);
            return;
        }

        try {
            await this.mageSkills();
        } catch (ex) {
            console.log(ex);
        }

        setTimeout(this.useSkillsLoop.bind(this), 100);
    }

    mageSkills() {
        let allPromises = [];
        if (!character.rip) {
            if (this.options?.use_burst) allPromises.push(this.manaBurst());
            if (this.options?.energize) allPromises.push(this.energize("Shalfey"));
        }

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
			if (!can_use("regen_hp") || character.rip || is_transporting(character)) {
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