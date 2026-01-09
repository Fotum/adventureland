import { CharacterType, Entity, Game, IPosition, MapName, MonsterName, PingCompensatedCharacter } from "alclient";
import { EventConfig, getEventConfig } from "../../configs/events/event_configs";
import { PartyController } from "../../controller/party_controller";
import { Strategy } from "../../strategies/character_runner";
import { EventName, SpecialName } from "../constants";
import { EVENTS, SPECIAL_MONSTERS } from "../settings";

export type PreparedScheduleEvent = {
    id: string;
    name: EventName;
    targets: MonsterName[];
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
export function getActiveScheduleEvents(partyController: PartyController): PreparedScheduleEvent[] {
    let preparedEvents: PreparedScheduleEvent[] = [];

    for (const runner of partyController.getRunners()) {
        if (!runner.isReady()) continue;

        const bot: PingCompensatedCharacter = runner.bot;
        Object.keys(bot.S).forEach((key) => {
            let eventIsActive: boolean = EVENTS.get(key) ?? false;
            if (eventIsActive && (!("live" in bot.S[key]) || bot.S[key].live)) {
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
                    destination: joinTo ? joinTo : { map: bot.S[key].map, x: bot.S[key].x, y: bot.S[key].y },
                    waitForRespawnMs: eventConfig.waitForRespawnMs,
                    override: eventConfig.override,
                    strategies: eventConfig.strategies
                });
            }
        });
        break;
    }

    return preparedEvents;
}

export type PreparedSpecialMonster = {
    id: string;
    name: SpecialName;
    targets: MonsterName[];
    moveTo: IPosition;
    strategies: {
        [T in CharacterType]?: {
            attack?: Strategy<PingCompensatedCharacter>;
            move?: Strategy<PingCompensatedCharacter>;
        };
    };
};
export function getBossesAroundCharacters(partyController: PartyController): PreparedSpecialMonster[] {
    let lookFor: Map<MonsterName, boolean> = new Map<MonsterName, boolean>(
        Array.from(SPECIAL_MONSTERS.entries()).filter(([, isActive]) => isActive)
    );

    let preparedSpecials: PreparedSpecialMonster[] = [];
    for (const runner of partyController.getRunners()) {
        let specialsAround: Entity[] = runner.bot.getEntities({ typeList: Array.from(lookFor.keys()) });
        for (let special of specialsAround) {
            partyController.bossTimers.set(special.type, Date.now());

            let specialConfig: EventConfig = getEventConfig(special.type, partyController);
            preparedSpecials.push({
                id: special.id,
                name: special.type as SpecialName,
                targets: specialConfig.targets,
                moveTo: { map: special.map, x: special.x, y: special.y },
                strategies: specialConfig.strategies
            });
        }
    }

    return preparedSpecials;
}
