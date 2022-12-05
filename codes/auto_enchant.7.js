const upgrade_items = [
	{item: "slimestaff", level: 8},

	// {item: "iceskates", level: 5},
	// {item: "xmaspants", level: 7},
	// {item: "xmasshoes", level: 7},
	{item: "mittens", level: 7},
	// {item: "xmashat", level: 7},
	{item: "sweaterhs", level: 6},
	{item: "cape", level: 5},
	// Rugged set
	{item: "helmet1", level: 7},
	{item: "coat1", level: 7},
	{item: "pants1", level: 7},
	{item: "gloves1", level: 7},
	{item: "shoes1", level: 7},
	// Wanderer set
	{item: "wattire", level: 7},
	{item: "wgloves", level: 7},
	{item: "wshoes", level: 7},
	{item: "wcap", level: 7},
	{item: "wbreeches", level: 7},
	// Rare items
	{item: "woodensword", level: 7},
	{item: "firestaff", level: 7},
	{item: "fireblade", level: 7},
	{item: "ornamentstaff", level: 7},
	{item: "basher", level: 5},
	// {item: "merry", level: 5},
	{item: "candycanesword", level: 7}
];

const compound_items = [
	{item: "ringsj", level: 4},
	{item: "wbook0", level: 4},
	// Earrings
	{item: "strearring", level: 2},
	{item: "intearring", level: 2},
	// Amulets
	{item: "intamulet", level: 3},
	{item: "stramulet", level: 3},
	// Rings
	{item: "strring", level: 3},
	{item: "intring", level: 3},
	// Orbs
	{item: "orbg", level: 2}
];

const scrolls_amount = {
	"scroll0": 50,
	"scroll1": 30,
	"scroll2": 5,
	"cscroll0": 50,
	"cscroll1": 5,
	"cscroll2": 1
};

async function upgradeItemsLoop() {
	try {
		if (!character.q.upgrade && upgrade_state && do_enchant_items) {
			for (let toUpgrade of upgrade_items) {
				let toUpgradeName = toUpgrade.item;
				let toUpgradeLevel = toUpgrade.level;
				
				let [item, itemIx] = getItemAndIx(
					(i) => (i.name === toUpgradeName && i.level < toUpgradeLevel)
				);
				if (!item || itemIx < 0) {
					continue;
				}
				
				let scrollName = "scroll" + getScrollNumForItem(item);		
				let [scroll, scrollIx] = getItemAndIx(
					(i) => (i.name === scrollName)
				);
				if (!scroll || scrollIx === -1) {
					let amount = scrolls_amount[scrollName];
					await buyScrolls(scrollName, amount);
				}
				
				let npc = find_npc("newupgrade");
				if (distance(character, npc) < 400 && locate_item(scrollName) > -1) {
					game_log(`Upgrading: ${item.name}`);
					await use_skill("massproduction", character);
					await upgrade(itemIx, scrollIx)
						.catch(
							(reason) => game_log(`Upgrade failed: ${reason.reason}`)
						);
				}
			}
		}
	} catch (e) {
		game_log(`[upgradeItemsLoop] - ${e.name}: ${e.message}`);
	}

	setTimeout(upgradeItemsLoop, 500);
}

async function compoundItemsLoop() {
	try {
		if (!character.q.compound && upgrade_state && do_enchant_jewelry) {
			for (let toCompound of compound_items) {
				let toCompoundName = toCompound.item;
				let toCompoundLevel = toCompound.level;
				
				let [item, itemIxs] = getItemAndIndexes(toCompoundName, 0, toCompoundLevel);
				if (!item || itemIxs.length < 3) {
					continue;
				}
				
				let scrollName = "cscroll" + getScrollNumForItem(item);
				let [scroll, scrollIx] = getItemAndIx(
					(i) => (i.name === scrollName)
				);
				if (!scroll || scrollIx === -1) {
					let amount = scrolls_amount[scrollName];
					await buyScrolls(scrollName, amount);
				}
				
				let npc = find_npc("newupgrade");
				if (distance(character, npc) < 400 && locate_item(scrollName) > -1) {
					game_log(`Compounding: ${item.name}`);
					await use_skill("massproduction", character);
					await compound(itemIxs[0], itemIxs[1], itemIxs[2], scrollIx)
						.catch(
							(reason) => game_log(`Compound failed: ${reason.reason}`)
						);
				}
			}
		}
	} catch (e) {
		game_log(`[compoundItemsLoop] - ${e.name}: ${e.message}`);
	}

	setTimeout(compoundItemsLoop, 500);
}

function getItemAndIndexes(trg_name, trg_level, trg_limit) {
	if (trg_level === trg_limit) {
		return [null, []];
	}

	let items_to_combine = [];
	for (let i = 0; i < character.items.length; i++) {
		let inv_item = character.items[i];
		if (inv_item && inv_item.name === trg_name && inv_item.level === trg_level) {
			items_to_combine.push(i);
		}
		
		if (items_to_combine.length === 3) {
			return [inv_item, items_to_combine];
		}
	}

	return getItemAndIndexes(trg_name, trg_level + 1, trg_limit);
}

function getItemAndIx(filter) {
	for (let i = 0; i < character.items.length; i++) {
		let invItem = character.items[i];
		if (invItem && filter(invItem)) {
			return [invItem, i]
		}
	}
	
	return [null, -1];
}

function getScrollNumForItem(item) {
	let grades = parent.G.items[item.name].grades;

	let scrollNum;
	if (item.level < grades[0]) {
		scrollNum = "0";
	} else if (item.level < grades[1]) {
		scrollNum = "1";
	} else {
		scrollNum = "2";
	}

	return scrollNum;
}

async function buyScrolls(type, amount) {
	if (amount <= 0) {
		return;
	}
	
	let scroll_merchant = get_npc("scrolls");
	if (scroll_merchant && character.esize > 0) {
		let item_def = parent.G.items[type];
		if (item_def !== null) {
			let cost = item_def.g * amount;
			if (character.gold >= cost) {
				return buy(type, amount);
			} else {
				game_log("Not enough gold!");
				return null;
			}
		}
	}

	return null;
}

function get_npc(name) {
	let npc = parent.G.maps[character.map].npcs.filter(npc => npc.id === name);
	if (npc.length > 0) {
		return npc[0];
	}
	
	return null;
}