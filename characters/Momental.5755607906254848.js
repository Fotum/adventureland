game.on("event", function (data) {
    if (!controller) return;

    let eventToNotify = BOSS_INFO.global[data.name];
    if (!eventToNotify || !eventToNotify.is_active) return;

    let event = {
        id: eventToNotify.id,
        name: eventToNotify.name,
        type: "global",
        summon: eventToNotify.summon,
        wait_resp: eventToNotify.wait_resp
    };

    if (eventToNotify.to) event.to = eventToNotify.to;
    if (eventToNotify.map) event.map = eventToNotify.map;
    if (eventToNotify.x) event.x = eventToNotify.x;
    if (eventToNotify.y) event.y = eventToNotify.y;

    notifyCharactersOfEvent(event, Object.keys(eventToNotify.characters));
});

// parent.socket.on("players", (data) => {
//     console.log(data);
// });
// parent.socket.emit("players");

var controller = undefined;
async function runCharacter() {
    // Initialize modules
    await initialize_character();

    // Restore state
    restoreCharacterState();
    // Send character info
    updateCharacterInfoLoop();
    // Respawn if dead
    respawnLoop();

    // Character behaviour
    let currStrat = new MerchantBehaviour();

    // Character controller
    controller = new MerchantController({
        enchant_items: true,
        enchant_jewelry: true,
        check_bosses: true,
        check_cyberland: true,
        store_bank: true,
        resupply: {
            hp_pots_type: "hpot1",
            mp_pots_type: "mpot1",
            potions_needed: 5000,
            potions_minimum: 4500
        }
    }, currStrat);

    currStrat.enable();
    controller.enable();
}
runCharacter();

async function initialize_character() {
    // Pathfinding modules
    await load_module("graph_mover");
    await load_module("mover_module");

    // General functions
    await load_module("base_operations");
    await load_module("event_task");

    // Class specific functions
    await load_module("auto_enchant");
    await load_module("merchant_strats");
}

async function load_module(module) {
    try {
        if (parent.caracAL) {
            await parent.caracAL.load_scripts([module]);
        } else {
            await load_code(module);
        }
    } catch (ex) {
        console.error(ex);
    }
}