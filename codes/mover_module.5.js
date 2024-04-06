const AWAIT_BLINK_MS = 500;
const AWAIT_TRANSPORT_MS = 500;
const AWAIT_TOWN_MS = 3500;


let _smart_move_logic = smart_move_logic;
let _continue_pathfinding = continue_pathfinding;
let _smart_move = smart_move;

continue_pathfinding = function() {}

smart.curr_step = null;
smart.blink_min = 200;
smart.blink_mode = 1500;
smart.no_target = false;
smart.unlocked_keys = [];
smart.api_key = "";
smart.use_town = true;
smart.on_done = function (done, reason) {
    if (done) parent.resolve_deferreds("smart_move", {success: true});
    else parent.reject_deferreds("smart_move", {reason: reason});
};

smart_move = function(destination) {
    // If we call smart_move while already smart moving then stop and call interrupt
    if (smart.moving) {
        game_log("Interrupted", "#cf5b5b");

        smart.moving = false;
        parent.reject_deferreds("smart_move", {reason: "interrupted"});
        move(character.real_x, character.real_y);
    }

    // Prepare smart_move parameters
    let preparationResult = prepare_smart_move(destination);
    // If preparation failed then call fail and return
    if (!preparationResult.success) {
        game_log("Path preparation failed", "#cf5b5b");
        return Promise.reject(preparationResult.success, preparationResult.reason);
    }

    // If preparation succeeded and we can join then join event, call success and return
    if (preparationResult.success && typeof(preparationResult.action) === "function") {
        game_log("Joining event or event map", "#2b97ff");
        return preparationResult.action();

        // return Promise.resolve(preparationResult.success, "joined");
    }

    if (smart.blink_mode && character.ctype !== "mage") smart.blink_mode = false;
    if (!smart.last_blink) {
        let dt = new Date();
        dt.setMilliseconds(dt.getMilliseconds() - Math.max(AWAIT_BLINK_MS, AWAIT_TOWN_MS, AWAIT_TRANSPORT_MS));
        smart.last_blink = dt;
    }

    plot_path_smart_move();

    smart.moving = true;
    smart.found = false;
    smart.curr_step = null;
    return parent.push_deferred("smart_move");
}

