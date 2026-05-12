import {
    Entity,
    Game,
    PingCompensatedCharacter,
    type CharacterType,
    type IPosition,
    type MapName,
    type MonsterName
} from "alclient";
import { getEventConfig, type EventConfig } from "../../configs/event_configs.js";
import { PartyController } from "../../controller/party_controller.js";
import { CharacterRunner, type Strategy } from "../../strategies/character_runner.js";
import { type EventName, type SpecialName } from "../constants.js";
import { EVENTS, SPECIAL_MONSTERS } from "../settings.js";

export type PreparedEvent = {
    id: string;
    name: EventName | SpecialName;
    targets: MonsterName[];
    scheduled: boolean;
    destination: IPosition | keyof typeof Game.G.events;
    waitForRespawnMs?: number;
    override?: boolean;
    strategies: {
        [T in CharacterType]?: {
            attack?: Strategy<PingCompensatedCharacter>;
            move?: Strategy<PingCompensatedCharacter>;
        };
    };
};
export function getPreparedEvents(partyController: PartyController): PreparedEvent[] {
    let preparedEvents: PreparedEvent[] = [];

    let runners: CharacterRunner<PingCompensatedCharacter>[] = partyController.getRunners(true);
    // Check schedule
    for (const runner of runners) {
        const bot: PingCompensatedCharacter = runner.bot;
        Object.keys(bot.S).forEach((key) => {
            let eventIsActive: boolean = EVENTS.get(key) ?? false;
            // @ts-ignore: key is extracted from bot.S
            if (eventIsActive && (!("live" in bot.S[key]) || bot.S[key].live)) {
                // @ts-ignore: key will always be MapName or MonsterName
                let canJoin: boolean = Game.G.events[key]?.join ?? false;

                let joinTo: MonsterName | MapName = undefined;
                if (canJoin) {
                    if (key in Game.G.maps) {
                        joinTo = key as MapName;
                    } else if (key in Game.G.monsters) {
                        joinTo = key as MonsterName;
                    }
                }

                let eventConfig: EventConfig = getEventConfig(key, partyController);
                preparedEvents.push({
                    id: key,
                    name: key as EventName,
                    targets: eventConfig.targets,
                    scheduled: eventConfig.scheduled,
                    // @ts-ignore: key will always be MapName or MonsterName
                    destination: joinTo ? joinTo : { map: bot.S[key].map, x: bot.S[key].x, y: bot.S[key].y },
                    waitForRespawnMs: eventConfig.waitForRespawnMs,
                    override: eventConfig.override,
                    strategies: eventConfig.strategies
                });
            }
        });
        break;
    }

    // Check monsters around characters
    let lookFor: MonsterName[] = Array.from(SPECIAL_MONSTERS.entries())
        .filter(([, isActive]) => isActive)
        .map(([type]) => type);
    for (const runner of runners) {
        let specialsAround: Entity[] = runner.bot.getEntities({ typeList: lookFor });
        for (let special of specialsAround) {
            partyController.bossTimers.set(special.type, Date.now());

            let specialConfig: EventConfig = getEventConfig(special.type, partyController);
            preparedEvents.push({
                id: special.id,
                name: special.type as SpecialName,
                targets: specialConfig.targets,
                scheduled: specialConfig.scheduled,
                destination: { map: special.map, x: special.x, y: special.y },
                strategies: specialConfig.strategies
            });
        }
    }

    return preparedEvents;
}
