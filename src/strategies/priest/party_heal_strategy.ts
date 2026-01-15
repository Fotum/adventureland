import { Priest } from "alclient";
import { filterRunners, ignoreExceptions } from "../../base/functions/general";
import { PartyController } from "../../controller/party_controller";
import { Loop, LoopName, Loops, Strategy, StrategyName } from "../character_runner";

export type PartyHealConfig = {
    hp?: number;
    hpMissing?: number;
    hpRatio?: number;
};

export const DEFUALT_PARTY_HEAL_CONFIG: PartyHealConfig = {
    hpRatio: 0.45
};

export class PartyHealStrategy implements Strategy<Priest> {
    public loops: Loops<Priest> = new Map<LoopName, Loop<Priest>>();

    private _name: StrategyName = "party_heal";
    private partyController: PartyController;
    private options: PartyHealConfig;

    constructor(partyController: PartyController, options: PartyHealConfig = DEFUALT_PARTY_HEAL_CONFIG) {
        this.partyController = partyController;

        if (options.hp === undefined && options.hpMissing === undefined && options.hpRatio === undefined)
            this.options = DEFUALT_PARTY_HEAL_CONFIG;
        else this.options = options;

        this.loops.set("party_heal", {
            fn: async (bot: Priest) => {
                await this.partyHeal(bot);
            },
            interval: ["partyheal"]
        });
    }

    public get name() {
        return this._name;
    }

    private async partyHeal(bot: Priest): Promise<unknown> {
        if (bot.rip) return;
        if (!bot.canUse("partyheal")) return;
        if (!bot.party) return;

        let nearbyRunners = filterRunners(this.partyController.getRunners(), { serverData: bot.serverData });
        for (let runner of nearbyRunners) {
            let myBot = runner.bot;

            if (myBot.rip) continue;
            if (myBot.party !== bot.party) continue;

            if (
                (this.options.hp !== undefined && myBot.hp < this.options.hp) ||
                (this.options.hpRatio !== undefined && myBot.hp / myBot.max_hp < this.options.hpRatio) ||
                (this.options.hpMissing !== undefined && myBot.max_hp - myBot.hp > this.options.hpMissing)
            ) {
                return bot.partyHeal().catch(ignoreExceptions);
            }
        }
    }
}
