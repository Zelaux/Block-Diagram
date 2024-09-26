function ifStatementHandler(compiler: RawCompiler): Handler {
    return handler((currentBlock, thisNode) => {
        if (thisNode.children.length > 3) return Result.error("Too mush children for if (>3)")
        let block = currentBlock.next(
            new HorizontalBlockOfBlocks(new PreparedGraphElement(thisNode.element.aspect, wrapRawCompiler(thisNode.content, compiler)))
        );
        for (let branchList of thisNode.children) {
            let innerBlock = new ElementBlock(), currentInnerBlock: Block = innerBlock;
            for (let innerNode of branchList) {
                let blockResult = innerNode.addToBlock(currentInnerBlock);
                if (blockResult.isError()) return blockResult
                currentInnerBlock = blockResult.data!
            }
            block.addBlock(innerBlock)
        }

        return Result.ok(block)
    })
}


const handler = (h: Handler) => h;


function simpleHandler(compiler: RawCompiler) {
    return handler((currentBlock, thisNode) => {
        let graphElement = new PreparedGraphElement(thisNode.element.aspect, wrapRawCompiler(thisNode.content, compiler));
        currentBlock = currentBlock.addElement(graphElement)
        return Result.ok(currentBlock)
    })
}


function openCloseHandler(open: RawCompiler, close: RawCompiler) {
    return handler((block, thisNode) => {

        block = block.addElement(new PreparedGraphElement(thisNode.element.aspect, wrapRawCompiler(thisNode.content[0], open)));


        /**@type ParsedNode[]*/
        let children = thisNode.children[0];
        for (let parsedNode of children) {
            let result = parsedNode.addToBlock(block);
            if (result.error != null) return result;
            block = result.data!;
        }
        block = block.addElement(new PreparedGraphElement(thisNode.element.aspect, wrapRawCompiler(thisNode.content[1], close)));

        return Result.ok(block)
    })
}

/**@param name {string|string[]}
 * @param rawCompiler {RawCompiler}
 * @return Compiler
 * */
function wrapRawCompiler(name: GraphText, rawCompiler: RawCompiler): Compiler {
    return function () {
        arguments[arguments.length] = name
        arguments.length += 1
        // @ts-ignore
        return rawCompiler.apply(undefined, arguments)
    };
}