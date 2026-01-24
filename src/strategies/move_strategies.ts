import {
    Constants,
    Entity,
    GData,
    GMap,
    GMonster,
    Game,
    IPosition,
    MapName,
    MonsterName,
    Pathfinder,
    PingCompensatedCharacter,
    Player,
    ServerInfoDataLive,
    SmartMoveOptions,
    Tools
} from "alclient";
import { HEAL_RETREAT_RATIO, PLAYER_MIN_DISTANCE } from "../base/constants";
import { filterRunners, ignoreExceptions } from "../base/functions/general";
import { sortClosestDistance } from "../base/functions/sort";
import { Vector } from "../base/geometry/vector";
import { PartyController } from "../controller/party_controller";
import { CharacterRunner, Loop, LoopName, Strategy, StrategyName } from "./character_runner";

export class BaseMoveStrategy<T extends PingCompensatedCharacter> implements Strategy<T> {
    public loops = new Map<LoopName, Loop<T>>();

    private _name: StrategyName = "move";
    private types: MonsterName[];

    public constructor(type: MonsterName | MonsterName[]) {
        if (Array.isArray(type)) this.types = type;
        else this.types = [type];

        this.loops.set("move", {
            fn: async (bot: T) => {
                if (bot.rip) return;
                await this.move(bot).catch(ignoreExceptions);
            },
            interval: 200
        });
    }

    public get name(): StrategyName {
        return this._name;
    }

    private async move(bot: T): Promise<unknown> {
        if (bot.ctype == "priest") {
            let lowHpFriend: Player = bot.getPlayer({ isDead: false, isPartyMember: true, returnLowestHP: true });
            if (lowHpFriend && lowHpFriend.hp < lowHpFriend.max_hp * HEAL_RETREAT_RATIO && Tools.distance(bot, lowHpFriend) > bot.range) {
                return bot.smartMove(lowHpFriend, { getWithin: bot.range * 0.8 }).catch(ignoreExceptions);
            }
        } else if (bot.hp < bot.max_hp * HEAL_RETREAT_RATIO) {
            let priest: Player = bot.getPlayer({ isDead: false, isPartyMember: true, ctype: "priest", returnNearest: true });
            if (priest && Tools.distance(bot, priest) > priest.range) {
                return bot.smartMove(priest, { getWithin: priest.range * 0.8 }).catch(ignoreExceptions);
            }
        }

        let nearest: Entity = bot.getEntity({
            returnNearest: true,
            typeList: this.types,
            willBurnToDeath: false,
            willDieToProjectiles: false
        });

        if (!nearest) {
            if (!bot.smartMoving) return bot.smartMove(this.types[0], { useBlink: true });
        } else if (Tools.distance(bot, nearest) > bot.range) {
            return bot.smartMove(nearest, {
                getWithin: Math.max(0, bot.range - nearest.speed),
                resolveOnFinalMoveStart: true
            });
        }
    }
}

export class FollowMoveStrategy<T extends PingCompensatedCharacter> implements Strategy<T> {
    public loops: Map<LoopName, Loop<T>> = new Map<LoopName, Loop<T>>();

    private _name: StrategyName = "move";
    private friendToFollow: CharacterRunner<PingCompensatedCharacter> | string;

    public constructor(friendToFollow: CharacterRunner<PingCompensatedCharacter> | string) {
        this.friendToFollow = friendToFollow;
        this.loops.set("move", {
            fn: async (bot: PingCompensatedCharacter) => {
                if (bot.rip) return;
                await this.move(bot).catch(ignoreExceptions);
            },
            interval: 1000
        });
    }

    protected async move(bot: PingCompensatedCharacter): Promise<unknown> {
        let toFollow: IPosition & { ready?: boolean } = undefined;
        if (this.friendToFollow instanceof CharacterRunner) {
            toFollow = this.friendToFollow.bot;
        } else {
            toFollow = bot.getPlayers().find((player) => player.id == this.friendToFollow);
            if (toFollow) toFollow.ready = true;
        }

        if (!toFollow || !toFollow.ready) return;
        return bot.smartMove(toFollow, { getWithin: PLAYER_MIN_DISTANCE + 5 }).catch(ignoreExceptions);
    }

