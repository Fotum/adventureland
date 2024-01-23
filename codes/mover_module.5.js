let _smart_move_logic = smart_move_logic;
let _start_pathfinding = start_pathfinding;
let _continue_pathfinding = continue_pathfinding;

smart.blink_mode = 500;
smart.no_target = false;
smart.original_failsafe = true;
smart.unlocked_keys = [];
smart.api_key = "";
smart.use_town = true;

smart_move_logic = async function()
{
    if(!smart.moving) //No path has been requested yet
        return;

    if(smart.no_target && get_targeted_monster())
        return;

    if(smart.blink_mode && !smart.last_blink)
        smart.last_blink = new Date();

    if(smart.blink_mode && can_use("blink") && mssince(smart.last_blink) < 1000)
        return;

    if(is_transporting(character))
        return;

    if(smart.run_original)
    {
        _smart_move_logic();
        return;
    }

    if(!smart.searching && !smart.found)
    {
        start_pathfinding();
        return;
    }

    if(!smart.found)
        return;

    if(character.moving || !can_walk(character) || is_transporting(character))
    {
        console.log("Unable to move");
        return;
    }

    if(!smart.plot || !smart.plot.length)
    {
        smart.moving = false;
        smart.on_done(true);
        return;
    }

    let current = smart.plot[0];

    if (character.map == current.map && character.x == current.x && character.y == current.y && !current.transport)
    {
        smart.plot.splice(0, 1);
        return;
    }

    if(current.transport)
    {
        console.log("Transporting to ", current);
        transport(current.map, current.s);
        smart.plot.splice(0, 1);
        smart.last_blink = new Date();
        return;
    }

    if(smart.blink_mode && can_use("blink") && !is_on_cooldown("blink") && character.mp >= 1600)
    {
        for(let i = smart.plot.length - 1; i >= 0; i--)
        {
            if(smart.plot[i].map == character.map && (isNaN(smart.blink_mode) || parent.distance(smart.plot[i], character) <= parseFloat(smart.blink_mode)))
            {
                console.log("Blinking to ", smart.plot[i]);
                try {
                    await use_skill("blink", [smart.plot[i].x, smart.plot[i].y]);
                }
                catch(ex)
                {
                    console.log("Failed to blink", ex, smart.plot[i]);
                }
                smart.plot.splice(0, i + 1);
                smart.last_blink = new Date();

                return;
            }
        }

        if(smart.blink_mode == "always" && mssince(smart.last_blink) >= 10000)
        {
            console.log("Path timed out...", smart.plot.length ? smart.plot[0] : null);
            game_log("Path timed out...", "#CF5B5B");
            smart_move({ map: smart.map, x: smart.x, y: smart.y }, smart.on_done);
            return;
        }
    }

    if(current.town)
    {
        if(!is_on_cooldown("use_town"))
        {
            console.log("Going to town");
            smart.plot.splice(0, 1);
            await use_skill("use_town");
            await sleep(1000);
            smart.last_blink = new Date();
        }

        return;
    }

    if(character.map == current.map && can_move_to(current.x, current.y))
    {
        move(current.x, current.y);
        smart.plot.splice(0, 1);
    }
    else
    {
        console.log("Lost the path...", smart.plot.length ? smart.plot[0] : null);
        game_log("Lost the path...", "#CF5B5B");
        smart_move({map: smart.map, x: smart.x, y: smart.y}, smart.on_done);
    }
};

start_pathfinding = function()
{
    smart.searching = true;
    smart.error = null;
    delete smart.run_original;
    try
    {
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
        })
            .then((res) => {

                if(res.status == 404)
                    throw new Error("Unauthorized API access");

                if(!res.ok)
                    throw new Error(`[${res.status}] ${res.statusText}`);

                return res.json();
            })
            .then((data) => {
                clearTimeout(timeoutId);

                if(data == null || data === false || typeof(data) != "object" || data.path == null)
                {
                    console.log("Pathfinding error", "Invalid response");
                    smart.error = "Invalid response";
                    if(smart.original_failsafe)
                    {
                        game_log("Invalid response, reverting to original", "#CF5B5B");
                        smart.run_original = true;
                        _start_pathfinding();
                        return;
                    }
                    else
                    {
                        game_log("Path not found!", "#CF575F");
                        smart.plot = [];
                        smart.found = true;
                    }
                }

                if(data.error)
                {
                    console.log("Pathfinding error", data.error);
                    smart.error = data.error;
                    if(smart.original_failsafe)
                    {
                        game_log(data.error + ", reverting to original", "#CF5B5B");
                        smart.run_original = true;
                        _start_pathfinding();
                        return;
                    }
                    else
                    {
                        game_log("Path not found!", "#CF575F");
                        smart.plot = [];
                        smart.found = true;
                    }
                }
                else
                {
                    //The path returned from the pathfinding service isn't in the same format as the smart_move plot.
                    //Convert it.
                    smart.plot = [];

                    let last_map = character.map;

                    for(let step of data.path)
                    {
                        if(step.action === "Move")
                            smart.plot.push({x: step.x, y: step.y, map: last_map});
                        else if(step.action === "Teleport")
                        {
                            smart.plot.push({x: step.x, y: step.y, map: step.action_target, transport: true, s: step.target_spawn});
                            last_map = step.action_target;
                        }
                        else if(step.action === "Town")
                            smart.plot.push({x: step.x, y: step.y, map: last_map, town: true});
                    }

                    smart.found = true;
                }
            })
            .catch((e) => {
                console.log("Pathfinding error", e);
                smart.error = e;
                if(smart.original_failsafe)
                {
                    game_log("Pathfinding error, reverting to original", "#CF5B5B");
                    smart.run_original = true;
                    _start_pathfinding();
                }
                else
                {
                    game_log("Path not found!", "#CF575F");
                    smart.plot = [];
                    smart.found = true;
                }
            });
    }
    catch(ex)
    {
        console.log("Pathfinding error", ex);
        smart.error = ex;
        if(smart.original_failsafe)
        {
            game_log("Pathfinding error, reverting to original", "#CF5B5B");
            smart.run_original = true;
            _start_pathfinding();
        }
        else
        {
            game_log("Path not found!", "#CF575F");
            smart.plot = [];
            smart.found = true;
        }
    }
};