class Cursor {

    value: number

    constructor(v: number) {
        this.value = v;
    }

    move(value: number) {
        this.value += value;
        return this;
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
    static ZERO: Vector = Vector.new(0, 0);
    static X: Vector = Vector.new(1, 0);
    static Y: Vector = Vector.new(0, 1);
    x: number
    y: number;

    constructor(x: number | Cursor, y: number | Cursor) {
        this.x = Vector.extractNumber(x);
        this.y = Vector.extractNumber(y);
    }

    public static new(x: number | Cursor, y: number | Cursor) {
        return new Vector(x, y)
    }

    private static extractNumber(value: number | Cursor) {
        return typeof value == "number" ? value : value.value;
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
    drawBB: boolean = false

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


type numbers = number[]
type strings = string[]

enum Direction {
    Left, Top, Right, Bottom
}

class Bounds {
    static axis = ["left", "top"] as ("left" | "top")[]
    static axisToSize: { left: "right", top: "bottom" } = {
        "left": "right",
        "top": "bottom",
    }
    static directions: { x: ("left" | "right")[], y: ("top" | "bottom")[] } = {
        x: ["left", "right"],
        y: ["top", "bottom"]
    }
    left: number = 0;
    top: number = 0;
    right: number = 0;
    bottom: number = 0;

    constructor(left: number, top: number, right: number, bottom: number) {
        this.left = left;
        this.top = top;
        this.right = right;
        this.bottom = bottom;
    }

    static makeZero() {
        return new Bounds(0, 0, 0, 0)
    }

    merge(other: Bounds, direction: Direction, margin: number = 0): Bounds {
        switch (direction) {
            case Direction.Left:
                this.left -= margin + other.width()
                this.expand(this.left, this.y() + other.height())
                break;
            case Direction.Right:
                this.right += margin + other.width()
                this.expand(this.left, this.y() + other.height())
                break;
            case Direction.Top:
                this.top -= margin + other.height()
                this.expand(this.x() + other.width(), this.top)
                break;
            case Direction.Bottom:
                this.bottom += margin + other.height()
                this.expand(this.x() + other.width(), this.top)
                break;
        }
        return this
    }

    expandPoint(point: Vector) {
        return this.expand(point.x, point.y)
    }

    expand(x: number, y: number): Bounds {
        for (let i = 0; i < Bounds.axis.length; i++) {
            let axis = Bounds.axis[i];
            let value = i == 0 ? x : y
            if (value < this[axis]) {
                this[axis] = value
            } else if (value > this[Bounds.axisToSize[axis]]) {
                this[Bounds.axisToSize[axis]] = value
            }
        }
        return this
    }

    expandBound(other: Bounds) {
        this.expand(other.left, other.top)
        this.expand(other.right, other.bottom)
    }

    shiftVector(vector: Vector): Bounds {
        return this.shift(vector.x, vector.y)
    }

    shift(x: number, y: number): Bounds {
        for (let i = 0; i < Bounds.directions.x.length; i++) {
            let x1 = Bounds.directions.x[i];
            this[x1] += x

            let y1 = Bounds.directions.y[i];
            this[y1] += y
        }
        return this
    }

    copy(): Bounds {
        let parse = JSON.parse(JSON.stringify(this));
        Object.setPrototypeOf(parse,Object.getPrototypeOf(this))
        return parse
    }

    width() {
        return this.right - this.left;
    }

    height() {
        return this.bottom - this.top;
    }

    x() {
        return this.left;
    }

    y() {
        return this.top
    }
}