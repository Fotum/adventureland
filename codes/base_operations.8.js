load_code("graph_mover");
load_code("mover_module");

var MAP_GRAPH = initializeGraphGlobal(character.map);
game.on("new_map", function () {
    MAP_GRAPH = initializeGraphGlobal(character.map);
});

// var respawning = false;
// character.on("death", function() {
// 	if (character.rip && !respawning) {
// 		respawning = true;

// 		const ripMap = character.map;
// 		const ripX = character.x;
// 		const ripY = character.y;

// 		setTimeout(function() {
// 			respawn();
// 			setTimeout(function() {
// 				respawning = false;
// 				Mover.move(ripX, ripY, ripMap);
// 			}, 5000)
// 		}, 20000);
// 	}
// });

// Accept party from one of these sources
function on_party_invite(name) {
	if (parent.party_list > 0) {
		return;
	}
	
	let party_members = ["Shalfey", "Nlami", "MagicFotum", "Momental"];
	if (party_members.includes(name)) {
		accept_party_invite(name);
	}
}

// Accept magiport from party MagicFotum
function on_magiport(name) {
	if (name !== "MagicFotum") {
		return;
	}

	accept_magiport(name);
}

var DO_MOVE_GRAPH = false;
async function moveByGraph(target) {
	try {
		if (DO_MOVE_GRAPH) {
			set_message("Graph moving");
			if (!target) {
				DO_MOVE_GRAPH = false;
				return;
			}

			let from = {x: character.real_x, y: character.real_y};
			let to = {x: target.x, y: target.y};
			let path = plotPathGlobal(from, to);

			for (let node of path) {
				if (DO_MOVE_GRAPH) {
					await move(node.x, node.y);
				}
			}
			DO_MOVE_GRAPH = false;
		}
	} catch (e) {
		game_log(`${e.name}: ${e.message}`);
	}
}

async function moveLoop() {
	try {
		let target = get_target();
		let isInRange = is_in_range(target, "attack");

		if (target && target.name !== character.name) {
			if (isInRange && DO_MOVE_GRAPH) {
				// No need to move, we are already in range
				DO_MOVE_GRAPH = false;
				move(character.real_x, character.real_y);
			} else if (!isInRange) {
				// We are not in range, so we have to move
				let canMoveTo = can_move_to(target);
				// If we cant move straight then move by graph
				if (!canMoveTo && !DO_MOVE_GRAPH) {
					DO_MOVE_GRAPH = true;
					moveByGraph(target);
				} else if (canMoveTo) {
					// If we can move straight then turn off graph moving
					DO_MOVE_GRAPH = false;
					if (!isInRange) {
						set_message("Normal moving");
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
	
	setTimeout(moveLoop, 250);
}

async function lootLoop() {
    try {
        loot();
    } catch (e) {
        game_log(`${e.name}: ${e.message}`);
    }
	
    setTimeout(lootLoop, 250);
}

async function regenLoop() {
    try {
        const hpRatio = character.hp / character.max_hp
        const mpRatio = character.mp / character.max_mp
        const minPing = Math.min(...parent.pings)

        if (character.rip) {
            // Don't heal if we're dead
            setTimeout(regenLoop, Math.max(100, ms_to_next_skill("use_hp")))
            return
        }
		
        if (mpRatio < hpRatio && can_use("regen_hp")) {
			// Let's regen mp
			let mpPot0 = locate_item("mpot0");
			let mpPot1 = locate_item("mpot1");

			if (mpPot1 !== -1 && mpRatio < USE_MP_AT_RATIO) {
				await equip(mpPot1);
				reduce_cooldown("use_mp", minPing);
			} else if (mpPot0 !== -1 && mpRatio < USE_MP_AT_RATIO) {
				await equip(mpPot0);
				reduce_cooldown("use_mp", minPing);
			} else if (mpRatio < USE_MP_AT_RATIO) {
				await use_skill("regen_mp");
				reduce_cooldown("regen_mp", minPing);
			}
		} else if (can_use("regen_hp")) {
			// Let's regen hp
			let hpPot0 = locate_item("hpot0");
			let hpPot1 = locate_item("hpot1");

			if (hpPot1 !== -1 && hpRatio < USE_HP_AT_RATIO) {
				await equip(hpPot1);
				reduce_cooldown("use_hp", minPing);
			} else if (hpPot0 !== -1 && hpRatio < USE_HP_AT_RATIO) {
				await equip(hpPot0);
				reduce_cooldown("use_hp", minPing);
			} else if (hpRatio < USE_HP_AT_RATIO) {
				await use_skill("regen_hp");
				reduce_cooldown("regen_hp", minPing);
			}
		}
    } catch (e) {
        game_log(`${e.name}: ${e.message}`);
    }

    setTimeout(regenLoop, Math.max(100, ms_to_next_skill("use_hp")));
}

async function updateCharacterInfoLoop() {
	try {
		let myInfo = Object.fromEntries(Object.entries(character)
			.filter(
				(current) => character.read_only.indexOf(current[0]) !== -1
			)
		);
		myInfo.name = character.name;
		myInfo.cc = character.cc;
		myInfo.eSize = character.esize;
		myInfo.gold = character.gold.toLocaleString('ru-RU');
		myInfo.hpPots = num_items((i) => i && i.name === "hpot0");
		myInfo.mpPots = num_items((i) => i && i.name === "mpot0");

		set(character.name, myInfo);
	} catch (e) {
		game_log(`${e.name}: ${e.message}`);
	}

	setTimeout(updateCharacterInfoLoop, 100);
}

async function sendItemsToCharacterLoop(name) {
	try {
		const friendSendTo = get(name);
		const sendTo = parent.entities[name];
		
		if (sendTo && distance(character, sendTo) < 400) {
			for (let i = 0; i < character.items.length; i++) {
				let item = character.items[i];
				if (!item) continue;
				if (item.l) continue;
				if (["hpot0", "mpot0", "hpot1", "mpot1", "tracker", "computer", "elixirluck"].includes(item.name)) continue;
				if (DO_NOT_SEND.find((i) => i.name === item.name && i.level === item.level)) continue;
				
				if (friendSendTo) {
					if (friendSendTo.eSize === 0) continue;
				}

				await send_item(name, i, item.q ?? 1);
			}
			
			if (character.gold > 100000 * 2) {
				await send_gold(sendTo, character.gold - 100000);
			}
		}
	} catch (e) {
		game_log(`${e.name}: ${e.message}`);
	}
	
	setTimeout(async () => { sendItemsToCharacterLoop(name) }, 1000);
}

//Returns the number of items in your inventory for a given item name;
function num_items(filtCondition) {
	return character.items
		.filter(filtCondition)
		.reduce(function(a, b) {
			return a + (b["q"] || 1);
		}, 0);
}

function ms_to_next_skill(skill) {
	var next_skill = parent.next_skill[skill];
	if (!next_skill) {
		return 0;
    }
	
	var ms = parent.next_skill[skill].getTime() - Date.now();
	
	return ms < 0 ? 0 : ms;
}

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}