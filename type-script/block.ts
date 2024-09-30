type HeightInfo = { totalElements: number, unscaledHeight: number }

interface Block {
    next<BlockType extends Block>(exited: BlockType): BlockType

    prev<BlockType extends Block>(exited: BlockType): BlockType

    addBlock(block: Block): BlockOfBlocks

    addElement(element: PreparedGraphElement): ElementBlock

    compile(x: number, y: Cursor, width: number): string[]

    calculateWidth(): number

    calculateHeight(): HeightInfo

    isBlockContainer(): boolean

    isEmpty(): boolean;
}

abstract class AbstractBlock implements Block {
    abstract isEmpty(): boolean

    abstract isBlockContainer(): boolean

    abstract addBlock(block: Block): BlockOfBlocks;

    abstract addElement(element: PreparedGraphElement): ElementBlock;

    abstract compile(x: number, y: Cursor, width: number): string[];

    abstract calculateWidth(): number;

    abstract calculateHeight(): HeightInfo;


    prevBlock: Block | null = null
    nextBlock: Block | null = null


    next<BlockType extends Block>(exited: BlockType): BlockType {
        let block = exited;
        this.nextBlock = block;
        let block1 = (block as unknown) as AbstractBlock;
        block1.prevBlock = this;
        return block
    }

    prev<BlockType extends Block>(exited: BlockType): BlockType {
        let block = exited;

        this.prevBlock = block;
        if (block !== null) {
            let block1 = (block as unknown) as AbstractBlock;
            block1.nextBlock = this;
        }
        return block
    }


}


abstract class BlockOfBlocks extends AbstractBlock implements Block {

    isEmpty(): boolean {
        return this.rootElement == null && this.innerElements.length == 0;
    }

    rootElement: PreparedGraphElement | null
    branchTitles: NullableGraphText[] | null = null

    protected constructor(rootElement: PreparedGraphElement | null) {
        super();
        this.rootElement = rootElement;
    }

    innerElements: Block[] = []
    ;


    addBlock(block: Block): BlockOfBlocks {
        console.log(block)
        this.innerElements.push(block)
        return this;
    }

    addElement(element: PreparedGraphElement): ElementBlock {
        let elementBlock = this.next(new ElementBlock());
        return elementBlock.addElement(element);
    }


    isBlockContainer() {
        return true
    }

}

class TitlePosition {
    baseline: SVGDominantBaseline
    anchor: SVGTextAnchor
    offset: Vector

    constructor(baseline: SVGDominantBaseline, anchor: SVGTextAnchor, offset: Vector) {
        this.baseline = baseline;
        this.anchor = anchor;
        this.offset = offset;
    }

    static new(baseline: SVGDominantBaseline, anchor: SVGTextAnchor, offset: Vector = Vector.ZERO) {
        return new TitlePosition(baseline, anchor, offset)
    }
}

class HorizontalBlockOfBlocks extends BlockOfBlocks {
    type = HorizontalBlockOfBlocks

    constructor(rootElement: PreparedGraphElement | null) {
        super(rootElement);
    }

    calculateHeight(): HeightInfo {

        let max: HeightInfo = {totalElements: 0, unscaledHeight: 0};
        for (let innerElement of this.innerElements) {
            let values = innerElement.calculateHeight();
            max.totalElements = Math.max(values.totalElements, max.totalElements)
            max.unscaledHeight = Math.max(values.unscaledHeight, max.unscaledHeight)

        }
        if (this.rootElement != null) {
            max.totalElements++;
            max.unscaledHeight += this.rootElement.aspect;
        }
        if (this.nextBlock != null) {
            let next = this.nextBlock.calculateHeight();
            max.totalElements += next.totalElements
            max.unscaledHeight += next.unscaledHeight
        }
        return max
    }
    ;

    static TITLE_POSITION: TitlePosition[][] = (function () {
        let center = TitlePosition.new("hanging", "start",Vector.new(5,0));
        let left = TitlePosition.new("auto", "end", Vector.new(0, -5));
        let right = TitlePosition.new("auto", "start", Vector.new(0, -5));
        return [
            [],
            [center],
            [left, right],
            [left, center, right],
        ]
    })()
    static POSITIONS: Vector[][] = [
        [],
        [Vector.new(0.5, 1)],
        [Vector.new(0, 0.5), Vector.new(1, 0.5)],
        [Vector.new(0, 0.5), Vector.new(0.5, 1), Vector.new(1, 0.5)],
    ];

