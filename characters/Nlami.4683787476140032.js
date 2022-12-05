const USE_HP_AT_RATIO = 0.75;
const USE_MP_AT_RATIO = 0.75;

const USE_HEAL_AT_RATIO = 0.8;
const USE_MASS_HEAL_AT_RATIO = 0.5;

var DRAW_DEBUG = true;

const FARM_MONSTERS = [
	"porcupine",
	"goldenbat",
	"cutebee",
	"mvampire",
	"phoenix",
	"snowman",
	"armadillo",
	"grinch",
	"croc"
];

const DO_NOT_SEND = [
	{name: "firestaff", level: 7},
	{name: "slimestaff", level: 7}
];

var attack_mode = true;

// Load farming functions and loops
load_code("base_operations");
load_code("healer_farm");
load_code("draw_ui");
load_code("mover_module");

// Send character info
updateCharacterInfoLoop();

// General operations
moveLoop();
lootLoop();
regenLoop();

// Class dependent operations
attackHealLoop();
targetChoosePartyLoop();
// targetChooseSoloLoop();
curseLoop();
partyHealLoop();

sendItemsToCharacterLoop("Momental");

// Invite members to party if they are lost
setInterval(create_party, 5000);

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
		(c) => c.online > 0 && c.server === selfCharacter.server
	);

	for (let char of onlineOnServer) {
		if (!currPartyList.includes(char.name)) {
			send_party_invite(char.name)
		}
	}
}