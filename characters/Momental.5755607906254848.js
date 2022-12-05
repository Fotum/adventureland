const USE_HP_AT_RATIO = 0.75;
const USE_MP_AT_RATIO = 0.75;

const HP_POTIONS_TYPE = "hpot0";
const MP_POTIONS_TYPE = "mpot0";

const POTIONS_NEEDED = 5000;
const POTIONS_MINIMUM = 4500;

const SELL_LIST = [
	"xmassweater",
	"rednose",
	"mcape",
	"warmscarf",
	// Trash
	"beewings",
	"rattail",
	"spores",

	"dexamulet",
	"vitamulet",
	"dexring",
	"vitring",
	"vitearring",
	"dexearring",
	"snowball",
	"blade",
	"staff",
	"shoes",
	"helmet",
	"pants",
	"gloves",
	"coat",
	"hpbelt",
	"hpamulet",
	"cclaw"
];

const PONTY_BUY_LIST = [
    // Wanderer's set
    {item: "wattire", max_level: 4},
	// {item: "wgloves", max_level: 0},
	//{item: "wcap", max_level: 4},
	{item: "wshoes", max_level: 4},
    {item: "wbreeches", max_level: 4},
	// Rugged set
	// {item: "shoes1", max_level: 4},
	// {item: "gloves1", max_level: 4},
	// {item: "helmet1", max_level: 4},
	// {item: "pants1", max_level: 4},
	// Rare items
	{item: "firestaff", max_level: 0},
	{item: "fireblade", max_level: 0},
	//{item: "sweaterhs", max_level: 0},
	{item: "ololipop", max_level: 0}
	// Amulets
	// {item: "intamulet", level: 1},
	// {item: "stramulet", level: 1},
	// Rings
	// {item: "strring", level: 1},
	// {item: "intring", level: 1}
];


var upgrade_state = true;
var do_enchant_items = true;
var do_enchant_jewelry = true;

// Load merchant routines
load_code("base_operations");
load_code("auto_enchant");
load_code("draw_ui");
load_code("mover_module");

// Send character info
updateCharacterInfoLoop();

lootLoop();
regenLoop();

// Enchant gear from upgrade_items
upgradeItemsLoop();
// Enchant jewellery from compound_items
compoundItemsLoop();
// Sell useless stuff
setInterval(sellStuffFromList, 10000);
// Buy items from Ponty
setInterval(buyFromPonty, 60000);

// Buff everyone with luck
buffPlayersAroundLoop();
// Do resupply runs
resupplyMembersLoop();

async function buffPlayersAroundLoop() {
	try {
		let playerToBuff = Object.values(parent.entities)
			.filter(
				(ent) => (ent.type === "character" && !ent.s.mluck)
			)[0];
			
		if (playerToBuff && !is_on_cooldown("mluck") && is_in_range(playerToBuff, "mluck") && character.mp > 10) {
			await use_skill("mluck", playerToBuff)
					.then(reduce_cooldown("mluck", Math.min(...parent.pings)))
					.catch(
						(reason) => game_log(`Mluck failed: ${reason.reason}`)
					);
		}
	} catch (e) {
		game_log(`[buffPlayersAroundLoop] - ${e.name}: ${e.message}`);
	}

	setTimeout(buffPlayersAroundLoop, Math.max(100, ms_to_next_skill("mluck")));
}

async function resupplyMembersLoop() {
	try {
		upgrade_state = false;

		let resupply_members = getMembersToResupply();
		if (resupply_members.length > 0) {
			await Mover.move("potions")
				.then(() => buyPotionsToMembers(resupply_members)
			);
			
			for (let member of resupply_members) {
				if (member.name === character.name) {
					continue;
				}

				let memberEntity = parent.entities[member.name];
				// Member is not on our map or in close vicinity
				if (!memberEntity) {
					await Mover.move(member.x, member.y, member.map);
				}

				memberEntity = parent.entities[member.name];
				if (memberEntity) {
					if (distance(character, memberEntity) > 100) {
						await Mover.moveX(memberEntity.x, memberEntity.y);
					}

					let hpPotsNeeded = member.hp_pots;
					let mpPotsNeeded = member.mp_pots;
					
					let hpPotsIx = locate_item(HP_POTIONS_TYPE);
					let mpPotsIx = locate_item(MP_POTIONS_TYPE);

					if (hpPotsIx > -1 && hpPotsNeeded > 0) {
						sendPotionsToMember(HP_POTIONS_TYPE, member.name, hpPotsNeeded);
					}
	
					if (mpPotsIx > -1 && mpPotsNeeded > 0) {
						sendPotionsToMember(MP_POTIONS_TYPE, member.name, mpPotsNeeded);
					}
				}
			}

			await Mover.move(-232, -136, "main");
		}
	} catch (e) {
		game_log(`[resupplyMembersLoop] - ${e.name}: ${e.message}`);
	} finally {
		upgrade_state = true;
	}

	setTimeout(resupplyMembersLoop, 60000);
}

