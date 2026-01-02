import { InviteData, PingCompensatedCharacter } from "alclient"
import { Loop, LoopName, Strategy, StrategyName } from "./character_runner"


export type PartyConfig = {
    accept?: string[]
    deny?: string[]
}

export class AcceptPartyRequest<T extends PingCompensatedCharacter> implements Strategy<T> {
    private _name: StrategyName = "party";
    private options: PartyConfig;
    private onRequest: (data: { name: string }) => Promise<void>;

    public constructor(config?: PartyConfig) {
        if (!config) config = {};
        this.options = config;
    }

    public onApply(bot: T): void {
        this.onRequest = async (data: InviteData) => {
            if (this.options.accept && !this.options.accept.includes(data.name)) return;
            if (this.options.deny && this.options.deny.includes(data.name)) return;

            await bot.acceptPartyRequest(data.name).catch(console.error);
        };
        bot.socket.on("request", this.onRequest);
    }

    public onRemove(bot: T): void {
        if (this.onRequest) bot.socket.off("request", this.onRequest);
    }

    public get name() {
        return this._name;
    }
}

export class RequestParty<T extends PingCompensatedCharacter> implements Strategy<T> {
    public loops = new Map<LoopName, Loop<T>>;

    private partyLeader: string;
    private _name: StrategyName = "party";

    public constructor(partyLeader: string) {
        this.partyLeader = partyLeader;

        this.loops.set("party", {
            fn: async (bot: T) => {
                await this.requestParty(bot);
            },
            interval: 2000
        });
    }

    public get name() {
        return this._name;
    }

    private async requestParty(bot: T): Promise<void> {
        if (!bot.partyData?.list?.includes(this.partyLeader)) {
            return bot.sendPartyRequest(this.partyLeader).catch(console.error);
        }
    }
}