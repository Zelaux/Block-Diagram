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


function ifSideStatementHandler(compiler: RawCompiler, ifType: IfBranchType): Handler {
    const defaultNames = [
        "Да", "Нет"
    ]
    return handler((block: Block, thisNode: ParsedNode) => {
        let childrenAmount = thisNode.children.length;
        if (childrenAmount == 1) {
            thisNode.children.push([])
        }
        if (thisNode.children.length != 2) return Result.error("Supported only with two children");
        let branches: IfBlockBranch[] = []
        for (let i = 0; i < thisNode.children.length; i++) {
            let child = thisNode.children[i];
            let branchBlock = nodesToBlock(new SimpleBlockOfBlocks(), child);
            if (branchBlock.isError()) return branchBlock
            branches[i] = new IfBlockBranch(branchBlock.data!, thisNode.titles[i])
        }
        let ifBlock = new IfBlock(
            prepareNode(thisNode, thisNode.content, compiler),
            branches[0], branches[1], ifType
        );

        return Result.ok(block.addBlock(ifBlock))
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

function compilePrepered(openPrepare: PreparedGraphElement, centerXCursor: Cursor, cursorY: Cursor, compileInfo: CompileInfo) {
    let width = compileInfo.width;
    let height = compileInfo.width * openPrepare.aspect;
    return openPrepare.compile(centerXCursor.value - width / 2, cursorY.value, width, height);
}

function openCloseHandler(open: RawCompiler, close: RawCompiler, useIndent: boolean = false) {
    return handler((block, thisNode) => {

        let openPrepare = prepareNode(thisNode, thisNode.content[0], open);

        let closePrepare = prepareNode(thisNode, thisNode.content[1], close);
        let shouldUseIndent = useIndent;
        if (thisNode.children[0].length < 2 && useIndent) {
            let valid = false;
            for (let child of thisNode.children[0]) {
                if (valid) break
                if (child.children.length > 0) {
                    valid = true;
                    break
                }
            }
            shouldUseIndent = valid;
        }
        if (!shouldUseIndent) {
            let simpleBlockOfBlocks = new SimpleBlockOfBlocks();
            simpleBlockOfBlocks.bbColor = "gray"
            let inner = simpleBlockOfBlocks.addElement(openPrepare)

            let result = nodesToBlock(inner, thisNode.children[0]);
            if (result.isError()) return result;
            result.data!.addElement(closePrepare)
            block = block.addBlock(simpleBlockOfBlocks);
        } else {


            let blocks = new SimpleBlockOfBlocks();
            let originalCalculateBoundingBox = blocks.calculateBoundingBox;
            blocks.calculateBoundingBox = compileInfo => {
                let boundingBox = originalCalculateBoundingBox.call(blocks, compileInfo);
                let fullElementWidth = compileInfo.width + compileInfo.width / 2;
                boundingBox.bounds.shift(fullElementWidth, 0)
                    .expand(-fullElementWidth / 2 - compileInfo.width / 4, 0)
                    .expand(fullElementWidth / 2, openPrepare.aspect * compileInfo.width)
                boundingBox.updateBounds()
                return boundingBox
            }
            let originalCompile = blocks.compile;
            blocks.compile = (centerXCursor, cursorY, compileInfo) => {


                let myBB = blocks.calculateBoundingBox(compileInfo);
                let originalBB = originalCalculateBoundingBox.call(blocks, compileInfo);
                let bbSvg = bbToSvg("", myBB, Vector.new(centerXCursor, cursorY), "purple", compileInfo);
                let width = compileInfo.width;
                let fullWidth = width * 1.5;

                function drawLine(myStrings: string[], lineX1: number, lineX2: number) {
                    let closeY = cursorY.value + width * closePrepare.aspect / 2
                    myStrings.push(svgLine(lineX1, closeY, lineX2, closeY))
                }

                let myStrings: string[] = compilePrepered(openPrepare, centerXCursor, cursorY, compileInfo)
                let lineX1 = centerXCursor.value + width / 2;
                let lineX2 = centerXCursor.value + width;
                drawLine(myStrings, lineX1, lineX2)
                // centerXCursor.value +=
                let v1 = centerXCursor.value;
                let compileResult = centerXCursor.withOffset(fullWidth,
                    () => originalCompile.call(blocks, centerXCursor, cursorY, compileInfo)
                );

                centerXCursor.value = v1;
                compileResult.svgCode[0] = bbSvg

                cursorY.withOffset(-(compileInfo.topMargin + closePrepare.aspect * width), () => {

                    myStrings.push.apply(myStrings, compileResult.svgCode)
                    drawLine(myStrings, lineX1, lineX2);
                    myStrings.push.apply(myStrings,
                        compilePrepered(closePrepare, centerXCursor, cursorY, compileInfo))
                    compileResult.svgCode = myStrings
                })
                cursorY.value -= compileInfo.topMargin
                compileResult.output.x = v1;
                return compileResult
            }

            let result = nodesToBlock(blocks, thisNode.children[0]);
            if (result.isError()) return result;
            block = block.addBlock(blocks);

        }
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