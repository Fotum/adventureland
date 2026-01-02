import { Entity, IPosition, MonsterName, Pathfinder, PingCompensatedCharacter, Player, Tools } from "alclient";
import { Loop, LoopName, Strategy, CharacterRunner, StrategyName } from "./character_runner";
import { ignoreExceptions, sortTypeThenClosest } from "../base/functions";
import { getEntityAvoidanceVector, getRandomAngle, getVector } from "../geometry/functions";
import { Vector } from "../geometry/vector";


export class BaseMoveStrategy<T extends PingCompensatedCharacter> implements Strategy<T> {
    public loops = new Map<LoopName, Loop<T>>;

    private _name: StrategyName = "move";
    private types: MonsterName[];

    public constructor(type: MonsterName | MonsterName[]) {
        if (Array.isArray(type)) this.types = type;
        else this.types = [type];

        this.loops.set("move", {
            fn: async (bot: T) => {
                await this.move(bot);
            },
            interval: 200
        });
    }

    public get name() {
        return this._name;
    }

    private async move(bot: T) {
        let nearest: Entity = bot.getEntity({
            returnNearest: true,
            typeList: this.types,
            willBurnToDeath: false,
            willDieToProjectiles: false
        });

        if (!nearest) {
            if (!bot.smartMoving) bot.smartMove(this.types[0]).catch(ignoreExceptions);
        } else if (Tools.distance(bot, nearest) > bot.range) {
            bot.smartMove(nearest, {
                getWithin: Math.max(0, bot.range - nearest.speed),
                resolveOnFinalMoveStart: true
            }).catch(ignoreExceptions);
        }
    }
}

export class FollowMoveStrategy implements Strategy<PingCompensatedCharacter> {
    public loops = new Map<LoopName, Loop<PingCompensatedCharacter>>;

    private _name: StrategyName = "move";
    private friendToFollow: CharacterRunner<PingCompensatedCharacter>;

    public constructor(friendToFollow: CharacterRunner<PingCompensatedCharacter>) {
        if (!friendToFollow) throw new Error("No follow target specified");
        this.friendToFollow = friendToFollow;

        this.loops.set("move", {
            fn: async (bot: PingCompensatedCharacter) => {
                await this.move(bot).catch(ignoreExceptions);
            },
            interval: 1000
        });
    }

    public get name() {
        return this._name;
    }

    private async move(bot: PingCompensatedCharacter): Promise<IPosition> {
        let friend: PingCompensatedCharacter = this.friendToFollow.bot;
        if (!friend || !friend.ready) return;

        return bot.smartMove(friend, { getWithin: 10 });
    }
}

export class HoldPositionStrategy implements Strategy<PingCompensatedCharacter> {
    public loops = new Map<LoopName, Loop<PingCompensatedCharacter>>;

    private _name: StrategyName = "move";
    private location: IPosition;

    public constructor(location: IPosition) {
        this.location = location;

        this.loops.set("move", {
            fn: async (bot: PingCompensatedCharacter) => {
                await this.move(bot);
            },
            interval: 1000
        });
    }

    public get name() {
        return this._name;
    }

    private async move(bot: PingCompensatedCharacter): Promise<void> {
        await bot.smartMove(this.location, { useBlink: true }).catch(ignoreExceptions);
    }
}

export class FarmingMoveStrategy implements Strategy<PingCompensatedCharacter> {
    public loops = new Map<LoopName, Loop<PingCompensatedCharacter>>;

    protected types: MonsterName[];
    protected position: IPosition;
    protected botSort: (a: Entity, b: Entity) => number;

    private _name: StrategyName = "move";

    public constructor(type: MonsterName | MonsterName[], position: IPosition) {
        if (Array.isArray(type)) this.types = type;
        else this.types = [type];

        this.position = position;
        this.loops.set("move", {
            fn: async (bot: PingCompensatedCharacter) => {
                if (bot.rip) return;
                if (!Pathfinder.canStand(bot) && bot.moving) return;

                let targets: Entity[] = bot.getEntities({
                    canDamage: true,
                    couldGiveCredit: true,
                    typeList: this.types,
                    willBurnToDeath: false,
                    willDieToProjectiles: false
                });
                targets.sort(this.botSort);
                let target: IPosition = targets.length > 0 ? targets[1] : undefined;

                await this.move(bot, target, bot.range - 5);
            },
            interval: 250
        });
    }