    compile(x: number, cursorY: Cursor, width: number) {
        const gap = 15;
        let svgResult: string[] = []

        let maxY = cursorY.value;
        const margin = 15
        let amount = this.innerElements.length;
        let sizes = []

        let sum = 0;
        for (let i = 0; i < amount; i++) {
            sizes[i] = this.innerElements[i].calculateWidth()
            sum += sizes[i]
        }
        let myBlockWidth = sum * width + (sum - 1) * margin;

        class BranchInfo {
            rootPosition?: Vector
            // @ts-ignore
            output: Vector//late init
            // @ts-ignore
            isEmpty: boolean//late init
        }

        let branchInfos: BranchInfo[] = this.innerElements.map(() => new BranchInfo())
        let currentX = (x + width / 2) - myBlockWidth / 2
        // if ((amount & 1) == 0) {
        //     currentX +=
        // }


        if (this.rootElement != null) {
            let height = this.rootElement.aspect * width


            let positions = HorizontalBlockOfBlocks.POSITIONS[amount];
            for (let i = 0; i < positions.length; i++) {
                let position = positions[i];
                branchInfos[i].rootPosition = position.copy().mul(width, height).add(x, cursorY.value)
            }
            svgResult.push.apply(svgResult, this.rootElement.compile(x, cursorY.value, width, height))

            cursorY.move(height + gap)

        }
        cursorY.move(gap)
        let startY = cursorY.value
        //Drawing inner elements
        for (let i = 0; i < amount; i++) {
            let branchInfo = branchInfos[i];
            let innerElement = this.innerElements[i];
            branchInfo.isEmpty = innerElement.isEmpty()
            let cloneY = cursorY.clone();
            let size = sizes[i];
            let blockWidth = (width * size + margin * (size - 1));
            let outputX = currentX + blockWidth / 2;
            svgResult.push.apply(svgResult, innerElement.compile(outputX - width / 2, cloneY, width))
            maxY = Math.max(maxY, cloneY.value)
            branchInfo.output = Vector.new(outputX, cloneY.value - gap)
            currentX += blockWidth + margin;
        }
        cursorY.value = maxY + gap * 4;
        if (this.nextBlock != null) {//Drawing output lines
            for (let info of branchInfos) {
                let output = info.output;
                svgResult.push(svgLine(output.x, maxY + gap * 2, output.x, output.y))
            }
        }
        if (this.rootElement != null) {//Drawing lines from root to inner


            for (let i = 0; i < branchInfos.length; i++) {
                let titlePosition = HorizontalBlockOfBlocks.TITLE_POSITION[branchInfos.length][i];
                let branchInfo = branchInfos[i];
                if (branchInfo.isEmpty && branchInfos.length == 3 && i == 1) continue
                let from = branchInfo.rootPosition!;
                let to = branchInfo.output;
                let tox = to.x;
                if (!branchInfo.isEmpty) {
                    svgResult.push(
                        svgLine(tox, from.y, from.x, from.y),
                        svgLine(tox, from.y, tox, startY)
                    )
                } else {
                    svgResult.push(
                        svgLine(tox, from.y, from.x, from.y),
                        svgLine(tox, from.y, tox, to.y)
                    )
                }
                let branchTitles = this.branchTitles;
                if (branchTitles != null) {
                    svgResult.push(defaultCenterText(
                        from.x + titlePosition.offset.x, from.y + titlePosition.offset.y
                        , 0, 0,
                        branchTitles[i],
                        titlePosition.baseline, titlePosition.anchor))
                }
            }
        }
        if (this.nextBlock != null) {
            svgResult.push(svgLine(branchInfos[0].output.x, maxY + gap * 2, branchInfos[branchInfos.length - 1].output.x, maxY + gap * 2))
            if (this.nextBlock.isEmpty()) {
                svgResult.push(svgLine(x + width / 2, cursorY.value - gap, x + width / 2, maxY + gap * 2))
            } else {
                svgResult.push(svgLine(x + width / 2, cursorY.value, x + width / 2, maxY + gap * 2))
            }
            svgResult.push.apply(svgResult, this.nextBlock.compile(x, cursorY, width))
        }
        return svgResult
    }

    calculateWidth(): number {
        let result = 0;
        for (let element of this.innerElements) {
            result += element.calculateWidth();
        }
        if (this.nextBlock == null) {
            return Math.max(1, result)
        }
        return Math.max(1, result, this.nextBlock.calculateWidth())
    }
}

function svgLine(x1: number, y1: number, x2: number, y2: number) {
    return makePath(`M ${x1} ${y1} L ${x2} ${y2}`)
}

class ElementBlock extends AbstractBlock {
    isEmpty(): boolean {
        return this.innerElements.length == 0
    }


    innerElements: PreparedGraphElement[] = [];

    addBlock(block: Block): BlockOfBlocks {
        throw new Error("Unsupported operation")
    }


    addElement(element: PreparedGraphElement) {
        this.innerElements.push(element)
        return this;
    }


    isBlockContainer() {
        return false
    }

    compile(x: number, y: Cursor, width: number) {
        const gap = 15;
        let svgResult: string[] = []
        let prevPosition: [number, number] | undefined = undefined
        for (let innerElement of this.innerElements) {
            let height = innerElement.aspect * width;
            if (prevPosition !== undefined) {
                svgResult.push(svgLine(x + width / 2, y.value, x + width / 2, y.value - gap))
            }
            svgResult.push.apply(svgResult, innerElement.compile(x, y.value, width, height))
            y.move(gap + height)
            prevPosition = [x, y.value]

        }
        if (this.nextBlock != null) {

            svgResult.push(svgLine(x + width / 2, y.value, x + width / 2, y.value - gap))
            svgResult.push.apply(svgResult, this.nextBlock.compile(x, y, width))
        }
        return svgResult
    }

    calculateHeight(): HeightInfo {
        let info: HeightInfo = {
            totalElements: this.innerElements.length,
            unscaledHeight: 0
        };
        for (let innerElement of this.innerElements) {
            info.unscaledHeight += innerElement.aspect
        }
        if (this.nextBlock != null) {
            let nextinfo = this.nextBlock.calculateHeight();
            info.totalElements += nextinfo.totalElements
            info.unscaledHeight += nextinfo.unscaledHeight
        }
        return info;
    }

    calculateWidth(): number {
        let number = 1.50;
        if (this.nextBlock == null) {
            return number
        }
        return Math.max(number, this.nextBlock.calculateWidth())
    }
}