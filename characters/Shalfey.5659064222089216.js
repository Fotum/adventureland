const DO_NOT_SEND = [
	{name: "orbg", level: 2},
	{name: "test_orb", level: 0},
	{name: "bataxe", level: 8},
	{name: "fireblade", level: 9},
	{name: "ololipop", level: 8}
];


character.on("cm", function(data) {
	if (data.name !== "MagicFotum" && data.name !== "Momental") return;
	controller.pushFarmBossActions(data.message);
});

character.on("death", function(data) {
	if (controller) {
		controller.strategy.disable();
		controller.disable();
	}
});

character.on("respawn", function(data) {
	controller.strategy.enable();
	controller.enable();
});

var controller = undefined;
async function runCharacter() {
	// Initialize modules
	await initialize_character();

	// Restore state
	restoreCharacterState();
	// Send character info
	updateCharacterInfoLoop();
	// Respawn if dead
    respawnLoop();

	// Character behaviour
	let currStrat = new WarriorBehaviour({
		is_solo: false,
		healer: "Nlami",
		looter: "Nlami",
		farm_area: FARM_AREAS.moles,
		do_circle: true,
		use_taunt: true,
		use_agitate: true,
		use_cleave: true,
		use_explosion: true
	});

	// Character controller
	controller = new WarriorController({}, currStrat);
	
	controller.enable();
	currStrat.enable();

	sendItemsToCharacterLoop("Momental");
}
runCharacter();

async function initialize_character() {
	// Pathfinding modules
	await load_module("graph_mover");
	await load_module("mover_module");

	// General functions
	await load_module("base_operations");
	await load_module("vector_movement");
	await load_module("event_task");

	// Class specific functions
	await load_module("warrior_strats");
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