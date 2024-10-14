class Cursor {

    value: number

    move(value: number) {
        this.value += value;
        return this;
    }

    constructor(v: number) {
        this.value = v;
    }

    withOffset<T>(offset: number, closure: (() => T) | ((self: Cursor) => T)): T {
        this.value += offset;
        let v = closure(this);
        this.value -= offset;
        return v
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

    private static extractNumber(value: number | Cursor) {
        return typeof value == "number" ? value : value.value;
    }

    public static new(x: number | Cursor, y: number | Cursor) {
        return new Vector(x, y)
    }


    constructor(x: number | Cursor, y: number | Cursor) {
        this.x = Vector.extractNumber(x);
        this.y = Vector.extractNumber(y);
    }

    copy() {
        return Vector.new(this.x, this.y);
    }

    add(x: number, y: number) {
        this.x += x
        this.y += y
        return this
    }

    set(x: number, y: number) {
        this.x = x
        this.y = y
        return this
    }

    mul(x: number, y: number) {
        this.x *= x
        this.y *= y
        return this
    }
}

class CompileInfo {
    width: number
    topMargin: number
    extraWidth: number
    isLast: boolean = true
    drawBB:boolean=false

    constructor(width: number, topMargin: number, extraWidth: number) {
        this.width = width;
        this.topMargin = topMargin;
        this.extraWidth = extraWidth;
    }
}

class CompileResult {
    /**
     * Offset from end position
     * */
    output: Vector
    svgCode: string[]

    constructor(output: Vector, svgCode: string[]) {
        this.output = output;
        this.svgCode = svgCode;
    }
}
