const UPGRADE_ITEMS = [
	{item: "staff", level: 8},
	{item: "slimestaff", level: 8},

	{item: "mittens", level: 6},
	{item: "cape", level: 5},
	{item: "sshield", level: 7},
	{item: "mshield", level: 5},
	{item: "basher", level: 6},
	{item: "wbreeches", level: 8},
	// Heavy set
	{item: "hhelmet", level: 5},
	{item: "harmor", level: 5},
	{item: "hpants", level: 5},
	{item: "hgloves", level: 5},
	{item: "hboots", level: 5},
	// Rare items
	// {item: "woodensword", level: 7},
	{item: "firestaff", level: 6},
	{item: "fireblade", level: 6},
	{item: "firebow", level: 6},

	{item: "harbringer", level: 5},
	{item: "oozingterror", level: 5},
	{item: "mshield", level: 5},
	{item: "t2quiver", level: 6},

	// Bunny stuff
	{item: "eears", level: 7},
	{item: "ecape", level: 7},
	{item: "epyjamas", level: 7},
	{item: "pinkie", level: 7},
	{item: "eslippers", level: 7},

	{item: "ornamentstaff", level: 8},
	{item: "pmace", level: 6},
	{item: "mcape", level: 6},
	{item: "wingedboots", level: 6},
	{item: "gcape", level: 6},
	{item: "lmace", level: 3},
	{item: "glolipop", level: 6},
	{item: "ololipop", level: 6},
	{item: "handofmidas", level: 5},
	{item: "bataxe", level: 5},
	{item: "frankypants", level: 3},
	// Weapon of the dead
	{item: "phelmet", level: 6},
	// {item: "pmaceofthedead", level: 6},
	// {item: "bowofthedead", level: 6}
];

const COMPOUND_ITEMS = [
	// {item: "ringsj", level: 4},
	// {item: "wbook0", level: 4},
	{item: "wbookhs", level: 3},
	// Earrings
	{item: "strearring", level: 3},
	{item: "intearring", level: 3},
	// Amulets
	{item: "intamulet", level: 4},
	{item: "stramulet", level: 4},
	{item: "skullamulet", level: 4},

	{item: "t2stramulet", level: 2},
	{item: "t2intamulet", level: 2},
	{item: "t2dexamulet", level: 2},

	// Rings
	{item: "strring", level: 4},
	{item: "intring", level: 4},
	// Belts
	{item: "strbelt", level: 3},
	{item: "intbelt", level: 3},
	// {item: "dexbelt", level: 3},
	// Orbs
	{item: "orbg", level: 3},
	{item: "lostearring", level: 2}
];

const SCROLLS_AMOUNT = {
	"scroll0": 50,
	"scroll1": 30,
	"scroll2": 10,
	"cscroll0": 50,
	"cscroll1": 30,
	"cscroll2": 0
};


async function upgradeItems() {
	try {
		if (!character.q.upgrade && character.map !== "bank") {
			// For each item in upgrade list
			for (let toUpgrade of UPGRADE_ITEMS) {
				let toUpgradeName = toUpgrade.item;
				let toUpgradeLevel = toUpgrade.level;

				// Upgrade item until desired level
				for (let wave = 0; wave < toUpgradeLevel; wave++) {
					// Get number of items in upgrade wave
					let numToUpgrade = num_items(
						(item) => item && item.name === toUpgradeName && item.level === wave
					);

					for (let i = 0; i < numToUpgrade; i++) {
						let [item, itemIx] = getItemAndIx(
							(it) => (it.name === toUpgradeName && it.level === wave)
						);

						if (!item || itemIx < 0) {
							continue;
						}

						let scrollName = "scroll" + getScrollNumForItem(item);
						let [scroll, scrollIx] = getItemAndIx(
							(sc) => (sc.name === scrollName)
						);

						if (!scroll || scrollIx < -1) {
							return;
							// let amount = SCROLLS_AMOUNT[scrollName];
							// await buyScrolls(scrollName, amount);
							// // Sleep for 500ms to wait for inventory update
							// await sleep(500);
							// [scroll, scrollIx] = getItemAndIx(
							// 	(sc) => (sc.name === scrollName)
							// );
						}

						game_log(`Upgrading: ${item.name}`, LOG_COLORS.blue);
						await use_skill("massproduction", character);
						if (G.skills.massproductionpp.mp <= character.mp)
							await use_skill("massproductionpp", character);

						await upgrade(itemIx, scrollIx)
							.catch(
								(reason) => game_log(`Upgrade failed: ${reason.reason}`)
							);
					}
				}
			}
		}
	} catch (ex) {
		console.error("upgradeItems", ex);
	}
}

async function compoundItems() {
	try {
		if (!character.q.compound && character.map !== "bank") {
			for (let toCompound of COMPOUND_ITEMS) {
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
					return;
					// let amount = SCROLLS_AMOUNT[scrollName];
					// await buyScrolls(scrollName, amount);
					// // Sleep for 1s to wait for inventory update
					// await sleep(500);
					// [scroll, scrollIx] = getItemAndIx(
					// 	(sc) => (sc.name === scrollName)
					// );
				}
				
				game_log(`Compounding: ${item.name}`, LOG_COLORS.blue);
				await use_skill("massproduction", character);
				if (G.skills.massproductionpp.mp <= character.mp)
					await use_skill("massproductionpp", character);

				await compound(itemIxs[0], itemIxs[1], itemIxs[2], scrollIx)
					.catch(
						(reason) => game_log(`Compound failed: ${reason.reason}`)
					);
			}
		}
	} catch (ex) {
		console.error("compoundItems", ex);
	}
}

async function restockScrolls() {
	try {
		if (character.map !== "bank") {
			for (let key in SCROLLS_AMOUNT) {
				let scrollsMax = SCROLLS_AMOUNT[key];
				let scrollsNow = num_items((i) => i && i.name === key);

				let diff = scrollsMax - scrollsNow;
				if (diff > 0) await buyScrolls(key, diff);
			}
		}
	} catch (ex) {
		console.error("restockScrolls", ex);
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

async function buyScrolls(type, amount) {
	if (amount <= 0) {
		return;
	}

	if (character.esize > 0) {
		let item_def = parent.G.items[type];
		if (item_def !== null) {
			let cost = item_def.g * amount;
			if (character.gold >= cost) {
				return buy(type, amount);
			} else {
				game_log("Not enough gold!");
			}
		}
	}

	return null;
}