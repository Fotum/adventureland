async function attackLoop() {
	try {
		const target = get_targeted_monster();
		if (!target) {
			set_message("No targets");
		} else if (can_attack(target) && character.mp >= character.mp_cost) {
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

async function manaBurstLoop() {
	try {
		const target = get_targeted_monster();
		if (target) {
			if (!is_on_cooldown("burst") && character.mp > 2000) {
				await use_skill("burst", target);
				reduce_cooldown("burst", Math.min(...parent.pings));
			}
		}
	} catch (e) {
		game_log(`[manaBurstLoop] - ${e.name}: ${e.message}`);
	}
	
	setTimeout(manaBurstLoop, Math.max(1, ms_to_next_skill("burst")));
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