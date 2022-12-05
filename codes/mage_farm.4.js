async function attackLoop() {
	try {
		if (attack_mode) {
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
		// Use only with ornament staff
		let currEquippedMainWeapon = character.slots.mainhand;
		if (currEquippedMainWeapon && currEquippedMainWeapon.name === "ornamentstaff") {
			const target = get_targeted_monster();
			if (target) {
				let mpRatio = character.mp / character.max_mp;
				if (!is_on_cooldown("burst") && mpRatio > USE_BURST_AT_MP_RATIO) {
					await use_skill("burst", target);
					reduce_cooldown("burst", Math.min(...parent.pings));
				}
			}
		}
	} catch (e) {
		game_log(`[manaBurstLoop] - ${e.name}: ${e.message}`);
	}
	
	setTimeout(manaBurstLoop, Math.max(1, ms_to_next_skill("burst")));
}

async function changeWeaponOnBurnLoop() {
	try {
		const target = get_targeted_monster();
		if (target) {
			let targetStatus = target.s;
			let myBurn = false;
			if (targetStatus && targetStatus.burned) {
				myBurn = targetStatus.burned.f === character.name;
				// myBurn = true;
			}

			let item = character.items[39];
			if (myBurn && item && item.name === "ornamentstaff") {
				await equip(39)
					.catch(
						(reason) => game_log(`Item equip failed: ${reason.reason}`)
					);
			} else if (!myBurn && item && item.name === "firestaff" && character.mp > character.mp_cost) {
				await equip(39)
					.catch(
						(reason) => game_log(`Item equip failed: ${reason.reason}`)
					);
			}
		}
	} catch (e) {
		game_log(`[changeWeaponOnBurnLoop] - ${e.name}: ${e.message}`);
	}

	setTimeout(changeWeaponOnBurnLoop, 100);
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