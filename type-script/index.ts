
const startKeyWord = () => "Начало";
const endKeyWord = () => "Конец";


function terminatorConstructor(isNullProvider: () => string) {
    return (x: number, y: number, width: number, height: number, text: NullableGraphText) => {
        let hh = height / 2;//half_height
        let wl = width - height;//width_left
        return [
            makePath(`M ${x} ${y + hh} q 0 ${hh} ${hh} ${hh} l ${wl} 0 q ${hh} 0 ${hh} ${-hh} q 0 ${-hh} ${-hh} ${-hh} l ${-wl} 0 q ${-hh} 0 ${-hh} ${hh}`),
            defaultCenterText(x, y, width, height, textOr(text, isNullProvider()))
        ]
    };
}

let blockList = [
    graphElement("start", 1 / 3, simpleHandler(terminatorConstructor(startKeyWord))),
    graphElement(["end", "stop"], 1 / 3, simpleHandler(terminatorConstructor(endKeyWord))),
    graphElement("connector", 1 / 3, simpleHandler((x, y, width, height, text) => {
        x += width / 3
        width = width / 3
        return [
            `<circle r="${width / 2}" cx="${x + width / 2}" cy="${y + width / 2}" fill="none" stroke="black" stroke-width="1"></circle>`,
            defaultCenterText(x, y, width, height, text)
        ]
    })),
    graphElement("program", 1 / 3, openCloseHandler(terminatorConstructor(startKeyWord), terminatorConstructor(endKeyWord))),
    graphElement(["process", "block"], 2 / 3, simpleHandler((x, y, width, height, text) => [
        makeRect(x, y, width, height),
        defaultCenterText(x, y, width, height, text)
    ])),
    graphElement(["data", "io"], 2 / 3, simpleHandler((x, y, width, height, text) => {
        const padding = width / 4
        return [
            makePath(`M ${x - padding} ${y} l ${padding} ${height} l ${width + padding} 0 l ${-padding} ${-height} Z`),
            defaultCenterText(x, y, width, height, text)
        ]
    })),
    graphElement(["function", "func", "def"], 2 / 3, simpleHandler((x, y, width, height, text) => {
        const padding = 6
        return [
            makeRect(x - padding, y, width + padding * 2, height),
            makePath(`M ${x} ${y} l 0 ${height} M ${x + width} ${y} l 0 ${height}`),
            defaultCenterText(x, y, width, height, text)
        ]
    })),
    graphElement("if", 2 / 3, ifStatementHandler((x, y, width, height, text) => [
        makePath(`M ${x + width / 2} ${y + height} l ${width / 2} ${-height / 2} l ${-width / 2} ${-height / 2} l ${-width / 2} ${height / 2} Z`),
        defaultCenterText(x, y, width, height, text)
    ])),
    graphElement("loop", 2 / 3, openCloseHandler(loopOpenRawCompiler, loopCloseRawCompiler)),
    graphElement(["parallel", "join"], 0, (currentBlock, thisNode) => {

        let subBlock: Block = new HorizontalBlockOfBlocks(null)
        for (let child of thisNode.children) {
            if (child.length == 0) continue
            let innerBlock: Block = new ElementBlock();
            let innerCurrentBlock = innerBlock;
            for (let parsedNode of child) {
                let result = parsedNode.addToBlock(innerCurrentBlock);
                if (result.isError()) return result
                innerCurrentBlock = result.data!
            }
            subBlock.addBlock(innerBlock)
        }

        return Result.ok(currentBlock.next(subBlock))
    }),

    graphElement("for", 2 / 3, (currentBlock, thisNode) => {
        let blockMapElement = blockMap["block"];
        let graphElement = thisNode.element;

        thisNode.element = blockMapElement
        currentBlock = currentBlock.addElement(prepare(thisNode, thisNode.content[0], ((blockMapElement.handler as any).compiler as RawCompiler)))
        thisNode.element = graphElement
        currentBlock = currentBlock.addElement(prepare(thisNode, thisNode.content[1], loopOpenRawCompiler))
        let result = nodesToBlock(currentBlock, thisNode.children[0]);
        if (result.isError()) return result;

        currentBlock = result.data!
        thisNode.element = blockMapElement
        currentBlock = currentBlock.addElement(prepare(thisNode, thisNode.content[2], ((blockMapElement.handler as any).compiler as RawCompiler)))
        thisNode.element = graphElement
        currentBlock = currentBlock.addElement(prepare(thisNode, undefined, loopCloseRawCompiler))
        return Result.ok(currentBlock)
    })
    //TODO while, do-while
]

function loopCloseRawCompiler(x: number, y: number, width: number, height: number, text: NullableGraphText) {
    let part_size = Math.min(200000000, height / 4)
    return [
        makePath(`M ${x} ${y} l ${width} 0 l 0 ${height - part_size} l ${-part_size} ${part_size} l ${-(width - part_size * 2)} 0 l ${-part_size} ${-part_size} Z`),
        defaultCenterText(x, y, width, height, text)
    ];
}

function loopOpenRawCompiler(x: number, y: number, width: number, height: number, text: NullableGraphText) {
    let part_size = Math.min(20000000, height / 4)
    return [
        makePath(`M ${x} ${y + height} l ${width} 0 l 0 ${-(height - part_size)} l ${-part_size} ${-part_size} l ${-(width - part_size * 2)} 0 l ${-part_size} ${part_size} Z`),
        defaultCenterText(x, y, width, height, text)
    ];
}


const blockMap: { [name: string]: GraphElement } = {}
for (let blockListElement of blockList) {
    let name = blockListElement.name;
    if (typeof name == "string") {
        blockMap[name] = blockListElement
    } else {
        for (let alias of name) {
            blockMap[alias] = blockListElement
        }
    }
}
/*
*
* <rect x="--x" y="--y" width="--width" height="--height"/>
        <text style="x: calc(--x + calc())" dominant-baseline="middle" text-anchor="middle">TEXT</text>
*
* */