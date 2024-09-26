"use strict";
class Cursor {
    move(x) {
        this.v += x;
        return this;
    }
    constructor(v) {
        this.v = v;
    }
    clone() {
        return new Cursor(this.v);
    }
}
