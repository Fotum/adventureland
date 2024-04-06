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
        "staffofthedead",

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
        {name: "glolipop", level: 5, bank_tab: "items3"},
        {name: "oozingterror", level: 5, bank_tab: "items3"},
        {name: "harbringer", level: 5, bank_tab: "items3"},
        {name: "bataxe", level: 5, bank_tab: "items3"},
        {name: "xmace", level: 6, bank_tab: "items3"},

        // Armor
        {name: "hgloves", level: 5, bank_tab: "items3"},
        {name: "hboots", level: 5, bank_tab: "items3"},
        {name: "mcape", level: 6, bank_tab: "items3"},

        // Jewelry
        {name: "intamulet", level: 3, bank_tab: "items3"},
        {name: "stramulet", level: 3, bank_tab: "items3"},

        {name: "intearring", level: 3, bank_tab: "items3"},
        {name: "strearring", level: 3, bank_tab: "items3"},

        // Materials and keys
        {name: "cryptkey", bank_tab: "items0"},
        {name: "frozenkey", bank_tab: "items0"},
        {name: "seashell", bank_tab: "items0"},
        {name: "carrot", bank_tab: "items0"},
        {name: "bwing", bank_tab: "items0"},
        {name: "essenceoffrost", bank_tab: "items0"},
        {name: "essenceoffire", bank_tab: "items0"},
        {name: "lotusf", bank_tab: "items0"},

        {name: "funtoken", bank_tab: "items1"},
        {name: "smoke", bank_tab: "items1"},

        {name: "electronics", bank_tab: "items1"},

        {name: "offeringp", bank_tab: "items0"},
        {name: "offering", bank_tab: "items0"},

        {name: "vitscroll", bank_tab: "items0"},
        {name: "forscroll", bank_tab: "items0"},

        // Consumables
        {name: "hotchocolate", bank_tab: "items1"},
        {name: "pumpkinspice", bank_tab: "items1"}
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

    static shouldGoBank() {
        for (let invItem of character.items) {
            if (!invItem) continue;

            for (let storable of MerchantUtils.STORE_ITEMS) {
                if (invItem.name === storable.name && (invItem.level === storable.level || invItem.level > storable.level)) return true;
            }
        }

        return false;
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
    // AFK position logic
    #afk_position = FARM_AREAS.moles.merchant_position;
    #afk_positions = [];

    #actionCheckerLoopFlg = false;
    #actionExecutorLoopFlg = false;

    // Current action
    #current_task = null;

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
            Object.values(BOSS_INFO.field).forEach((bi) => bi.last_check = fieldBossInfo[bi.name]);
        }

        this.actionCheckerLoop();
        this.actionExecutorLoop();
        this.saveBossInfoLoop();
        this.checkScheduleLoop();
        this.checkBossesAroundLoop();

        this.resupplyMembersLoop();
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
        if (!this.#actionCheckerLoopFlg || character.rip) {
            setTimeout(this.actionCheckerLoop.bind(this), 1000);
            return;
        }

        // Check field bosses
        if (this.options.check_bosses && !character.action_queue.some((t) => t.name === "bcheck") && (!this.#boss_check || ts_msince(this.#boss_check) >= 3)) {
            this.pushCheckBossTask();
        }

        // Check cyberland
        if (this.options.check_cyberland && !character.action_queue.some((t) => t.name === "cyberland") && (!this.#cyberland_check || ts_msince(this.#cyberland_check) >= 5)) {
            this.pushCyberlandCheckActions();
        }

        // Store stuff to bank
        if (this.options.store_bank && !character.action_queue.some((t) => t.name === "bank") && (!this.#bank_check || ts_msince(this.#bank_check) >= 10)) {
            this.pushBankStoreActions();
        }

        // Check and push return to afk_position
        if (character.current_state === "afk" && character.action_queue.length === 0 && (character.map !== this.#afk_position.map || parent.simple_distance(character, this.#afk_position) > 100)) {
            game_log(`Pushing "return" task to queue`, LOG_COLORS.blue);

            let merchantReturnTask = new Task("return");
            merchantReturnTask.pushAction("change_state", null, "return");
            merchantReturnTask.pushAction("call", "window.moveTo", this.#afk_position);
            merchantReturnTask.pushAction("change_state", null, null);

            character.action_queue.push(merchantReturnTask);
        }

        // Set state to AFK
        if ((!character.current_state || character.current_state !== "afk") && character.action_queue.length === 0) {
            game_log(`Pushing "afk" task to queue`, LOG_COLORS.blue);

            let afkStateTask = new Task("afk");
            afkStateTask.pushAction("change_state", null, "afk");

            character.action_queue.push(afkStateTask);
        }

        setTimeout(this.actionCheckerLoop.bind(this), 1000);
    }

    async actionExecutorLoop() {
		if (!this.#actionExecutorLoopFlg || character.rip) {
			setTimeout(this.actionExecutorLoop.bind(this), 500);
			return;
		}

		// Execute from queue
		if (!this.#current_task && character.action_queue.length > 0) {
            this.#current_task = character.action_queue[0];
            try {
                while (!this.#current_task.isComplete()) {
                    try {
                        let action = this.#current_task.getCurrentAction();
                        game_log(`Executing "${action.type}" step`, LOG_COLORS.blue);
                        await this.executeActionStep(action);
                        game_log(`Finished "${action.type}" step`, LOG_COLORS.blue);
                    } catch (ex) {
                        console.error("actionExecutorLoop.action", ex);
                    } finally {
                        this.#current_task.actionComplete();
                    }
                }
            } catch (ex) {
                console.error("actionExecutorLoop", ex);
            } finally {
                character.action_queue.splice(0, 1);
                this.#current_task = null;
            }
		}

		setTimeout(this.actionExecutorLoop.bind(this), 100);
	}

    async executeActionStep(action) {
        let actionType = action.type;
        if (actionType === "change_state") {
            game_log(`Changing state to: ${action.arg}`, LOG_COLORS.blue);
            character.current_state = action.arg;
            return set_message(action.arg);
        }

        if (actionType === "call") {
            let splitted = action.name.split(".");
            let context = splitted[0];
            let funcName = splitted[1];
            let arg = action.arg;

            game_log(`Calling ${action.name} function`, LOG_COLORS.blue);
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
    // async rotateAfkPositionLoop() {
    //     if (!this.options.resupply) {
    //         setTimeout(this.rotateAfkPositionLoop.bind(this), 30000);
    //         return;
    //     }

    //     try {
    //         let onlineOnServer = getOnlineCharacters();
    //         let currFarmAreas = new Set();
    //         for (let member of onlineOnServer) {
    //             let memberInfo = get(member);
    //             let merchant_position = memberInfo.farmOptions?.farm_area?.merchant_position;
    //             if (merchant_position) currFarmAreas.add(merchant_position);
    //         }

    //         let currFarmAreas = new Set(
    //             onlineOnServer.map((c) => get(c)?.farmOptions?.farm_area?.merchant_position)
    //                           .filter((a) => a)
    //         );


    //         if (this.#afk_positions.length !== currFarmAreas.length || this.#afk_positions.some((p) => !currFarmAreas.has(p.name)))
    //             const newPositions = [];
    //             currFarmAreas.forEach(function(area) {

    //                 newPositions.push();
    //             });

    //             this.#afk_areas = currFarmAreas;
    //             shuffle(this.#afk_areas);
    //         }

    //         if (this.#afk_position_list.length > 1) {
    //             let areaName = this.#afk_areas.shift();

    //             let afkPosition = FARM_AREAS[areaName].merchant_position;
    //             if (!afkPosition) this.#afk_position = afkPosition;

    //             this.#afk_areas.push(areaName);
    //         }
    //     } catch (ex) {
    //         console.error(ex);
    //         this.#afk_position = FARM_AREAS.event.merchant_position;
    //     }

    //     setTimeout(this.rotateAfkPositionLoop.bind(this), 300000);
    // }

    async resupplyMembersLoop() {
        if (!this.options.resupply || character.rip) {
            setTimeout(this.resupplyMembersLoop.bind(this), 30000);
            return;
        }

        try {
            let onlineOnServer = getOnlineCharacters();
            onlineOnServer.push(character.name);

            let member_info = onlineOnServer
                .map((n) => get(n))
                .filter((m) => m && !m.rip && !["goobrawl"].includes(m.map));

            let potionsMin = this.options.resupply?.potions_minimum;
            for (let member of member_info) {
                let needSupply = (member.hpPots <= potionsMin || member.mpPots <= potionsMin)
                              && character.map === member.map
                              && parent.simple_distance(character, member) <= 350;

                if (!needSupply) continue;

                let hpPotsType = this.options.resupply?.hp_pots_type;
                let mpPotsType = this.options.resupply?.mp_pots_type;

                let myHpPots = num_items((i) => i && i.name === hpPotsType);
                let myMpPots = num_items((i) => i && i.name === mpPotsType);

                let hpPotsNeed = this.options.resupply?.potions_needed - member.hpPots || 0;
                let mpPotsNeed = this.options.resupply?.potions_needed - member.mpPots || 0;

                let hpPotsToBuy = hpPotsNeed - (myHpPots - this.options.resupply?.potions_needed) || 0;
                let mpPotsToBuy = mpPotsNeed - (myMpPots - this.options.resupply?.potions_needed) || 0;
                if (character.name === member.name) {
                    hpPotsToBuy = hpPotsNeed;
                    mpPotsToBuy = mpPotsNeed;
                }

                if (hpPotsNeed > 0) {
                    if (hpPotsToBuy > 0) await MerchantUtils.buy_potions(hpPotsType, hpPotsToBuy);

                    if (character.name !== member.name) {
                        game_log(`Passing ${hpPotsNeed} ${hpPotsType} to ${member.name}`, LOG_COLORS.blue);
                        await this.sendPotionsToMember(hpPotsType, member.name, hpPotsNeed);
                    }
                }

                if (mpPotsNeed > 0) {
                    if (mpPotsToBuy > 0) await MerchantUtils.buy_potions(mpPotsType, mpPotsToBuy);

                    if (character.name !== member.name) {
                        game_log(`Passing ${mpPotsNeed} ${mpPotsType} to ${member.name}`, LOG_COLORS.blue);
                        await this.sendPotionsToMember(mpPotsType, member.name, mpPotsNeed);
                    }
                }
            }
        } catch (ex) {
            console.error("resupplyMembersLoop", ex);
        }

        setTimeout(this.resupplyMembersLoop.bind(this), 1000);
    }

    async sendPotionsToMember(potionType, memberName, totalAmount) {
        let potsIndex = locate_item(potionType);
        if (potsIndex < 0) {
            game_log(`Could not find potions "${potionType}" for member ${memberName}`, LOG_COLORS.red);
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
            let bossTimes = {};
            Object.values(BOSS_INFO.field).forEach((bi) => bossTimes[bi.name] = bi.last_check);
            set("boss_info", bossTimes);
        } catch (ex) {
            console.error("saveBossInfoLoop", ex);
        }

        setTimeout(this.saveBossInfoLoop.bind(this), 150000);
    }

    pushCheckBossTask() {
        let bossKeys = Object.keys(BOSS_INFO.field);
        let bossesToCheck = new Set();
        bossKeys.forEach(function(key) {
            let bossInfo = BOSS_INFO.field[key];

            if (bossInfo.is_active && (!bossInfo.last_check || ts_ssince(bossInfo.last_check) >= bossInfo.respawn)) {
                bossesToCheck.add(key);
            }
        });

        this.#boss_check = Date.now();
        if (bossesToCheck.length === 0) return;
        let route = BOSS_CHECK_ROUTE.filter((n) => bossesToCheck.has(n.name));

        game_log(`Pushing "bcheck task to queue"`, LOG_COLORS.blue);

        let bcheckTask = new Task("bcheck");

        bcheckTask.pushAction("change_state", null, "bcheck");
        for (let node of route) {
            bcheckTask.pushAction("call", "this.checkNode", node);
        }
        bcheckTask.pushAction("change_state", null, null);

        character.action_queue.push(bcheckTask);
    }

    async checkNode(node) {
        if (distance(character, node) > 150) {
            game_log(`Moving to ${node.name} on ${node.map} ${node.x} ${node.y}`, LOG_COLORS.blue);
            await smart_move(node);
            this.#boss_check = Date.now();
        }
    }

    // Check and notify about schedule bosses
    async checkScheduleLoop() {
        if (!this.options.check_bosses) {
            setTimeout(this.checkScheduleLoop.bind(this), 300000);
            return;
        }

        try {
            Object.keys(parent.S).forEach(function(key) {
                let gEvent = BOSS_INFO.global[key];
                if (gEvent && gEvent.is_active) {                   
                    let event = {
                        id: gEvent.id,
                        name: gEvent.name,
                        type: "global",
                        wait_resp: gEvent.wait_resp,
                        summon: gEvent.summon
                    }

                    if (gEvent.to) event.to = gEvent.to;
                    if (gEvent.map) event.map = gEvent.map;
                    if (gEvent.x) event.x = gEvent.x;
                    if (gEvent.y) event.y = gEvent.y;

                    notifyCharactersOfEvent(event, Object.keys(gEvent.characters));
                }
            });
        } catch (ex) {
            console.error("checkScheduleLoop", ex);
        }

        setTimeout(this.checkScheduleLoop.bind(this), 300000);
    }

    // Check and notify about bosses around character
    async checkBossesAroundLoop() {
        if (!this.options.check_bosses || character.rip) {
            setTimeout(this.checkBossesAroundLoop.bind(this), 30000);
            return;
        }

        let targetList = Object.keys(BOSS_INFO.field);
        let bossesAround = Object.values(parent.entities).filter((e) => e.type === "monster" && targetList.includes(e.mtype));
        for (let bossEntity of bossesAround) {
            let bossInfo = BOSS_INFO.field[bossEntity.mtype];

            // Remove boss nodes from queue
            if (this.#current_task && this.#current_task.name === "bcheck") {
                let tasksActionList = this.#current_task.action_list;
                for (let i = 0; i < tasksActionList.length; i++) {
                    let queuedEvent = tasksActionList[i];
                    let queuedEventArg = queuedEvent.arg;
    
                    if (!queuedEventArg || queuedEventArg.name !== bossInfo.name) continue;
    
                    this.#current_task.removeAction(i);
                    i--;
                }
            }

            if (ts_ssince(bossInfo.last_check) >= 30) {
                game_log(`Found ${bossEntity.mtype} at map: ${character.map}, x: ${round(bossEntity.x)}, y: ${round(bossEntity.y)}`, LOG_COLORS.blue);
                // Update check time
                this.#boss_check = Date.now();
                bossInfo.last_check = Date.now();

                let event = {
                    id: bossEntity.id,
                    name: bossInfo.name,
                    type: "field",
                    wait_resp: false,
                    summon: true,
                    map: bossEntity.map,
                    x: round(bossEntity.x),
                    y: round(bossEntity.y)
                };

                notifyCharactersOfEvent(event, Object.keys(bossInfo.characters));
            }
        }

        setTimeout(this.checkBossesAroundLoop.bind(this), 3000);
    }

    // ------------------- CYBERLAND CHECKER SECTION -------------------- //
    pushCyberlandCheckActions() {
        game_log(`Pushing "cyberland check" task to queue`, LOG_COLORS.blue);

        let cyberlandTask = new Task("cyberland");
        cyberlandTask.pushAction("change_state", null, "cyberland");
        cyberlandTask.pushAction("call", "this.checkCyberlandCommand", null);
        cyberlandTask.pushAction("change_state", null, null);

        character.action_queue.push(cyberlandTask);
    }

    async checkCyberlandCommand() {
        await smart_move("main");
        await smart_move("cyberland");
        // Wait for transport
        await sleep(500);

        this.#cyberland_check = Date.now();
        parent.socket.emit("eval", {command: "give spares"});
        while (character.map === "cyberland") {
            loot();
            await sleep(1000);
            leave();
            await sleep(1000);
        }
    }

    // ----------------------- BANK STORE SECTION ----------------------- //
    pushBankStoreActions() {
        if (!MerchantUtils.shouldGoBank()) return;

        this.#bank_check = Date.now();
        game_log(`Pushing "bank store" task to queue`, LOG_COLORS.blue);

        let bankStoreTask = new Task("bank");
        bankStoreTask.pushAction("change_state", null, "bank");
        bankStoreTask.pushAction("call", "window.smart_move", "bank");
        bankStoreTask.pushAction("call", "this.storeItemsToBankCommand", null);
        bankStoreTask.pushAction("change_state", null, null);

        character.action_queue.push(bankStoreTask);
    }

    async storeItemsToBankCommand() {
        if (character.map !== "bank") return;

        let itemsToStore = MerchantUtils.getItemsToStore();
        if (itemsToStore.length === 0) return;

        for (let toStore of itemsToStore) {
            await bank_store(toStore.inv_ix, toStore.bank_tab);
        }
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
    #restockScrollsLoopFlg = false;
    #sellBuyLoopFlg = false;

    constructor() {
        character.farm_options = {};

        this.regenLoop();
        // this.lootLoop();

        this.useSkillsLoop();
        this.upgradeLoop();
        this.compoundLoop();
        this.exchangeLoop();
        this.restockScrollsLoop();
        this.sellBuyLoop();
    }

    // Enables all loops
    enable() {
        this.#useSkillsFlag = true;
        this.#upgradeLoopFlg = true;
        this.#compoundLoopFlg = true;
        this.#exchangeLoopFlg = true;
        this.#restockScrollsLoopFlg = true;
        this.#sellBuyLoopFlg = true;
    }

    // Disables all loops
    disable() {
        this.#useSkillsFlag = false;
        this.#upgradeLoopFlg = false;
        this.#compoundLoopFlg = false;
        this.#exchangeLoopFlg = false;
        this.#restockScrollsLoopFlg = false;
        this.#sellBuyLoopFlg = false;
    }

    // ------------------------- SKILLS SECTION ------------------------- //
    async useSkillsLoop() {
        if (!this.#useSkillsFlag || character.rip) {
            setTimeout(this.useSkillsLoop.bind(this), 500);
            return;
        }

        try {
            await this.merchantSkills();
        } catch (ex) {
            console.log("useSkillsLoop", ex);
        }

        setTimeout(this.useSkillsLoop.bind(this), 500);
    }

    merchantSkills() {
        let allPromises = [];

        allPromises.push(this.buffPlayersAround());

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
        } catch (ex) {
            console.error("buffPlayersAroundLoop", ex);
        }
    }

    // ------------------------- UTILITY SECTION ------------------------ //
    async regenLoop() {
        try {
            // Don't heal if we're dead or using teleport to town
            if (!can_use("regen_hp") || character.rip || smart.curr_step?.town) {
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
        } catch (ex) {
            console.error("regenLoop", ex);
        }
    
        setTimeout(this.regenLoop.bind(this), Math.max(100, ms_to_next_skill("use_hp")));
    }

    async lootLoop() {
        try {
            loot();
        } catch (ex) {
            console.error("lootLoop", ex);
        }
        
        setTimeout(this.lootLoop.bind(this), 250);
    }

    async upgradeLoop() {
        if (!this.#upgradeLoopFlg || character.rip) {
            setTimeout(this.upgradeLoop.bind(this), 1000);
            return;
        }

        try {
            await upgradeItems();
        } catch (ex) {
            console.error("upgradeLoop", ex);
        }

        setTimeout(this.upgradeLoop.bind(this), 1000);
    }

    async compoundLoop() {
        if (!this.#compoundLoopFlg || character.rip) {
            setTimeout(this.compoundLoop.bind(this), 1000);
            return;
        }

        try {
            await compoundItems();
        } catch (ex) {
            console.error("compoundLoop", ex);
        }

        setTimeout(this.compoundLoop.bind(this), 1000);
    }

    async restockScrollsLoop() {
        if (!this.#restockScrollsLoopFlg || character.rip) {
            setTimeout(this.restockScrollsLoop.bind(this), 10000);
            return;
        }

        try {
            await restockScrolls();
        } catch (ex) {
            console.error("restockScrollsLoop", ex);
        }

        setTimeout(this.restockScrollsLoop.bind(this), 10000);
    }

    async exchangeLoop() {
        if (!this.#exchangeLoopFlg || character.map === "bank" || character.rip) {
            setTimeout(this.exchangeLoop.bind(this), 1000);
            return;
        }

        try {
            MerchantUtils.exchangeItems();
        } catch (ex) {
            console.error("exchangeLoop", ex);
        }

        setTimeout(this.exchangeLoop.bind(this), 1000);
    }

    async exchangeShellsLoop() {
        // Fisherman for shell exchange find_npc("fisherman")
    }
    
    // ------------------------ SELL & BUY SECTION ---------------------- //
    async sellBuyLoop() {
        if (!this.#sellBuyLoopFlg || character.rip) {
            setTimeout(this.sellBuyLoop.bind(this), 1000);
            return;
        }

        try {
            MerchantUtils.sellStuffFromList();
            MerchantUtils.buyFromPonty();
        } catch (ex) {
            console.error("sellBuyLoop", ex);
        }

        setTimeout(this.sellBuyLoop.bind(this), 1000);
    }
}