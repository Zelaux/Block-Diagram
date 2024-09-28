function prepare(thisNode: ParsedNode, name: NullableGraphText, compiler: RawCompiler) {
    let name1 = thisNode.element.name;
    return new PreparedGraphElement(typeof name1 == "string" ? name1 : name1[0], thisNode.element.aspect, wrapRawCompiler(name, compiler));
}

function ifStatementHandler(compiler: RawCompiler): Handler {
    return handler((block: Block, thisNode: ParsedNode) => {
        if (thisNode.children.length > 3) return Result.error("Too mush children for if (>3)")
        block = block.next(
            new HorizontalBlockOfBlocks(prepare(thisNode, thisNode.content, compiler))
        );
        console.log(thisNode)
        for (let branchList of thisNode.children) {
            let innerBlock: AbstractBlock = new ElementBlock(), currentInnerBlock: Block = innerBlock;
            for (let innerNode of branchList) {
                let blockResult = innerNode.addToBlock(currentInnerBlock);
                if (blockResult.isError()) return blockResult
                currentInnerBlock = blockResult.data!
            }
            if (currentInnerBlock != innerBlock) {
                while (innerBlock.isEmpty()) {
                    let next = innerBlock.nextBlock! as AbstractBlock;
                    // @ts-ignore
                    next.prevBlock = null
                    innerBlock = next
                }
            }
            if (currentInnerBlock.isBlockContainer()) {
                currentInnerBlock = currentInnerBlock.next(new ElementBlock())
            }
            block = block.addBlock(innerBlock)
        }

        return Result.ok(block)
    })
}


const handler = (h: Handler, extra?: any) => h;


function simpleHandler(compiler: RawCompiler) {
    let handler1 = handler((currentBlock, thisNode) => {
        let graphElement = prepare(thisNode, thisNode.content, compiler);
        currentBlock = currentBlock.addElement(graphElement)
        return Result.ok(currentBlock)
    });
    (handler1 as any).compiler=compiler
    return handler1
}


function nodesToBlock(block: Block, children: ParsedNode[]) {
    let myBlock = block

    for (let parsedNode of children) {
        let result = parsedNode.addToBlock(myBlock);
        if (result.isError()) {
            return result
        }
        myBlock = result.data!;
    }
    return Result.ok(myBlock)
}

function openCloseHandler(open: RawCompiler, close: RawCompiler) {
    return handler((block, thisNode) => {

        block = block.addElement(prepare(thisNode, thisNode.content[0], open));

        let result = nodesToBlock(block, thisNode.children[0]);
        if (result.isError()) return result;
        block = result.data!.addElement(prepare(thisNode, thisNode.content[1], close));

        return Result.ok(block)
    })
}

/**@param name {string|string[]}
 * @param rawCompiler {RawCompiler}
 * @return Compiler
 * */
function wrapRawCompiler(name: NullableGraphText, rawCompiler: RawCompiler): Compiler {
    return function () {
        arguments[arguments.length] = name
        arguments.length += 1
        // @ts-ignore
        return rawCompiler.apply(undefined, arguments)
    };
}