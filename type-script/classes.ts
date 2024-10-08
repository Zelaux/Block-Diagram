class Cursor {

    value: number

    move(x: number) {
        this.value += x;
        return this;
    }

    constructor(v: number) {
        this.value = v;
    }

    clone() {
        return new Cursor(this.value);
    }

}

class Vector {
    x: number
    y: number;
    static ZERO: Vector = Vector.new(0, 0);
    static X: Vector = Vector.new(1, 0);
    static Y: Vector = Vector.new(0, 1);

    public static new(x: number, y: number) {
        return new Vector(x, y)
    }

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    copy() {
        return Vector.new(this.x, this.y);
    }

    add(x: number, y: number) {
        this.x += x
        this.y += y
        return this
    }

    mul(x: number, y: number) {
        this.x *= x
        this.y *= y
        return this
    }
}