    public get name(): StrategyName {
        return this._name;
    }
}

export type HoldPositionStrategyConfig = {
    position: IPosition | CharacterRunner<PingCompensatedCharacter>;
    delta?: number;
    offset?: {
        x?: number;
        y?: number;
    };
};
export class HoldPositionStrategy<T extends PingCompensatedCharacter> implements Strategy<T> {
    public loops = new Map<LoopName, Loop<T>>();

    private _name: StrategyName = "move";
    private config: HoldPositionStrategyConfig;
    private lastPosition: IPosition = undefined;

    public constructor(config: HoldPositionStrategyConfig) {
        this.config = config;

        this.loops.set("move", {
            fn: async (bot: T) => {
                if (bot.rip) return;
                await this.move(bot).catch(ignoreExceptions);
            },
            interval: 1000
        });
    }

    public get name() {
        return this._name;
    }

    private async move(bot: T): Promise<unknown> {
        let configPosition: IPosition | CharacterRunner<PingCompensatedCharacter> = this.config.position;
        let holdPosition: IPosition = undefined;
        if (configPosition instanceof CharacterRunner) {
            if (configPosition.isReady()) {
                this.lastPosition = { map: configPosition.bot.map, x: configPosition.bot.x, y: configPosition.bot.y };
            } else if (this.lastPosition === undefined) {
                this.lastPosition = { map: bot.map, x: bot.x, y: bot.y };
            }

            holdPosition = this.lastPosition;
        } else {
            holdPosition = configPosition;
        }

        let delta: number = 0;
        if (this.config.delta) {
            delta = this.config.delta;
        }
        if (this.config?.offset) {
            if (this.config.offset.x) holdPosition.x += this.config.offset.x;
            if (this.config.offset.y) holdPosition.y += this.config.offset.y;
        }

        if (delta > 0 && Tools.distance(bot, holdPosition) > delta) {
            return bot.smartMove(holdPosition, { useBlink: true, getWithin: delta }).catch(ignoreExceptions);
        } else {
            return bot.smartMove(holdPosition, { useBlink: true }).catch(ignoreExceptions);
        }
    }
}

export type KiteInCircleConfig = {
    centre: IPosition | CharacterRunner<PingCompensatedCharacter>;
    radius: number;
    typeList: MonsterName[];
};
export class KiteInCircleStrategy<T extends PingCompensatedCharacter> implements Strategy<T> {
    public loops: Map<LoopName, Loop<T>> = new Map<LoopName, Loop<T>>();

    protected config: KiteInCircleConfig;

    private _name: StrategyName = "move";
    private lastCentre: IPosition = undefined;

    public constructor(config: KiteInCircleConfig) {
        this.config = config;

        this.loops.set("move", {
            fn: async (bot: T) => {
                if (bot.rip) return;
                await this.move(bot).catch(ignoreExceptions);
            },
            interval: 500
        });
    }

    public get name(): StrategyName {
        return this._name;
    }

