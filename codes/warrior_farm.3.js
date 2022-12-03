//This function contains our logic for when we're farming mobs
async function attackLoop() {
	try {
		const target = get_targeted_monster();
		if (!target) {
			set_message("No targets");
		} else if (can_attack(target)) {
			set_message("Attacking");
			await attack(target)
				.catch(
					(reason) => game_log(`Attack failed: ${reason.reason}`)
				);
			reduce_cooldown("attack", Math.min(...parent.pings));
		}
	} catch (e) {
		game_log(`[attackLoop] - ${e.name}: ${e.message}`);
	}
	
	setTimeout(attackLoop, Math.max(1, ms_to_next_skill("attack")));
}

async function targetChooseLoop() {
	try {
		let target = get_targeted_monster();
		if (!target) {
			target = find_viable_targets()[0];
			if (target) {
				await change_target(target);
			}
		}
	} catch (e) {
		game_log(`[targetChooseLoop] - ${e.name}: ${e.message}`);
	}
	
	setTimeout(targetChooseLoop, 150);
}

async function tauntLoop() {
	try {
		let target = find_viable_targets().find((mob) => mob.targeting_party);
		if (target && !is_on_cooldown("taunt") && is_in_range(target, "taunt")) {
			await use_skill("taunt", target)
				.catch(
					(reason) => game_log(`Taunt failed: ${reason.reason}`)
				);
			reduce_cooldown("taunt", Math.min(...parent.pings));
		}
	} catch (e) {
		game_log(`[tauntLoop] - ${e.name}: ${e.message}`);
	}
	
	setTimeout(tauntLoop, Math.max(1, ms_to_next_skill("taunt")));
}

async function hardShellLoop() {
	try {
		let hpRatio = character.hp / character.max_hp;
		if (hpRatio < USE_HS_AT_HP_RATIO && !character.moving) {
			await use_skill("hardshell", character)
				.catch(
					(reason) => game_log(`Hard Shell failed: ${reason.reason}`)
				);
			reduce_cooldown("hardshell", Math.min(...parent.pings));
		}
	} catch (e) {
		game_log(`[hardShellLoop] - ${e.name}: ${e.message}`);
	}

	setTimeout(hardShellLoop, Math.max(1, ms_to_next_skill("hardshell")));
}

function find_viable_targets() {
	let monsters = Object.values(parent.entities).filter(
			(mob) => (mob.type == "monster") &&
				((!BLACKLIST_MONSTERS.includes(mob.mtype) && FARM_MONSTERS.includes(mob.mtype) && !mob.target) ||
				parent.party_list.includes(mob.target))
		);

	if (monsters) {
		monsters.forEach(
			(mob) => mob.targeting_party = parent.party_list.includes(mob.target) && mob.target !== character.name
		);

		monsters.sort(
				function (current, next) {
					if (current.targeting_party && !next.targeting_party) {
						return -1;
					}
					if (current.special && !next.special) {
						return -1;
					}
					if (current.xp > next.xp) {
						return -1;
					}
					var dist_current = distance(character, current);
					var dist_next = distance(character, next);
					// Else go to the 2nd item
					if (dist_current < dist_next) {
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