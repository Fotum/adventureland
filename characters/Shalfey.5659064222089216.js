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
	"cutebee"
];

const BLACKLIST_MONSTERS = [
	"porcupine"
];

// Load everything that's needed functions
load_code("base_operations");
load_code("warrior_farm");
load_code("draw_ui");
// load_code("dps_meter"); // DPS Meter

// Send character info
updateCharacterInfoLoop();

// General operations
moveLoop();
lootLoop();
regenLoop();

// Class dependent operations
attackLoop();
tauntLoop();
targetChooseLoop();

sendItemsToCharacterLoop("Nlami");

function do_follow() {
	curr_state = null;
	let following_target = parent.entities["Nlami"];
	if (following_target !== null) {
		change_target(following_target);
	}
}