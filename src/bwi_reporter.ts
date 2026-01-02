import { PingCompensatedCharacter } from "alclient";
import BotWebInterface from "bot-web-interface";
import prettyMilliseconds from "pretty-ms";
import { PartyController } from "./controller/party_controller";


type BWIMetricSchema = {
    name: string
    type: string
    label: string
    options?: {}
    getter: () => any
}
type BWIDataSource = {
    name: string
    realm: string
    rip: boolean
    level: number
    health: number
    maxHealth: number
    mana: number
    maxMana: number
    xp: number
    maxXp: number
    isize: number
    esize: number
    gold: number
    party: string
    status: string
    target: string
    cc: number
    xpPh: number
    xpHisto: number[]
    goldHisto: number[]
}

export class BWIReporter {
    private statBeatIntrval: number;
    private bwiInstance: BotWebInterface;
    private statisticsInterval: NodeJS.Timeout;
    private controller: PartyController;

    private botDataSources = new Map<string, BWIDataSource>();

    public constructor(controller: PartyController, port: number = 924, statBeatInterval: number = 500) {
        this.statBeatIntrval = statBeatInterval;
        this.controller = controller;

        this.bwiInstance = new BotWebInterface({
            port: port,
            password: null,
            updateRate: statBeatInterval
        });

        for (let executor of controller.getRunners()) {
            let bot: PingCompensatedCharacter = executor.bot;

            let dataSourceObj: BWIDataSource = {
                name: bot.id,
                realm: `${bot.serverData.region}${bot.serverData.name}`,
                rip: bot.rip,
                level: bot.level,
                health: bot.hp,
                maxHealth: bot.max_hp,
                mana: bot.mp,
                maxMana: bot.max_mp,
                xp: bot.xp,
                maxXp: bot.max_xp,
                isize: bot.isize,
                esize: bot.esize,
                gold: bot.gold,
                party: bot.party,
                status: "Doing something",
                target: "None",
                cc: bot.cc,
                xpPh: 0,
                xpHisto: [],
                goldHisto: []
            };

            this.botDataSources.set(executor.bot.id, dataSourceObj);
            this.createMonitorUi(this.botDataSources.get(executor.bot.id));
        }

        this.statisticsInterval = setInterval(this.updateStatistics.bind(this), this.statBeatIntrval);
    }

    private updateStatistics(): void {
        for (let executor of this.controller.getRunners()) {
            let bot: PingCompensatedCharacter = executor.bot;
            let dataSource: BWIDataSource = this.botDataSources.get(bot.id);

            dataSource.realm = `${bot.serverData.region}${bot.serverData.name}`;
            dataSource.rip = bot.rip;
            if (dataSource.level != bot.level) {
                dataSource.xpHisto = [];
            }
            dataSource.level = bot.level;
            dataSource.health = bot.hp;
            dataSource.maxHealth = bot.max_hp;
            dataSource.mana = bot.mp;
            dataSource.maxMana = bot.max_mp;
            dataSource.xp = bot.xp;
            dataSource.maxXp = bot.max_xp;
            dataSource.isize = bot.isize;
            dataSource.esize = bot.esize;
            dataSource.gold = bot.gold;
            dataSource.party = bot.party;
            dataSource.target = bot.getTargetEntity()?.name ?? "None";
            dataSource.cc = bot.cc;

            dataSource.goldHisto.push(bot.gold);
            dataSource.goldHisto.slice(-100);

            dataSource.xpHisto.push(bot.xp);
            dataSource.xpHisto.slice(-100);
            dataSource.xpPh = this.valPh(dataSource.xpHisto);
        }
    }

    private createMonitorUi(ds: BWIDataSource): void {
        const schema: BWIMetricSchema[] = [
            { name: "name", type: "text", label: "Name", getter: () => ds.name },
            { name: "realm", type: "text", label: "Realm", getter: () => ds.realm },
            { name: "not_rip", type: "text", label: "Alive", getter: () => ds.rip ? "No" : "Yes" },
            { name: "level", type: "text", label: "Level", getter: () => ds.level },
            { name: "health", type: "labelProgressBar", label: "Health", options: { color: "red" }, getter: () => this.quickBarVal(ds.health, ds.maxHealth) },
            { name: "mana", type: "labelProgressBar", label: "Mana", options: { color: "blue" }, getter: () => this.quickBarVal(ds.mana, ds.maxMana) },
            { name: "xp", type: "labelProgressBar", label: "XP", options: { color: "green" }, getter: () => this.quickBarVal(ds.xp, ds.maxXp, true) },
            { name: "inv", type: "labelProgressBar", label: "Inventory", options: { color: "brown" }, getter: () => this.quickBarVal(ds.isize - ds.esize, ds.isize) },
            { name: "gold", type: "text", label: "Gold", getter: () => this.humanizeInt(ds.gold, 1) },
            { name: "party_leader", type: "text", label: "Chief", getter: () => ds.party || "N/A" },
            { name: "current_status", type: "text", label: "Status", getter: () => ds.status },
            { name: "target", type: "text", label: "Target", getter: () => ds.target || "None" },
            { name: "gph", type: "text", label: "Gold/h", getter: () => this.humanizeInt(this.valPh(ds.goldHisto), 1) },
            { name: "xpph", type: "text", label: "XP/h", getter: () => this.humanizeInt(ds.xpPh, 1) },
            { name: "ttlu", type: "text", label: "TTLU", getter: () => (ds.xpPh <= 0 && "N/A") || prettyMilliseconds(((ds.maxXp - ds.xp) * 3_600_000) / ds.xpPh, { unitCount: 2 }) },
            { name: "cc", type: "text", label: "CC", getter: () => Math.round(ds.cc) }
        ];

        let ui = this.bwiInstance.publisher.createInterface(
            schema.map((x) => ({
                name: x.name,
                type: x.type,
                label: x.label,
                options: x.options
            }))
        );

        ui.setDataSource(() => {
            let result = {};
            schema.forEach((x) => (result[x.name] = x.getter()));
            return result;
        });
    }

    private humanizeInt(num: number, digits: number): string {
        num = Math.round(num);
        let lookup = [
            { value: 1e3, symbol: "" },
            { value: 1e6, symbol: "k" },
            { value: 1e9, symbol: "Mil" },
            { value: 1e12, symbol: "Bil" },
            { value: 1e15, symbol: "Tril" }
        ];

        let regexp: RegExp = /\.0+$|(\.[0-9]*[1-9])0+$/;
        let item = lookup.find(function (item) {
            return Math.abs(num) < item.value;
        });

        return item
                ? ((num * 1e3) / item.value).toFixed(digits).replace(regexp, "$1") + item.symbol
                : num.toExponential(digits);
    }

    private quickBarVal(num: number, denom: number, humanize: boolean = false): [number, string] {
        let modif = (x: number): string => x.toString();
        if (humanize) {
            modif = (x: number): string => this.humanizeInt(x, 1)
        }

        return [(100 * num) / denom, `${modif(num)}/${modif(denom)}`];
    }

    private valPh(arr: number[]): number {
        if (arr.length < 2) {
            return 0;
        }

        return (
            ((arr[arr.length - 1] - arr[0]) * 3600000) /
            (arr.length - 1) / 
            this.statBeatIntrval
        );
    }
}