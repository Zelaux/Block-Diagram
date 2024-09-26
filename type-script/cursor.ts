class Cursor {

    v: number

    move(x: number) {
        this.v += x;
        return this;
    }

    constructor(v: number) {
        this.v = v;
    }

    clone() {
        return new Cursor(this.v);
    }

}