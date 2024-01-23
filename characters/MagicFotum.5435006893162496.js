const USE_HP_AT_RATIO = 0.75;
const USE_MP_AT_RATIO = 0.8;

const USE_BURST_AT_MP_RATIO = 0.7;

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
	"armadillo",
	"minimush",
	"stoneworm",
	"crab",
	"osnake",
	"bee",
	"rat"
];
const BLACKLIST_MONSTERS = ["plantoid"];

const DO_NOT_SEND = [
	{name: "firestaff", level: 8},
	{name: "ornamentstaff", level: 7},
	{name: "orbg", level: 2},
	{name: "test_orb", level: 0}
];

var is_solo = false;
var combat_mode = false;

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
switchMode();

// Send all items and gold to healer
sendItemsToCharacterLoop("Nlami");
// sendItemsToCharacterLoop("Momental");

async function summonParty() {
	await use_skill("magiport", "Nlami");
	await use_skill("magiport", "Shalfey");
}