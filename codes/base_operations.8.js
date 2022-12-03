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

async function moveLoop() {
	try {
		let target = get_target();
		if (target && !is_in_range(target, "attack")) {
			move(
                character.x + (target.x - character.x) / 4,
                character.y + (target.y - character.y) / 4
            )
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
		myInfo.targName = parent.ctarget ? parent.ctarget.name : null;
		myInfo.eSize = character.esize;
		myInfo.gold = character.gold.toLocaleString('ru-RU');
		myInfo.hpPots = num_items("hpot0");
		myInfo.mpPots = num_items("mpot0");

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
				if (["hpot0", "mpot0", "hpot1", "mpot1", "tracker", "computer"].includes(item.name)) continue;
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
function num_items(name) {
	return character.items.filter(item => item && item.name === name).reduce(function(a,b){ return a + (b["q"] || 1);}, 0);
}

function ms_to_next_skill(skill) {
	var next_skill = parent.next_skill[skill];
	if (!next_skill) {
		return 0;
    }
	
	var ms = parent.next_skill[skill].getTime() - Date.now();
	
	return ms < 0 ? 0 : ms;
}