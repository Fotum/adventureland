if(typeof(globalThis.Mover) == "undefined")
{
    /**
     * @typedef {Object} character
     * @property {number} x
     * @property {number} y
     * @property {string} map
     */

    /**
     * A class that handles moving the character from position A to position B.
     *
     * Note: All public methods in this class are asynchronous!
     *
     * @version 2022-08-15
     */
    class Mover
    {
        /**
         * Should errors/messages be logged to the console (Game Inspector)?
         * @type {boolean}
         * @static
         * @default true
         */
        static logToConsole = true;

        /**
         * Should errors/messages be displayed in the window?
         * @type {boolean}
         * @static
         * @default false
         */
        static logToWindow =  false;

        /**
         * The unique key you have been given by Zinal#5950.
         * @static
         * @see NOT IN USE
         * @since 2021-10-04
         * @type {string}
         */
        static ApiKey = "ZinTest";

        /**
         *
         * @type {{action: string, [x]: number, [y]: number, [action_target]: string, [action_spawn]: number}[] | null}
         */
        static path = null;

        /**
         *
         * @type {number}
         */
        static currentStep = 0;

        /**
         * The position of the potion shop on the winter map.
         * @private
         * @static
         * @since 2021-10-04
         * @type {{x: number, y: number, map: string}}
         */
        static #winterPotionsPosition = {x: -84, y: -173, map: "winter_inn"};

        /**
         * A collection of custom positions, based on the list from smart_move.
         * @private
         * @static
         * @since 2021-10-04
         * @type {{halloween: {potions: {x: number, y: number, map: string}}, winter_cave: {potions: {x: number, y: number, map: string}}, winter_inn: {potions: {x: number, y: number, map: string}}, winterland: {potions: {x: number, y: number, map: string}}, any: {scrolls: {x: number, y: number, map: string}, upgrade: {x: number, y: number, map: string}, potions: {x: number, y: number, map: string}, exchange: {x: number, y: number, map: string}, compound: {x: number, y: number, map: string}}}}
         */
        static #customPositions = {
            any: {
                upgrade:    {x: -204, y: -129, map: "main"},
                compound:   {x: -204, y: -129, map: "main"},
                exchange:   {x: -26, y: -432, map: "main"},
                potions:    {x: 56, y: -122, map: "main"},
                scrolls:    {x: -465, y: -71, map: "main"}
            },
            halloween: {
                potions:    {x: 149, y: -182, map: "halloween"}
            },
            winterland: {
                potions:    Mover.#winterPotionsPosition,
            },
            winter_inn: {
                potions:    Mover.#winterPotionsPosition,
            },
            winter_cave: {
                potions:    Mover.#winterPotionsPosition,
            }
        };

        /** @type {boolean} */
        static #stopping = false;
        /** @type {boolean} */
        static #stopped = true;

        /**
         *
         * @returns {Promise}
         */
        static async stop()
        {
            Mover.#stopping = true;
            stop("move");

            while(!Mover.#stopped)
                await sleep(100);
        }

        /**
         * @typedef MoverStep
         * @property {string} action
         * @property {number} [x]
         * @property {number} [y]
         * @property {string} [action_target]
         * @property {number} [target_spawn]
         */

        /**
         * @callback NodeReachedCallback
         * @param {number} index
         * @param {number} length
         * @param {MoverStep} lastStep
         * @returns {boolean}
         */

        /**
         *
         * @param {number|{x: number, y: number, map: string}|string} x
         * @param {number|null} [y]
         * @param {string|null} [map]
         * @param {NodeReachedCallback} nodeReached
         * @returns {Promise}
         */
        static async move(x, y = undefined, map = undefined, nodeReached = null)
        {
            if(is_string(x))
            {
                await Mover.move_by_path(x, nodeReached);
                return true;
            }

            /** @type {null|{x: number, y: number, map: string}} */
            let realPos = null;
            if(is_object(x) && "x" in x)
                realPos = {x: x.x, y: x.y, map: x.map};
            else if(is_number(x) && is_number(y))
                realPos = {x: x, y: y, map: map || character.map};

            if(realPos == null)
            {
                Mover._log("Failed to get path: No destination specified");
                return false;
            }

            if(character.map == realPos.map  && can_move_to(realPos.x, realPos.y))
                return await Mover.moveX(realPos.x, realPos.y);
            else
            {
                await Mover.move_by_path(realPos, nodeReached);
                return character.map == realPos.map && character.x >= realPos.x - 10 && character.x <= realPos.x + 10 && character.y >= realPos.y - 10 && character.y <= realPos.y + 10;
            }
        }

        /**
         * Move the character to a destination using the pathfinder service, if applicable.
         * Falls back to smart_move if an error occurred.
         * @static
         * @param {{x: number, y: number, map: string}|string} destination
         * @param {NodeReachedCallback | null} nodeReached
         * @returns {Promise}
         */
        static async move_by_path(destination, nodeReached = null)
        {
            Mover.#stopping = false;
            Mover.#stopped = false;
            let data = await Mover.get_path({x: Math.round(character.x), y: Math.round(character.y), map: character.map}, destination);

            if(data == null || data === false || data.path ==  null)
            {
                Mover._log("Failed to get path: Invalid response: ", data);
                await Mover.smart_moveX(destination);
                Mover.#stopped = true;
                return;
            }

            if(data.error)
            {
                Mover._log("Failed to get path: ", data.error);
                await Mover.smart_moveX(destination);
                Mover.#stopped = true;
                return;
            }

            //Mover._log(`Path calculation took ${data.time}ms`, data.path);


            Mover.path = data.path;
            Mover.currentStep = 0;

            for(let i in data.path)
            {
                if(Mover.#stopping)
                    break;

                Mover.currentStep = i;

                if(character.dead || character.rip)
                {
                    Mover.path = null;
                    Mover.#stopped = true;
                    return;
                }

                let step = data.path[i];
                if(step.action == "Move")
                {
                    let moved = await Mover.moveX(step.x, step.y);
                    if(!moved)
                    {
                        Mover._log("Failed to move to ", step);
                        await Mover.smart_moveX(destination);
                        Mover.path = null;
                        Mover.#stopped = true;
                        return;
                    }
                }
                else if(step.action == "Teleport")
                {
                    await transport(step.action_target, step.target_spawn);
                    await Mover._sleep(100);
                    while(is_transporting(character))
                        await Mover._sleep(100);
                    await Mover._sleep(500);
                }
                else if(step.action == "Town")
                {
                    await Mover.useTown();
                }

                if(nodeReached != null)
                {
                    if(nodeReached(i, data.path.length, step) === false)
                        break;
                }
            }

            Mover.path = null;
            Mover.#stopped = true;
        }

        static async useTown()
        {
            while(is_on_cooldown("use_town"))
                await Mover._sleep(100);

            await use_skill("use_town");
            await Mover._sleep(1000);
            while(is_transporting(character))
                await Mover._sleep(500);
            await Mover._sleep(250);
        }

        /**
         * Get a path from [start] to [destination] using the pathfinder service.
         * @static
         * @param {{x: number, y: number, map: string}} start
         * @param {{x: number, y: number, map: string}|string|{to: string}} destination
         * @returns {Promise<{[path]: object[], [time]: number, error: string|null}>}
         */
        static async get_path(start, destination)
        {
            if(is_string(destination))
                destination = {to: destination};

            let startPos = start;
            let endPos = null;

            if(typeof(start) != "object")
                return {"error": `Start is not an object`};

            if("x" in destination)
                endPos = {x: Math.round(destination.x), y: Math.round(destination.y), map: destination.map || character.map};
            else if("to" in destination || "map" in destination)
            {
                if(destination.to == "town")
                    destination.to = "main";
                if(G.monsters[destination.to])
                {
                    let locations = [],  theone;
                    for(let name in G.maps)
                    {
                        (G.maps[name].monsters || []).forEach(function(pack){
                            if(pack.type != destination.to || G.maps[name].ignore ||  G.maps[name].instance)
                                return;
                            if(pack.boundaries)
                            {
                                pack.last = pack.last || 0;
                                let boundary = pack.boundaries[pack.last % pack.boundaries.length];
                                pack.last++;
                                locations.push([boundary[0], (boundary[1] + boundary[3]) / 2, (boundary[2]  + boundary[4]) / 2]);
                            }
                            else if(pack.boundary)
                            {
                                let boundary = pack.boundary;
                                locations.push([name, (boundary[0] + boundary[2]) / 2, (boundary[1] + boundary[3]) / 2]);
                            }
                        });
                    }

                    if(locations.length)
                    {
                        theone = random_one(locations);
                        endPos = {x: theone[1], y: theone[2], map: theone[0]};
                    }
                }
                else if(G.maps[destination.to || destination.map])
                {
                    let mapName = destination.to || destination.map;
                    endPos = {x: G.maps[mapName].spawns[0][0], y: G.maps[mapName].spawns[0][1], map: mapName};
                }
                else if((character.map in Mover.#customPositions && destination.to in Mover.#customPositions[character.map]) || destination.to in Mover.#customPositions.any)
                {
                    if(character.map in Mover.#customPositions && destination.to in Mover.#customPositions[character.map])
                        endPos = Mover.#customPositions[character.map][destination.to];
                    else
                        endPos = Mover.#customPositions.any[destination.to];
                }
                else if(find_npc(destination.to))
                {
                    var l = find_npc(destination.to);
                    endPos = {x: l.x, y: l.y + 15, map: l.map};
                }
            }

            if(!endPos)
                return {"error": "Unrecognized location"};

            try
            {
                let res = await fetch("https://almapper.zinals.tech:42805/FindPath/", {
                    method: "POST",
                    mode: "cors",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        fromMap: startPos.map,
                        fromX: startPos.x,
                        fromY: startPos.y,
                        toMap: endPos.map,
                        toX: endPos.x,
                        toY: endPos.y,
                        apiKey: Mover.ApiKey,
                        runspd: character.speed
                    })
                });

                let result = await res.json();

                //console.log("Got response", result);

                if(result == null || typeof(result) != "object")
                    return {error: "Invalid response"};

                return result;
            }
            catch(ex)
            {
                if(!is_string(ex))
                    ex = JSON.stringify(ex);
                return {error: ex};
            }
        }

        /**
         * Emulates the standard move command, but ensures that the character doesn't get stuck in the same position.
         * @static
         * @param {number | {x: number, y: number, map: string}} x
         * @param {number} [y]
         * @returns {Promise}
         */
        static async moveX(x, y)
        {
            if(typeof(x) == "object")
            {
                let err = Mover._ensureRequiredFields(["x", "y"], [x]);
                if(err != null)
                {
                    Mover._log(err);
                    return false;
                }
                else
                {
                    y = x.y;
                    x = x.x;
                }
            }

            if(x == Math.round(character.x) && y == Math.round(character.y))
                return true;

            let tries = 0;
            let pos = [character.x, character.y, character.map];
            while(true)
            {
                if(tries >= 5)
                    return false;

                await move(x, y);
                await sleep(5);
                if(Math.round(character.x) == pos[0] && Math.round(character.y) == pos[1] && character.map == pos[2])
                {
                    if(x == pos[0] && y == pos[1])
                        return true;
                    tries++;

                    await sleep(250);
                }
                else
                    break;
            }

            return true;
        }

        /**
         * Emulates the standard smart_move command, but ensures that the character has stopped before continuing.
         * @static
         * @param {{x: number, y: number, map: string} | string} position
         * @returns {Promise}
         */
        static async smart_moveX(position)
        {
            let done = false;

            smart_move(position).then(function(data){
                done = true;
            }).catch(function(data)
            {
                done = true;
            });

            while(!done)
                await sleep(250);

            while(smart != null && smart.moving)
                await sleep(250);
        }

        /**
         * Pathfinder logging method
         * @static
         * @private
         * @returns {void}
         */
        static _log()
        {
            if(Mover.logToConsole)
                console.log.apply(this, arguments);

            if(Mover.logToWindow)
            {
                let str = "";
                for(let i in arguments)
                {
                    let arg = arguments[i];
                    if(typeof(arg) == "object")
                        str += JSON.stringify(arg);
                    else
                        str += arg;
                }
                console.log(str);
            }
        }

        /**
         * Sleep/Wait for a specific amount of milliseconds.
         * @static
         * @param {number} ms
         * @private
         * @returns {Promise}
         */
        static _sleep(ms)
        {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
    }

    globalThis.Mover = Mover;
    window.Mover = Mover;
}      