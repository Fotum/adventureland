import { Constants, Game, Mage, Merchant, Paladin, PingCompensatedCharacter, Priest, Ranger, Rogue, ServerIdentifier, ServerRegion, SkillName, Warrior } from "alclient"


export type Loop<T> = {
    fn: (bot: T) => Promise<unknown>
    interval: SkillName[] | Number
}
export type Loops<T> = Map<LoopName, Loop<T>>;

export type StrategyName = "base" | "attack" | "move" | "party" | "party_heal" | "magiport" | "upgrade" | "utility";
export type LoopName = "attack" | "move" | "avoidance" | "use_pots" | "buy_pots" | "loot" | "respawn" | "party" | "party_heal" | "magiport" | "mluck" | "upgrade" | "ponty" | "inventory" | "resuppply";

export interface Strategy<T> {
    name: StrategyName
    loops?: Loops<T>
    onApply?: (bot: T) => void
    onRemove?: (bot: T) => void
}

type ExecLoop<T> = Loop<T> & {
    fn: (bot: T) => Promise<unknown>
    interval: SkillName[] | Number
    started: Date
}
type ExecLoops<T> = Map<string, ExecLoop<T>>;

export class CharacterRunner<T extends PingCompensatedCharacter> {
    public bot: T;

    private started: Date;
    private stopped: boolean = false;

    private strategies: Map<StrategyName, Strategy<T>> = new Map<StrategyName, Strategy<T>>();
    private loops: ExecLoops<T> = new Map<LoopName, ExecLoop<T>>;
    private timeouts: Map<string, NodeJS.Timeout> = new Map<string, NodeJS.Timeout>();

    public constructor(bot: T, strategy: Strategy<T>) {
        this.changeBot(bot);
        this.applyStrategy(strategy);
    }

    public applyStrategy(strategy: Strategy<T>): void {
        if (!strategy) return;

        if (this.strategies.has(strategy.name))
            this.removeStrategy(strategy.name);

        if (strategy.onApply)
            strategy.onApply(this.bot);

        if (!strategy.loops) return;

        for (const [name, loop] of strategy.loops) {
            if (!loop) {
                // Stop loop
                this.stopLoop(name);
            } else if (this.loops.has(name)) {
                // Change loop
                let oldLoop: ExecLoop<T> = this.loops.get(name);
                this.loops.set(name, {
                    fn: loop.fn,
                    interval: loop.interval,
                    started: oldLoop.started
                });
            } else {
                // Start loop
                let now: Date = new Date();
                this.loops.set(name, {
                    fn: loop.fn,
                    interval: loop.interval,
                    started: now
                });

                const newLoop = async () => {
                    // Run loop
                    let started: number = Date.now();
                    try {
                        let loop: ExecLoop<T> = this.loops.get(name);
                        if (!loop || this.stopped) return;
                        if (this.bot.ready) {
                            await loop.fn(this.bot);
                        }
                    } catch (ex) {
                        console.error(`${name}`, ex);
                    }

                    // Next run
                    let loop: ExecLoop<T> = this.loops.get(name);
                    if (!loop || this.stopped) return;
                    if (loop.started.getTime() > started) return;
                    if (typeof loop.interval == "number") {
                        this.timeouts.set(
                            name,
                            setTimeout(
                                async () => {
                                    newLoop();
                                }, loop.interval
                            )
                        );
                    } else if (Array.isArray(loop.interval)) {
                        let cooldowns: number[] = loop.interval.map((skill) => this.bot.getCooldown(skill));
                        let loopCooldown: number = Math.max(50, Math.min(...cooldowns));
                        this.timeouts.set(
                            name,
                            setTimeout(
                                async () => {
                                    newLoop();
                                }, loopCooldown
                            )
                        );
                    }
                }
                newLoop().catch(console.error);
            }
        }

        this.strategies.set(strategy.name, strategy);
    }

    public applyStrategies(strategies: Strategy<T>[]): void {
        for (let strategy of strategies)
            this.applyStrategy(strategy);
    }

    public removeStrategy(stratName: StrategyName): void {
        let strategy = this.strategies.get(stratName);
        if (!strategy)
            return;

        if (strategy.loops) {
            for (let [loopName] of strategy.loops) {
                this.stopLoop(loopName);
            }
        }

        if (strategy.onRemove) strategy.onRemove(this.bot);
        this.strategies.delete(stratName);
    }

