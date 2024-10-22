"use strict";
class Cursor {
    constructor(v) {
        this.value = v;
    }
    move(value) {
        this.value += value;
        return this;
    }
    withOffset(offset, closure) {
        this.value += offset;
        let v = closure(this);
        this.value -= offset;
        return v;
    }
    clone() {
        return new Cursor(this.value);
    }
}
class Vector {
    constructor(x, y) {
        this.x = Vector.extractNumber(x);
        this.y = Vector.extractNumber(y);
    }
    static new(x, y) {
        return new Vector(x, y);
    }
    static extractNumber(value) {
        return typeof value == "number" ? value : value.value;
    }
    copy() {
        return Vector.new(this.x, this.y);
    }
    add(x, y) {
        this.x += x;
        this.y += y;
        return this;
    }
    set(x, y) {
        this.x = x;
        this.y = y;
        return this;
    }
    mul(x, y) {
        this.x *= x;
        this.y *= y;
        return this;
    }
}
Vector.ZERO = Vector.new(0, 0);
Vector.X = Vector.new(1, 0);
Vector.Y = Vector.new(0, 1);
class CompileInfo {
    constructor(width, topMargin, extraWidth) {
        this.isLast = true;
        this.drawBB = false;
        this.width = width;
        this.topMargin = topMargin;
        this.extraWidth = extraWidth;
    }
}
class CompileResult {
    constructor(output, svgCode) {
        this.output = output;
        this.svgCode = svgCode;
    }
}
var Direction;
(function (Direction) {
    Direction[Direction["Left"] = 0] = "Left";
    Direction[Direction["Top"] = 1] = "Top";
    Direction[Direction["Right"] = 2] = "Right";
    Direction[Direction["Bottom"] = 3] = "Bottom";
})(Direction || (Direction = {}));
class Bounds {
    constructor(left, top, right, bottom) {
        this.left = 0;
        this.top = 0;
        this.right = 0;
        this.bottom = 0;
        this.left = left;
        this.top = top;
        this.right = right;
        this.bottom = bottom;
    }
    static makeZero() {
        return new Bounds(0, 0, 0, 0);
    }
    merge(other, direction, margin = 0) {
        switch (direction) {
            case Direction.Left:
                this.left -= margin + other.width();
                this.expand(this.left, this.y() + other.height());
                break;
            case Direction.Right:
                this.right += margin + other.width();
                this.expand(this.left, this.y() + other.height());
                break;
            case Direction.Top:
                this.top -= margin + other.height();
                this.expand(this.x() + other.width(), this.top);
                break;
            case Direction.Bottom:
                this.bottom += margin + other.height();
                this.expand(this.x() + other.width(), this.top);
                break;
        }
        return this;
    }
    expandPoint(point) {
        return this.expand(point.x, point.y);
    }
    expand(x, y) {
        for (let i = 0; i < Bounds.axis.length; i++) {
            let axis = Bounds.axis[i];
            let value = i == 0 ? x : y;
            if (value < this[axis]) {
                this[axis] = value;
            }
            else if (value > this[Bounds.axisToSize[axis]]) {
                this[Bounds.axisToSize[axis]] = value;
            }
        }
        return this;
    }
    expandBound(other) {
        this.expand(other.left, other.top);
        this.expand(other.right, other.bottom);
    }
    shiftVector(vector) {
        return this.shift(vector.x, vector.y);
    }
    shift(x, y) {
        for (let i = 0; i < Bounds.directions.x.length; i++) {
            let x1 = Bounds.directions.x[i];
            this[x1] += x;
            let y1 = Bounds.directions.y[i];
            this[y1] += y;
        }
        return this;
    }
    copy() {
        let parse = JSON.parse(JSON.stringify(this));
        Object.setPrototypeOf(parse, Object.getPrototypeOf(this));
        return parse;
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
        return this.top;
    }
}
Bounds.axis = ["left", "top"];
Bounds.axisToSize = {
    "left": "right",
    "top": "bottom",
};
Bounds.directions = {
    x: ["left", "right"],
    y: ["top", "bottom"]
};
