class Vector {
    constructor(x, y) {
        this.x = x || 0;
        this.y = y || 0;
    }

    static negative(v) {
        return new Vector(-v.x, -v.y);
    }

    static add(a, b) {
        if (b instanceof Vector) return new Vector(a.x + b.x, a.y + b.y);
	    else return new Vector(a.x + b, a.y + b);
    }

    static subtract(a, b) {
        if (b instanceof Vector) return new Vector(a.x - b.x, a.y - b.y);
	    else return new Vector(a.x - b, a.y - b);
    }

    static multiply(a, b) {
        if (b instanceof Vector) return new Vector(a.x * b.x, a.y * b.y);
	    else return new Vector(a.x * b, a.y * b);
    }

    static divide(a, b) {
        if (b instanceof Vector) return new Vector(a.x / b.x, a.y / b.y);
	    else return new Vector(a.x / b, a.y / b);
    }

    static equals(a, b) {
        return a.x === b.x && a.y === b.y;
    }

    static dot(a, b) {
        return a.x * b.x + a.y * b.y;
    }

    static cross(a, b) {
        return a.x * b.y - a.y * b.x;
    }

    negative() {
        this.x = -this.x;
        this.y = -this.y;

        return this;
    }

    add(v) {
        if (v instanceof Vector) {
            this.x += v.x;
            this.y += v.y;
        } else {
            this.x += v;
            this.y += v;
        }

        return this;
    }

    subtract(v) {
        if (v instanceof Vector) {
            this.x -= v.x;
            this.y -= v.y;
        } else {
            this.x -= v;
            this.y -= v;
        }

        return this;
    }

    multiply(v) {
        if (v instanceof Vector) {
            this.x *= v.x;
            this.y *= v.y;
        } else {
            this.x *= v;
            this.y *= v;
        }

        return this;
    }

    divide(v) {
        if (v instanceof Vector) {
            if (v.x !== 0) this.x /= v.x;
            if (v.y !== 0) this.y /= v.y;
        } else if (v !== 0) {
            this.x /= v;
            this.y /= v;
        }

        return this;
    }

    equals(v) {
        return this.x === v.x && this.y === v.y;
    }

    dot(v) {
        return this.x * v.x + this.y * v.y;
    }

    cross(v) {
        return this.x * v.y - this.y * v.x;
    }

    length() {
        return Math.sqrt(this.dot(this));
    }

    normalize() {
        return this.divide(this.length());
    }

    min() {
        return Math.min(this.x, this.y);
    }

    max() {
        return Math.max(this.x, this.y);
    }

    toAngles() {
        return -Math.atan2(-this.y, this.x);
    }

    angleTo(a) {
        return Math.acos(this.dot(a) / (this.length() * a.length()));
    }
    
    rotate(a) {
        let cosA = Math.cos(a);
        let sinA = Math.sin(a);

        let x1 = this.x;
        let y1 = this.y;

        this.x = cosA * x1 - sinA * y1;
        this.y = sinA * x1 + cosA * y1;

        return this;
    }

    toArray(n) {
        return [this.x, this.y].slice(0, n || 2);
    }

    clone() {
        return new Vector(this.x, this.y);
    }

    set(x, y) {
        this.x = x;
        this.y = y;

        return this;
    }

    limit(l) {
        if (this.length() > l) this.normalize().multiply(l);

        return this;
    }
}


// const ENTITY_SCALE_MULT = 20;
const MAX_VEC_LEN = 50;
const PLAYER_MIN_DISTANCE = 15;
const AVOID_MTYPES = new Set(["mole", "prat"]);

function getTargetVector(target, minDistance, maxDistance) {
    let targetVector = new Vector();
    if (!target) return targetVector;

    let distance = distance2D(target.real_x, target.real_y);
    // We are in a "safe" range
    if (distance <= maxDistance) return targetVector;

    if (minDistance >= maxDistance) minDistance = maxDistance / 3;

    let targetVectorMag = Math.min((distance - minDistance - (maxDistance - minDistance) / 2), MAX_VEC_LEN);    
    targetVector.set(target.real_x - character.real_x, target.real_y - character.real_y).limit(targetVectorMag);

    return targetVector;
}

function getEntityAvoidanceVector(positionVector, rangeBuffer, characterMaxDistance, entityScale) {
    let avoidanceVector = new Vector();

    for (let entity of Object.values(parent.entities)) {
        let isMonster = entity.type === "monster" && entity.mtype;
        let isPlayer = entity.player && entity.type === "character";

        if (!isMonster && !isPlayer) continue;

        // Minimum distance from players
        let minDistance = PLAYER_MIN_DISTANCE;
        // Minimum distance from monsters
        if (isMonster) minDistance = entity.range + rangeBuffer;

        // Maximum distance from monsters
        let maxDistance = characterMaxDistance;
        // Distance corrections
        if (minDistance >= maxDistance) {
            minDistance = characterMaxDistance / 2;
        }

        // Current distance to the entity
        let distance = distance2D(entity.real_x, entity.real_y);
        // Avoidance vector calculation
        if ((distance < minDistance) && (AVOID_MTYPES.has(entity.mtype) || isPlayer)) {
            // Create a normalized vector which represents the direction from the entity towards the player
            let entityVector = new Vector(positionVector.x - entity.real_x, positionVector.y - entity.real_y).normalize();
            // Scale this vector so that maxDist = 0 and minDist = 1
            // This allows far entities to push on our character weaker and close entities to push stronger.
            let scale = 1 - ((distance - minDistance) / (maxDistance - minDistance));
            entityVector = entityVector.multiply(scale * entityScale);

            // Add scaled vector to our avoidance
            avoidanceVector.add(entityVector);
        }
    }

    return avoidanceVector.limit(MAX_VEC_LEN);
}