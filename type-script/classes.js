"use strict";
class Cursor {
    move(x) {
        this.value += x;
        return this;
    }
    constructor(v) {
        this.value = v;
    }
    clone() {
        return new Cursor(this.value);
    }
}
class Vector {
    static new(x, y) {
        return new Vector(x, y);
    }
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    copy() {
        return Vector.new(this.x, this.y);
    }
    add(x, y) {
        this.x += x;
        this.y += y;
        return this;
    }
    mul(x, y) {
        this.x *= x;
        this.y *= y;
        return this;
    }
}
