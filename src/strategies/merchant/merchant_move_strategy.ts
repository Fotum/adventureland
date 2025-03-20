import { IPosition, Merchant, MonsterName, Pathfinder, PingCompensatedCharacter, SmartMoveOptions } from "alclient";
import { Loop, LoopName, Loops, Strategy, StrategyName } from "../strategy_executor";
import { SpecialName } from "../../configs/boss_configs";


export type MoveExecuteConfig = {
    
}

export class MoveExecuteStrategy implements Strategy<Merchant> {
    public loops: Loops<Merchant> = new Map<LoopName, Loop<Merchant>>;

    private spawns: (IPosition & SpecialName)[];
    private _name: StrategyName = "move";

    public constructor() {
        this.loops.set("move", {
            fn: async (bot: PingCompensatedCharacter) => {
                if (bot.smartMoving || bot.rip) return;
                this.move(bot);
            },
            interval: 1000
        });
    }

    protected async move(bot: PingCompensatedCharacter): Promise<void> {
        let smartMoveOptions: SmartMoveOptions = {
            getWithin: bot.range - 10,
            stopIfTrue: async (): Promise<boolean> => {
                return true;
            }
        };


    }

    public get name() {
        return this._name;
    }
}