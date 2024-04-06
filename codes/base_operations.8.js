const LOG_COLORS = {
    blue: "#2b97ff",
    red: "#cf5b5b"
};

const MY_CHARACTERS = ["Shalfey", "Nlami", "MagicFotum", "Momental"];

const BASE = {
    h: 8,
    v: 7,
    vn: 2
};

const FARM_BOSSES = [
    "mvampire",
    "fvampire",
    "phoenix",
    "snowman",
    "goldenbat",
    "cutebee",
    "grinch",
    "dragold",
    "franky",
    "icegolem",
    // "crabxx",
    "jr",
    "greenjr",
    "pinkgoo",
    "bgoo",
    // "wabbit",

    // Crypt bosses
    "a7",
    "a3"
];

const FARM_AREAS = {
    // EVENT AREAS
    event: {
        name: "event",
        area: null,
        position: null,
        merchant_position: {map: "main", x: 0, y: 0},
        farm_monsters: [],
        blacklist_monsters: []
    },

    // REGULAR AREAS
    cave_first: {
        name: "cave_first",
        area: {x: 70, y: -1300, d: 550},
        position: {x: 377, y: -1075, map: "cave"},
        merchant_position: null,
        farm_monsters: ["bat"],
        blacklist_monsters: []
    },
    cave_second: {
        name: "cave_second",
        area: {x: 1282, y: -19, d: 300},
        position: {x: 1282, y: -19, map: "cave"},
        merchant_position: null,
        farm_monsters: ["bat"],
        blacklist_monsters: []
    },
    stoneworm: {
        name: "stoneworm",
        area: {x: 860, y: -14, d: 250},
        position: {x: 795, y: -41, map: "spookytown"},
        merchant_position: null,
        farm_monsters: ["stoneworm"],
        blacklist_monsters: []
    },
    booboo: {
        name: "booboo",
        area: {x: 400, y: -700, d: 200},
        position: {x: 155, y: -556, map: "spookytown"},
        merchant_position: null,
        farm_monsters: ["booboo"],
        blacklist_monsters: []
    },
    bees: {
        name: "bees",
        area: {x: 547, y: 1064, d: 150},
        position: {x: 547, y: 1064, map: "main"},
        merchant_position: null,
        farm_monsters: ["bee"],
        blacklist_monsters: []
    },
    squigs: {
        name: "squigs",
        area: {x: -1150, y: 424, d: 300},
        position: {x: -1150, y: 424, map: "main"},
        merchant_position: null,
        farm_monsters: ["squig", "squigtoad", "frog"],
        blacklist_monsters: []
    },
    tortoise: {
        name: "tortoise",
        area: {x: -1105, y: 1138, d: 370},
        position: {x: -1105, y: 1138, map: "main"},
        merchant_position: null,
        farm_monsters: ["tortoise", "frog"],
        blacklist_monsters: []
    },
    croc: {
        name: "croc",
        area: {x: 780, y: 1714, d: 300},
        position: {x: 798, y: 1576, map: "main"},
        merchant_position: null,
        farm_monsters: ["croc"],
        blacklist_monsters: []
    },
    armadillo: {
        name: "armadillo",
        area: {x: 506, y: 1817, d: 200},
        position: {x: 506, y: 1817, map: "main"},
        merchant_position: null,
        farm_monsters: ["armadillo"],
        blacklist_monsters: []
    },
    rats: {
        name: "rats",
        area: {x: -5, y: -173, d: 200},
        position: {x: -5, y: -173, map: "mansion"},
        merchant_position: null,
        farm_monsters: ["rat"],
        blacklist_monsters: []
    },
    moles: {
        name: "moles",
        area: {x: -2, y: -300, d: 250},
        position: {x: -1, y: -63, map: "tunnel"},
        merchant_position: {x: 242, y: -21, map: "tunnel"},
        farm_monsters: ["mole"],
        blacklist_monsters: ["wabbit"]
    }
    // vrats: {
    //     name: "vrats",
    //     area: {x: 59, y: 118, d: 200},
    //     position: {x: 56, y: 400, map: "level1"},
    //     merchant_position: {x: 57, y: 424, map: "level1"},
    //     farm_monsters: ["prat"],
    //     blacklist_monsters: []
    // }
};

