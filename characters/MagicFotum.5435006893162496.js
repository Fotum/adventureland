const FARM_MONSTERS = [
	"porcupine",
	"goldenbat",
	"cutebee",
	"mvampire",
	"phoenix",
	"snowman",
	"grinch",
	"armadillo"
];

const DO_NOT_SEND = [];

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
// targetChoosePartyLoop();
targetChooseSoloLoop();
// manaBurstLoop()
// Send all items and gold to healer
sendItemsToCharacterLoop("Nlami");

function do_follow() {
	let following_target = parent.entities["Nlami"];
	if (following_target !== null) {
		change_target(following_target);
	}
}