    private async move(bot: T): Promise<unknown> {
        // If priest -> run to our low HP party member and heal
        // If not priest -> run to our priest so he can heal us
        if (bot.ctype == "priest") {
            let lowHpFriend: Player = bot.getPlayer({ isDead: false, isPartyMember: true, returnLowestHP: true });
            if (lowHpFriend && lowHpFriend.hp < lowHpFriend.max_hp * HEAL_RETREAT_RATIO && Tools.distance(bot, lowHpFriend) > bot.range) {
                return bot.smartMove(lowHpFriend, { getWithin: bot.range * 0.8 }).catch(ignoreExceptions);
            }
        } else if (bot.hp < bot.max_hp * HEAL_RETREAT_RATIO) {
            let priest: Player = bot.getPlayer({ isDead: false, isPartyMember: true, ctype: "priest", returnNearest: true });
            if (priest && Tools.distance(bot, priest) > priest.range) {
                return bot.smartMove(priest, { getWithin: priest.range * 0.8 }).catch(ignoreExceptions);
            }
        }

        let configPosition: IPosition | CharacterRunner<PingCompensatedCharacter> = this.config.centre;
        let configCentre: IPosition = undefined;
        if (configPosition instanceof CharacterRunner) {
            if (configPosition.isReady()) {
                this.lastCentre = { map: configPosition.bot.map, x: configPosition.bot.x, y: configPosition.bot.y };
            } else if (this.lastCentre === undefined) {
                this.lastCentre = { map: bot.map, x: bot.x, y: bot.y };
            }

            configCentre = this.lastCentre;
        } else {
            configCentre = configPosition;
        }

        const centre: IPosition = configCentre;
        const radius: number = this.config.radius;
        const typeList: MonsterName[] = this.config.typeList;

        // If we are too far away from centre -> return back
        if (Tools.distance(bot, centre) > radius) {
            await bot.smartMove(centre, { getWithin: radius, useBlink: true }).catch(ignoreExceptions);
        }

        // if we have some entities targeting us within our attack range -> calculate avoidance vector and kite
        let monsters: Entity[] = bot.getEntities({ typeList: typeList, targetingMe: true, withinRange: bot.range });
        if (monsters.length > 0) {
            let botPositionVector: Vector = new Vector(bot.x, bot.y);
            let kitingVector: Vector = new Vector();
            for (const monster of monsters) {
                let entityToPlayerVector: Vector = botPositionVector.clone().subtract(new Vector(monster.x, monster.y)).normalize();
                kitingVector.add(entityToPlayerVector);
            }
            kitingVector.normalize().multiply(bot.range);

            let pathVector: Vector = botPositionVector.add(kitingVector);
            let moveToPoint: IPosition = { map: bot.map, x: pathVector.x, y: pathVector.y };
            if (Pathfinder.canWalkPath(bot, moveToPoint)) {
                return bot.move(moveToPoint.x, moveToPoint.y, { resolveOnStart: true }).catch(ignoreExceptions);
            } else {
                await bot.smartMove(moveToPoint, { avoidTownWarps: true, resolveOnFinalMoveStart: true }).catch(ignoreExceptions);
            }
        } else {
            // Nothing is targeting us, just stay in range of our attack
            let monster: Entity = bot.getEntity({ typeList: typeList, returnNearest: true });
            if (!monster) return;

            if (Tools.distance(bot, monster) > bot.range) {
                return bot
                    .smartMove(monster, {
                        getWithin: bot.range,
                        avoidTownWarps: true,
                        resolveOnFinalMoveStart: true
                    })
                    .catch(ignoreExceptions);
            }
        }
    }
}

export type MoveInCircleStrategyConfig = {
    centre: IPosition | PingCompensatedCharacter;
    radius: number;
    sides?: number;
    ccw?: boolean;
    rnd?: boolean;
};
export class MoveInCircleStrategy<T extends PingCompensatedCharacter> implements Strategy<T> {
    public loops: Map<LoopName, Loop<T>> = new Map<LoopName, Loop<T>>();

    protected config: MoveInCircleStrategyConfig;

    private _name: StrategyName = "move";
    private lastCentre: IPosition = undefined;

    public constructor(config: MoveInCircleStrategyConfig) {
        if (config.sides === undefined) {
            config.sides = 3;
        } else if (config.sides !== undefined && config.sides < 3) {
            config.sides = 3;
        }

        this.config = config;

        this.loops.set("move", {
            fn: async (bot: T) => {
                if (bot.rip) return;
                await this.move(bot).catch(ignoreExceptions);
            },
            interval: 250
        });
    }

