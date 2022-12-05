async function attackHealLoop() {
	try {
		const lowest_health = lowest_health_partymember();
		const target = get_targeted_monster();
		
		if (lowest_health && lowest_health.health_ratio < USE_HEAL_AT_RATIO) {
			if (can_attack(lowest_health)) {
				set_message("Healing");

				// Equip slimestaff
				let item = character.items[39];
				if (item && item.name === "slimestaff") {
					await equip(39)
						.catch(
							(reason) => game_log(`Item equip failed: ${reason.reason}`)
						);
				}

				await heal(lowest_health)
					.catch(
						(reason) => game_log(`Heal failed: ${reason.reason}`)
					);
				reduce_cooldown("attack", Math.min(...parent.pings));
			}
		} else if (attack_mode) {
			if (target && can_attack(target) && character.mp >= character.mp_cost) {
				set_message("Attacking");

				// Equip firestaff
				let item = character.items[39];
				if (item && item.name === "firestaff") {
					await equip(39)
						.catch(
							(reason) => game_log(`Item equip failed: ${reason.reason}`)
						);
				}

				await attack(target)
					.catch(
						(reason) => game_log(`Attack failed: ${reason.reason}`)
					);
				reduce_cooldown("attack", Math.min(...parent.pings));
			}
		}
	} catch (e) {
		game_log(`[attackHealLoop] - ${e.name}: ${e.message}`);
	}
	
	setTimeout(attackHealLoop, Math.max(1, ms_to_next_skill("attack")));
}

async function targetChoosePartyLoop() {
	try {
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

async function partyHealLoop() {
	try {
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
	let monsters = Object.values(parent.entities).filter(
			(mob) => (mob.type === "monster") &&
					!mob.target &&
					FARM_MONSTERS.includes(mob.mtype)
		);

	if (monsters) {
		monsters.sort(
				function (current, next) {
					if (current.target === character.name && next.target !== character.name) {
						return -1;
					}
					var dist_current = distance(character, current);
					var dist_next = distance(character, next);
					if (dist_current < dist_next) {
						return -1;
					}
					else if (current.xp > next.xp) {
						return -1;
					}
					else if (dist_current > dist_next) {
						return 1;
					}
					
					return 0;
				}
			);
	}

    return (monsters) ? monsters : [];
}