    public async reconnect(retry: boolean = true): Promise<void> {
        if (this.bot) {
            this.bot.socket.removeAllListeners("disconnect");
            this.bot.disconnect();
        }

        if (this.stopped) return;

        let newBot: PingCompensatedCharacter;
        try {
            switch (this.bot.ctype) {
                case "mage": {
                    newBot = new Mage(
                        this.bot.owner,
                        this.bot.userAuth,
                        this.bot.characterID,
                        Game.G,
                        Game.servers[this.bot.serverData.region][this.bot.serverData.name]
                    );
                    break;
                }
                case "merchant": {
                    newBot = new Merchant(
                        this.bot.owner,
                        this.bot.userAuth,
                        this.bot.characterID,
                        Game.G,
                        Game.servers[this.bot.serverData.region][this.bot.serverData.name]
                    );
                    break;
                }
                case "paladin": {
                    newBot = new Paladin(
                        this.bot.owner,
                        this.bot.userAuth,
                        this.bot.characterID,
                        Game.G,
                        Game.servers[this.bot.serverData.region][this.bot.serverData.name]
                    );
                    break;
                }
                case "priest": {
                    newBot = new Priest(
                        this.bot.owner,
                        this.bot.userAuth,
                        this.bot.characterID,
                        Game.G,
                        Game.servers[this.bot.serverData.region][this.bot.serverData.name]
                    );
                    break;
                }
                case "ranger": {
                    newBot = new Ranger(
                        this.bot.owner,
                        this.bot.userAuth,
                        this.bot.characterID,
                        Game.G,
                        Game.servers[this.bot.serverData.region][this.bot.serverData.name]
                    );
                    break;
                }
                case "rogue": {
                    newBot = new Rogue(
                        this.bot.owner,
                        this.bot.userAuth,
                        this.bot.characterID,
                        Game.G,
                        Game.servers[this.bot.serverData.region][this.bot.serverData.name]
                    );
                    break;
                }
                case "warrior": {
                    newBot = new Warrior(
                        this.bot.owner,
                        this.bot.userAuth,
                        this.bot.characterID,
                        Game.G,
                        Game.servers[this.bot.serverData.region][this.bot.serverData.name]
                    );
                    break;
                }
                default: {
                    throw new Error(`No handler for ${this.bot.ctype}`);
                }
            }

            await newBot.connect();
            this.changeBot(newBot as T);
        } catch (ex) {
            if (newBot) {
                newBot.socket.removeAllListeners("disconnect");
                newBot.disconnect();
            }

            console.error(`Couldn't reconnect ${this.bot.name}\nCause:`, ex);
            console.error(`Retry is: ${retry}`);
            if (retry) {
                let wait = /wait_(\d+)_second/.exec(ex);
                if (wait && wait[1]) {
                    this.timeouts.set(
                        "connect",
                        setTimeout(() => this.reconnect(), 2000 + Number.parseInt(wait[1])  * 1000)
                        );
                } else if (/limits/.test(ex)) {
                    this.timeouts.set(
                        "connect",
                        setTimeout(() => this.reconnect(), Constants.RECONNECT_TIMEOUT_MS)
                    );
                } else if (/nouser/.test(ex)) {
                    this.stop();
                    throw new Error(`Authorization failed for ${this.bot.name}! No longer trying to reconnect...`);
                } else {
                    this.timeouts.set(
                        "connect",
                        setTimeout(() => this.reconnect, 10000)
                    );
                }
            }
        }
    }

    public async changeServer(region: ServerRegion, id: ServerIdentifier, retry: boolean = true): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            if (this.bot) {
                this.bot.socket.removeAllListeners("disconnect");
                this.bot.disconnect();
            }

