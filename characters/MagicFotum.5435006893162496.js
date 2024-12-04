const DO_NOT_SEND = [
	{name: "firestaff", level: 9},
	{name: "orbg", level: 2},
	{name: "jacko", level: 2},
	{name: "pinkie", level: 8}
];


character.on("cm", function(data) {
	if (data.name !== "Momental") return;
	controller.pushFarmBossActions(data.message);
});

character.on("death", function(data) {
	if (controller) {
		controller.strategy.disable();
		controller.disable();
	}
});

character.on("respawn", () => {
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

	// Turn off town usage when smart moving
	smart.use_town = false;
	// Character behaviour
	let currStrat = new MageBehaviour(false, FARM_AREAS.bigbird);

	// Character controller
	controller = new MageController({
		do_quests: true
	}, currStrat);

	controller.enable();
	currStrat.enable();

	sendItemsToCharacterLoop("Momental");
}
runCharacter();

async function initialize_character() {
	// Constants
    await load_module("constants");

	// Pathfinding modules
	await load_module("graph_mover");
	await load_module("mover_module");

	// General functions
	await load_module("base_operations");
	await load_module("vector_movement");
	await load_module("event_task");

	// Class specific functions
	await load_module("character_controller");
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