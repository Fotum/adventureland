import { PingCompensatedCharacter, type ServerData } from "alclient";
import { CharacterRunner } from "../../strategies/character_runner.js";

export type FilterRunnersOptions = {
    owner?: string;
    serverData?: ServerData;
};
export function filterRunners(
    runners: CharacterRunner<PingCompensatedCharacter>[],
    filters: FilterRunnersOptions = {}
): CharacterRunner<PingCompensatedCharacter>[] {
    let filteredRunners: CharacterRunner<PingCompensatedCharacter>[] = [];
    for (let runner of runners) {
        if (!runner.isReady()) continue;
        if (filters.owner && runner.bot.owner !== filters.owner) continue;
        if (
            filters.serverData &&
            (filters.serverData.region !== runner.bot.serverData.region ||
                filters.serverData.name !== runner.bot.serverData.name)
        )
            continue;

        filteredRunners.push(runner);
    }

    return filteredRunners;
}