function sellStuffFromList() {
	if (SELL_LIST.length === 0) {
		return;
	}
	
	let npc = find_npc("basics");
	if (distance(character, npc) > 400) {
		return;
	}
	
	for (let i = 0; i < character.items.length; i++) {
		let item = character.items[i];
		if (!item || item.level > 0) {
			continue;
		}
		
		if (SELL_LIST.includes(item.name)) {
			sell(i, 9999);
		}
	}
}

function buyFromPonty() {
	let ponty = find_npc("secondhands");
	if (distance(character, ponty) > 500 || character.gold < 500000) {
		return;
	}

	parent.socket.once("secondhands", function (secondhands) {
		for (let pontyItem of secondhands) {
			let toBuy = PONTY_BUY_LIST.find(
				(i) => i.item === pontyItem.name && i.max_level >= pontyItem.level
			);
			let itemValue = calculate_item_value(pontyItem) * 2 * (pontyItem.q ?? 1);

			if (toBuy && character.esize > 0 && (character.gold - itemValue) >= 0) {
				parent.socket.emit("sbuy", {rid: pontyItem.rid});
				game_log(`Bought item from Ponty: ${pontyItem.name} +${pontyItem.level} for ${itemValue}`);
			}
		}
	});

	parent.socket.emit("secondhands");
}

function getMembersToResupply() {
	let party_members = parent.party_list;
	if (!party_members || party_members.length === 0) {
		return [];
	}
	
	let member_info = party_members.map((nm) => get(nm));

	let someoneOverMinimum = member_info.find(
		(m) => m.name !== character.name && (m.hpPots < POTIONS_MINIMUM || m.mpPots < POTIONS_MINIMUM)
	);
	if (!someoneOverMinimum) {
		return [];
	}

	let resupply_members = [];
	for (let member of member_info) {
		let hpPotsToBuy = POTIONS_NEEDED - member.hpPots;
		let mpPotsToBuy = POTIONS_NEEDED - member.mpPots;

		if (hpPotsToBuy < 0) {
			hpPotsToBuy = 0;
		}
		if (mpPotsToBuy < 0) {
			mpPotsToBuy = 0;
		}

		resupply_members.push(
			{
				name: member.name,
				map: member.map,
				x: member.x,
				y: member.y,
				hp_pots: hpPotsToBuy,
				mp_pots: mpPotsToBuy
			}
		);
	}
	
	return resupply_members;
}

function buyPotionsToMembers(resupply_members) {
	let hpPotsNeeded = 0;
	let mpPotsNeeded = 0;
	for (let member of resupply_members) {
		hpPotsNeeded += member.hp_pots;
		mpPotsNeeded += member.mp_pots;
	}

	let hpPotsToBuy = hpPotsNeeded - adjustPotionsToBuy(HP_POTIONS_TYPE);
	let mpPotsToBuy = mpPotsNeeded - adjustPotionsToBuy(MP_POTIONS_TYPE);

	if (hpPotsToBuy > 0) {
		buy_potions(HP_POTIONS_TYPE, hpPotsToBuy);
	}

	if (mpPotsToBuy > 0) {
		buy_potions(MP_POTIONS_TYPE, mpPotsToBuy);
	}
}

function adjustPotionsToBuy(potType) {
	let potInInventory = num_items(potType);
	let numToAdjust = potInInventory - POTIONS_NEEDED;

	return (numToAdjust > 0) ? numToAdjust : 0;
}

async function buy_potions(type, amount) {
	try {
		if (character.esize === 0) {
			game_log("Inventory is full");
			return;
		}

		let item_def = parent.G.items[type];
		if (!item_def) {
			game_log(`Item with type ${type} could not be found`);
			return;
		}

		let cost = item_def.g * amount;
		if (character.gold < cost) {
			game_log("Not enough gold!");
		}

		if (amount > 9999) {
			let tmpTotal = amount - 9999;
			await buy_with_gold(type, 9999);

			while (character.esize !== 0 || tmpTotal > 0) {
				if (tmpTotal >= 9999) {
					tmpTotal -= 9999;
					await buy_with_gold(type, 9999);
				} else {
					await buy_with_gold(type, tmpTotal);
					tmpTotal = 0;
				}
			}
		} else {
			await buy_with_gold(type, amount);
		}
	} catch (e) {
		game_log(`[buy_potions] - ${e.name}: ${e.message}`);
	}
}

async function sendPotionsToMember(potionType, memberName, totalAmount) {
	try {
		let potsIndex = locate_item(potionType);
		if (potsIndex > -1) {
			let itemAmount = character.items[potsIndex].q;
			if (itemAmount >= totalAmount) {
				await send_item(memberName, potsIndex, totalAmount);
			} else {
				let tmpTotal = totalAmount - itemAmount;
				await send_item(memberName, potsIndex, itemAmount);

				let noMore = false;
				while (!noMore || tmpTotal > 0) {
					let tmpIndex = locate_item(potionType);
					if (tmpIndex > -1) {
						let newAmount = character.items[tmpIndex].q;
						tmpTotal -= newAmount;
						await send_item(memberName, tmpIndex, newAmount);
					} else {
						noMore = true;
					}
				}
			}
		}
	} catch (e) {
		game_log(`[sendPotionsToMember] - ${e.name}: ${e.message}`);
	}
}