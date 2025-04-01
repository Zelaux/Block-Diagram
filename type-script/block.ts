type HeightInfo = { totalElements: number, unscaledHeight: number }

function makeCenteredBounds(width: number, height: number) {
    let hw = width / 2 + 5;
    let bounds1 = new Bounds(-hw, -2, hw, height + 2);
    return bounds1;
}

class BlockBoundingBox {
    // /**@deprecated*/
    // inputWireX: number
    // /**@deprecated*/
    // inputWireY: number = 0
    bounds: Bounds
    outputWire: number
    /**@deprecated*/
    readonly width: number;
    /**@deprecated*/
    readonly height: number;

    constructor( bounds: Bounds, output: number) {
        if(output!==0)throw new Error()
        this.outputWire = output;
        this.bounds = bounds;
        this.width = bounds.width()
        this.height = bounds.height()
        if(output!=0){
            debugPoint()
        }
    }

    static makeCenter(width: number, height: number, output: number) {

        return new BlockBoundingBox(makeCenteredBounds(width, height), output)
    }

    static make(bounds: Bounds, output: number) {
        bounds = bounds.copy();
        bounds.left -= 5
        let topOffset = 2;
        bounds.top -= topOffset
        bounds.right += 5
        bounds.bottom += topOffset
        return new BlockBoundingBox( bounds, output)
    }

    updateBounds(bounds: Bounds = this.bounds) {
        // @ts-ignore
        this["width"] = bounds.width()
        // @ts-ignore
        this["height"] = bounds.height()
        this.bounds = bounds;
    }
}

function bbToSvg(name: string | undefined, bb: BlockBoundingBox, vector: Vector, color: string, compileInfo: CompileInfo) {
    let width = bb.bounds.width()
    let height = bb.bounds.height()
    let x = vector.x + bb.bounds.x()
    let y = vector.y + bb.bounds.y()
    if(name===undefined){
        console.error(new Error())
    }
    if (compileInfo.drawBB) {
        return `<g class="bounding-box">
<rect x="${x}" y="${y}" width="${(width)}" height="${(height)}" style="fill: none" data-type="${name}" stroke-width="3" stroke="${color}"/>
<circle r="5" cx="${vector.x}" cy="${vector.y}" fill="${color}"></circle>
<!--<line stroke-width="5" x1="${vector.x}" y1="${vector.y}" x2="${x}" y2="${y}" stroke="${color}"></line>-->
</g>
`;
    } else {
        return ``;
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
    parentInfo?: ParentInfo

    next<T extends Block>(block: T): T {
        let parentInfo = this.assertHasParent();
        parentInfo.parent.innerElements.splice(parentInfo.inParentIndex + 1, 0, block)
        return block;
    }

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
    rootElement: PreparedGraphElement | null
    branchTitles: NullableGraphText[] | null = null
    innerElements: Block[] = []
    ;

    protected constructor(rootElement: PreparedGraphElement | null) {
        super();
        this.rootElement = rootElement;
    }

    isEmpty(): boolean {
        return this.rootElement == null && this.innerElements.length == 0;
    }

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


