/**
 * @param {RawCompiler} compiler
 * @return Handler
 */
function ifStatementHandler(compiler) {
    return handler((currentBlock, thisNode) => {
        if (thisNode.children.length > 3) return Result.error("Too mush children for if (>3)")
        let block = currentBlock.next();
        block.rootElement = new PreparedGraphElement(thisNode.element.name, thisNode.element.aspect, wrapRawCompiler(thisNode.content, compiler))
        for (let branchList of thisNode.children) {
            let innerBlock = new Block(), currentInnerBlock = innerBlock;
            for (let innerNode of branchList) {
                let blockResult = innerNode.addToBlock(innerBlock);
                if (blockResult.isError()) return blockResult
                currentInnerBlock = blockResult.data
            }
            block.innerElements.push(innerBlock)
        }

        return Result.ok(block)
    })
}

/**@param h {Handler}*/
const handler = h => h;

/**@param compiler {RawCompiler}
 * @return Handler
 * */
function simpleHandler(compiler) {
    return handler((currentBlock, thisNode) => {
        currentBlock.innerElements.push(wrapRawCompiler(thisNode.content, compiler));
        return Result.ok(currentBlock)
    })
}

/**@param open {RawCompiler}
 * @param close {RawCompiler}
 * @return Handler
 * */
function openCloseHandler(open, close) {
    return handler((block, thisNode) => {

        block.innerElements.push(new PreparedGraphElement(thisNode.element + "_start", thisNode.aspect, wrapRawCompiler(thisNode.content[0], open)));


        /**@type ParsedNode[]*/
        let children = thisNode.children[0];
        for (let parsedNode of children) {
            let result = parsedNode.addToBlock(parsedNode);
            if (result.error != null) return result;
            block = result.data;
        }
        block.innerElements.push(new PreparedGraphElement(thisNode.element + "_end", thisNode.aspect, wrapRawCompiler(thisNode.content[1], close)));
        return Result.ok(block)
    })
}

/**@param name {string|string[]}
 * @param rawCompiler {RawCompiler}
 * @return Compiler
 * */
function wrapRawCompiler(name, rawCompiler) {
    return function () {
        arguments[arguments.length] = name
        arguments.length += 1
        return rawCompiler.apply(undefined, arguments)
    };
}