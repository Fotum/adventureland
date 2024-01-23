const USE_HP_AT_RATIO = 0.75;
const USE_MP_AT_RATIO = 0.75;

const HP_POTIONS_TYPE = "hpot0";
const MP_POTIONS_TYPE = "mpot0";

const POTIONS_NEEDED = 5000;
const POTIONS_MINIMUM = 4500;

const SELL_LIST = [
	"xmassweater",
	"rednose",
	"warmscarf",

	"dexamulet",
	"vitamulet",
	"dexring",
	"vitring",
	"vitearring",
	"dexearring",
	"snowball",
	// "blade",
	// "staff",
	"hpbelt",
	"hpamulet",
	"cclaw",
	"iceskates",
	"hbow",
	"santasbelt",
	"candycanesword",
	"xmaspants",
	"wcap",
	"xmashat",
	"xmasshoes",
	"stinger",
	"xmace",
	"quiver",
	"sstinger",
	"merry",
	// "ringsj",
	"t2bow",

	// Rugged
	"helmet1",
	"coat1",
	"pants1",
	"gloves1",
	"shoes1"
];

const PONTY_BUY_LIST = [
    // Wanderer's set
    {item: "wattire", max_level: 4},
	{item: "wgloves", max_level: 4},
	// {item: "wcap", max_level: 4},
	// {item: "wshoes", max_level: 4},
    {item: "wbreeches", max_level: 4},
	// Rugged set,
	// {item: "helmet1", max_level: 4},
	// {item: "pants1", max_level: 4},
	// {item: "coat1", max_level: 4},
	// Heavy set
	// {item: "hhelmet", max_level: 2},
	{item: "harmor", max_level: 2},
	{item: "hpants", max_level: 2},
	// Rare items
	{item: "firestaff", max_level: 0},
	{item: "fireblade", max_level: 0},
	{item: "ololipop", max_level: 0},
	{item: "oozingterror", max_level: 0},
	{item: "mittens", max_level: 4},
	{item: "pmace", max_level: 4},
	{item: "lmace", max_level: 5}
	// Amulets
	// {item: "intamulet", level: 1},
	// {item: "stramulet", level: 1},
	// Rings
	// {item: "strring", level: 1},
	// {item: "intring", level: 1}
];

const EXCHANGE_ITEMS = [
	"weaponbox",
	"armorbox",
	"gem0",
	"greenenvelope",
	"goldenegg"
];

const NO_TELEPORT_MAPS = [
	"cave"
];

const AFK_POSITION = {
	x: -232,
	y: -136,
	map: "main"
};


var upgrade_state = true;
var do_enchant_items = true;
var do_enchant_jewelry = true;

// Load merchant routines
load_code("base_operations");
load_code("auto_enchant");
load_code("draw_ui");

// Send character info
updateCharacterInfoLoop();

// General operations
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
// Exchange items from Xyn
exchangeItemsLoop();

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
		resupply_members.sort(function (prev, next) {
			if (prev.map !== next.map) {
				return -1;
			}

			return 0;
		});

		if (resupply_members.length > 0) {
			useTownSwitch();
			await smart_move("potions")
				.then(() => buyPotionsToMembers(resupply_members)
			);
			
			for (let member of resupply_members) {
				if (member.name === character.name) {
					continue;
				}

				// Member is not in close vicinity
				while (distance(character, member) > 100) {
					// Member is not on our map
					if (member.map !== character.map) {
						useTownSwitch();
						await smart_move(member);
					}
					// Member is on our map, but not near
					else {
						await moveTo(member);
					}
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

			useTownSwitch();
			await smart_move(AFK_POSITION)
				.catch((e) => game_log(e.reason)
			);
		}
	} catch (e) {
		game_log(`[resupplyMembersLoop] - ${e.name}: ${e.message}`);
	} finally {
		upgrade_state = true;
	}

	setTimeout(resupplyMembersLoop, 60000);
}

async function exchangeItemsLoop() {
	let currentMap = G.maps[character.map];
	const exchangeLoc = Object.values(currentMap.npcs).find((n) => n?.id === "exchange");
	let itemsToExchange = getItemsToExchange();
	
	if (exchangeLoc && itemsToExchange.length > 0 && character.esize > 0 && !character.moving) {
		let exchangePosition = {
			x: exchangeLoc.position[0],
			y: exchangeLoc.position[1]
		};

		if (simple_distance(character, exchangePosition) > 400) {
			await moveTo(exchangePosition);
		}

		while (itemsToExchange.length > 0 && character.esize > 0 && simple_distance(character, exchangePosition) <= 400) {
			await exchangeItems(itemsToExchange);
			itemsToExchange = getItemsToExchange();
		}

		await moveTo(AFK_POSITION);
	} else {
		game_log("Could not exchange items, either location not found or no items to exchange");
	}

	setTimeout(exchangeItemsLoop, 90000);
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
	
	let member_info = party_members.map((nm) => get(nm)).filter((m) => m);

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
	let potInInventory = num_items((i) => i && i.name === potType);
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

function getItemsToExchange() {
	let result = [];
	for (let i = 0; i < character.items.length; i++) {
		let item = character.items[i];
		if (item?.name && EXCHANGE_ITEMS.includes(item?.name)) {
			result.push(
				{
					ix: i,
					nm: item.name,
					q: item.q
				}
			);
		}
	}

	return result;
}

async function exchangeItems(itemsList) {
	if (!itemsList?.length) {
		return;
	}

	while (itemsList.length > 0 && character.esize > 0) {
		let item = itemsList.pop();
		for (let j = 0; j < item.q && character.esize > 0; j++) {
			await exchange(item.ix);
		}
	}
}

function useTownSwitch() {
	smart.use_town = !NO_TELEPORT_MAPS.includes(character.map);
}