    public get name(): StrategyName {
        return this._name;
    }

    private async move(bot: T): Promise<unknown> {
        let configPosition: IPosition | CharacterRunner<PingCompensatedCharacter> = this.config.centre;
        let configCentre: IPosition = undefined;
        if (configPosition instanceof CharacterRunner) {
            if (configPosition.isReady()) {
                this.lastCentre = { map: configPosition.bot.map, x: configPosition.bot.x, y: configPosition.bot.y };
            } else if (this.lastCentre === undefined) {
                this.lastCentre = { map: bot.map, x: bot.x, y: bot.y };
            }

            configCentre = this.lastCentre;
        } else {
            configCentre = configPosition;
        }

        const angle: number = (2 * Math.PI) / this.config.sides;
        const centre = configCentre;
        const radius = this.config.radius;

        let direction: number = 1;
        if (this.config.rnd && !this.config.ccw) direction = Math.random() < 0.5 ? 1 : -1;
        if (this.config.ccw && !this.config.rnd) direction = -1;

        if (Pathfinder.canWalkPath(bot, centre)) {
            let angleFromCentreToCurrent: number = Math.atan2(bot.y - centre.y, bot.x - centre.x);
            let endPositionAngle: number = angleFromCentreToCurrent + angle * direction;
            let endPosition: IPosition = {
                x: centre.x + radius * Math.cos(endPositionAngle),
                y: centre.y + radius * Math.sin(endPositionAngle)
            };

            return bot.move(endPosition.x, endPosition.y).catch(ignoreExceptions);
        } else {
            return bot.smartMove(centre, { getWithin: radius, useBlink: true }).catch(ignoreExceptions);
        }
    }
}

export type SpecialMonsterKiteStrategyConfig = {
    partyController: PartyController;
    ignoreMaps?: MapName[];
    typeList: MonsterName[];
};
type CheckedBossData =
    | undefined
    | {
          map: MapName;
          x: number;
          y: number;
      };
export class SpecialMonsterKiteStrategy<T extends PingCompensatedCharacter> implements Strategy<T> {
    public loops: Map<LoopName, Loop<T>> = new Map<LoopName, Loop<T>>();

    protected config: SpecialMonsterKiteStrategyConfig;
    protected spawns: IPosition[];

    private _name: StrategyName = "move";
    private avoidDoorsCosts = { blink: 999_999_999, enter: 999_999_999, town: 999_999_999, transport: 999_999_999 };

    public constructor(config: SpecialMonsterKiteStrategyConfig) {
        this.config = config;
        if (!this.config.ignoreMaps) this.config.ignoreMaps = ["test"];

        this.spawns = Pathfinder.locateMonster(this.config.typeList);
        if (this.config.ignoreMaps.length) {
            this.spawns = this.spawns.filter((spawn) => !this.config.ignoreMaps.includes(spawn.map));
        }

        this.loops.set("move", {
            fn: async (bot: T) => {
                if (bot.rip) return;
                await this.move(bot).catch(ignoreExceptions);
                await this.kiteToNpc(bot).catch(ignoreExceptions);
            },
            interval: 250
        });
    }

    public get name(): StrategyName {
        return this._name;
    }

