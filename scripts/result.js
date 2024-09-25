/**@template ResultType */
class Result {
    /**@type {ResultType|null}*/
    data
    /**@type {null|string}*/
    error
    isError(){
        return this.error!=null;
    }
    static error(error) {
        let result = new Result();
        if (arguments.length > 1) {
            let range = arguments[1];
            switch (typeof range) {
                case "undefined":
                    break;
                case "object":
                    if (range instanceof Array) error += ` at [${range[0]};${range[1]}]`
                    break;
                case "boolean":
                    break;
                case "number":
                    error += " at " + range
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
        result.error = error;
        console.trace(error)
        // console.error(error)
        // throw new Error(error);
        return result
    }

    static ok(data) {
        let result = new Result();
        result.data = data
        return result;
    }
}