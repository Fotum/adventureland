game.on("event", function (data) {
	if (!controller) return;

	let eventToNotify = EVENT_INFO.global[data.name];
	if (!eventToNotify || !eventToNotify.is_active) return;

	let onlineOnServer = getOnlineCharacters();
	notifyCharactersOfEvent(eventToNotify, onlineOnServer);
});


var controller = undefined;
async function runCharacter() {
	// Initialize modules
	await initialize_character();

	// Restore state
	restoreCharacterState();

	// Send character info
	updateCharacterInfoLoop();

	// Мемберы должны сами говорить какие им поты нужны
	// Character behaviour
	let currStrat = new MerchantBehaviour();

	// Character controller
	controller = new MerchantController({
		enchant_items: true,
		enchant_jewelry: true,
		check_bosses: true,
		check_cyberland: true,
		store_bank: true,
		resupply: {
			hp_pots_type: "hpot0",
			mp_pots_type: "mpot0",
			potions_needed: 5000,
			potions_minimum: 4500
		}
	}, currStrat);

	currStrat.enable();
	controller.enable();
}
runCharacter();

async function initialize_character() {
	// Pathfinding modules
	await load_module("graph_mover");
	await load_module("mover_module");

	// General functions
	await load_module("base_operations");
	// await load_module("events");
	// await load_module("draw_ui");

	// Class specific functions
	await load_module("auto_enchant");
	await load_module("merchant_strats");
}

async function load_module(module) {
	try {
		if (parent.caracAL) {
			await parent.caracAL.load_scripts([module]);
		} else {
			await load_code(module);
		}
	} catch (ex) {
		console.error(ex);
	}
}