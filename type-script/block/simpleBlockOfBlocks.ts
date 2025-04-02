//depends: block
class SimpleBlockOfBlocks extends BlockOfBlocks {
    type = SimpleBlockOfBlocks
    bbColor = "green"

    constructor() {
        super(null);
    }

    addChild<T extends AbstractBlock>(block: T): T {
        block.parentInfo = new ParentInfo(this, this.innerElements.length)
        this.innerElements.push(block)
        return block
    }

    addElement(element: PreparedGraphElement): BlockOfElements {
        return this.addChild(new BlockOfElements()).addElement(element);
    }


    addBlock(block: Block): BlockOfBlocks {
        // @ts-ignore
        this.addChild(block);
        return this;
    }

    calculateBoundingBox(compileInfo: CompileInfo): BlockBoundingBox {

        let width = 1.50 * compileInfo.width * 0;
        let bounds = Bounds.makeZero()
        bounds.right = width / 2
        bounds.left = -width / 2
        let height = (this.innerElements.length - 1) * compileInfo.topMargin;
        let current_position = Vector.new(0, 0);
        for (let i = 0; i < this.innerElements.length; i++) {
            let innerElement = this.innerElements[i];
            let bb = innerElement.calculateBoundingBox(compileInfo);
            let other = bb.bounds
                .copy()
                .shiftVector(current_position);
            console.log(other)
            bounds.expandBound(
                other
            )
            current_position.x += bb.outputWire
            current_position.y += bb.bounds.height()
            if (i + 1 < this.innerElements.length) {
                current_position.y += +compileInfo.topMargin
            }
        }
        return BlockBoundingBox.make(bounds, current_position.x)
    }


    compile(x: Cursor, y: Cursor, compileInfo: CompileInfo) {
        const topMargin = compileInfo.topMargin;
        let width = compileInfo.width;
        let svgResult: string[] = [
            "<g class='block simpleBlockOfBlocks'>",
            bbToSvg(this.rootElement == null ? "null" : this.rootElement.name, this.calculateBoundingBox(compileInfo), Vector.new(x, y), this.bbColor, compileInfo),
        ]
        let prevPosition: Vector | null = null

        let last = compileInfo.isLast;
        for (let i = 0; i < this.innerElements.length; i++) {
            let innerElement = this.innerElements[i];
            let bb = innerElement.calculateBoundingBox(compileInfo)
            compileInfo.isLast = last && (i == this.innerElements.length - 1)
            if (prevPosition !== null) {

                svgResult.push(svgLine(
                    prevPosition.x, prevPosition.y,
                    x.value, y.value,
                ))
            }

            // noinspection SillyAssignmentJS
            let compileResult = x.withOffset(0, () => {
                return innerElement.compile(x, y, compileInfo)
            });
            svgResult.push.apply(svgResult, compileResult.svgCode)
            if (i + 1 < this.innerElements.length) y.move(topMargin)
            prevPosition = compileResult.output
            // noinspection ConstantConditionalExpressionJS
            prevPosition = true ? prevPosition : Vector.ZERO

        }
        svgResult.push("</g>")
        return new CompileResult(prevPosition || Vector.new(x, y), svgResult)
    }

}