import { HitData, PingCompensatedCharacter } from "alclient";
import { Strategy, StrategyName } from "./character_runner";
import { ignoreExceptions } from "../base/functions";


export class UnstuckStrategy<T extends PingCompensatedCharacter> implements Strategy<T> {
    private _name: StrategyName = "utility";
    private onHit: (data: HitData) => Promise<void>;
    
    public constructor() {}

    public onApply(bot: T): void {
        this.onHit = async (data: HitData): Promise<void> => {
            if (data.id !== bot.id) return;
            if (data.stacked && !data.stacked.includes(bot.id)) return;
            
            let x: number = -15 + Math.round(30 * Math.random());
            let y: number = -15 + Math.round(30 * Math.random());
            await bot.move(bot.x + x, bot.y + y).catch(ignoreExceptions);
        }

        bot.socket.on("hit", this.onHit);
    }

    public onRemove(bot: T): void {
        if (this.onHit) bot.socket.off("hit", this.onHit);
    }

    public get name() {
        return this._name;
    }
}