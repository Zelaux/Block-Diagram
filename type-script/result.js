"use strict";
class Result {
    constructor(data, error) {
        this.data = data;
        this.error = error;
    }
    static ok(data) {
        return new Result(data, null);
    }
    static error(error, ...args) {
        if (arguments.length > 1) {
            let range = arguments[1];
            switch (typeof range) {
                case "undefined":
                    break;
                case "object":
                    if (range instanceof Array)
                        error += ` at [${range[0]};${range[1]}]`;
                    break;
                case "boolean":
                    break;
                case "number":
                    error += " at " + range;
                    break;
                case "string":
                    break;
                case "function":
                    break;
                case "symbol":
                    break;
                case "bigint":
                    break;
            }
        }
        console.trace(error);
        return new Result(null, error);
    }
    isError() {
        return this.error != null;
    }
}
