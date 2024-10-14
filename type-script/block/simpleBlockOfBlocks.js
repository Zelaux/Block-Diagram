"use strict";
//priority: 60
class SimpleBlockOfBlocks extends BlockOfBlocks {
    constructor() {
        super(null);
        this.type = SimpleBlockOfBlocks;
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
        let width = 1.50 * compileInfo.width;
        let height = (this.innerElements.length - 1) * compileInfo.topMargin;
        for (let innerElement of this.innerElements) {
            let bb = innerElement.calculateBoundingBox(compileInfo);
            height += bb.height;
            width = Math.max(width, bb.width);
        }
        return BlockBoundingBox.make(Vector.new(width / 2, 0), width, height);
    }
    compile(x, y, compileInfo) {
        var _a;
        const topMargin = compileInfo.topMargin;
        let width = compileInfo.width;
        let svgResult = [
            bbToSvg((_a = this.rootElement) === null || _a === void 0 ? void 0 : _a.name, this.calculateBoundingBox(compileInfo), Vector.new(x, y), "green")
        ];
        let prevPosition = null;
        for (let innerElement of this.innerElements) {
            if (prevPosition !== null) {
                svgResult.push(svgLine(prevPosition.x, prevPosition.y, x.value, y.value));
            }
            let bb = innerElement.calculateBoundingBox(compileInfo);
            x.withOffset(bb.width / 2 - bb.anchor.x, () => {
                y.withOffset(bb.anchor.y, () => {
                    // noinspection SillyAssignmentJS
                    let compileResult = innerElement.compile(x, y, compileInfo);
                    svgResult.push.apply(svgResult, compileResult.svgCode);
                    y.move(topMargin);
                    prevPosition = compileResult.output;
                });
            });
            // noinspection ConstantConditionalExpressionJS
            prevPosition = true ? prevPosition : Vector.ZERO;
        }
        return new CompileResult(prevPosition || Vector.new(x, y), svgResult);
    }
}