const BOSS_INFO = {
    // Global bosses
    global: {
        dragold: {
            id: -1,
            name: "dragold",
            targets: ["dragold"],
            wait_resp: false,
            summon: true,
            map: "cave",
            x: 1060,
            y: -746,
            characters: {
                Shalfey: {
                    is_solo: false,
                    looter: character.name,
                    healer: "Nlami",
                    farm_area: null,
                    do_circle: true,
                    use_taunt: false,
                    use_agitate: false,
                    use_cleave: false,
                    use_explosion: false
                },
                Nlami: {
                    is_solo: false,
                    looter: character.name,
                    farm_area: null,
                    do_circle: true,
                    use_curse: false,
                    use_mass_heal: true
                }
            },
            is_active: true
        },
        snowman: {
            id: -2,
            name: "snowman",
            targets: ["snowman"],
            wait_resp: false,
            summon: true,
            map: "winterland",
            x: 1220,
            y: -936,
            characters: {
                Shalfey: {
                    is_solo: false,
                    looter: character.name,
                    healer: null,
                    farm_area: null,
                    do_circle: true,
                    use_taunt: true,
                    use_agitate: false,
                    use_cleave: false,
                    use_explosion: false
                },
                Nlami: {
                    is_solo: false,
                    looter: character.name,
                    farm_area: null,
                    do_circle: true,
                    use_curse: false,
                    use_mass_heal: true
                },
                MagicFotum: {
                    is_solo: false,
                    looter: character.name,
                    farm_area: null,
                    do_circle: true,
                    use_burst: false,
                    energize: true
                }
            },
            is_active: true
        },
        goobrawl: {
            id: -3,
            name: "goobrawl",
            targets: ["pinkgoo", "bgoo"],
            wait_resp: true,
            summon: false,
            to: "goobrawl",
            characters: {
                Shalfey: {
                    is_solo: false,
                    looter: character.name,
                    healer: null,
                    farm_area: null,
                    do_circle: true,
                    use_taunt: true,
                    use_agitate: true,
                    use_cleave: true,
                    use_explosion: true
                },
                Nlami: {
                    is_solo: false,
                    looter: character.name,
                    farm_area: null,
                    do_circle: true,
                    use_curse: true,
                    use_mass_heal: true
                },
                MagicFotum: {
                    is_solo: false,
                    looter: character.name,
                    farm_area: null,
                    do_circle: true,
                    use_burst: true,
                    energize: true
                }
            },
            is_active: true
        },
        icegolem: {
            id: -4,
            name: "icegolem",
            targets: ["icegolem"],
            wait_resp: false,
            summon: false,
            to: "icegolem",
            characters: {
                Shalfey: {
                    is_solo: false,
                    looter: character.name,
                    healer: null,
                    farm_area: null,
                    do_circle: false,
                    use_taunt: true,
                    use_agitate: false,
                    use_cleave: false,
                    use_explosion: false
                },
                Nlami: {
                    is_solo: false,
                    looter: character.name,
                    farm_area: null,
                    do_circle: false,
                    use_curse: true,
                    use_mass_heal: true
                },
                MagicFotum: {
                    is_solo: false,
                    looter: character.name,
                    farm_area: null,
                    do_circle: false,
                    use_burst: true,
                    energize: true
                }
            },
            is_active: true
        }
    },

    // Field bosses
    field: {
        phoenix: {
            name: "phoenix",
            targets: ["phoenix", "frog"],
            last_check: null,
            respawn: 35,
            characters: {
                Shalfey: {
                    is_solo: false,
                    looter: character.name,
                    healer: null,
                    farm_area: null,
                    do_circle: true,
                    use_taunt: true,
                    use_agitate: false,
                    use_cleave: false,
                    use_explosion: false
                },
                Nlami: {
                    is_solo: false,
                    looter: character.name,
                    farm_area: null,
                    do_circle: true,
                    use_curse: true,
                    use_mass_heal: true
                },
                MagicFotum: {
                    is_solo: false,
                    looter: character.name,
                    farm_area: null,
                    do_circle: true,
                    use_burst: true,
                    energize: true
                }
            },
            is_active: true
        },
        fvampire: {
            name: "fvampire",
            targets: ["fvampire"],
            last_check: null,
            respawn: 1440,
            characters: {
                Shalfey: {
                    is_solo: false,
                    looter: character.name,
                    healer: "Nlami",
                    farm_area: null,
                    do_circle: true,
                    use_taunt: true,
                    use_agitate: false,
                    use_cleave: false,
                    use_explosion: false
                },
                Nlami: {
                    is_solo: false,
                    looter: character.name,
                    farm_area: null,
                    do_circle: true,
                    use_curse: true,
                    use_mass_heal: true
                },
                MagicFotum: {
                    is_solo: false,
                    looter: character.name,
                    farm_area: null,
                    do_circle: true,
                    use_burst: true,
                    energize: true
                }
            },
            is_active: true
        },
        mvampire: {
            name: "mvampire",
            targets: ["mvampire"],
            last_check: null,
            respawn: 1080,
            characters: {
                Shalfey: {
                    is_solo: false,
                    looter: character.name,
                    healer: null,
                    farm_area: null,
                    do_circle: true,
                    use_taunt: true,
                    use_agitate: false,
                    use_cleave: false,
                    use_explosion: false
                },
                Nlami: {
                    is_solo: false,
                    looter: character.name,
                    farm_area: null,
                    do_circle: true,
                    use_curse: true,
                    use_mass_heal: true
                },
                MagicFotum: {
                    is_solo: false,
                    looter: character.name,
                    farm_area: null,
                    do_circle: true,
                    use_burst: true,
                    energize: true
                }
            },
            is_active: true
        },
        jr: {
            name: "jr",
            targets: ["jr"],
            last_check: null,
            respawn: 25920,
            characters: {
                MagicFotum: {
                    is_solo: true,
                    looter: character.name,
                    farm_area: null,
                    do_circle: true,
                    use_burst: true,
                    energize: true
                }
            },
            is_active: true
        },
        greenjr: {
            name: "greenjr",
            targets: ["greenjr"],
            last_check: null,
            respawn: 51840,
            characters: {
                Shalfey: {
                    is_solo: false,
                    looter: character.name,
                    healer: null,
                    farm_area: null,
                    do_circle: true,
                    use_taunt: true,
                    use_agitate: false,
                    use_cleave: false,
                    use_explosion: false
                },
                Nlami: {
                    is_solo: false,
                    looter: character.name,
                    farm_area: null,
                    do_circle: true,
                    use_curse: true,
                    use_mass_heal: true
                },
                MagicFotum: {
                    is_solo: false,
                    looter: character.name,
                    farm_area: null,
                    do_circle: true,
                    use_burst: true,
                    energize: true
                }
            },
            is_active: true
        }
    }
};

