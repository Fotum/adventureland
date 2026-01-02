import { CMData, Mage, Pathfinder, PingCompensatedCharacter, Tools } from "alclient";
import { Loop, LoopName, Strategy, CharacterRunner, StrategyName } from "../character_runner";
import { filterExecutors } from "../../base/functions";


export type MagiportConfig = {
    delay: number
    range: number
}

export const DEFAULT_MAGIPORT_CONFIG: MagiportConfig = {
    delay: 5000,
    range: 250
};

export class MagiportSmartMovingStrategy implements Strategy<Mage> {
    public loops = new Map<LoopName, Loop<PingCompensatedCharacter>>();

    private static recentlyMagiported = new Map<string, number>();

    private _name: StrategyName = "magiport";
    private executors: CharacterRunner<PingCompensatedCharacter>[];
    private options: MagiportConfig;

    public constructor(executors: CharacterRunner<PingCompensatedCharacter>[], options: MagiportConfig = DEFAULT_MAGIPORT_CONFIG) {
        this.executors = executors;
        this.options = options;

        this.loops.set("magiport", {
            fn: async (bot: Mage) => {
                await this.magiport(bot);
            },
            interval: ["magiport"]
        });
    }

    public get name() {
        return this._name;
    }

    protected async magiport(bot: Mage) {
        if (!bot.canUse("magiport")) return;
        if (bot.map.startsWith("bank")) return;
        if (bot.smartMoving) return;
        if (bot.getEntity({ type: "fieldgen0", withinRange: 400 })) return;

        for (let context of filterExecutors(this.executors, { serverData: bot.serverData })) {
            let friend = context.bot;
            if (friend.id == bot.id) continue;
            if (!friend.smartMoving) continue;
            if (friend.map.startsWith("bank")) continue;
            if (Pathfinder.canWalkPath(bot, friend)) continue;
            if (!Pathfinder.canWalkPath(bot, friend.smartMoving)) continue;
            if (Tools.squaredDistance(friend, friend.smartMoving) < (2 * this.options.range)) continue;
            if (Tools.squaredDistance(bot, friend.smartMoving) > this.options.range) continue;

            let lastMagiport = MagiportSmartMovingStrategy.recentlyMagiported.get(friend.id);
            if (lastMagiport && (lastMagiport + this.options.delay) > Date.now()) continue;

            try {
                await bot.magiport(friend.id);
                MagiportSmartMovingStrategy.recentlyMagiported.set(friend.id, Date.now());

                await friend.acceptMagiport(bot.id);
                await friend.stopSmartMove();
                await friend.stopWarpToTown();
            } catch (ex) {
                console.error(ex);
            }
        }
    }
}

export type MagiportServiceConfig = {
    allowList?: string[]
}

export class MagiportServiceStrategy implements Strategy<Mage> {
    public loops = new Map<LoopName, Loop<PingCompensatedCharacter>>();

    private _name: StrategyName = "utility";
    private options: MagiportServiceConfig;
    private inviteListener: (data: CMData) => Promise<unknown>;

    public constructor(options: MagiportServiceConfig = {}) {
        this.options = options;
    }

    public onApply(bot: Mage) {
        this.inviteListener = async (data: CMData) => {
            if (this.options.allowList && !this.options.allowList.includes(data.name)) return;
            if (!data.message.includes("magiport")) return;
            if (bot.players.get(data.name)) return;
            if (!bot.canUse("magiport")) return;

            return bot.magiport(data.name);
        }
        bot.socket.on("cm", this.inviteListener);
    }

    public onRemove(bot: Mage) {
        if (this.inviteListener) bot.socket.off("cm", this.inviteListener);
    }

    public get name() {
        return this._name;
    }
}