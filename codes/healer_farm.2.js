async function switchMode() {
	combat_mode = !combat_mode;

	if (combat_mode) {
		attackHealLoop();
		if (is_solo) {
			targetChooseSoloLoop();	
		} else {
			targetChoosePartyLoop();
		}
		curseLoop();
		darkBlessingLoop();
		partyHealLoop();
	} else {
		set_message("Out of combat");
		// Sleep for 300 ms to wait for target chooser return
		await sleep(300);
		change_target(undefined);
	}
}

async function attackHealLoop() {
	try {
		if (!combat_mode) {
			return;
		}

		const lowest_health = lowest_health_partymember();
		const target = get_targeted_monster();
		
		if (lowest_health && is_in_range(lowest_health, "attack") && lowest_health.health_ratio < USE_HEAL_AT_RATIO) {
			set_message("Healing");

			last_targeted_monster = target;
			await heal(lowest_health)
				.catch(
					(reason) => game_log(`Heal failed: ${reason.reason}`)
				);
			reduce_cooldown("attack", Math.min(...parent.pings));
		} else if (target && is_in_range(target, "attack") && character.mp >= character.mp_cost) {
			set_message("Attacking");
			await attack(target)
				.catch(
					(reason) => game_log(`Attack failed: ${reason.reason}`)
				);
			reduce_cooldown("attack", Math.min(...parent.pings));
		}
	} catch (e) {
		game_log(`[attackHealLoop] - ${e.name}: ${e.message}`);
	}
	
	setTimeout(attackHealLoop, Math.max(1, ms_to_next_skill("attack")));
}

async function targetChoosePartyLoop() {
	try {
		if (!combat_mode) {
			return;
		}

		let target = get_targeted_monster();
		if (!target) {
			let tank_character = parent.entities["Shalfey"];
			if (tank_character) {
				target = get_target_of(tank_character);
				if (target) {
					change_target(target);
				}
			}
		}
	} catch (e) {
		game_log(`[targetChoosePartyLoop] - ${e.name}: ${e.message}`);
	}
	
	setTimeout(targetChoosePartyLoop, 100);
}

async function targetChooseSoloLoop() {
	try {
		if (!combat_mode) {
			return;
		}

		let target = get_targeted_monster();
		if (!target) {
			target = find_viable_targets()[0];
			if (target) {
				await change_target(target);
			}
		}
	} catch (e) {
		game_log(`[targetChooseSoloLoop] - ${e.name}: ${e.message}`);
	}

	setTimeout(targetChooseSoloLoop, 100);
}

async function curseLoop() {
	try {
		if (!combat_mode) {
			return;
		}

		const target = get_targeted_monster();
		if (target && !target.immune) {
			if (!is_on_cooldown("curse") && is_in_range(target, "curse") && !is_disabled(character) && character.mp > 450) {
				await use_skill("curse", target)
					.catch(
						(reason) => game_log(`Curse failed: ${reason.reason}`)
					);
				reduce_cooldown("curse", Math.min(...parent.pings));
			}
		}
	} catch (e) {
		game_log(`[curseLoop] - ${e.name}: ${e.message}`);
	}
	
	setTimeout(curseLoop, Math.max(1, ms_to_next_skill("curse")));
}

async function darkBlessingLoop() {
	try {
		if (!combat_mode) {
			return;
		}

		let target = get_targeted_monster();
		if (target && !is_on_cooldown("darkblessing") && !is_disabled(character) && character.mp > 900) {
			await use_skill("darkblessing")
				.catch(
					(reason) => game_log(`Dark Blessing failed: ${reason.reason}`)
				);
			reduce_cooldown("darkblessing", Math.min(...parent.pings));
		}
	} catch (e) {
		game_log(`[darkBlessingLoop] - ${e.name}: ${e.message}`);
	}

	setTimeout(darkBlessingLoop, Math.max(1, ms_to_next_skill("darkblessing")));
}

async function partyHealLoop() {
	try {
		if (!combat_mode) {
			return;
		}

		const lowest_health = lowest_health_partymember();
	
		if (lowest_health && !lowest_health.rip && lowest_health.health_ratio < USE_MASS_HEAL_AT_RATIO && character.mp > 400) {
			if (!is_on_cooldown("partyheal")) {
				await use_skill("partyheal")
					.catch(
						(reason) => game_log(`Mass heal failed: ${reason.reason}`)
					);
				reduce_cooldown("partyheal", Math.min(...parent.pings));
			}
		}
	} catch (e) {
		game_log(`[partyHealLoop] - ${e.name}: ${e.message}`);
	}
	
	setTimeout(partyHealLoop, Math.max(1, ms_to_next_skill("partyheal")));
}

//Returns the party member with the lowest hp -> max_hp ratio.
function lowest_health_partymember() {
	// Add Self into party list by default
	let self = character;
	self.health_ratio = self.hp / self.max_hp;
	
	let party = [self];
	let member_names = parent.party_list;
	if (member_names.length !== 0) {
		for (let member_name of member_names) {
			if (member_name === character.name) {
				continue;
			}
			
			let entity = parent.entities[member_name];
			if (entity && !entity.rip) {
				entity.health_ratio = entity.hp / entity.max_hp;
				party.push(entity)
			}
		}
	}

    //Order our party array by health percentage
    party.sort(function (current, next) {
        return current.health_ratio - next.health_ratio;
    });

    //Return the lowest health
    return party[0];
}

function find_viable_targets() {
	let farmableMonsters = [...FARM_BOSSES, ...FARM_MONSTERS];
	// Filter entities by monster type, not having any targets and not blacklisted
	let monsters = Object.values(parent.entities).filter(
		(mob) => (mob.type === "monster") &&
				(!BLACKLIST_MONSTERS.includes(mob.mtype) && farmableMonsters.includes(mob.mtype))
	);

	if (monsters) {
		// Mark boss monsters
		monsters.forEach(
			(mob) => mob.is_boss_target = FARM_BOSSES.includes(mob.mtype)
		);

		monsters.sort(
				function (current, next) {
					// If mob targeting our party member - prioritize it
					if (current.target === character.name && next.target !== character.name) {
						return -1;
					}

					let dist_current = distance(character, current);
					let dist_next = distance(character, next);
					// If mob is boss - prioritize it and sort em by distance (if more than one)
					if (current.is_boss_target && !next.is_boss_target) {
						return -1;
					} else if (current.is_boss_target && next.is_boss_target) {
						return (dist_current < dist_next) ? -1 : 1;
					}

					// If mob is not boss - sort em by distance
					if (dist_current < dist_next) {
						return -1;
					} else if (dist_current > dist_next) {
						return 1;
					}
					
					return 0;
				}
			);
	}

    return (monsters) ? monsters : [];
}