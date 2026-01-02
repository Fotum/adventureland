import { Game, PingCompensatedCharacter } from "alclient";
import { CharacterRunner } from "../strategies/character_runner";
import { SpecialName } from "../configs/boss_configs";
import { INFINITE_PAST, SPECIAL_MONSTERS } from "../base/constants";
import fs from "fs";
import { SpotConfig, SpotName, getSpotConfig } from "../configs/spot_configs";
import { Task, TaskTarget } from "./bot_task";


type BossTimer = {
    lastCheck: Date
    respawn: number
}

export class PartyController {
    private defaultSpot: SpotConfig;

    private executors: CharacterRunner<PingCompensatedCharacter>[];
    private bossTimers = new Map<SpecialName, BossTimer>();

    private states = new Map<string, TaskTarget>();
    private actionQueues = new Map<string, Task[]>();

    public constructor(executors: CharacterRunner<PingCompensatedCharacter>[], defaultSpot: SpotName) {
        this.executors = executors;
        this.defaultSpot = getSpotConfig(defaultSpot, executors);

        this.restoreState();
    }

    private async stateControlLoop(): Promise<void> {
        for (let executor of this.executors) {
            let bot: PingCompensatedCharacter = executor.bot;
            if (bot.rip) continue;

            let currState: TaskTarget = this.states.get(bot.id);
            let botTasks: Task[] = this.actionQueues.get(bot.id);
            
        }

        setTimeout(this.stateControlLoop, 500);
    }

    private async taskExecuteLoop(): Promise<void> {

    }

    private restoreState(): void {
        let loadedSettings = this.loadStates();
        for (let executor of this.executors) {
            let botName: string = executor.bot.id;
            let state: TaskTarget = loadedSettings.states[botName];

            if (state) this.states.set(botName, state);
            else this.states.set(botName, { name: "afk" });
        }

        // Restore action queue

        for (let specialNm of SPECIAL_MONSTERS) {
            let respawnTime: number = Game.G.monsters[specialNm].respawn;
            let savedTimer: Date = loadedSettings.bossTimers[specialNm];

            if (savedTimer) this.bossTimers.set(specialNm, { lastCheck: savedTimer, respawn: respawnTime });
            else this.bossTimers.set(specialNm, { lastCheck: INFINITE_PAST, respawn: respawnTime });
        }
    }

    private loadStates(): { states: {}, bossTimers: {} } {
        let result = { states: {}, bossTimers: {} };
        let loadPath: string = "../../settings/last_state.json";
        if (fs.existsSync(loadPath)) {
            let root = JSON.parse(fs.readFileSync(loadPath, { encoding: "utf-8" }));
            for (let key in root.states) {
                result.states[key] = root.states[key];
            }

            // Restore action queue

            for (let key in root.bossTimers) {
                result.bossTimers[key] = root.bossTimers[key];
            }
        }

        fs.unlinkSync(loadPath);
        return result;
    }

    private saveStates(): void {
        let root = { states: {}, bossTimers: {} };
        for (let [name, state] of this.states) {
            root.states[name] = state;
        }

        // Save action queue

        for (let [name, timer] of this.bossTimers) {
            root.bossTimers[name] = timer.lastCheck;
        }

        fs.writeFileSync("../../settings/last_state.json", JSON.stringify(root), { encoding: "utf-8" });
    }
}