const DO_NOT_SEND = [
	{name: "firestaff", level: 9},
	{name: "orbg", level: 2},
	{name: "test_orb", level: 0}
];


character.on("cm", function(data) {
	if (data.name !== "Momental") return;
	controller.pushFarmBossActions(data.message);
});

var controller = undefined;
async function runCharacter() {
	// Initialize modules
	await initialize_character();

	// Restore state
	restoreCharacterState();

	// Send character info
	updateCharacterInfoLoop();

	// Character behaviour
	let currStrat = new MageBehaviour({
		is_solo: false,
		looter: "Nlami",
		farm_area: FARM_AREAS.cave_first,
		do_circle: true,
		use_burst: false,
		energize: true
	});

	// Character controller
	controller = new MageController({
		use_magiport: true
	}, currStrat);

	currStrat.enable();
	controller.enable();

	sendItemsToCharacterLoop("Momental");
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
	await load_module("mage_strats");
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