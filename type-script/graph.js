"use strict";
class PreparedGraphElement {
    constructor(name, aspect, compile) {
        this.name = name;
        this.aspect = aspect;
        this.compile = compile;
    }
}
class GraphElement {
    constructor(name, aspect, handler) {
        this.name = name;
        this.aspect = aspect;
        this.handler = handler;
    }
    static new(name, aspect, handler) {
        return new GraphElement(name, aspect, handler);
    }
    oneName() {
        return typeof this.name == "string" ? this.name : this.name[0];
    }
}
const graphElement = GraphElement.new;
