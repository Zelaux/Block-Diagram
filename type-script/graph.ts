type RawCompiler = (x: number, y: number, width: number, height: number, text: NullableGraphText) => string[]
type Compiler = (x: number, y: number, width: number, height: number) => string[]
type Handler = (currentBlock: Block, thisNode: ParsedNode) => Result<Block>
type GraphText = string|string[]
type NullableGraphText =GraphText|null|undefined

class PreparedGraphElement {
    aspect: number
    compile: Compiler


    constructor(aspect: number, compile: Compiler) {
        this.aspect = aspect;
        this.compile = compile;
    }
}

class GraphElement {
    name: string|string[]

    aspect: number

    handler: Handler


    private constructor(name: string|string[], aspect: number, handler: Handler) {
        this.name = name;
        this.aspect = aspect;
        this.handler = handler;
    }

    static new(name: string|string[], aspect: number, handler: Handler) {
        return new GraphElement(name, aspect, handler)
    }
}


const graphElement = GraphElement.new