    protected async move(bot: T): Promise<IPosition | void> {
        const smartMoveOptions: SmartMoveOptions = {
            getWithin: bot.range - 10,
            stopIfTrue: async (): Promise<boolean> => {
                let target: CheckedBossData = this.checkGoodData(bot);
                if (!target) return false;
                return Tools.distance(target, bot.smartMoving) > bot.range;
            },
            useBlink: true,
            avoidTownWarps: bot.targets > 0
        };

        let target: CheckedBossData = this.checkGoodData(bot);
        if (target) {
            return Tools.distance(bot, target) > bot.range ? bot.smartMove(target, smartMoveOptions).catch(ignoreExceptions) : undefined;
        }

        spawns: for (let spawn of this.spawns) {
            if (this.config.ignoreMaps && this.config.ignoreMaps.includes(spawn.map)) continue;
            if (this.config.partyController?.getRunners()) {
                for (let runner of this.config.partyController.getRunners()) {
                    if (runner.bot == bot) continue;
                    if (Tools.distance(runner.bot, spawn) < 400) continue spawns;
                    if (!runner.bot.smartMoving) continue;
                    if (Tools.distance(runner.bot.smartMoving, spawn) < 100) continue spawns;
                }
            }

            try {
                await bot.smartMove(spawn, smartMoveOptions);
            } catch (ex) {
                if (ex.message.includes("new smartMove started")) return;
                else console.error(ex);
            }

            let target: CheckedBossData = this.checkGoodData(bot);
            if (target) return bot.smartMove(target, smartMoveOptions).catch(ignoreExceptions);
        }

        let gMap: GMap = bot.G.maps[bot.map as keyof GData["maps"]];
        let canRoam: boolean = false;

        let spawns: IPosition[] = [];
        for (let spawn of gMap.monsters) {
            let gMonster: GMonster = bot.G.monsters[spawn.type];
            canRoam = spawn.roam ? true : spawn.roam;

            if (gMonster.aggro >= 100 || gMonster.rage >= 100) continue;
            if (spawn.boundary) {
                spawns.push({
                    map: bot.map,
                    x: (spawn.boundary[0] + spawn.boundary[2]) / 2,
                    y: (spawn.boundary[1] + spawn.boundary[3]) / 2
                });
            } else if (spawn.boundaries) {
                for (let boundary of spawn.boundaries) {
                    if (this.config.ignoreMaps && this.config.ignoreMaps.includes(boundary[0])) continue;
                    spawns.push({
                        map: boundary[0],
                        x: (boundary[1] + boundary[3]) / 2,
                        y: (boundary[2] + boundary[4]) / 2
                    });
                }
            }
        }

        if (!canRoam) return;
        for (let spawn of gMap.spawns) {
            spawns.push({ map: bot.map, x: spawn[0], y: spawn[1] });
        }
        spawns.sort((a, b) => a.x - b.x);

        spawns: for (let spawn of spawns) {
            if (this.config.partyController?.getRunners()) {
                for (let runner of this.config.partyController.getRunners()) {
                    if (runner.bot == bot) continue;
                    if (Tools.distance(runner.bot, spawn) < 400) continue spawns;
                    if (!runner.bot.smartMoving) continue;
                    if (Tools.distance(runner.bot.smartMoving, spawn) < 100) continue spawns;
                }
            }

            try {
                await bot.smartMove(spawn, smartMoveOptions).catch(ignoreExceptions);
            } catch (ex) {
                if (ex.message.includes("new smartMove started")) return;
                else console.error(ex);
            }

            let target: CheckedBossData = this.checkGoodData(bot);
            if (target) return bot.smartMove(target, smartMoveOptions).catch(ignoreExceptions);
        }
    }

