var MAP_GRAPH_LIST = {
    [character.map]: initialize_graph(character.map)
};
var MAP_GRAPH = MAP_GRAPH_LIST[character.map];
game.on("new_map", function () {
    if (MAP_GRAPH_LIST[character.map]) {
        MAP_GRAPH = MAP_GRAPH_LIST[character.map];
    } else {
        MAP_GRAPH = initialize_graph(character.map);
        MAP_GRAPH_LIST[character.map] = MAP_GRAPH;
    }
});

// Accept party from one of these sources
function on_party_invite(name) {
    if (MY_CHARACTERS.includes(name)) {
        accept_party_invite(name);
    }
}

// Accept magiport from party MagicFotum
function on_magiport(name) {
    if (name !== "MagicFotum") return;

    accept_magiport(name)
        .then(async () => {
            await sleep(500);
            if (smart.moving) stop("smart");
            if (character.moving) stop("move");
            stop("teleport");
        });
}

function restoreCharacterState() {
    let localInfo = get(character.name);

    character.state = localInfo?.state;

    let savedQueue = localInfo?.actionQueue;
    if (savedQueue) character.action_queue = savedQueue.map((sq) => Object.assign(new Task, sq));

    set_message(character?.state?.name);
}

async function updateCharacterInfoLoop() {
    try {
        let myInfo = {};
        // Name and coordinates
        myInfo.name = character.name;
        myInfo.map = character.map;
        myInfo.in = character.in;
        myInfo.x = round(character.x);
        myInfo.y = round(character.y);
        myInfo.real_x = round(character.real_x);
        myInfo.real_y = round(character.real_y);

        // HP and max HP
        myInfo.hp = character.hp;
        myInfo.mp = character.mp;
        myInfo.max_hp = character.max_hp;
        myInfo.max_mp = character.max_mp;
        myInfo.rip = character.rip;

        // Other info
        myInfo.speed = character.speed;
        myInfo.goldm = character.goldm;
        myInfo.luckm = character.luckm;
        myInfo.cc = character.cc;

        myInfo.hpPots = num_items((i) => i && i.name === "hpot1");
        myInfo.mpPots = num_items((i) => i && i.name === "mpot1");

        // Character state and queue
        myInfo.state = character.state;
        myInfo.actionQueue = character.action_queue;

        set(character.name, myInfo);
    } catch (e) {
        game_log(`${e.name}: ${e.message}`);
    }

    setTimeout(updateCharacterInfoLoop, 250);
}

async function sendItemsToCharacterLoop(name) {
    try {
        const friendSendTo = get(name);
        const sendTo = parent.entities[name];
        
        if (sendTo && distance(character, sendTo) < 400) {
            for (let i = 0; i < character.items.length; i++) {
                let item = character.items[i];
                if (!item) continue;
                if (item.l) continue;
                if (["hpot0", "mpot0", "hpot1", "mpot1", "tracker", "computer", "elixirluck"].includes(item.name)) continue;
                if (DO_NOT_SEND.find((i) => i.name === item.name && i.level <= item.level)) continue;
                
                if (friendSendTo) {
                    if (friendSendTo.eSize === 0) continue;
                }

                await send_item(name, i, item.q ?? 1);
            }
            
            if (character.gold > 100000 * 2) {
                await send_gold(sendTo, character.gold - 100000);
            }
        }
    } catch (e) {
        game_log(`${e.name}: ${e.message}`);
    }
    
    setTimeout(async () => { sendItemsToCharacterLoop(name) }, 1000);
}

async function respawnLoop() {
    if (character.rip) respawn();
    setTimeout(respawnLoop, 5000);
}

function setCruise(speed) {
    let min_speed = speed;
    if (!min_speed) {
        // Find cruise speed
        let party_speeds = parent.party_list.map(nm => get(nm)?.speed);
        min_speed = Math.min(character.speed, ...party_speeds);
    }

    cruise(min_speed);
}

function getServerPlayers() {
    const playersData = new Promise((resolve, reject) => {
        const dataCheck = (data) => {
            resolve(data);
        };

        setTimeout(() => {
            parent.socket.off("players", dataCheck);
            reject("getServerPlayers timeout (2500ms)");
        }, 2500);

        parent.socket.once("players", dataCheck);
    });

    parent.socket.emit("players");
    return playersData;
}

function getOnlineCharacters(serverName) {
    const onlineCharacters = get_characters();
    let selfCharacter = onlineCharacters.find(
        (c) => c.name === character.name
    );

    if (!serverName) serverName = selfCharacter.server;

    let onlineOnServer = onlineCharacters
        .filter((c) => c.name !== character.name && c.online > 0 && c.server === serverName)
        .map((c) => c.name);

    return onlineOnServer || [];
}

