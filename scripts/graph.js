/**@typedef {(currentBlock:Block,thisNode:ParsedNode)=> Result<Block>} Handler*/

/**@typedef {(x: number,y:number,width:number,height:number,text:string|null)=>string[]} RawCompiler*/
/**@typedef {(x: number,y:number,width:number,height:number)=>string[]} Compiler*/



class PreparedGraphElement {
    aspect
    /**@type {Compiler}*/
    compile


    /**
     * @param aspect
     * @param {Compiler} compile
     */
    constructor(aspect, compile) {
        this.aspect = aspect;
        this.compile = compile;
    }
}

class GraphElement {
    /**@type string*/
    name
    /**@type number*/
    aspect
    /**@type Handler*/
    handler


    static new(name, aspect, handler) {
        console.assert(typeof handler=="function","Fuck tyou")
        let self = new GraphElement();
        self.name = name;
        self.aspect = aspect;
        self.handler = handler;
        return self
    }
}


/**
 * @param name {string|string[]}
 * @param aspect {number} height/width
 * @param handler {Handler}
 * @return GraphElement
 */
const graphElement =GraphElement.new