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
	{name: "firestaff", level: 6},
	{name: "slimestaff", level: 7}
];

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
attackHealLoop();
targetChoosePartyLoop();
// targetChooseSoloLoop();
curseLoop();
partyHealLoop();

sendItemsToCharacterLoop("Momental");

// Invite members to party if they are lost
setInterval(create_party, 5000);

// function on_draw() {
//   if (DRAW_DEBUG) {
// 		clear_drawings();

// 		draw_circle(character.real_x, character.real_y, character.range);

// 		let target = get_target(character);
// 		if (target) {
// 			draw_line(character.real_x, character.real_y, target.x, target.y);
// 		}

// 		if (is_moving(character)) {
// 			draw_line(character.from_x, character.from_y, character.going_x, character.going_y, 1, 0x33FF42);
// 		}
// 	}

// 	for(let entity of Object.values(parent.entities)) {
// 		let entity_targ = get_target_of(entity);
// 		// if(entity_targ && entity_targ.name === character.name && entity.moving){
// 		if(entity) {
// 			draw_line(entity.from_x, entity.from_y, entity.going_x, entity.going_y, 1, 0xda0b04);
// 			draw_circle(entity.x, entity.y, entity.range, 1, 0xda0b04);
// 		}
// 	}
// }

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