    protected async kiteToNpc(bot: T): Promise<unknown> {
        let target: Entity = bot.getEntity({ typeList: this.config.typeList });
        if (!target) return;

        let targets: IPosition[] = [];
        if (bot.map == "main") {
            let kane: Player = bot.players.get("$Kane");
            if (!kane && this.config?.partyController.getRunners()) {
                for (let runner of this.config.partyController.getRunners()) {
                    if (!runner.isReady()) continue;
                    if (runner.bot == bot) continue;

                    kane = runner.bot.players.get("$Kane");
                    if (kane) break;
                }
            }
            if (kane) targets.push(kane);

            let angel: Player = bot.players.get("$Angel");
            if (!angel && this.config?.partyController.getRunners()) {
                for (let runner of this.config.partyController.getRunners()) {
                    if (!runner.isReady()) continue;
                    if (runner.bot == bot) continue;

                    angel = runner.bot.players.get("$Angel");
                    if (angel) break;
                }
            }
            if (angel) targets.push(angel);
        }

        if (targets.length == 1) return;
        targets.sort(sortClosestDistance(bot));

        let lastD: number = 0;
        for (let target of targets) {
            if (!target) return;

            let d: number = Tools.distance({ x: bot.x, y: bot.y }, { x: target.x, y: target.y });
            if (d < bot.range) {
                lastD = d;
                continue;
            }

            if (lastD) {
                return bot
                    .smartMove(target, {
                        costs: this.avoidDoorsCosts,
                        getWithin: d - (bot.range - lastD),
                        resolveOnFinalMoveStart: true
                    })
                    .catch(ignoreExceptions);
            } else {
                return bot
                    .smartMove(target, {
                        costs: this.avoidDoorsCosts,
                        resolveOnFinalMoveStart: true
                    })
                    .catch(ignoreExceptions);
            }
        }

        if (lastD) {
            return bot
                .smartMove(targets[1], {
                    costs: this.avoidDoorsCosts,
                    getWithin: Tools.distance({ x: bot.x, y: bot.y }, { x: targets[1].x, y: targets[1].y }) - (bot.range = lastD),
                    resolveOnFinalMoveStart: true
                })
                .catch(ignoreExceptions);
        }
    }

    protected returnUndefinedIfMapIgnored(position: { map: MapName; x: number; y: number }): CheckedBossData {
        if (!this.config.ignoreMaps) return position;
        if (this.config.ignoreMaps.includes(position.map)) return undefined;

        return position;
    }

    protected checkGoodData(bot: T): CheckedBossData {
        let target: Entity = bot.getEntity({ returnNearest: true, typeList: this.config.typeList });
        if (target) return this.returnUndefinedIfMapIgnored(target);

        if (this.config.partyController?.getRunners()) {
            for (let runner of filterRunners(this.config.partyController.getRunners(), { serverData: bot.serverData })) {
                if (bot == runner.bot) continue;
                let target: Entity = runner.bot.getEntity({ returnNearest: true, typeList: this.config.typeList });
                if (target) return this.returnUndefinedIfMapIgnored(target);
            }
        }

        for (let type of this.config.typeList) {
            let sInfo: ServerInfoDataLive = bot.S?.[type] as ServerInfoDataLive;
            if (sInfo?.live && sInfo.map && sInfo.x !== undefined && sInfo.y !== undefined) {
                return this.returnUndefinedIfMapIgnored(sInfo as { map: MapName; x: number; y: number });
            }

            if (sInfo?.live && sInfo.map && bot.map != sInfo.map) {
                let gInfo: GMap = Game.G.maps[sInfo.map as keyof GData["maps"]];
                return { map: sInfo.map, x: gInfo.spawns[0][0], y: gInfo.spawns[0][1] };
            }
        }

        let maps: Set<MapName> = new Set<MapName>(this.spawns.map((spawn) => spawn.map));
        if (maps.size > 0 && !maps.has(bot.map)) {
            let gInfo: GMap = Game.G.maps[this.spawns[0].map as keyof GData["maps"]];
            return { map: this.spawns[0].map, x: gInfo.spawns[0][0], y: gInfo.spawns[0][1] };
        }

        return undefined;
    }
}

export class KiteMonsterStrategy<T extends PingCompensatedCharacter> extends SpecialMonsterKiteStrategy<T> {
    public constructor(config: SpecialMonsterKiteStrategyConfig) {
        super(config);

        this.loops.set("move", {
            fn: async (bot: T) => {
                if (bot.rip) return;
                await this.move(bot).catch(ignoreExceptions);
            },
            interval: 250
        });
    }

    protected async move(bot: T): Promise<IPosition | void> {
        let entity = bot.getEntity({ ...this.config, returnNearest: true });
        if (!entity) return super.move(bot).catch(ignoreExceptions);

        return this.kite(bot, entity).catch(ignoreExceptions);
    }

