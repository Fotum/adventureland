import { PingCompensatedCharacter } from "alclient";
import { type SpecialName } from "../base/constants.js";
import { ignoreExceptions } from "../base/functions/general.js";
import { PartyController } from "../controller/party_controller.js";
import { type Loop, type LoopName, type Strategy, type StrategyName } from "./character_runner.js";

type SurgeBossesConfig = {
    bossList: SpecialName[];
};
export class SurgeBossesStrategy<T extends PingCompensatedCharacter> implements Strategy<T> {
    public loops = new Map<LoopName, Loop<T>>();

    protected partyController: PartyController;
    protected config: SurgeBossesConfig;

    private _name: StrategyName = "utility";

    public constructor(partyController: PartyController, config: SurgeBossesConfig) {
        this.partyController = partyController;
        this.config = config;

        this.loops.set("temporal", {
            fn: async (bot: T) => {
                await this.temporalSurge(bot).catch(ignoreExceptions);
            },
            interval: ["temporalsurge"]
        });
    }

    public get name(): StrategyName {
        return this._name;
    }

    private async temporalSurge(bot: T): Promise<void> {
        if (!bot.hasItem("orboftemporal") && bot.slots.orb?.name != "orboftemporal") return;
        if (!bot.canUse("temporalsurge", { ignoreEquipped: true })) return;

        await bot.temporalSurge();
    }
}
