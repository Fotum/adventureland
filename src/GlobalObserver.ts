import { EntityModel, Game, ItemDataTrade, MonsterName, Observer, PingCompensatedCharacter, RespawnModel, ServerIdentifier, ServerRegion } from "alclient";
import fs from "fs";


const SERVER_OBSERVERS: Observer[] = [];
const CREDENTIALS_PATH: string = "credentials.json";
const CREDENTIALS: any = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, "utf8"));
async function prepareObservers() {
    if ((CREDENTIALS.email && CREDENTIALS.password) || (CREDENTIALS.userAuth && CREDENTIALS.userID)) {
        await Game.loginJSONFile(CREDENTIALS_PATH);
        await Game.getGData(true, true);

        // TODO: DEBUG
        SERVER_OBSERVERS.push(await Game.startObserver("US", "III"));

        // // Open socket to all AL servers
        // for (let sr in Game.servers) {
        //     let serverRegion: ServerRegion = (sr as ServerRegion);
        //     for (const si in Game.servers[serverRegion]) {
        //         let serverIdentifier: ServerIdentifier = (si as ServerIdentifier);

        //         console.log(`Successfully connected to ${serverRegion}${serverIdentifier}`);
        //         SERVER_OBSERVERS.push(await Game.startObserver(serverRegion, serverIdentifier));
        //     }
        // }
    }
}

async function getSpecialMonsters() {
    // if (types.length == 0) return [];

    // TODO: DEBUG
    let observer: Observer = SERVER_OBSERVERS[0];
    // let serverRegion: ServerRegion = observer.serverData.region;
    // let serverIdentifier: ServerIdentifier = observer.serverData.name;

    // let promiseResult = await Game.getMerchants();
    // console.log(promiseResult);

    let secondHandsFunc = async (secondhands: any) => {
        for (let item of secondhands) {
            console.log(item);
        }
    };

    const forSocket = async function(data: any) {
        try {
            return await secondHandsFunc(data);
        } catch (message) {
            return console.error(message);
        }
    };

    observer.socket.once("secondhands", forSocket);
    observer.socket.emit("secondhands");

    // console.log(observer.S);
    // observer.socket.close();

    // let result = [];
    // for (let entity of entities) {
    //     if (entity.in && entity.in !== entity.map) continue;
    //     result.push({
    //         hp: entity.hp,
    //         id: entity.name,
    //         lastSeen: new Date(entity.lastSeen).toISOString(),
    //         level: entity.level,
    //         map: entity.map,
    //         s: entity.s,
    //         serverIdentifier: entity.serverIdentifier,
    //         serverRegion: entity.serverRegion,
    //         target: entity.target,
    //         type: entity.type,
    //         x: entity.x,
    //         y: entity.y
    //     });
    // }

    // for (let respawn of respawns) {
    //     result.push({
    //         estimatedRespawn: new Date(respawn.estimatedRespawn).toISOString(),
    //         serverIdentifier: respawn.serverIdentifier,
    //         serverRegion: respawn.serverRegion,
    //         type: respawn.type
    //     });
    // }

    // return result;
}

await prepareObservers();
await getSpecialMonsters();