function notifyCharactersOfEvent(event, characters) {
    if (!event || !characters || characters.length === 0) return;

    let onlineOnServer = getOnlineCharacters();
    let mageIsOnline = onlineOnServer.some((n) => n === "MagicFotum");
    let mageInEvent = characters.find((n) => n === "MagicFotum");
    if (event.summon && mageInEvent && mageIsOnline) {
        send_cm(mageInEvent, event);
    } else {
        event.summon = false;
        let toNotify = characters.filter((c) => onlineOnServer.includes(c));
        send_cm(toNotify, event);
    }
}

async function waitForTargets(targets, waitTime) {
    let awaitStart = Date.now();
    let targetsAround = Object.values(parent.entities).filter((m) => m.type === "monster" && targets.includes(m.mtype));
    while (targetsAround.length === 0 && ts_ssince(awaitStart) < waitTime) {
        await sleep(500);
        targetsAround = Object.values(parent.entities).filter((m) => m.type === "monster" && targets.includes(m.mtype));
    }

    return targetsAround;
}

function calculateStatsByLevel(ctype, level) {
    function getGains(level) {
        if (level > 80) return 3;
        if (level > 65) return 4;
        if (level > 55) return 3;
        if (level > 40) return 2;

        return 1;
    }

    let base = G.classes[ctype].stats;
    let lbase = G.classes[ctype].lstats;

    let playerStats = {};
    for (let stat in base) {
        playerStats[stat] = base[stat];
        let points = 0;

        for (let i = 1; i <= level; i++) {
            points += getGains(i);
        }

        playerStats[stat] += Math.floor(points * lbase[stat]);
    }

    return playerStats;
}

// Emit functions
function acquireHolidayBuff() {
    parent.socket.emit("interaction", {type: "newyear_tree"});
}

// Returns the number of items in your inventory for a given item name;
function num_items(filtCondition) {
    return character.items
        .filter(filtCondition)
        .reduce(function(a, b) {
            return a + (b["q"] || 1);
        }, 0);
}

function find_desired_item(item, start) {
    if (!item) return -1;
    if (!start) start = 0;

    if (start < 0) return -1;

    let itemName = item;
    let itemLevel = undefined;
    if (typeof(item) === "object") {
        itemName = item?.name;
        itemLevel = item?.level;
    }

    if (!itemName) return -1;
    for (let i = start; i < character.items.length; i++) {
        let invItem = character.items[i];
        if (invItem && itemName === invItem.name && (!itemLevel || itemLevel === invItem.level)) {
            return i;
        }
    }

    return -1;
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        let temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
}

function is_object_empty(obj) {
    return !obj || (Object.keys(obj).length === 0 && obj.constructor === Object);
}

// Time functions
function ms_to_next_skill(skill) {
    let next_skill = parent.next_skill[skill];
    if (!next_skill) return 0;
    
    let ms = parent.next_skill[skill].getTime() - Date.now();
    
    return ms < 0 ? 0 : ms;
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function ts_mssince(ts, ref) {
    if (!ref) ref = Date.now();
    return ref - ts;
}

function ts_ssince(ts, ref) {
    return round(ts_mssince(ts, ref) / 1000);
}

function ts_msince(ts, ref) {
    return round(ts_mssince(ts, ref) / 60000);
}

// Geometry functions
function getRectVertices(minX, minY, maxX, maxY) {  
    return {
        topLeft: {x: minX, y: minY},
        topRight: {x: maxX, y: minY},
        botLeft: {x: minX, y: maxY},
        botRight: {x: maxX, y: maxY}
    };
}

function distance2D(x2, y2) {
    let a = character.real_x - x2;
    let b = character.real_y - y2;

    return Math.sqrt(a * a + b * b);
}

function containsPoint(rect, point) {
    let x1 = rect.x1;
    let x2 = rect.x2;

    let y1 = rect.y1;
    let y2 = rect.y2;

    let pX = point.x;
    let pY = point.y;

    return (x1 <= pX && pX <= x2 &&
            y1 <= pY && pY <= y2);
}

function get_angle_between(a, b) {
    let dX = b.x - a.x;
    let dY = b.y - a.y;

    return Math.atan2(dY, dX);
}

function degrees_to_radian(degrees) {
    return degrees * (Math.PI / 180);
}

function radian_to_degrees(radian) {
    return radian * (180 / Math.PI)
}

function get_random_angle() {
    return Math.random() * Math.PI * get_random_sign();
}

function get_random_sign() {
    return Math.floor(Math.random() * 2) || -1;
}