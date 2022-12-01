const FARM_MONSTERS = [
	"porcupine",
	"goldenbat",
	"cutebee",
	"mvampire",
	"phoenix",
	"snowman",
	"armadillo",
	"grinch"
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
// targetChoosePartyLoop();
targetChooseSoloLoop();
curseLoop();
partyHealLoop();

sendItemsToCharacterLoop("Momental");

// Invite members to party if they are lost
setInterval(create_party, 5000);

function create_party() {
	let party_members = ["Shalfey", "Nlami", "MagicFotum", "Momental"];
	let curr_party_list = parent.party_list;
	
	if (curr_party_list.length < 4) {
		for (let member of party_members) {
			if (!curr_party_list.includes(member)) {
				send_party_invite(member);
			}
		}
	}
}