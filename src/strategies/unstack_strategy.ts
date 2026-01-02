import { Entity, PingCompensatedCharacter } from "alclient";
import { ignoreExceptions } from "../base/functions";
import { Loop, LoopName, Strategy, StrategyName } from "./character_runner";


export class UnstackStrategy<T extends PingCompensatedCharacter> implements Strategy<T> {
    public loops = new Map<LoopName, Loop<PingCompensatedCharacter>>;

    private _name: StrategyName = "utility";

    public constructor() {
        this.loops.set("avoidance", {
            fn: async (bot: PingCompensatedCharacter) => {
                await this.unstack(bot);
            },
            interval: 1000
        });
    }

    private async unstack(bot: PingCompensatedCharacter): Promise<void> {
        let entities: Entity[] = bot.getEntities({ withinRangeOf: bot, withinRange: 15 });
        if (entities.length == 0) return;

        let x: number = -15 + Math.round(30 * Math.random());
        let y: number = -15 + Math.round(30 * Math.random());

        await bot.move(bot.x + x, bot.y + y).catch(ignoreExceptions);
    }

    public get name(): StrategyName {
        return this._name;
    }
}

// export class UnstuckStrategy<T extends PingCompensatedCharacter> implements Strategy<T> {
//     private _name: StrategyName = "utility";
//     private onHit: (data: HitData) => Promise<void>;
    
//     public constructor() {}

//     public onApply(bot: T): void {
//         this.onHit = async (data: HitData): Promise<void> => {
//             if (data.id !== bot.id) return;
//             if (data.stacked && !data.stacked.includes(bot.id)) return;
            
//             let x: number = -15 + Math.round(30 * Math.random());
//             let y: number = -15 + Math.round(30 * Math.random());
//             await bot.move(bot.x + x, bot.y + y).catch(ignoreExceptions);
//         }

//         bot.socket.on("hit", this.onHit);
//     }

//     public onRemove(bot: T): void {
//         if (this.onHit) bot.socket.off("hit", this.onHit);
//     }

//     public get name() {
//         return this._name;
//     }
// }