import { PingCompensatedCharacter, Player } from "alclient";
import { ignoreExceptions } from "../base/functions/general.js";
import { PLAYER_MIN_DISTANCE } from "../base/settings.js";
import { type Loop, type LoopName, type Strategy, type StrategyName } from "./character_runner.js";

export class UnstackStrategy<T extends PingCompensatedCharacter> implements Strategy<T> {
    public loops = new Map<LoopName, Loop<PingCompensatedCharacter>>();

    private _name: StrategyName = "unstack";

    public constructor() {
        this.loops.set("unstack", {
            fn: async (bot: PingCompensatedCharacter) => {
                if (bot.rip || bot.smartMoving || bot.moving) return;
                await this.unstack(bot);
            },
            interval: 1000
        });
    }

    private async unstack(bot: PingCompensatedCharacter): Promise<void> {
        let player: Player = bot.getPlayer({ withinRange: PLAYER_MIN_DISTANCE, returnNearest: true });
        if (!player) {
            return;
        }

        let angleFromPlayerToBot: number = Math.atan2(bot.y - player.y, bot.x - player.x);
        let x: number = PLAYER_MIN_DISTANCE * Math.cos(angleFromPlayerToBot);
        let y: number = PLAYER_MIN_DISTANCE * Math.sin(angleFromPlayerToBot);

        await bot.move(bot.x + x, bot.y + y).catch(ignoreExceptions);
    }

    public get name(): StrategyName {
        return this._name;
    }
}