function prepare_smart_move(destination) {
	smart.map = "";
    if (is_string(destination)) {
        destination = {to: destination};
    }

	if ("x" in destination)	{
        smart.map = destination.map || character.map;
		smart.x = destination.x;
		smart.y = destination.y;
	} else if ("to" in destination || "map" in destination) {
        // We want to smart move to town, by default it's main
        if (destination.to === "town") {
            destination.to = "main";
        }

        // We want to smart move to event that can be joined
        if (G.events[destination.to] && parent.S[destination.to] && G.events[destination.to].join) {
            // Join and return, no need to walk anywhere
            return {
                success: true,
                action: function() { return join(destination.to) }
            };
		} else if (G.monsters[destination.to]) {
            // We want to smart move to some monster
            let locations = [];

            // Looking for desired monster's location
            for (let name in G.maps) {
                let monstersOnMap = G.maps[name].monsters || [];

                for (let monster of monstersOnMap) {
                    if (monster.type !== destination.to || G.maps[name].ignore || G.maps[name].instance) continue;

                    // Check boundaries for phoenix, mvampire etc
                    if (monster.boundaries) {
                        // Calculate random boundary, from boundaries list
                        monster.last = monster.last || 0;
                        let boundary = monster.boundaries[monster.last % monster.boundaries.length];
                        monster.last++;

                        let tmpBound = [boundary[0], (boundary[1] + boundary[3]) / 2, (boundary[2] + boundary[4]) / 2];
                        locations.push(tmpBound);
                    } else if (monster.boundary) {
                        // Push boundary with map name to locations
                        let boundary = monster.boundary;
                        let tmpBoundary = [name, (boundary[0] + boundary[2]) / 2, (boundary[1] + boundary[3]) / 2];
                        locations.push(tmpBoundary);
                    }
                }
            }

            // This way, when you smart_move("snake") repeatedly - you can keep visiting different maps with snakes
            if (locations.length) {
                let theOne = random_one(locations);
                smart.map = theOne[0];
                smart.x = theOne[1];
                smart.y = theOne[2];
            }
        } else if (G.maps[destination.to || destination.map]) {
            let trgMap = G.maps[destination.to || destination.map];
            // We want to move to some event map
            if (trgMap.event) {
                if (parent.S[trgMap]?.event) {
                    return {
                        success: true,
                        action: function() { return join(trgMap.event) }
                    };
                } else {
                    game_log("Path not found!", "#cf575f");
                    return {
                        success: false,
                        reason: "invalid"
                    };
                }
            } else {
                // We want to move to some regular map
                smart.map = destination.to || destination.map;
                smart.x = G.maps[smart.map].spawns[0][0];
                smart.y = G.maps[smart.map].spawns[0][1];
            }
        } else if (destination.to === "upgrade" || destination.to === "compound") {
            smart.map = "main";
            smart.x = -204;
            smart.y = -129;
        } else if (destination.to === "exchange") {
            smart.map = "main";
            smart.x = -26;
            smart.y = -432;
        } else if (destination.to === "potions") {
            if (character.map === "halloween") {
                smart.map = "halloween";
                smart.x = 149;
                smart.y = -182;
            } else if (in_arr(character.map, ["winterland", "winter_inn", "winter_cave"])) {
                smart.map = "winter_inn";
                smart.x = -84;
                smart.y = -173;
            } else {
                smart.map = "main";
                smart.x = 56;
                smart.y = -122;
            }
        } else if (destination.to === "scrolls") {
            smart.map = "main";
            smart.x = -465;
            smart.y = -71;
        } else if (find_npc(destination.to)) {
            let l = find_npc(destination.to);
            smart.map = l.map;
            smart.x = l.x;
            smart.y = l.y + 15;
        }
    }

    if (!smart.map) {
        game_log("Unrecognized location", "#cf5b5b");
        return {
            success: false,
            reason: "invalid"
        };
    }

    game_log("Preparation complete", "#2b97ff");
    return {
        success: true
    };
}

