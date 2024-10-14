"use strict";
class Cursor {
    move(value) {
        this.value += value;
        return this;
    }
    constructor(v) {
        this.value = v;
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
    static extractNumber(value) {
        return typeof value == "number" ? value : value.value;
    }
    static new(x, y) {
        return new Vector(x, y);
    }
    constructor(x, y) {
        this.x = Vector.extractNumber(x);
        this.y = Vector.extractNumber(y);
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
