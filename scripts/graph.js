/**@typedef {(currentBlock:Block,thisNode:ParsedNode)=> Result<Block>} Handler*/

/**@typedef {(x: number,y:number,width:number,height:number,text:string|null)=>string[]} RawCompiler*/
/**@typedef {(x: number,y:number,width:number,height:number)=>string[]} Compiler*/


class RawGraphElement {
    aspect
    /**@type {RawCompiler}*/
    make
}

class PreparedGraphElement {
    name
    aspect
    /**@type {Compiler}*/
    compile


    /**
     * @param name
     * @param aspect
     * @param {Compiler} compile
     */
    constructor(name, aspect, compile) {
        this.name = name;
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
}


/**
 * @param name {string|string[]}
 * @param aspect {number} height/width
 * @param handler {Handler}
 * @return GraphElement
 */
function graphElement(name, aspect, handler) {

    let newVar = {name, aspect, handler};
    return Object.setPrototypeOf(newVar, GraphElement.prototype)
}