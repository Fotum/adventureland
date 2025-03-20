import { Tools, IPosition, MonsterName, PingCompensatedCharacter, Entity } from "alclient";
import { Vector } from "./vector";

export function getRandomAngle(): number {
    return Math.random() * Math.PI * (Math.random() < 0.5 ? 1 : -1);
}

export function getVector(from: IPosition, to: IPosition, withinTo?: number, limit?: number): Vector {
    let targetVector: Vector = new Vector();
    if (!from || !to) return targetVector;
    if (!withinTo) withinTo = 0;
    if (!limit) limit = 9999;

    let distance: number = Tools.distance(from, to);
    if (distance <= withinTo) return targetVector;

    let limitMag: number = Math.min((distance - withinTo), limit);
    targetVector.set(to.x - from.x, to.y - from.y).limit(limitMag);

    return targetVector;
}

export type EntityAvoidanceConfig = {
    affectArea: number
    magLimit: number
    ignoreMonsters?: MonsterName[]
    entityScaleAdd?: {
        [T in MonsterName]?: number
    }
}
export function getEntityAvoidanceVector(bot: PingCompensatedCharacter, config: EntityAvoidanceConfig): Vector {
    // Defaults
    if (config.affectArea == 0) config.affectArea = bot.range;
    if (config.magLimit == 0) config.magLimit = 5;
    if (!config.ignoreMonsters) config.ignoreMonsters = [];

    const scale: number = 1 - ((config.affectArea > config.magLimit) ?
                                config.magLimit / config.affectArea :
                                config.affectArea / config.magLimit);

    const entities: Entity[] = bot.getEntities({
        withinRange: config.affectArea,
        notTypeList: this.config.ignoreMonsters ?
                     this.config.ignoreMonsters :
                     undefined,
        willBurnToDeath: false,
        willDieToProjectiles: false
    });

    let avoidanceVector: Vector = new Vector();
    for (let entity of entities) {
        if (config.ignoreMonsters.includes(entity.type)) continue;

        let entityScale: number = scale;
        if (config.entityScaleAdd && config.entityScaleAdd[entity.type])
            entityScale += config.entityScaleAdd[entity.type];

        let entityDistance: number = Tools.squaredDistance(bot, entity);
        if (entityDistance > this.config.affectArea) continue;

        let entityVector: Vector = new Vector(bot.x - entity.x, bot.y - entity.y).normalize();
        entityVector.multiply(entityDistance * entityScale).limit(this.config.magLimit);

        avoidanceVector.add(entityVector);
    }

    return avoidanceVector.limit(config.magLimit);
}