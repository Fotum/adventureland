class MerchantUtils {
	static SELL_LIST = [
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
		"xmashat",
		"xmasshoes",
		"stinger",
		"xmace",
		"quiver",
		"sstinger",
		"merry",
		"ringsj",
		"t2bow",
		"firecrackers",
		"throwingstars",
		"sword",
		"rapier",
		"dagger",
		"basher",
		"pstem",
		"spear",
		"cupid",
		"swifty",
		"dexbelt",
		"shield",
		"whiteegg",
		"eslippers",
		"carrotsword",
		"spores",
		"smoke",
		// Temporary
		"wbook0",
	
		// Weapon of the dead
		"pmaceofthedead",
		"daggerofthedead",
		"bowofthedead",
		"swordofthedead",

		// Wanderer
		"wcap",
		"wgloves",
		"wattire",
		"wshoes",
	
		// Rugged
		"helmet1",
		"coat1",
		"pants1",
		"gloves1",
		"shoes1"
	];
	
	static PONTY_BUY_LIST = [
		// Wanderer's set
		// {item: "wattire", max_level: 4},
		// {item: "wgloves", max_level: 4},
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
		{item: "lmace", max_level: 3},
		{item: "frankypants", max_level: 3},
		// Amulets
		// {item: "intamulet", level: 1},
		// {item: "stramulet", level: 1},
		// Rings
		// {item: "strring", level: 1},
		// {item: "intring", level: 1}
		// Earrings
		{item: "intearring", max_level: 1},
		{item: "strearring", max_level: 1}
	];

	static EXCHANGE_ITEMS = [
		"weaponbox",
		"armorbox",
		"gem0",
		"greenenvelope",
		"goldenegg",
		"candycane",
		"mistletoe",
		"candy0",
		"candy1",
		"basketofeggs"
	];

	static STORE_ITEMS = [
		// Weapons
		{name: "fireblade", level: 6, bank_tab: "items3"},
		{name: "firestaff", level: 6, bank_tab: "items3"},
		{name: "ololipop", level: 5, bank_tab: "items3"},
		{name: "oozingterror", level: 0, bank_tab: "items3"},
		{name: "harbringer", level: 0, bank_tab: "items3"},
		{name: "bataxe", level: 5, bank_tab: "items3"},

		// Armor
		{name: "hgloves", level: 5, bank_tab: "items3"},

		// Materials and keys
		{name: "cryptkey", bank_tab: "items0"},

		{name: "offeringp", bank_tab: "items0"},
		{name: "offering", bank_tab: "items0"},

		{name: "vitscroll", bank_tab: "items0"},
		{name: "forscroll", bank_tab: "items0"}
	];

	static sellStuffFromList() {
		if (MerchantUtils.SELL_LIST.length === 0) return;
		
		for (let i = 0; i < character.items.length; i++) {
			let item = character.items[i];
			if (!item || item.level > 0) continue;

			if (MerchantUtils.SELL_LIST.includes(item.name)) sell(i, 9999);
		}
	}
	
	static buyFromPonty() {
		if (MerchantUtils.PONTY_BUY_LIST.length === 0) return;
		if (parent.simple_distance(character, find_npc("secondhands")) > 400 || character.gold < 500000) return;
	
		parent.socket.once("secondhands", function (secondhands) {
			for (let pontyItem of secondhands) {
				let toBuy = MerchantUtils.PONTY_BUY_LIST.find(
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

	static async exchangeItems() {
		if (character.q.exchange) return;

		let itemsToExchange = MerchantUtils.getItemsToExchange();
		if (itemsToExchange.length === 0 || character.esize === 0) return;

		while (itemsToExchange.length > 0 && character.esize > 0) {
			let item = itemsToExchange.pop();
			for (let i = 0; i < item.q && character.esize > 0; i++) {
				await exchange(item.ix);
			}

			itemsToExchange = MerchantUtils.getItemsToExchange();
		}
	}

	static getItemsToExchange() {
		let result = [];
		for (let i = 0; i < character.items.length; i++) {
			let item = character.items[i];
			if (item?.name && MerchantUtils.EXCHANGE_ITEMS.includes(item?.name)) {
				result.push({ix: i, q: item.q});
			}
		}
	
		return result;
	}

	static async buy_potions(type, amount) {
		if (!amount) throw new Error("[buy_potions] - amount parameter is undefined");
		if (!type) throw new Error("[buy_potions] - type parameter is undefined");

		if (amount <= 0) return;

		// if (character.esize === 0) throw new Error("Inventory is full");

		let item_def = parent.G.items[type];
		if (!item_def) throw new Error(`Item with type ${type} could not be found`);

		let cost = item_def.g * amount;
		if (character.gold < cost) throw new Error("Not enough gold!");

		if (amount > 9999) {
			let tmpTotal = amount;
			while (character.esize !== 0 && tmpTotal > 0) {
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
	}

	static getItemsToStore() {
		let itemsToStore = [];
		for (let i = 0; i < character.items.length; i++) {
			let item = character.items[i];
			if (!item) continue;

			for (let storable of MerchantUtils.STORE_ITEMS) {
				if (item.name === storable.name && (item.level === storable.level || item.level > storable.level)) {
					let itemInfo = G.items[item.name];
					itemsToStore.push({
						name: item.name,
						inv_ix: i,
						bank_tab: storable.bank_tab,
						max_stack: itemInfo.s || null,
						curr_stack: item.q || null
					});
				}
			}
		}

		return itemsToStore;
	}

	static findInBank(itemName, bankTabName, maxStack) {
		if (!maxStack) maxStack = Infinity;
		let bankTab = character.bank[bankTabName];

		let itemList = [];
		for (let i = 0; i < bankTab.length; i++) {
			let item = bankTab[i];
			if (!item) continue;

			if (item.name === itemName && item.q < maxStack) {
				itemList.push({ix: i, q: item.q});
			}
		}

		return itemList;
	}
}


class MerchantController {
	#AFK_POSITION = {
		x: 310,
		y: -899,
		map: "cave"
	};

	#actionCheckerLoopFlg = false;
	#actionExecutorLoopFlg = false;

	// Current action
	#current_action = undefined;

	// Last check timers
	#boss_check = null;
	#cyberland_check = null;
	#bank_check = null;

	constructor(options, strategy) {
		if (!character.action_queue) character.action_queue = [];

		this.options = options;
		this.strategy = strategy;

		let fieldBossInfo = get("boss_info");
		if (fieldBossInfo) {
			EVENT_INFO.field.forEach((b) => b.last_check = fieldBossInfo[b.target]);
		}

		this.actionCheckerLoop();
		this.actionExecutorLoop();
		this.saveBossInfoLoop();
		this.checkScheduleLoop();
	}

	enable() {
		this.#actionCheckerLoopFlg = true;
		this.#actionExecutorLoopFlg = true;
	}

	disable() {
		this.#actionCheckerLoopFlg = false;
		this.#actionExecutorLoopFlg = false;
	}

	// ----------------- ACTION QUEUE HANDLERS SECTION ------------------ //
	async actionCheckerLoop() {
		if (!this.#actionCheckerLoopFlg) {
			setTimeout(this.actionCheckerLoop.bind(this), 1000);
			return;
		}

		// Check and push resupply
		if (!character.action_queue.some((a) => a.task === "resupply")) {
			this.pushResupplyActions();
		}

		// Check field bosses
		if (this.options.check_bosses && !character.action_queue.some((a) => a.task === "bcheck") && (!this.#boss_check || ts_msince(this.#boss_check) >= 3)) {
			this.pushCheckBossAcions();
		}

		// Check cyberland
		if (this.options.check_cyberland && !character.action_queue.some((a) => a.task === "cyberland") && (!this.#cyberland_check || ts_msince(this.#cyberland_check) >= 5)) {
			this.pushCyberlandCheckActions();
		}

		// Store stuff to bank
		if (this.options.store_bank && !character.action_queue.some((a) => a.task === "bank") && (!this.#bank_check || ts_msince(this.#bank_check) >= 5)) {
			this.pushBankStoreActions();
		}

		// Check and push return to AFK_POSITION
		if (!character.current_state && !character.action_queue.some((a) => a.task === "return") && parent.simple_distance(character, this.#AFK_POSITION) > 100) {
			game_log(`Pushing "return" task to queue`, "#2b97ff");

			character.action_queue.push({
				task: "return",
				type: "change_state",
				arg: "return"
			});

			const afk_pos = this.#AFK_POSITION;
			character.action_queue.push({
				task: "return",
				type: "call",
				name: "window.moveTo",
				arg: afk_pos
			});

			character.action_queue.push({
				task: "return",
				type: "change_state",
				arg: undefined
			});
		}

		// Set state to AFK
		if ((!character.current_state || character.current_state !== "afk") && character.action_queue.length === 0) {
			character.action_queue.push({
				task: "afk",
				type: "change_state",
				arg: "afk"
			});
		}

		setTimeout(this.actionCheckerLoop.bind(this), 1000);
	}

	async actionExecutorLoop() {
		if (!this.#actionExecutorLoopFlg) {
			setTimeout(this.actionExecutorLoop.bind(this), 500);
			return;
		}

		// Execute from queue
		if (!this.#current_action && character.action_queue.length > 0) {
			let queued_action = character.action_queue[0];

			this.#current_action = queued_action;
			try {
				game_log(`Executing "${queued_action.type}" step`, "#2b97ff");
				await this.executeActionStep(queued_action);
				game_log(`Finished "${queued_action.type}" step`, "#2b97ff");
			} catch (ex) {
				game_log(`[${queued_action.action}] - ${ex.name}: ${ex.message}`, "#cf5b5b");
				console.error(ex);
			} finally {
				character.action_queue.splice(0, 1);
				this.#current_action = null;
			}
		}

		setTimeout(this.actionExecutorLoop.bind(this), 100);
	}

	async executeActionStep(action) {
		let actionType = action.type;
		if (actionType === "change_state") {
			game_log(`Changing state to: ${action.arg}`, "#2b97ff");
			character.current_state = action.arg;
			return set_message(action.arg);
		}

		if (actionType === "call") {
			let splitted = action.name.split(".");
			let context = splitted[0];
			let funcName = splitted[1];
			let arg = action.arg;

			game_log(`Calling ${action.name} function`, "#2b97ff");
			console.log("Function call: ", action.name, arg);
			if (context === "window") {
				if (arg) return window[funcName](action.arg);
				else return window[funcName]();
			}

			if (context === "this") {
				if (arg) return this[funcName](action.arg);
				else return this[funcName]();
			}
		}
	}

	// -------------------- RESUPPLY ROUTINE SECTION -------------------- //
	pushResupplyActions() {
		let resupply_members = this.getMembersToResupply();
		if (resupply_members.length === 0) return;

		game_log(`Pushing "resupply" task to queue`, "#2b97ff");
		character.action_queue.push({
			task: "resupply",
			type: "change_state",
			arg: "resupply"
		});

		character.action_queue.push({
			task: "resupply",
			type: "call",
			name: "this.buyPotionsToMembers",
			arg: resupply_members
		});

		for (let member of resupply_members) {
			if (member.name === character.name) continue;
			character.action_queue.push({
				task: "resupply",
				type: "call",
				name: "this.resupplyMember",
				arg: member
			});
		}

		character.action_queue.push({
			task: "resupply",
			type: "change_state",
			arg: null
		});
	}

	getMembersToResupply() {
		let onlineOnServer = getOnlineCharacters();
		onlineOnServer.push(character.name);
		let member_info = onlineOnServer
			.map((c) => get(c))
			.filter((m) => m && !["goobrawl"].includes(m.map));

		let potionsMin = this.options.resupply?.potions_minimum;
		let needToRun = member_info.some((m) => m.hpPots <= potionsMin || m.mpPots <= potionsMin);
		if (!needToRun) return [];

		let resupply_members = [];
		for (let member of member_info) {
			let hpPotsToBuy = (this.options.resupply?.potions_needed - member.hpPots) || 0;
			let mpPotsToBuy = (this.options.resupply?.potions_needed - member.mpPots) || 0;
	
			if (hpPotsToBuy > 0 || mpPotsToBuy > 0) {
				resupply_members.push({
						name: member.name,
						hp_pots: hpPotsToBuy,
						mp_pots: mpPotsToBuy
				});
			}
		}

		return resupply_members;
	}

	async buyPotionsToMembers(resupply_members) {
		const potsNeeded = this.options.resupply?.potions_needed;
		const hpPotsType = this.options.resupply?.hp_pots_type;
		const mpPotsType = this.options.resupply?.mp_pots_type;

		let currHpPots = num_items((i) => i && i.name === hpPotsType);
		let currMpPots = num_items((i) => i && i.name === mpPotsType);

		let hpPotsToBuy = potsNeeded - currHpPots;
		let mpPotsToBuy = potsNeeded - currMpPots;
		for (let member of resupply_members) {
			hpPotsToBuy += member.hp_pots;
			mpPotsToBuy += member.mp_pots;
		}

		return Promise.allSettled([
			MerchantUtils.buy_potions(hpPotsType, hpPotsToBuy),
			MerchantUtils.buy_potions(mpPotsType, mpPotsToBuy)
		]);
	}

	async resupplyMember(trgMember) {
		game_log(`Moving to resupply ${trgMember.name}`, "#2b97ff");

		let memberInfo = get(trgMember.name);
		let moveToPos = {map: memberInfo.map, x: memberInfo.x, y: memberInfo.y};
		while (moveToPos.map !== character.map || distance(character, moveToPos) > 300) {
			if (moveToPos.map !== character.map) {
				await smart_move(moveToPos.map);
			} else {
				memberInfo = get(trgMember.name);
				moveToPos = {map: memberInfo.map, x: memberInfo.x, y: memberInfo.y};

				if (moveToPos.map === character.map) await moveTo(moveToPos);
			}
		}

		if (trgMember.hp_pots > 0) await this.sendPotionsToMember(this.options.resupply?.hp_pots_type, trgMember.name, trgMember.hp_pots);
		if (trgMember.mp_pots > 0) await this.sendPotionsToMember(this.options.resupply?.mp_pots_type, trgMember.name, trgMember.mp_pots);
	}

	async sendPotionsToMember(potionType, memberName, totalAmount) {
		let potsIndex = locate_item(potionType);
		if (potsIndex < 0) {
			game_log(`Could not find potions "${potionType}" for member ${memberName}`, "#cf5b5b");
			return;
		}

		let itemAmount = character.items[potsIndex].q;
		if (itemAmount >= totalAmount) {
			await send_item(memberName, potsIndex, totalAmount);
		} else {
			let tmpTotal = totalAmount;
			let noMore = false;
			while (!noMore && tmpTotal > 0) {
				if (potsIndex >= 0) {
					// Currently have
					let newAmount = character.items[potsIndex].q;

					if (newAmount >= tmpTotal) newAmount = tmpTotal
					else tmpTotal -= newAmount;

					await send_item(memberName, potsIndex, newAmount);
					potsIndex = locate_item(potionType);
				} else {
					noMore = true;
				}
			}
		}
	}

	// ---------------------- BOSS CHECKER SECTION ---------------------- //
	async saveBossInfoLoop() {
		if (!this.options.check_bosses) {
			setTimeout(this.saveBossInfoLoop.bind(this), 150000);
			return;
		}

		try {
			let boss_info = {};
			let handled = new Set();
			for (let boss of EVENT_INFO.field) {
				if (!handled.has(boss.target)) {
					boss_info[boss.target] = boss.last_check;
					handled.add(boss.target);
				}
			}

            set("boss_info", boss_info);
        } catch (ex) {
            console.error(ex);
        }

        setTimeout(this.saveBossInfoLoop.bind(this), 150000);
	}

	pushCheckBossAcions() {
		let bossesToCheck = EVENT_INFO.field.filter((b) => b.is_active && (!b.last_check || ts_ssince(b.last_check) >= b.respawn));
		if (bossesToCheck.length === 0) return;

		game_log(`Pushing "bcheck task to queue"`, "#2b97ff");
		character.action_queue.push({
			task: "bcheck",
			type: "change_state",
			arg: "bcheck"
		});

		for (let event of bossesToCheck) {
			character.action_queue.push({
				task: "bcheck",
				type: "call",
				name: "this.checkFieldBoss",
				arg: event
			});
		}

		character.action_queue.push({
			task: "bcheck",
			type: "change_state",
			arg: undefined
		});
	}

	async checkFieldBoss(event) {
		if (distance(character, event) > 150) {
			game_log(`Moving to ${event.target} on ${event.map} ${event.x} ${event.y}`, "#2b97ff");
			await smart_move(event);
		}

		this.#boss_check = Date.now();
		let bossTargetNm = event.target;
		let bossEntity = Object.values(parent.entities).find((e) => e.mtype === bossTargetNm);

		if (!bossEntity) {
			game_log(`Could not find boss "${event.target} on ${event.map} ${event.x} ${event.y}", skipping`, "#2b97ff");
			return;
		}

		// Update respawn time for all events of the same type
		let eventsFromList = EVENT_INFO.field.filter((e) => e.target === event.target);
		for (let ev of eventsFromList) {
			ev.last_check = this.#boss_check;

			// Remove same boss checks from queue
			for (let i = 0; i < character.action_queue.length; i++) {
				let queuedEvent = character.action_queue[i];
				let queuedEventArg = queuedEvent.arg;

				if (queuedEvent.task !== "bcheck" || !queuedEventArg) continue;
				if (queuedEventArg.target !== event.target) continue;
				if (queuedEventArg.x === event.x && queuedEventArg.y === event.y && queuedEventArg.map === event.map) continue;

				game_log(`Removing unnecessary boss checks for ${event.target}`, "#2b97ff");
				character.action_queue.splice(i, 1);
				i--;
			}
		}

		let onServer = getOnlineCharacters();
		notifyCharactersOfEvent(event, onServer);
	}

	// Check and notify about schedule bosses
	async checkScheduleLoop() {
		if (!this.options.check_bosses) {
			setTimeout(this.checkScheduleLoop.bind(this), 300000);
			return;
		}

		try {
			let keys = Object.keys(parent.S);
			let onlineOnServer = getOnlineCharacters();

			for (let key of keys) {
				let gEvent = EVENT_INFO.global[key];
				if (gEvent && gEvent.is_active && (!gEvent.last_check || ts_msince(gEvent.last_check) >= 15)) {
					gEvent.last_check = Date.now();
					notifyCharactersOfEvent(gEvent, onlineOnServer);
				}
			}
		} catch (ex) {
			console.log(ex);
		}

		setTimeout(this.checkScheduleLoop.bind(this), 300000);
	}

	// ------------------- CYBERLAND CHECKER SECTION -------------------- //
	pushCyberlandCheckActions() {
		game_log(`Pushing "cyberland check task to queue"`, "#2b97ff");
		character.action_queue.push({
			task: "cyberland",
			type: "change_state",
			arg: "cyberland"
		});
		character.action_queue.push({
			task: "cyberland",
			type: "call",
			name: "this.checkCyberlandCommand",
			arg: null
		});
		character.action_queue.push({
			task: "cyberland",
			type: "change_state",
			arg: null
		});
	}

	async checkCyberlandCommand() {
		await smart_move("main");
		await smart_move("cyberland");
		// Wait for transport
		await sleep(500);

		this.#cyberland_check = Date.now();
		parent.socket.emit("eval", {command: "give spares"});
		while (character.map === "cyberland") {
			await sleep(500);
			leave();
		}
	}

	// ----------------------- BANK STORE SECTION ----------------------- //
	pushBankStoreActions() {
		let itemsToStore = MerchantUtils.getItemsToStore();
		if (itemsToStore.length === 0) return;

		game_log(`Pushing "bank store" task to queue`, "#2b97ff");
		character.action_queue.push({
			task: "bank",
			type: "change_state",
			arg: "bank"
		});
		character.action_queue.push({
			task: "bank",
			type: "call",
			name: "window.smart_move",
			arg: "bank"
		});
		character.action_queue.push({
			task: "bank",
			type: "call",
			name: "this.storeItemsToBankCommand",
			arg: itemsToStore
		});
		character.action_queue.push({
			task: "bank",
			type: "change_state",
			arg: null
		});
	}

	async storeItemsToBankCommand(itemsToStore) {
		if (character.map !== "bank") return;
		if (itemsToStore.length === 0) return;

		for (let toStore of itemsToStore) {
			await bank_store(toStore.inv_ix, toStore.bank_tab);
		}

		this.#bank_check = Date.now();
	}
}


class MerchantBehaviour {
	// Regen options
	#USE_HP_AT_RATIO = 0.75;
	#USE_MP_AT_RATIO = 0.75;

	// Loop flags
	#useSkillsFlag = false;
	#upgradeLoopFlg = false;
	#compoundLoopFlg = false;
	#exchangeLoopFlg = false;
	#sellBuyLoopFlg = false;

	constructor() {
		character.farm_options = {};

		this.regenLoop();
		// this.lootLoop();

		this.useSkillsLoop();
		this.upgradeLoop();
		this.compoundLoop();
		this.exchangeLoop();
		this.sellBuyLoop();
	}

	// Enables all loops
	enable() {
		this.#useSkillsFlag = true;
		this.#upgradeLoopFlg = true;
		this.#compoundLoopFlg = true;
		this.#exchangeLoopFlg = true;
		this.#sellBuyLoopFlg = true;
	}

	// Disables all loops
	disable() {
		this.#useSkillsFlag = false;
		this.#upgradeLoopFlg = false;
		this.#compoundLoopFlg = false;
		this.#exchangeLoopFlg = false;
		this.#sellBuyLoopFlg = false;
	}

	// ------------------------- SKILLS SECTION ------------------------- //
	async useSkillsLoop() {
        if (!this.#useSkillsFlag) {
			setTimeout(this.useSkillsLoop.bind(this), 500);
			return;
		}

        try {
            await this.merchantSkills();
        } catch (ex) {
            console.log(ex);
        }

        setTimeout(this.useSkillsLoop.bind(this), 500);
    }

	merchantSkills() {
        let allPromises = [];
        if (!character.rip) {
            allPromises.push(this.buffPlayersAround());
        }

        return Promise.allSettled(allPromises);
    }

	buffPlayersAround() {
		try {
			let task = async function() {
				let playersToBuff = Object.values(parent.entities)
					.filter(
						(ent) => (ent.type === "character" && ent.ctype !== "merchant" && (!ent.s.mluck || ent.s.mluck.f !== character.name))
					);

				for (let playerToBuff of playersToBuff) {
					if (!is_on_cooldown("mluck") && is_in_range(playerToBuff, "mluck") && character.mp > 10) {
						await use_skill("mluck", playerToBuff)
							.then(reduce_cooldown("mluck", Math.min(...parent.pings)));
					}
				}
			};

			return task();
		} catch (e) {
			game_log(`[buffPlayersAroundLoop] - ${e.name}: ${e.message}`);
		}
	}

	// ------------------------- UTILITY SECTION ------------------------ //
	async regenLoop() {
		try {
			// Don't heal if we're dead or using teleport to town
			if (!can_use("regen_hp") || character.rip || is_transporting(character)) {
				setTimeout(this.regenLoop.bind(this), Math.max(100, ms_to_next_skill("use_hp")));
				return;
			}
	
			const hpRatio = character.hp / character.max_hp;
			const mpRatio = character.mp / character.max_mp;
			const minPing = Math.min(...parent.pings);
			
			if ((hpRatio < mpRatio && hpRatio <= this.#USE_HP_AT_RATIO) || (hpRatio <= 0.55 && mpRatio >= character.mp_cost)) {
                // Let's regen hp
				let hpPot0 = locate_item("hpot0");
				let hpPot1 = locate_item("hpot1");
	
				if (hpPot1 !== -1) {
					await equip(hpPot1);
					reduce_cooldown("use_hp", minPing);
				} else if (hpPot0 !== -1) {
					await equip(hpPot0);
					reduce_cooldown("use_hp", minPing);
				} else {
					await use_skill("regen_hp");
					reduce_cooldown("regen_hp", minPing);
				}
            } else if (mpRatio <= this.#USE_MP_AT_RATIO) {
                // Let's regen mp
                let mpPot0 = locate_item("mpot0");
                let mpPot1 = locate_item("mpot1");

                if (mpPot1 !== -1) {
                    await equip(mpPot1);
                    reduce_cooldown("use_mp", minPing);
                } else if (mpPot0 !== -1) {
                    await equip(mpPot0);
                    reduce_cooldown("use_mp", minPing);
                } else {
                    await use_skill("regen_mp");
                    reduce_cooldown("regen_mp", minPing);
                }
            }
		} catch (e) {
			game_log(`${e.name}: ${e.message}`);
		}
	
		setTimeout(this.regenLoop.bind(this), Math.max(100, ms_to_next_skill("use_hp")));
	}

	async lootLoop() {
        try {
			loot();
        } catch (e) {
            game_log(`${e.name}: ${e.message}`);
        }
        
        setTimeout(this.lootLoop.bind(this), 250);
    }

	async upgradeLoop() {
		if (!this.#upgradeLoopFlg) {
			setTimeout(this.upgradeLoop.bind(this), 1000);
			return;
		}

		try {
            await upgradeItems();
        } catch (ex) {
            console.error(ex);
        }

        setTimeout(this.upgradeLoop.bind(this), 1000);
	}

	async compoundLoop() {
		if (!this.#compoundLoopFlg) {
			setTimeout(this.compoundLoop.bind(this), 1000);
			return;
		}

		try {
            await compoundItems();
        } catch (ex) {
            console.error(ex);
        }

        setTimeout(this.compoundLoop.bind(this), 1000);
	}

	async exchangeLoop() {
		if (!this.#exchangeLoopFlg) {
			setTimeout(this.exchangeLoop.bind(this), 1000);
			return;
		}

		try {
			MerchantUtils.exchangeItems();
		} catch (ex) {
			console.error(ex);
		}

		setTimeout(this.exchangeLoop.bind(this), 1000);
	}

	async exchangeShellsLoop() {
		// Fisherman for shell exchange find_npc("fisherman")
	}
	
	// ------------------------ SELL & BUY SECTION ---------------------- //
	async sellBuyLoop() {
		if (!this.#sellBuyLoopFlg) {
			setTimeout(this.sellBuyLoop.bind(this), 1000);
			return;
		}

		try {
			MerchantUtils.sellStuffFromList();
			MerchantUtils.buyFromPonty();
		} catch (ex) {
			console.error(ex);
		}

		setTimeout(this.sellBuyLoop.bind(this), 1000);
	}
}