function plot_path_smart_move() {
    smart.error = null;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    fetch("https://almapper.zinals.tech/FindPath/", {
            signal: controller.signal,
            method: "POST",
            mode: "cors",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${smart.api_key}`
            },
            body: JSON.stringify({
                fromMap: character.map,
                fromX: Math.round(character.x),
                fromY: Math.round(character.y),
                toMap: smart.map,
                toX: Math.round(smart.x),
                toY: Math.round(smart.y),
                runspd: character.speed,
                useTown: smart.use_town,
                keys: smart.unlocked_keys
            })
    }).then((res) => {
        if(res.status == 404)
            throw {action: "stop", error: new Error("Unauthorized API access")};

        if(!res.ok)
            throw {action: "stop", error: new Error(`[${res.status}] ${res.statusText}`)};

        return res.json();
    }).then((data) => {
        clearTimeout(timeoutId);

        if(data === null || data === false || typeof(data) !== "object" || data.path === null) {
            console.log("Pathfinding error", "Invalid response");
            throw {action: "stop", error: new Error("Path not found!")};
        }

        if (data.error) {
            console.log("Pathfinding error", data.error);
            throw {action: "stop", error: new Error("Path not found!")};
        } else {
            smart.plot = [];
            let last_map = character.map;

            for (let step of data.path) {
                if (step.action === "Move") {
                    smart.plot.push({x: step.x, y: step.y, map: last_map, move: true, complete: false});
                } else if (step.action === "Teleport") {
                    smart.plot.push({x: step.x, y: step.y, map: step.action_target, transport: true, spawn: step.target_spawn, complete: false});
                    last_map = step.action_target;
                } else if (step.action === "Town") {
                    smart.plot.push({x: step.x, y: step.y, map: last_map, town: true, complete: false});
                }
            }

            smart.found = true;
            game_log("Path found, moving", "#2b97ff");
            return {action: "continue"};
        }
    }).catch((ex) => {
        console.error(ex);
        smart.error = ex;
        parent.reject_deferreds("smart_move");
    });
}

smart_move_logic = async function() {
    if (!smart.moving) return;
    if (!smart.found) return;

    if (smart.no_target && get_targeted_monster()) return;
    if (character.moving || is_transporting(character)) return;

    if (!smart.plot || !smart.plot.length) {
        game_log("Done!", "#2b97ff");
        smart.moving = false;
        parent.resolve_deferreds("smart_move", {success: true});
        return;
    }

    if (character.rip) {
        game_log("Character is dead", "#2b97ff");
        smart.moving = false;
        parent.reject_deferreds("smart_move", {reason: "dead"});
        return;
    }

    // Await coord updates after actions
    if (smart.curr_step) {
        if (smart.curr_step.transport && mssince(smart.last_blink) <= AWAIT_TRANSPORT_MS) return;
        if (smart.curr_step.town && mssince(smart.last_blink) <= AWAIT_TOWN_MS) return;
        if (smart.curr_step.move && mssince(smart.last_blink) <= AWAIT_BLINK_MS) return;
    }

    if (smart.curr_step && smart.curr_step.move && !can_move_to(smart.curr_step.x, smart.curr_step.y)) {
        game_log("Can't reach", "#2b97ff");

        smart.moving = false;
        parent.reject_deferreds("smart_move", {reason: "unreachable"});
        return;
    }

    if (!can_walk(character)) {
        game_log("Unable to move", "#cf5b5b");
        return;
    }

    // Validate step
    validate_step_completion();
    if (!smart.curr_step || smart.curr_step.complete) smart.curr_step = smart.plot.shift();

    // Moving to another map
    if (smart.curr_step.transport) {
        game_log(`Transporting to ${smart.curr_step.map}`, "#2b97ff");

        try {
            transport(smart.curr_step.map, smart.curr_step.spawn);
        } catch (ex) {
            console.error("Transport exception: ", ex);
        }

        smart.last_blink = new Date();
        return;
    }

    // Using town portal
    if (smart.curr_step.town) {
        game_log("Going to town", "#2b97ff");

        use_skill("use_town");

        smart.last_blink = new Date();
        return;
    }

    // Using blink
    if (smart.blink_mode && can_use("blink") && !is_on_cooldown("blink") && character.mp >= 1600) {
        for (let i = smart.plot.length - 1; i >= 0; i--) {
            let blinkNode = smart.plot[i];
            let nodeDist = parent.simple_distance(blinkNode, character);
            if (blinkNode.map === character.map && nodeDist >= smart.blink_min && nodeDist <= parseFloat(smart.blink_mode)) {
                game_log(`Blinking to: x: ${blinkNode.x}, y: ${blinkNode.y}`, "#2b97ff");

                use_skill("blink", [blinkNode.x, blinkNode.y]);
                // smart.curr_step.complete = true;
                smart.curr_step = blinkNode;

                smart.last_blink = new Date();
                smart.plot.splice(0, i);

                return;
            }
        }
    }

    // Normal moving
    if (smart.curr_step.move && character.map === smart.curr_step.map) {
        move(smart.curr_step.x, smart.curr_step.y);
    }
}

function validate_step_completion() {
    if (!smart.curr_step || smart.curr_step.complete) return;

    // Teleport town validation
    if (smart.curr_step.town && parent.simple_distance(character, smart.curr_step) <= 150) {
        smart.curr_step.complete = true;
        return;
    }
    // Transport between locations validation
    if (smart.curr_step.transport && smart.curr_step.map === character.map) {
        smart.curr_step.complete = true;
        return;
    }
    // Movement validation
    if (smart.curr_step.move && character.x === smart.curr_step.x && character.y === smart.curr_step.y) {
        smart.curr_step.complete = true;
        return;
    }
}