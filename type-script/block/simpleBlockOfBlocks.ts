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

        let width = 1.50 * compileInfo.width;
        let height = (this.innerElements.length - 1) * compileInfo.topMargin;
        for (let innerElement of this.innerElements) {
            let bb = innerElement.calculateBoundingBox(compileInfo);
            height += bb.height
            width = Math.max(width, (bb.width - bb.anchor.x) * 2, bb.anchor.x * 2)
        }

        return BlockBoundingBox.make(Vector.new(width / 2, 0), width, height)
    }


    compile(x: Cursor, y: Cursor, compileInfo: CompileInfo) {
        const topMargin = compileInfo.topMargin;
        let width = compileInfo.width;
        let svgResult: string[] = [
            bbToSvg(this.rootElement?.name, this.calculateBoundingBox(compileInfo), Vector.new(x, y), this.bbColor, compileInfo)
        ]
        let prevPosition: Vector | null = null

        let last = compileInfo.isLast;
        for (let i = 0; i < this.innerElements.length; i++) {
            let innerElement = this.innerElements[i];
            compileInfo.isLast = last && (i == this.innerElements.length - 1)
            if (prevPosition !== null) {

                svgResult.push(svgLine(
                    prevPosition.x, prevPosition.y,
                    x.value, y.value,
                ))
            }
            let bb = innerElement.calculateBoundingBox(compileInfo);
            x.withOffset(bb.width / 2 - bb.anchor.x, () => {
                y.withOffset(bb.anchor.y, () => {
                    // noinspection SillyAssignmentJS
                    let compileResult = innerElement.compile(x, y, compileInfo);
                    svgResult.push.apply(svgResult, compileResult.svgCode)
                    y.move(topMargin)
                    prevPosition = compileResult.output

                })
            })
            // noinspection ConstantConditionalExpressionJS
            prevPosition = true ? prevPosition : Vector.ZERO

        }
        return new CompileResult(prevPosition || Vector.new(x, y), svgResult)
    }

}