    protected async kite(bot: T, entity: Entity): Promise<IPosition | void> {
        if ((bot.map != entity.map || bot.in != entity.in) && !bot.smartMoving) {
            return bot.smartMove(entity, { getWithin: bot.range, useBlink: true }).catch(ignoreExceptions);
        }

        // #TODO: Rewrite using vectors and multiple entities insted of one closest
        if (bot.ctype == "priest") {
            let lowHpFriend: Player = bot.getPlayer({ isDead: false, isPartyMember: true, returnLowestHP: true });
            if (lowHpFriend && lowHpFriend.hp < lowHpFriend.max_hp * HEAL_RETREAT_RATIO && Tools.distance(bot, lowHpFriend) > bot.range) {
                return bot.smartMove(lowHpFriend, { getWithin: bot.range * 0.8 }).catch(ignoreExceptions);
            }
        } else if (bot.hp < bot.max_hp * HEAL_RETREAT_RATIO) {
            let priest: Player = bot.getPlayer({ isDead: false, isPartyMember: true, ctype: "priest", returnNearest: true });
            if (priest && Tools.distance(bot, priest) > priest.range) {
                return bot.smartMove(priest, { getWithin: priest.range * 0.8 }).catch(ignoreExceptions);
            }
        }

        let angleFromEntityToBot: number = Math.atan2(bot.y - entity.y, bot.x - entity.x);
        let kiteDistance: number = Math.min(bot.range, (entity.charge ?? entity.speed ?? 0) + entity.range + 50);
        let lookDistance: number = kiteDistance * 1.25;
        let numAngles: number = 40;

        for (let i = 1; i < numAngles; i++) {
            let angle: number = angleFromEntityToBot + (i % 2 ? 1 : -1) * (Math.PI * ((i - (i % 2)) / numAngles));
            let angleCos: number = Math.cos(angle);
            let angleSin: number = Math.sin(angle);
            let kitePosition: IPosition = {
                map: bot.map,
                x: entity.x + kiteDistance * angleCos,
                y: entity.y + kiteDistance * angleSin
            };
            let lookPosition: IPosition = {
                map: bot.map,
                x: entity.x + lookDistance * angleCos,
                y: entity.y + lookDistance * angleSin
            };

            if (!(Pathfinder.canStand(lookPosition) && Pathfinder.canStand(kitePosition))) continue;
            if (Pathfinder.canWalkPath(bot, kitePosition)) {
                if (bot.smartMoving) bot.stopSmartMove().catch(ignoreExceptions);
                return bot.move(kitePosition.x, kitePosition.y, { resolveOnStart: true }).catch(ignoreExceptions);
            } else if (!bot.smartMoving) {
                return bot
                    .smartMove(kitePosition, {
                        avoidTownWarps: true,
                        costs: { enter: 9999, transport: 9999 },
                        resolveOnFinalMoveStart: true
                    })
                    .catch(ignoreExceptions);
            }
            break;
        }
    }
}

export class GetHolidaySpiritStrategy<T extends PingCompensatedCharacter> implements Strategy<T> {
    public loops: Map<LoopName, Loop<T>> = new Map<LoopName, Loop<T>>();

    private _name: StrategyName = "move";

    public constructor() {
        this.loops.set("move", {
            fn: async (bot: T) => {
                if (bot.rip) return;
                await this.getHolidaySpirit(bot);
            },
            interval: 250
        });
    }

    public get name(): StrategyName {
        return this._name;
    }

    private async getHolidaySpirit(bot: T): Promise<void> {
        if (!bot.S.holidayseason) return;
        if (bot.s.holidayspirit) return;

        await bot
            .smartMove("newyear_tree", {
                getWithin: Constants.NPC_INTERACTION_DISTANCE / 2,
                avoidTownWarps: true
            })
            .catch(ignoreExceptions);
        await bot.getHolidaySpirit();
    }
}
