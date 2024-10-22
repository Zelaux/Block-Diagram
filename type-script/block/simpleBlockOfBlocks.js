"use strict";
//depends: block
class SimpleBlockOfBlocks extends BlockOfBlocks {
    constructor() {
        super(null);
        this.type = SimpleBlockOfBlocks;
        this.bbColor = "green";
    }
    addChild(block) {
        block.parentInfo = new ParentInfo(this, this.innerElements.length);
        this.innerElements.push(block);
        return block;
    }
    addElement(element) {
        return this.addChild(new BlockOfElements()).addElement(element);
    }
    addBlock(block) {
        // @ts-ignore
        this.addChild(block);
        return this;
    }
    calculateBoundingBox(compileInfo) {
        let width = 1.50 * compileInfo.width * 0;
        let bounds = Bounds.makeZero();
        bounds.right = width / 2;
        bounds.left = -width / 2;
        let height = (this.innerElements.length - 1) * compileInfo.topMargin;
        let current_position = Vector.new(0, 0);
        for (let i = 0; i < this.innerElements.length; i++) {
            let innerElement = this.innerElements[i];
            let bb = innerElement.calculateBoundingBox(compileInfo);
            let other = bb.bounds
                .copy()
                .shiftVector(current_position);
            console.log(other);
            bounds.expandBound(other);
            current_position.x += bb.outputWire;
            current_position.y += bb.bounds.height();
            if (i + 1 < this.innerElements.length) {
                current_position.y += +compileInfo.topMargin;
            }
        }
        return BlockBoundingBox.make(bounds, current_position.x);
    }
    compile(x, y, compileInfo) {
        var _a;
        const topMargin = compileInfo.topMargin;
        let width = compileInfo.width;
        let svgResult = [
            bbToSvg((_a = this.rootElement) === null || _a === void 0 ? void 0 : _a.name, this.calculateBoundingBox(compileInfo), Vector.new(x, y), this.bbColor, compileInfo)
        ];
        let prevPosition = null;
        let last = compileInfo.isLast;
        for (let i = 0; i < this.innerElements.length; i++) {
            let innerElement = this.innerElements[i];
            let bb = innerElement.calculateBoundingBox(compileInfo);
            compileInfo.isLast = last && (i == this.innerElements.length - 1);
            if (prevPosition !== null) {
                svgResult.push(svgLine(prevPosition.x, prevPosition.y, x.value, y.value));
            }
            // noinspection SillyAssignmentJS
            let compileResult = x.withOffset(0, () => {
                return innerElement.compile(x, y, compileInfo);
            });
            svgResult.push.apply(svgResult, compileResult.svgCode);
            y.move(topMargin);
            prevPosition = compileResult.output;
            // noinspection ConstantConditionalExpressionJS
            prevPosition = true ? prevPosition : Vector.ZERO;
        }
        return new CompileResult(prevPosition || Vector.new(x, y), svgResult);
    }
}