    public onApply(bot: PingCompensatedCharacter): void {
        this.botSort = sortTypeThenClosest(bot, this.types);
    }

    public get name() {
        return this._name;
    }

    protected async move(bot: PingCompensatedCharacter, newPosition?: IPosition, withinRange?: number): Promise<void> {
        if (bot.ctype == "priest") {
            let lowHpFriend: Player = bot.getPlayer({ isDead: false, isPartyMember: true, returnLowestHP: true });
            if (lowHpFriend && lowHpFriend.hp < (lowHpFriend.max_hp * 0.5) && Tools.distance(bot, lowHpFriend) > bot.range) {
                bot.smartMove(lowHpFriend, { getWithin: bot.range - 25 }).catch(ignoreExceptions);
                return;
            }
        } else if (bot.hp < (bot.max_hp * 0.5)) {
            let priest: Player = bot.getPlayer({ isDead: false, isPartyMember: true, ctype: "priest", returnNearest: true });
            if (priest && Tools.distance(bot, priest) > priest.range) {
                bot.smartMove(priest, { getWithin: priest.range - 25 }).catch(ignoreExceptions);
                return;
            }
        }

        // We can see target nearby, check if we need to move or just keep staying
        if (newPosition) {
            let d: number = Tools.distance(bot, newPosition);
            if (!withinRange) withinRange = bot.range - 5;
            if (d > withinRange) {
                let targetVector: Vector = getVector(bot, newPosition, withinRange);
                let moveTo: Vector = new Vector(bot.x, bot.y).add(targetVector);

                // No need to move
                if (targetVector.length() == 0) return;

                let moveToPos: IPosition = { x: moveTo.x, y: moveTo.y, map: newPosition.map };
                if (Pathfinder.canWalkPath(bot, moveToPos)) {
                    bot.move(moveToPos.x, moveToPos.y, { disableSafetyCheck: true, resolveOnStart: true }).catch(ignoreExceptions);
                } else {
                    bot.smartMove(moveToPos, {
                        getWithin: withinRange,
                        resolveOnFinalMoveStart: true
                    }).catch(ignoreExceptions);
                }
            }

            return;
        }

        // If we are on a wrong map or somewhere far away and cant see any targets
        if (bot.map !== this.position.map) {
            await bot.smartMove(this.position, {
                avoidTownWarps: bot.targets > 0,
                resolveOnFinalMoveStart: true,
                useBlink: true,
                stopIfTrue: async () => {
                    if (bot.map !== this.position.map) return false;
                    let entities = bot.getEntities({
                        canDamage: true,
                        couldGiveCredit: true,
                        typeList: this.types,
                        willBurnToDeath: false,
                        willDieToProjectiles: false,
                        withinRange: "attack"
                    });
                    return entities.length > 0;
                }
            }).catch(ignoreExceptions);
        } else if (!bot.smartMoving) {
            bot.smartMove(this.position, {
                resolveOnFinalMoveStart: true,
                useBlink: true,
                stopIfTrue: async () => {
                    if (bot.map !== this.position.map) return false;
                    let entities = bot.getEntities({
                        canDamage: true,
                        couldGiveCredit: true,
                        typeList: this.types,
                        willBurnToDeath: false,
                        willDieToProjectiles: false,
                        withinRange: "attack"
                    });
                    return entities.length > 0;
                }
            }).catch(ignoreExceptions);
        }
    }
}

export type KitingMoveConfig = {
    position: IPosition
    kitingOpts: {
        numAngles: number
        lookupDist: number
        ignoreMonsters?: MonsterName[]
    }
}

export class KitingMoveStrategy extends FarmingMoveStrategy {
    private options: { numAngles: number, lookupDist: number, ignoreMonsters?: MonsterName[] };

    public constructor(type: MonsterName | MonsterName[], options: KitingMoveConfig) {
        super(type, options.position);
        this.options = options.kitingOpts;

        this.loops.set("move", {
            fn: async (bot: PingCompensatedCharacter) => {
                if (bot.rip) return;
                if (!Pathfinder.canStand(bot) && bot.moving) return;

                let targets: Entity[] = bot.getEntities({
                    canDamage: true,
                    couldGiveCredit: true,
                    typeList: this.types,
                    willBurnToDeath: false,
                    willDieToProjectiles: false
                });
                targets.sort(this.botSort);
                let target: IPosition = targets.length > 0 ? targets[1] : undefined;

                await this.move(bot, target);
            },
            interval: 250
        });
    }