const BOSS_CHECK_ROUTE = [
    {name: "phoenix", map: "main", x: 1188,  y: -193},
    {name: "phoenix", map: "main", x: 641,  y: 1803},
    {name: "phoenix", map: "main", x: -1184,  y: 781},
    {name: "phoenix", map: "halloween", x: 8,  y: 631},
    {name: "fvampire", map: "halloween", x: -406,  y: -1643},
    {name: "greenjr", map: "halloween", x: -569,  y: -512},
    {name: "phoenix", map: "cave", x: -181,  y: -1164},
    {name: "mvampire", map: "cave", x: -181,  y: -1164},
    // {name: "mvampire", map: "cave", x: -191,  y: -1177}
    {name: "mvampire", map: "cave", x: 1244,  y: -23},
    {name: "jr", map: "spookytown", x: -784,  y: -301}
];


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

    if (smart.moving) stop("smart");
    stop("teleport");
    stop("move");

    accept_magiport(name);
}

function restoreCharacterState() {
    character.current_state = get(character.name)?.currState;
    character.current_event = get(character.name)?.currEvent;
    character.farm_options = get(character.name)?.farmOptions;

    let savedQueue = get(character.name)?.actionQueue;
    if (savedQueue) character.action_queue = savedQueue.map((sq) => Object.assign(new Task, sq));

    set_message(character.current_state);
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
        myInfo.currState = character.current_state;
        myInfo.currEvent = character.current_event;
        myInfo.actionQueue = character.action_queue;
        myInfo.farmOptions = character.farm_options;

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
        for (let char of toNotify) {
            send_cm(char, event);
        }
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

//Returns the number of items in your inventory for a given item name;
function num_items(filtCondition) {
    return character.items
        .filter(filtCondition)
        .reduce(function(a, b) {
            return a + (b["q"] || 1);
        }, 0);
}

function find_desired_item(item) {
    if (!item) return [-1];

    let itemName = item;
    let itemLevel = undefined;
    if (typeof(item) === "object") {
        itemName = item?.name;
        itemLevel = item?.level;
    }

    if (!itemName) return [-1];

    let result = [];
    for (let i = 0; i < character.items.length; i++) {
        let invItem = character.items[i];
        if (invItem && itemName === invItem.name && (!itemLevel || itemLevel === invItem.level)) {
            result.push(i);
        }
    }

    return result;
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
function getRectVertices(maxX, maxY, minX, minY) {  
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