"use strict";
class FinalError extends Error {
    constructor(target) {
        super(Object.getPrototypeOf(target).constructor.name + ": this is final instance");
    }
}
class FinalProxy {
    defineProperty(target, property, attributes) {
        throw new FinalError(target);
    }
    deleteProperty(target, p) {
        throw new FinalError(target);
    }
    set(target, p, newValue, receiver) {
        throw new FinalError(target);
    }
}
