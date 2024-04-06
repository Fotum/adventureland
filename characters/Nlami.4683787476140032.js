const DO_NOT_SEND = [
	{name: "lmace", level: 7},
	{name: "orbg", level: 2},
	{name: "wbookhs", level: 2},
	{name: "wbook0", level: 4},
	{name: "handofmidas", level: 6},
	{name: "wgloves", level: 9},
	{name: "jacko", level: 2}
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
	let currStrat = new HealerBehaviour({
		is_solo: false,
		looter: "Nlami",
		farm_area: FARM_AREAS.moles,
		use_curse: false,
		use_mass_heal: true
	});

	// Character controller
	controller = new HealerController({}, currStrat);

	controller.enable();
	currStrat.enable();

	sendItemsToCharacterLoop("Momental");
}
runCharacter();

// Invite members to party if they are lost
setInterval(create_party, 1000);
function create_party() {
	let currPartyList = parent.party_list;
	if (currPartyList >= 4) {
		return;
	}

	const myCharacters = get_characters();
	let selfCharacter = myCharacters.find(
		(c) => c.name === character.name
	);

	if (!selfCharacter) {
		return;
	}

	let onlineOnServer = myCharacters.filter(
		(c) => c.name !== character.name && c.online > 0 && c.server === selfCharacter.server
	);

	for (let char of onlineOnServer) {
		if (!currPartyList.includes(char.name)) {
			send_party_invite(char.name);
		}
	}
}

async function initialize_character() {
	// Pathfinding modules
	await load_module("graph_mover");
	await load_module("mover_module");

	// General functions
	await load_module("base_operations");
	await load_module("vector_movement");
	await load_module("event_task");

	// Class specific functions
	await load_module("healer_strats");
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