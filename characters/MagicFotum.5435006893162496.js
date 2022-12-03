const USE_HP_AT_RATIO = 0.75;
const USE_MP_AT_RATIO = 0.8;

const USE_BURST_AT_MP_RATIO = 0.7;

const FARM_MONSTERS = [
	"porcupine",
	"goldenbat",
	"cutebee",
	"mvampire",
	"phoenix",
	"snowman",
	"grinch",
	"armadillo",
	"minimush"
];

const DO_NOT_SEND = [
	{name: "firestaff", level: 6},
	{name: "ornamentstaff", level: 7}
];

// Load farming functions and loops
load_code("base_operations");
load_code("mage_farm");
load_code("draw_ui");

// Send character info
updateCharacterInfoLoop();

// General operations
moveLoop();
lootLoop();
regenLoop();

// Class dependent operations
attackLoop();
targetChoosePartyLoop();
// targetChooseSoloLoop();
manaBurstLoop()
changeWeaponOnBurnLoop();
// Send all items and gold to healer
sendItemsToCharacterLoop("Nlami");
// sendItemsToCharacterLoop("Momental");

function do_follow() {
	let following_target = parent.entities["Nlami"];
	if (following_target !== null) {
		change_target(following_target);
	}
}