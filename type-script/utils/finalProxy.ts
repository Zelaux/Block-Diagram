
class FinalError extends Error{

    constructor(target:object) {
        super(Object.getPrototypeOf(target).constructor.name+": this is final instance");
    }
}


class FinalProxy<T extends object> implements ProxyHandler<T>{

    defineProperty(target: T, property: string | symbol, attributes: PropertyDescriptor): boolean {
        throw new FinalError(target)
    }

    deleteProperty(target: T, p: string | symbol): boolean {
        throw new FinalError(target)
    }


    set(target: T, p: string | symbol, newValue: any, receiver: any): boolean {
        throw new FinalError(target)
    }

}