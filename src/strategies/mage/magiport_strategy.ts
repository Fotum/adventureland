import { Mage, Pathfinder, Tools, type CMData } from "alclient";
import { filterRunners } from "../../base/functions/filter.js";
import { ignoreExceptions } from "../../base/functions/general.js";
import { FRIENDLY_CHARACTERS, MY_CHARACTERS } from "../../base/settings.js";
import { PartyController } from "../../controller/party_controller.js";
import logger from "../../logger.js";
import { type Loop, type LoopName, type Strategy, type StrategyName } from "../character_runner.js";

export type MagiportConfig = {
    delay: number;
    range: number;
    enableSmart: boolean;
    enableService: boolean;
    allowList?: string[];
};

export const DEFAULT_MAGIPORT_CONFIG: MagiportConfig = {
    delay: 1000,
    range: 150,
    enableSmart: true,
    enableService: true,
    allowList: [...MY_CHARACTERS.keys(), ...FRIENDLY_CHARACTERS]
};

export class MagiportStrategy implements Strategy<Mage> {
    public loops = new Map<LoopName, Loop<Mage>>();

    private static recentlyMagiported = new Map<string, number>();

    private magiportCmListener: (data: CMData) => Promise<unknown>;

    private _name: StrategyName = "magiport";
    private partyController: PartyController;
    private config: MagiportConfig;

    public constructor(partyController: PartyController, config: MagiportConfig = DEFAULT_MAGIPORT_CONFIG) {
        this.partyController = partyController;
        this.config = config;

        this.loops.set("magiport", {
            fn: async (bot: Mage) => {
                await this.magiport(bot).catch(ignoreExceptions);
            },
            interval: ["magiport"]
        });
    }

    public onApply(bot: Mage) {
        this.magiportCmListener = async (data: CMData) => {
            if (!this.config.enableService) return;
            if (this.config.allowList && !this.config.allowList.includes(data.name)) return;
            if (!data.message.includes("magiport")) return;
            if (bot.players.get(data.name)) return;
            if (!bot.canUse("magiport")) return;

            return bot.magiport(data.name);
        };
        bot.socket.on("cm", this.magiportCmListener);
    }

    public onRemove(bot: Mage) {
        if (this.magiportCmListener) bot.socket.off("cm", this.magiportCmListener);
    }

    public get name() {
        return this._name;
    }

    protected async magiport(bot: Mage) {
        if (!this.config.enableSmart) return;
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

            let lastMagiport = MagiportStrategy.recentlyMagiported.get(friend.id);
            if (lastMagiport && lastMagiport + this.config.delay > Date.now()) continue;

            try {
                await bot.magiport(friend.id);
                MagiportStrategy.recentlyMagiported.set(friend.id, Date.now());

                await friend.acceptMagiport(bot.id);
                await friend.stopSmartMove();
                await friend.stopWarpToTown();
            } catch (ex) {
                logger.error(ex);
            }
        }
    }
}
