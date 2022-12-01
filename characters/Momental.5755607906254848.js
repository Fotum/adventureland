var upgrade_state = 1;
var do_enchant_items = 1;
var do_enchant_jewelry = 1;

const SELL_LIST = [
	"xmassweater",
	"rednose",
	"mcape",
	"wattire",
	"warmscarf",
	// Trash
	"beewings",
	"rattail",

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
	"wcap",
	"wgloves",
	"wshoes",
	"hpbelt",
	"hpamulet"
];

const PONTY_BUY_LIST = [
	// Rugged set
	{item: "shoes1", max_level: 4},
	{item: "gloves1", max_level: 4},
	{item: "helmet1", max_level: 4},
	// Rare items
	{item: "firestaff", max_level: 0},
	{item: "sweaterhs", max_level: 0},
	// Amulets
	{item: "intamulet", level: 1},
	{item: "stramulet", level: 1},
	// Rings
	{item: "strring", level: 1},
	{item: "intring", level: 1}
];

const HP_POTIONS_TYPE = "hpot0";
const MP_POTIONS_TYPE = "mpot0";

const POTIONS_NEEDED = 5000;
const POTIONS_MINIMUM = 500;

// Load merchant routines
load_code("base_operations");
load_code("auto_enchant");
load_code("draw_ui");

// Send character info
updateCharacterInfoLoop();

lootLoop();
regenLoop();

// Enchant gear from upgrade_items
setInterval(upgradeItems, 500);
// Enchant jewellery from compound_items
setInterval(compoundItems, 1000);
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
		upgrade_state = 0;

		let resupply_members = getMembersToResupply();
		if (resupply_members.length > 0) {
			await smart_move({to: "potions"})
				.then(() => {
					buyPotionsToMembers(resupply_members);
					return resupply_members;
				})
				.then(async (arg) => {
					let member = arg[0];
					await smart_move({map: member.map, x: member.x, y: member.y});

					return arg;
				})
				.then(async (arg) => {
					let member = arg[0];
					let memberEntity = parent.entities[member.name];
					if (memberEntity) {
						await smart_move(memberEntity.x, memberEntity.y);
					}

					return arg;
				})
				.then((arg) => sendPotionsToPartyMembers(arg))
				.then(() => smart_move({map: "main", x: -232, y:-136}))
				.catch(
					(reason) => game_log(`Rejected: ${reason.name}: ${reason.message}`)
				);
		}
	} catch (e) {
		game_log(`[resupplyMembersLoop] - ${e.name}: ${e.message}`);
	} finally {
		upgrade_state = 1;
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
		if (!item) {
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
		for (let item of secondhands) {
			let toBuy = PONTY_BUY_LIST.find(
				(i) => i.item === item.name && i.max_level >= item.level
			);
			let itemValue = calculate_item_value(item) * 2 * (item.q ?? 1);

			if (toBuy && (character.gold - itemValue) >= 0) {
				parent.socket.emit("sbuy", {rid: item.rid});
				game_log(`Bought item from Ponty: ${item.name} +${item.level} for ${itemValue}`);
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
	
	let resupply_members = [];
	for (let member_nm of party_members) {
		let member = get(member_nm);
		let memberHpPots = member.hpPots;
		let memberMpPots = member.mpPots;
		if (memberHpPots <= POTIONS_MINIMUM || memberMpPots <= POTIONS_MINIMUM) {
			let hpPotsToBuy = POTIONS_NEEDED - memberHpPots;
			let mpPotsToBuy = POTIONS_NEEDED - memberMpPots;
			
			if (hpPotsToBuy <= 0) {
				hpPotsToBuy = 0;
			}
			if (mpPotsToBuy <= 0) {
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

	let hpPotsInventory = num_items(HP_POTIONS_TYPE);
	let mpPotsInventory = num_items(MP_POTIONS_TYPE);

	let hpPotsToBuy = hpPotsNeeded - hpPotsInventory;
	let mpPotsToBuy = mpPotsNeeded - mpPotsInventory;

	if (hpPotsToBuy > 0) {
		buy_potions(HP_POTIONS_TYPE, hpPotsToBuy);
	}

	if (mpPotsToBuy > 0) {
		buy_potions(MP_POTIONS_TYPE, mpPotsToBuy);
	}
}

function buy_potions(type, amount) {
	if (character.esize == 0) {
		game_log("Inventory is full");
		return;
	}
	
	let item_def = parent.G.items[type];
	if (!item_def) {
		return;
	}

	let cost = item_def.g * amount;
	if (character.gold >= cost) {
		buy(type, amount);
	} else {
		game_log("Not enough gold!");
	}
}

async function sendPotionsToPartyMembers(resupply_members) {
	try {
		for (let member of resupply_members) {
			if (member.name === character.name) {
				continue;
			}

			const memberEntity = parent.entities[member.name];
			if (memberEntity && distance(character, memberEntity) < 400) {
				const hpPotsNeeded = member.hp_pots;
				const mpPotsNeeded = member.mp_pots;
				
				let hpPotsIx = locate_item(HP_POTIONS_TYPE);
				let mpPotsIx = locate_item(MP_POTIONS_TYPE);
				
				if (hpPotsIx >= 0 && hpPotsNeeded > 0) {
					await send_item(member.name, hpPotsIx, hpPotsNeeded);
				}

				if (mpPotsIx >= 0 && mpPotsNeeded > 0) {
					await send_item(member.name, mpPotsIx, mpPotsNeeded);
				}
			}
		}
	} catch (e) {
		game_log(`[sendPotionsToPartyMembers] - ${e.name}: ${e.message}`);
	}
}