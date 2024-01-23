async function switchMode() {
	combat_mode = !combat_mode;

	if (combat_mode) {
		attackLoop();
		targetChooseLoop();
		if (!is_solo) {
			tauntLoop();
		}
		hardShellLoop();
		warCryLoop();
	} else {
		set_message("Out of combat");
		// Sleep for 300 ms to wait for target chooser return
		await sleep(300);
		change_target(undefined);
	}
}

async function attackLoop() {
	try {
		if (!combat_mode) {
			return;
		}

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
		game_log(`[targetChooseLoop] - ${e.name}: ${e.message}`);
	}
	
	setTimeout(targetChooseLoop, 150);
}

async function tauntLoop() {
	try {
		if (!combat_mode) {
			return;
		}

		let target = find_viable_targets().find((mob) => mob.targeting_party);
		if (target && !is_on_cooldown("taunt") && is_in_range(target, "taunt") && !is_disabled(character)) {
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
		if (!combat_mode) {
			return;
		}

		let hpRatio = character.hp / character.max_hp;
		if (hpRatio < USE_HS_AT_HP_RATIO && !character.moving && !is_disabled(character)) {
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

async function warCryLoop() {
	try {
		if (!combat_mode) {
			return;
		}

		let target = get_targeted_monster();
		if (target && !is_on_cooldown("warcry") && !is_disabled(character) && character.mp > 320) {
			await use_skill("warcry")
				.catch(
					(reason) => game_log(`War Cry failed: ${reason.reason}`)
				);
			reduce_cooldown("warcry", Math.min(...parent.pings));
		}
	} catch (e) {
		game_log(`[warCryLoop] - ${e.name}: ${e.message}`);
	}

	setTimeout(warCryLoop, Math.max(1, ms_to_next_skill("warcry")));
}

function find_viable_targets() {
	let farmableMonsters = [...FARM_BOSSES, ...FARM_MONSTERS];
	// Filter entities by monster type, not having any targets and not blacklisted
	let monsters = Object.values(parent.entities).filter(
		(mob) => (mob.type === "monster") &&
				((!BLACKLIST_MONSTERS.includes(mob.mtype) && farmableMonsters.includes(mob.mtype)) ||
					parent.party_list.includes(mob.target))
	);

	if (monsters) {
		// Mark monsters as whitelisted or not, targeting party or monster is boss
		monsters.forEach(
			(mob) => {
				mob.targeting_party = parent.party_list.includes(mob.target) && mob.target !== character.name;
				mob.is_boss_target = FARM_BOSSES.includes(mob.mtype);
			}
		);

        // Use circle area
        if (farm_area) {
            monsters = monsters.filter(
                (mob) => distance(farm_area, mob) <= farm_area.d
            );
        }

		monsters.sort(
			function (current, next) {
				// If mob targeting our party member - prioritize it
				if (!is_solo && current.targeting_party && !next.targeting_party) {
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