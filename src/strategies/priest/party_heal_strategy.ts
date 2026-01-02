import { Priest } from "alclient";
import { filterRunners, ignoreExceptions } from "../../base/functions";
import { PartyController } from "../../controller/party_controller";
import { Loop, LoopName, Loops, Strategy, StrategyName } from "../character_runner";


export type PartyHealConfig = {
    stopWhenMp: number
    when: {
        hp?: number
        hpMissing?: number
        hpRatio?: number
    }
}

export const DEFUALT_PARTY_HEAL_CONFIG: PartyHealConfig = {
    stopWhenMp: 0.15,
    when: {
        hpRatio: 0.4
    }
};

export class PartyHealStrategy implements Strategy<Priest> {
    public loops: Loops<Priest> = new Map<LoopName, Loop<Priest>>;

    private _name: StrategyName = "party_heal";
    private partyController: PartyController;
    private options: PartyHealConfig;

    constructor(partyController: PartyController, options: PartyHealConfig = DEFUALT_PARTY_HEAL_CONFIG) {
        this.partyController = partyController;

        if (options.when.hp === undefined && options.when.hpMissing === undefined && options.when.hpRatio === undefined) this.options = DEFUALT_PARTY_HEAL_CONFIG;
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
        if (this.options.stopWhenMp < (bot.mp / bot.max_mp)) return;
        if (!bot.canUse("partyheal")) return;
        if (!bot.party) return;

        let nearbyExecutors = filterRunners(this.partyController, { serverData: bot.serverData });
        for (let executor of nearbyExecutors) {
            let myBot = executor.bot;

            if (myBot.rip) continue;
            if (myBot.party !== bot.party) continue;

            if (
                (this.options.when.hpRatio !== undefined && (myBot.max_hp / myBot.hp) < this.options.when.hpRatio) ||
                (this.options.when.hp !== undefined && myBot.hp < this.options.when.hp) ||
                (this.options.when.hpMissing !== undefined && (myBot.max_hp - myBot.hp) > this.options.when.hpMissing)
            ) {
                return bot.partyHeal().catch(ignoreExceptions);
            }
        }
    }
}