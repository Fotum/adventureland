const upgrade_items = [
	{item: "slimestaff", level: 8},

	{item: "iceskates", level: 5},
	{item: "xmaspants", level: 7},
	{item: "xmasshoes", level: 7},
	{item: "mittens", level: 6},
	{item: "xmashat", level: 6},
	{item: "sweaterhs", level: 5},
	{item: "cape", level: 4},

	// Rugged set
	{item: "helmet1", level: 6},
	{item: "coat1", level: 5},
	{item: "pants1", level: 5},
	{item: "gloves1", level: 6},
	{item: "shoes1", level: 6},

	// Rare items
	{item: "woodensword", level: 7},
	{item: "firestaff", level: 5},
	{item: "ornamentstaff", level: 5},
	{item: "basher", level: 5},
	{item: "merry", level: 5},
	{item: "candycanesword", level: 7}
];

const compound_items = [
	{item: "ringsj", level: 3},
	{item: "wbook0", level: 3},
	// Earrings
	{item: "strearring", level: 2},
	{item: "intearring", level: 2},
	// Amulets
	{item: "intamulet", level: 2},
	{item: "stramulet", level: 3},
	// Rings
	{item: "strring", level: 2},
	{item: "intring", level: 2}
];

const scrolls_amount = {
	"scroll0": 50,
	"scroll1": 30,
	"scroll2": 5,
	"cscroll0": 50,
	"cscroll1": 5,
	"cscroll2": 1
};

function upgradeItems() {
	if (character.q.upgrade || upgrade_state != 1 || do_enchant_items != 1) {
		return;
	}
	
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
		if (!scroll || scrollIx < 0) {
			let amount = scrolls_amount[scrollName];
			buyScrolls(scrollName, amount);
			continue;
		}
		
		let npc = find_npc("newupgrade");
		if (distance(character, npc) < 400) {
			use_skill("massproduction", character);

			upgrade(itemIx, scrollIx);
		}

		return;
	}
}

function compoundItems() {
	if (character.q.compound || upgrade_state != 1 || do_enchant_jewelry != 1)
		return;
	
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
		if (!scroll || scrollIx < 0) {
			let amount = scrolls_amount[scrollName];
			buyScrolls(scrollName, amount);
			continue;
		}
		
		let npc = find_npc("newupgrade");
		if (distance(character, npc) < 400) {
			use_skill("massproduction", character);
			compound(itemIxs[0], itemIxs[1], itemIxs[2], scrollIx);
		}

		return;
	}
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

function buyScrolls(type, amount) {
	if (amount <= 0) {
		return;
	}
	
	let scroll_merchant = get_npc("scrolls");
	if (scroll_merchant && character.esize > 0) {
		let item_def = parent.G.items[type];
		if (item_def !== null) {
			let cost = item_def.g * amount;
			if (character.gold >= cost) {
				buy(type, amount);
			} else {
				game_log("Not enough gold!");
			}
		}
	}
}

function get_npc(name) {
	let npc = parent.G.maps[character.map].npcs.filter(npc => npc.id === name);
	if (npc.length > 0) {
		return npc[0];
	}
	
	return null;
}