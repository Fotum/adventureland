export class Vector {
    private _x: number;
    private _y: number;

    constructor(x?: number, y?: number) {
        this._x = x || 0;
        this._y = y || 0;
    }

    public static negative(v: Vector): Vector {
        return new Vector(-v.x, -v.y);
    }

    public static subtract(a: Vector, b: Vector | number): Vector {
        if (b instanceof Vector) return new Vector(a.x - b.x, a.y - b.y);
        else return new Vector(a.x - b, a.y - b);
    }

    public static multiply(a: Vector, b: Vector | number): Vector {
        if (b instanceof Vector) return new Vector(a.x * b.x, a.y * b.y);
	    else return new Vector(a.x * b, a.y * b);
    }

    public static divide(a: Vector, b: Vector | number): Vector {
        if (b instanceof Vector) return new Vector(a.x / b.x, a.y / b.y);
	    else return new Vector(a.x / b, a.y / b);
    }

    static equals(a: Vector, b: Vector): boolean {
        return a.x === b.x && a.y === b.y;
    }

    static dot(a: Vector, b: Vector): number {
        return a.x * b.x + a.y * b.y;
    }

    static cross(a: Vector, b: Vector): number {
        return a.x * b.y - a.y * b.x;
    }

    public get x(): number {
        return this._x;
    }

    public get y(): number {
        return this._y;
    }

    public set(x: number, y: number): Vector {
        this._x = x;
        this._y = y;

        return this;
    }

    public negative(): Vector {
        this._x = -this._x;
        this._y = -this._y;

        return this;
    }

    public add(v: Vector | number): Vector {
        if (v instanceof Vector) {
            this._x += v.x;
            this._y += v.y;
        } else {
            this._x += v;
            this._y += v;
        }

        return this;
    }

    public subtract(v: Vector | number): Vector {
        if (v instanceof Vector) {
            this._x -= v.x;
            this._y -= v.y;
        } else {
            this._x -= v;
            this._y -= v;
        }

        return this;
    }

    public multiply(v: Vector | number): Vector {
        if (v instanceof Vector) {
            this._x *= v.x;
            this._y *= v.y;
        } else {
            this._x *= v;
            this._y *= v;
        }

        return this;
    }

    public divide(v: Vector | number): Vector {
        if (v instanceof Vector) {
            if (v.x !== 0) this._x /= v.x;
            if (v.y !== 0) this._y /= v.y;
        } else if (v !== 0) {
            this._x /= v;
            this._y /= v;
        }

        return this;
    }

    public equals(v: Vector): boolean {
        return this.x == v.x && this.y == v.y;
    }

    public dot(v: Vector): number {
        return this.x * v.x + this.y * v.y;
    }

    public cross(v: Vector): number {
        return this.x * v.x - this.y * v.y;
    }

    public length(): number {
        return Math.sqrt(this.dot(this));
    }

    public normalize(): Vector {
        return this.divide(this.length());
    }

    public min(): number {
        return Math.min(this.x, this.y);
    }

    public max(): number {
        return Math.max(this.x, this.y);
    }

    public toAngles(): number {
        return -Math.atan2(-this.y, this.x);
    }

    public angleTo(v: Vector): number {
        return Math.acos(this.dot(v) / (this.length() * v.length()));
    }

    public rotate(a: number): Vector {
        let x1: number = this.x;
        let y1: number = this.y;

        this._x = Math.cos(a) * x1 - Math.sin(a) * y1;
        this._y = Math.sin(a) * x1 + Math.cos(a) * y1;

        return this;
    }

    public clone(): Vector {
        return new Vector(this.x, this.y);
    }

    public limit(l: number): Vector {
        if (this.length() > l)
            this.normalize().multiply(l);

        return this;
    }
}