function prepareNode(thisNode: ParsedNode, name: NullableGraphText, compiler: RawCompiler) {
    let name1 = thisNode.element.name;
    return new PreparedGraphElement(typeof name1 == "string" ? name1 : name1[0], thisNode.element.aspect, wrapRawCompiler(name, compiler));
}

function ifStatementHandler(compiler: RawCompiler): Handler {
    const defaultNames = [
        "Да", "Нет"
    ]
    return handler((block: Block, thisNode: ParsedNode) => {
        let childrenAmount = thisNode.children.length;
        if (childrenAmount == 1) {
            thisNode.children.push([])
        }
        if (childrenAmount > 3) return Result.error("Too much children for if (>3)")
        if (childrenAmount < 1) return Result.error("Too few children for if (<1)")
        let blockOfBlocks = new HorizontalBranchBlockOfBlocks(
            prepareNode(thisNode, thisNode.content, compiler)
        );
        blockOfBlocks.branchTitles = []
        if (childrenAmount < 3) {
            for (let i = 0; i < childrenAmount; i++) {
                blockOfBlocks.branchTitles[i] = thisNode.titles[i] || defaultNames[i]
            }
        } else {
            for (let i = 0; i < childrenAmount; i++) {
                blockOfBlocks.branchTitles[i] = thisNode.titles[i] || ""
            }
        }

        for (let branchList of thisNode.children) {
            let innerBlock: SimpleBlockOfBlocks = new SimpleBlockOfBlocks(), currentInnerBlock: Block = innerBlock;
            for (let innerNode of branchList) {
                let blockResult = innerNode.addToBlock(currentInnerBlock);
                if (blockResult.isError()) return blockResult
                currentInnerBlock = blockResult.data!
            }
            blockOfBlocks.addBlock(currentInnerBlock)
        }

        block = block.addBlock(blockOfBlocks)
        return Result.ok(block)
    })
}


const handler = (h: Handler, extra?: any) => h;


function simpleHandler(compiler: RawCompiler) {
    let handler1 = handler((currentBlock, thisNode) => {
        let graphElement = prepareNode(thisNode, thisNode.content, compiler);
        currentBlock = currentBlock.addElement(graphElement)
        return Result.ok(currentBlock)
    });
    (handler1 as any).compiler = compiler
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

function openCloseHandler(open: RawCompiler, close: RawCompiler, useIndent: boolean = false) {
    return handler((block, thisNode) => {

        block = block.addElement(prepareNode(thisNode, thisNode.content[0], open));
        if (useIndent) {

            let simpleBlockOfBlocks = new SimpleBlockOfBlocks();
            let result = nodesToBlock(simpleBlockOfBlocks, thisNode.children[0]);
            if (result.isError()) return result;
            block=block.addBlock(result.data!);
        } else {


            let result = nodesToBlock(block, thisNode.children[0]);
            if (result.isError()) return result;
            block = result.data!;

        }
        block = block.addElement(prepareNode(thisNode, thisNode.content[1], close))
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