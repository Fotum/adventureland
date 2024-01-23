// Load everything that's needed functions
load_code("base_operations");
load_code("warrior_farm");
// load_code("draw_ui");


const USE_HP_AT_RATIO = 0.75;
const USE_MP_AT_RATIO = 0.75;

const USE_HS_AT_HP_RATIO = 0.5;

const DO_NOT_SEND = [
	{name: "orbg", level: 2},
	{name: "test_orb", level: 0}
];

const FARM_BOSSES = [
	"mvampire",
	"fvampire",
	"phoenix",
	"snowman",
	"goldenbat",
	"cutebee",
	"grinch",
	"dragold"
];
const FARM_MONSTERS = [
	"bat",
	"wolfie",
	"arcticbee",
	// "ghost",
	"bgoo",
	"rat",
	"croc",
	// "bigbird",
	"stoneworm",
	"cgoo",
	"scorpion",
	//"spider",
	"osnake",
	"snake",
	"xscorpion"
];
const BLACKLIST_MONSTERS = [
	"porcupine"
];

var is_solo = false;
var combat_mode = false;

var farm_area = FARM_AREAS.caveFirst.area;

// Send character info
updateCharacterInfoLoop();

// General operations
moveLoop();
lootLoop();
regenLoop();

// Class dependent operations
switchMode();

sendItemsToCharacterLoop("Nlami");
// sendItemsToCharacterLoop("Momental");