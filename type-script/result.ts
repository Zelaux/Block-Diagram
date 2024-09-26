class Result<ResultType> {
    // @ts-ignore
    data: ResultType | null
    // @ts-ignore
    error: null | string

    private constructor(data: ResultType | null, error: string | null) {
        this.data = data;
        this.error = error;
    }

    static ok<ResultType>(data: ResultType) {
        return new Result(data, null)
    }
    static error<ResultType>(error: string,...args:any) {
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
        console.trace(error)
        return new Result<ResultType>(null, error)
    }

    isError() {
        return this.error!=null;
    }
}