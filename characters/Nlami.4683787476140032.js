const USE_HP_AT_RATIO = 0.75;
const USE_MP_AT_RATIO = 0.75;

const USE_HEAL_AT_RATIO = 0.8;
const USE_MASS_HEAL_AT_RATIO = 0.5;

const FARM_BOSSES = [
	"mvampire",
	"fvampire",
	"phoenix",
	"snowman",
	"goldenbat",
	"cutebee",
	"grinch"
];
const FARM_MONSTERS = [
	"porcupine",
	"goo",
	"minimush",
	"rat",
	"stoneworm",
	"crab",
	"osnake",
	"bee",
	"rat"
];
const BLACKLIST_MONSTERS = ["plantoid"];

const DO_NOT_SEND = [
	{name: "firestaff", level: 8}
];

var is_solo = false;
var combat_mode = false;

// Load farming functions and loops
load_code("base_operations");
load_code("healer_farm");
load_code("draw_ui");

// Send character info
updateCharacterInfoLoop();

// General operations
moveLoop();
lootLoop();
regenLoop();

// Class dependent operations
switchMode();

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