    protected async move(bot: PingCompensatedCharacter, target?: IPosition): Promise<void> {
        if (!target) return super.move(bot, target);

        this.kite(bot, target);
    }

    protected async kite(bot: PingCompensatedCharacter, target: IPosition): Promise<void> {
        let botPosVector: Vector = new Vector(bot.x, bot.y);
        let avoidanceVector: Vector = getEntityAvoidanceVector(bot, {
            affectArea: bot.range,
            magLimit: bot.range - 5,
            ignoreMonsters: this.options.ignoreMonsters ? this.options.ignoreMonsters : undefined
        });
        let targetVector: Vector = getVector(bot, target, bot.range - 5, bot.range - 5);

        let botMoveVector: Vector = botPosVector.clone().add(avoidanceVector).add(targetVector);
        if (botMoveVector.length() <= 10) return;

        for (let i = 1; i < this.options.numAngles; i++) {
            let lookupVec: Vector = botMoveVector.clone().multiply(this.options.lookupDist);
            let botMovePos: IPosition = { x: botMoveVector.x, y: botMoveVector.y, map: target.map };
            let lookupPos: IPosition = { x: lookupVec.x, y: lookupVec.y, map: target.map };
            if (!(Pathfinder.canStand(botMovePos) && Pathfinder.canStand(lookupPos))) {
                let angle = (i % 2 ? 1 : -1) * (Math.PI * ((i - (i % 2)) / this.options.numAngles));
                botMoveVector.rotate(angle);
                continue;
            }

            if (Pathfinder.canWalkPath(bot, botMovePos)) {
                if (bot.smartMoving) bot.stopSmartMove().catch(ignoreExceptions);
                bot.move(botMovePos.x, botMovePos.y, { disableSafetyCheck: true, resolveOnStart: true }).catch(ignoreExceptions);
            } else if (!bot.smartMoving) {
                bot.smartMove(botMovePos, {
                    avoidTownWarps: true,
                    costs: { enter: 9999, transport: 9999 },
                    resolveOnFinalMoveStart: true
                }).catch(ignoreExceptions);
            }

            return;
        }
    }
}

export type MoveAroundConfig = {
    position: IPosition
    kitingOpts: {
        radius: number
        minDistToMove: number
    }
}

export class MoveAroundStrategy extends FarmingMoveStrategy {
    private options: { radius: number, minDistToMove: number };

    public constructor(type: MonsterName | MonsterName[], options: MoveAroundConfig) {
        super(type, options.position);

        this.options = options.kitingOpts;

        this.loops.set("move", {
            fn: async (bot: PingCompensatedCharacter) => {
                if (bot.rip) return;
                if (!Pathfinder.canStand(bot) && bot.moving) return;

                let targets: Entity[] = bot.getEntities({
                    canDamage: true,
                    couldGiveCredit: true,
                    typeList: this.types,
                    willBurnToDeath: false,
                    willDieToProjectiles: false
                });
                targets.sort(this.botSort);
                let target: IPosition = targets.length > 0 ? targets[1] : undefined;

                await this.move(bot, target, this.options.radius);
            },
            interval: 250
        });
    }

    protected async move(bot: PingCompensatedCharacter, target?: IPosition, withinRange?: number): Promise<void> {
        if (!target) return super.move(bot, target, withinRange);

        this.moveAround(bot, target);
    }

    protected async moveAround(bot: PingCompensatedCharacter, centre: IPosition): Promise<void> {
        let angle: number = getRandomAngle();

        let moveVector: Vector = new Vector(bot.x - centre.x, bot.y - centre.y);
        moveVector = moveVector.rotate(angle).limit(this.options.radius);

        let newPosition: Vector = new Vector(centre.x, centre.y).add(moveVector);
        while (!Pathfinder.canWalkPath(bot, { x: newPosition.x, y: newPosition.y, map: centre.map })) {
            angle = getRandomAngle();
            newPosition = newPosition.rotate(angle);
        }

        if (Tools.distance(bot, newPosition) > this.options.minDistToMove)
            await bot.move(newPosition.x, newPosition.y, { disableSafetyCheck: true }).catch(ignoreExceptions);
    }
}