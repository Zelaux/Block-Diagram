function prepare(thisNode: ParsedNode, name: GraphText, compiler: RawCompiler) {
    let name1 = thisNode.element.name;
    return new PreparedGraphElement(typeof name1=="string"?name1:name1[0],thisNode.element.aspect, wrapRawCompiler(name, compiler));
}

function ifStatementHandler(compiler: RawCompiler): Handler {
    return handler((block: Block, thisNode: ParsedNode) => {
        if (thisNode.children.length > 3) return Result.error("Too mush children for if (>3)")
        block = block.next(
            new HorizontalBlockOfBlocks(prepare(thisNode, thisNode.content, compiler))
        );
        console.log(thisNode)
        for (let branchList of thisNode.children) {
            let innerBlock = new ElementBlock(), currentInnerBlock: Block = innerBlock;
            for (let innerNode of branchList) {
                let blockResult = innerNode.addToBlock(currentInnerBlock);
                if (blockResult.isError()) return blockResult
                currentInnerBlock = blockResult.data!
            }
            block = block.addBlock(innerBlock)
        }

        return Result.ok(block)
    })
}


const handler = (h: Handler) => h;


function simpleHandler(compiler: RawCompiler) {
    return handler((currentBlock, thisNode) => {
        let graphElement =prepare(thisNode, thisNode.content, compiler);
        currentBlock = currentBlock.addElement(graphElement)
        return Result.ok(currentBlock)
    })
}


function openCloseHandler(open: RawCompiler, close: RawCompiler) {
    return handler((block, thisNode) => {

        block = block.addElement(prepare(thisNode, thisNode.content[0], open));


        /**@type ParsedNode[]*/
        let children = thisNode.children[0];
        for (let parsedNode of children) {
            let result = parsedNode.addToBlock(block);
            if (result.isError()) return result;
            block = result.data!;
        }
        block = block.addElement(prepare(thisNode, thisNode.content[1], close));

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