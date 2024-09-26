interface Block {
    next<BlockType extends Block>(exited: BlockType): BlockType

    prev<BlockType extends Block>(exited: BlockType): BlockType

    addBlock(block: Block): BlockOfBlocks

    addElement(element: PreparedGraphElement): ElementBlock

    compile(x: number, y: Cursor, width: number): string[]

    calculateWidth(): number

    calculateHeight(): number

    isBlockContainer(): boolean
}

abstract class AbstractBlock implements Block {
    abstract isBlockContainer(): boolean

    abstract addBlock(block: Block): BlockOfBlocks;

    abstract addElement(element: PreparedGraphElement): ElementBlock;

    abstract compile(x: number, y: Cursor, width: number): string[];

    abstract calculateWidth(): number;

    abstract calculateHeight(): number;


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
        let block1 = (block as unknown) as AbstractBlock;
        block1.nextBlock = this;
        return block
    }


}


abstract class BlockOfBlocks extends AbstractBlock implements Block {

    rootElement: PreparedGraphElement

    protected constructor(rootElement: PreparedGraphElement) {
        super();
        this.rootElement = rootElement;
    }

    innerElements: Block[] = []
    ;


    addBlock(block: Block): BlockOfBlocks {
        this.innerElements.push(block)
        return this;
    }

    addElement(element: PreparedGraphElement): ElementBlock {
        let elementBlock = new ElementBlock();
        return elementBlock.addElement(element);
    }


    isBlockContainer() {
        return true
    }
}

class HorizontalBlockOfBlocks extends BlockOfBlocks {

    constructor(rootElement: PreparedGraphElement) {
        super(rootElement);
    }

    calculateHeight(): number {
        let max = 0;
        for (let innerElement of this.innerElements) {
            max = Math.max(innerElement.calculateHeight(), max)
        }
        return max
    }
    ;


    compile(x: number, y: Cursor, width: number) {
        const gap = 15;
        let svgResult: string[] = []

        {
            let height = this.rootElement.aspect * width
            svgResult.push.apply(svgResult, this.rootElement.compile(x, y.v, width, height))
            y.move(height + gap)
        }
        let maxY = y.v;
        const margin = 15
        let amount = this.innerElements.length;

        let sizes = []
        let sum = 0;
        for (let i = 0; i < amount; i++) {
            sizes[i] = this.innerElements[i].calculateWidth()
            sum += sizes[i]
        }
        let myBlockWidth = sum * width + (sum - 1) * margin;
        let currentX = (x + width / 2) - myBlockWidth / 2
        // if ((amount & 1) == 0) {
        //     currentX +=
        // }
        for (let i = 0; i < amount; i++) {
            let innerElement = this.innerElements[i];
            let cloneY = y.clone();
            let size = sizes[i];
            let blockWidth = (width * size + margin * (size - 1));
            svgResult.push.apply(svgResult, innerElement.compile(currentX + blockWidth / 2 - width / 2, cloneY, width))
            maxY = Math.max(maxY, cloneY.v)
            currentX += blockWidth + margin;
        }
        y.v = maxY + gap * 4;

        if (this.nextBlock != null) {
            svgResult.push.apply(svgResult, this.nextBlock.compile(x, y, width))
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

class ElementBlock extends AbstractBlock {


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
        for (let innerElement of this.innerElements) {
            let height = innerElement.aspect * width;
            svgResult.push.apply(svgResult, innerElement.compile(x, y.v, width, height))
            y.move(gap + height)
        }
        if (this.nextBlock != null) {
            svgResult.push.apply(svgResult, this.nextBlock.compile(x, y, width))
        }
        return svgResult
    }

    calculateHeight(): number {
        return this.innerElements.length;
    }

    calculateWidth(): number {
        if (this.nextBlock == null) {
            return 1
        }
        return Math.max(1, this.nextBlock.calculateWidth())
    }
}