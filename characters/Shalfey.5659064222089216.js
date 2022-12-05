const USE_HP_AT_RATIO = 0.75;
const USE_MP_AT_RATIO = 0.75;

const USE_HS_AT_HP_RATIO = 0.5;

const DO_NOT_SEND = [];

// Farm options
const FARM_MONSTERS = [
	"bat",
	"mvampire",
	"phoenix",
	"snowman",
	"grinch",
	"wolfie",
	"arcticbee",
	"goldenbat",
	"cutebee",
	"iceroamer",
	"armadillo",
	"arcticbee"
];

const BLACKLIST_MONSTERS = [
	"porcupine"
];

var attack_mode = true;

// Load everything that's needed functions
load_code("base_operations");
load_code("warrior_farm");
load_code("draw_ui");
// load_code("dps_meter"); // DPS Meter
load_code("mover_module");

// Send character info
updateCharacterInfoLoop();

// General operations
moveLoop();
lootLoop();
regenLoop();

// Class dependent operations
attackLoop();
targetChooseLoop();
tauntLoop();
hardShellLoop();

sendItemsToCharacterLoop("Nlami");
// sendItemsToCharacterLoop("Momental");

function do_follow() {
	curr_state = null;
	let following_target = parent.entities["Nlami"];
	if (following_target !== null) {
		change_target(following_target);
	}
}