            const switchBots = async () => {
                let newBot: PingCompensatedCharacter;
                try {
                    switch (this.bot.ctype) {
                        case "mage": {
                            newBot = new Mage(
                                this.bot.owner,
                                this.bot.userAuth,
                                this.bot.characterID,
                                Game.G,
                                Game.servers[this.bot.serverData.region][this.bot.serverData.name]
                            );
                            break;
                        }
                        case "merchant": {
                            newBot = new Merchant(
                                this.bot.owner,
                                this.bot.userAuth,
                                this.bot.characterID,
                                Game.G,
                                Game.servers[this.bot.serverData.region][this.bot.serverData.name]
                            );
                            break;
                        }
                        case "paladin": {
                            newBot = new Paladin(
                                this.bot.owner,
                                this.bot.userAuth,
                                this.bot.characterID,
                                Game.G,
                                Game.servers[this.bot.serverData.region][this.bot.serverData.name]
                            );
                            break;
                        }
                        case "priest": {
                            newBot = new Priest(
                                this.bot.owner,
                                this.bot.userAuth,
                                this.bot.characterID,
                                Game.G,
                                Game.servers[this.bot.serverData.region][this.bot.serverData.name]
                            );
                            break;
                        }
                        case "ranger": {
                            newBot = new Ranger(
                                this.bot.owner,
                                this.bot.userAuth,
                                this.bot.characterID,
                                Game.G,
                                Game.servers[this.bot.serverData.region][this.bot.serverData.name]
                            );
                            break;
                        }
                        case "rogue": {
                            newBot = new Rogue(
                                this.bot.owner,
                                this.bot.userAuth,
                                this.bot.characterID,
                                Game.G,
                                Game.servers[this.bot.serverData.region][this.bot.serverData.name]
                            );
                            break;
                        }
                        case "warrior": {
                            newBot = new Warrior(
                                this.bot.owner,
                                this.bot.userAuth,
                                this.bot.characterID,
                                Game.G,
                                Game.servers[this.bot.serverData.region][this.bot.serverData.name]
                            );
                            break;
                        }
                        default: {
                            throw new Error(`No handler for ${this.bot.ctype}`);
                        }
                    }
        
                    await newBot.connect();
                    this.changeBot(newBot as T);
                } catch (ex) {
                    if (newBot) {
                        newBot.socket.removeAllListeners("disconnect");
                        newBot.disconnect();
                        newBot = undefined;
                    }

                    console.error(`Couldn't change server for ${this.bot.name}\nCause:`, ex);
                    if (retry) {
                        let wait = /wait_(\d+)_second/.exec(ex);
                        if (wait && wait[1]) {
                            setTimeout(() => switchBots(), 2000 + Number.parseInt(wait[1]) + 1000);
                        } else if (/limits/.test(ex)) {
                            setTimeout(() => switchBots(), Constants.RECONNECT_TIMEOUT_MS);
                        } else if (/ingame/.test(ex)) {
                            setTimeout(() => switchBots(), 500);
                        } else if (/nouser/.test(ex)) {
                            this.stop();
                            throw new Error(`Authorization failed for ${this.bot.name}! No longer trying to reconnect...`);
                        } else {
                            setTimeout(() => switchBots(), 10000);
                            return;
                        }
                    }

                    reject(new Error("Failed to change server, not retrying..."));
                }

                resolve();
            }

            switchBots().catch(console.error);
        });
    }

    protected changeBot(newBot: T): void {
        this.bot = newBot;
        this.bot.socket.on("disconnect", () => this.reconnect());
        this.started = new Date();

        for (let [, strategy] of this.strategies) {
            if (strategy.onApply) {
                strategy.onApply(newBot);
            }
        }
    }

    private stopLoop(loopName: string): void {
        const timeout = this.timeouts.get(loopName);
        if (timeout) clearTimeout(timeout);

        this.loops.delete(loopName);
    }

    public hasStrategy(stratName: StrategyName): boolean {
        return this.strategies.has(stratName);
    }

    public isReady(): boolean {
        return !this.stopped && this.bot && this.bot.ready && this.bot.socket.connected;
    }

    public isStopped(): boolean {
        return this.stopped;
    }

    public stop(): void {
        this.stopped = true;
        for (let [, timeout] of this.timeouts)
            clearTimeout(timeout);

        if (!this.bot) return;
        this.bot.socket.removeAllListeners("disconnect");
        this.bot.disconnect();
    }

    public uptime(): number {
        return this.isReady() ? Date.now() - this.started.getTime() : 0;
    }
}