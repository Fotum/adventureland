async function switchMode() {
	combat_mode = !combat_mode;

	if (combat_mode) {
		attackLoop();
		if (is_solo) {
			targetChooseSoloLoop();
		} else {
			targetChoosePartyLoop();
		}
		// manaBurstLoop()
		manaBurstOnBurnLoop();
		changeWeaponOnMpLoop();
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

async function manaBurstOnBurnLoop() {
	try {
		if (!combat_mode) {
			return;
		}

		const target = get_targeted_monster();
		if (target) {
			let targetStatus = target.s;
			let myBurn = false;
			if (targetStatus && targetStatus.burned) {
				myBurn = targetStatus.burned.f === character.name;
			}

			let mpRatio = character.mp / character.max_mp;
			if (myBurn && mpRatio > USE_BURST_AT_MP_RATIO && !is_on_cooldown("burst")) {
				await use_skill("burst", target);
				reduce_cooldown("burst", Math.min(...parent.pings));

				// Equip ornament staff right after burst
				let ornamentstaff = character.items[39];
				if (ornamentstaff && ornamentstaff.name === "ornamentstaff") {
					await equip(39);
				}
			}
		}
	} catch (e) {
		game_log(`[manaBurstOnBurnLoop] - ${e.name}: ${e.message}`);
	}

	setTimeout(manaBurstOnBurnLoop, Math.max(1, ms_to_next_skill("burst")));
}

// async function manaBurstLoop() {
// 	try {
// 		if (!combat_mode) {
// 			return;
// 		}

// 		// Use only with ornament staff
// 		let currEquippedMainWeapon = character.slots.mainhand;
// 		if (currEquippedMainWeapon && currEquippedMainWeapon.name === "ornamentstaff") {
// 			const target = get_targeted_monster();
// 			if (target) {
// 				let mpRatio = character.mp / character.max_mp;
// 				if (!is_on_cooldown("burst") && mpRatio > USE_BURST_AT_MP_RATIO) {
// 					await use_skill("burst", target);
// 					reduce_cooldown("burst", Math.min(...parent.pings));
// 				}
// 			}
// 		}
// 	} catch (e) {
// 		game_log(`[manaBurstLoop] - ${e.name}: ${e.message}`);
// 	}
	
// 	setTimeout(manaBurstLoop, Math.max(1, ms_to_next_skill("burst")));
// }

async function changeWeaponOnMpLoop() {
	try {
		if (!combat_mode) {
			return;
		}

		let currEquippedMainWeapon = character.slots.mainhand
		let weaponInInventory = character.items[39];

		if (currEquippedMainWeapon && weaponInInventory) {
			let currWeaponName = currEquippedMainWeapon.name;
			let invWeaponName = weaponInInventory.name;

			if (currWeaponName === "ornamentstaff" && character.mp > character.mp_cost) {
				await equip(39);
			} else if (currWeaponName === "firestaff" && character.mp < character.mp_cost) {
				await equip(39);
			}
		}
	} catch (e) {
		game_log(`[changeWeaponOnMpLoop] - ${e.name}: ${e.message}`);
	}

	setTimeout(changeWeaponOnMpLoop, 100);
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