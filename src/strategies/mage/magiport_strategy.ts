import { CMData, Mage, Pathfinder, PingCompensatedCharacter, Tools } from "alclient";
import { filterRunners } from "../../base/functions/general";
import logger from "../../logger";
import { PartyController } from "../../controller/party_controller";
import { Loop, LoopName, Strategy, StrategyName } from "../character_runner";

export type MagiportConfig = {
    delay: number;
    range: number;
};

export const DEFAULT_MAGIPORT_CONFIG: MagiportConfig = {
    delay: 1000,
    range: 150
};

export class MagiportSmartMovingStrategy implements Strategy<Mage> {
    public loops = new Map<LoopName, Loop<PingCompensatedCharacter>>();

    private static recentlyMagiported = new Map<string, number>();

    private _name: StrategyName = "magiport";
    private partyController: PartyController;
    private config: MagiportConfig;

    public constructor(partyController: PartyController, config: MagiportConfig = DEFAULT_MAGIPORT_CONFIG) {
        this.partyController = partyController;
        this.config = config;

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

        for (let runner of filterRunners(this.partyController.getRunners(), { serverData: bot.serverData })) {
            let friend = runner.bot;
            if (friend.id == bot.id) continue;
            if (!friend.smartMoving) continue;
            if (friend.map.startsWith("bank")) continue;
            if (Pathfinder.canWalkPath(bot, friend)) continue;
            if (!Pathfinder.canWalkPath(bot, friend.smartMoving)) continue;
            if (Tools.distance(friend, friend.smartMoving) < 2 * this.config.range) continue;
            if (Tools.distance(bot, friend.smartMoving) > this.config.range) continue;

            let lastMagiport = MagiportSmartMovingStrategy.recentlyMagiported.get(friend.id);
            if (lastMagiport && lastMagiport + this.config.delay > Date.now()) continue;

            try {
                await bot.magiport(friend.id);
                MagiportSmartMovingStrategy.recentlyMagiported.set(friend.id, Date.now());

                await friend.acceptMagiport(bot.id);
                await friend.stopSmartMove();
                await friend.stopWarpToTown();
            } catch (ex) {
                logger.error(ex);
            }
        }
    }
}

export type MagiportServiceConfig = {
    allowList?: string[];
};
export class MagiportServiceStrategy implements Strategy<Mage> {
    public loops = new Map<LoopName, Loop<PingCompensatedCharacter>>();

    private _name: StrategyName = "utility";
    private options: MagiportServiceConfig;
    private inviteListener: (data: CMData) => Promise<unknown>;

    public constructor(options: MagiportServiceConfig) {
        this.options = options;
    }

    public onApply(bot: Mage) {
        this.inviteListener = async (data: CMData) => {
            if (this.options.allowList && !this.options.allowList.includes(data.name)) return;
            if (!data.message.includes("magiport")) return;
            if (bot.players.get(data.name)) return;
            if (!bot.canUse("magiport")) return;

            return bot.magiport(data.name);
        };
        bot.socket.on("cm", this.inviteListener);
    }

    public onRemove(bot: Mage) {
        if (this.inviteListener) bot.socket.off("cm", this.inviteListener);
    }

    public get name() {
        return this._name;
    }
}
