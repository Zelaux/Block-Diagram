type HeightInfo = { totalElements: number, unscaledHeight: number }

class BlockBoundingBox {
    /**
     * @Also input
     * */
    anchor: Vector
    width: number
    height: number

    static make(input: Vector, width: number, height: number) {
        input.x += 5
        return new BlockBoundingBox(input, width + 10, height + 4)
    }

    constructor(input: Vector, width: number, height: number) {
        this.anchor = input;
        this.width = width;
        this.height = height;
    }
}

function bbToSvg(name: string | undefined, bb: BlockBoundingBox, vector: Vector, color: string, compileInfo: CompileInfo) {
    let x = vector.x - bb.width / 2
    let y = vector.y
    if (compileInfo.drawBB) {
        return `<rect class="bounding-box" x="${x}" y="${y}" width="${(bb.width)}" height="${(bb.height)}" style="fill: none" data-type="${name}" stroke-width="3" stroke="${color}"/>`;
    } else {
        return `<!--<rect x="${x}" y="${y}" width="${(bb.width)}" height="${(bb.height)}" style="fill: none" data-type="${name}" stroke="${color}"/>-->`;
    }
}

interface Block {
    addBlock(block: Block): BlockOfBlocks

    addElement(element: PreparedGraphElement): BlockOfElements

    compile(centerX: Cursor, y: Cursor, compileInfo: CompileInfo): CompileResult

    isBlockContainer(): boolean

    isEmpty(): boolean;

    calculateBoundingBox(compileInfo: CompileInfo): BlockBoundingBox;

    next<T extends Block>(block: T): T;
}

class ParentInfo {
    parent: SimpleBlockOfBlocks
    inParentIndex: number

    constructor(parent: SimpleBlockOfBlocks, inParentIndex: number) {
        this.parent = parent;
        this.inParentIndex = inParentIndex;
    }

    siblingIndex(siblingIndex: number): Block | undefined {
        return this.parent.innerElements[this.inParentIndex + siblingIndex]
    }
}

abstract class AbstractBlock implements Block {
    next<T extends Block>(block: T): T {
        let parentInfo = this.assertHasParent();
        parentInfo.parent.innerElements.splice(parentInfo.inParentIndex + 1, 0, block)
        return block;
    }

    parentInfo?: ParentInfo

    abstract calculateBoundingBox(compileInfo: CompileInfo): BlockBoundingBox

    abstract isEmpty(): boolean

    abstract isBlockContainer(): boolean

    abstract addBlock(block: Block): BlockOfBlocks;

    abstract addElement(element: PreparedGraphElement): BlockOfElements;

    abstract compile(centerX: Cursor, y: Cursor, compileInfo: CompileInfo): CompileResult;

    protected assertHasParent() {
        if (this.parentInfo == null) throw new Error("Parent is null")
        return this.parentInfo
    }

    protected nextElement(error: boolean = false) {
        if (error) return this.assertHasParent().siblingIndex(1)
        return this.parentInfo?.siblingIndex(1)
    }
}


abstract class BlockOfBlocks extends AbstractBlock implements Block {
    marginBetweenBlocks: number = 15


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


    abstract addElement(element: PreparedGraphElement): BlockOfElements;

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

function svgLine(x1: number, y1: number, x2: number, y2: number) {
    return makePath(`M ${x1} ${y1} L ${x2} ${y2}`)
}

function rawSvgLine(x1: number, y1: number, x2: number, y2: number) {
    return `M ${x1} ${y1} L ${x2} ${y2}`
}


