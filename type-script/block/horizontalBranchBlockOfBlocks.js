"use strict";
//depends: block
class BranchTitle {
    constructor(text, position) {
        this.text = text;
        this.position = position;
    }
}
class HorizontalBranchInfo {
    setBB(bb) {
        this.bb = bb;
        this.bounds = bb.bounds;
    }
    setElement(element) {
        this.element = element;
        this.isEmpty = element.isEmpty();
    }
}
// @ts-ignore
class BlockBoundingBoxWithChildren extends BlockBoundingBox {
    constructor(bounds, output, children) {
        super(bounds, output);
        this.children = children;
    }
    static makeCenter(width, height, output, children) {
        return new BlockBoundingBoxWithChildren(makeCenteredBounds(width, height), output, children);
    }
    static make(bounds, output, children) {
        bounds = bounds.copy();
        // bounds.left -= 5
        // let topOffset = 2;
        // bounds.top -= topOffset
        // bounds.right += 5
        // bounds.bottom += topOffset
        return new BlockBoundingBoxWithChildren(bounds, output, children);
    }
}
class HorizontalBranchBlockOfBlocks extends BlockOfBlocks {
    constructor() {
        super(null);
        this.type = HorizontalBranchBlockOfBlocks;
    }
    static displayBranches(self, cursorY, branchInfos, centerXCursor, compileInfo, svgResult, topMargin) {
        let maxY = cursorY.value;
        //Drawing inner elements
        for (let i = 0; i < branchInfos.length; i++) {
            let info = branchInfos[i];
            let innerElement = info.element;
            centerXCursor.withOffset(info.offset.x, centerXCursor => {
                let yClone = cursorY.clone();
                let compileResult = innerElement.compile(centerXCursor, yClone, compileInfo);
                svgResult.push.apply(svgResult, compileResult.svgCode);
                maxY = Math.max(maxY, cursorY.value + info.bounds.height());
                info.output = compileResult.output;
            });
        }
        cursorY.value = maxY + topMargin * 3;
        HorizontalBranchBlockOfBlocks.addConnectionLines(self, compileInfo, branchInfos, maxY, topMargin, centerXCursor, cursorY, svgResult);
    }
    static addConnectionLines(self, compileInfo, branchInfos, maxY, topMargin, centerXCursor, cursorY, svgResult) {
        let nextBlock = self.parentInfo !== undefined ? self.parentInfo.siblingIndex(1) : undefined;
        let hasAfter = !compileInfo.isLast;
        if (!hasAfter) {
            let myParent = self.parentInfo;
            // debugPoint()
            while (myParent !== undefined) {
                if (myParent.siblingIndex(1) !== undefined) {
                    hasAfter = true;
                }
                myParent = myParent.parent.parentInfo;
            }
        }
        if (hasAfter) { //Drawing output lines
            let lines = [];
            {
                for (let info of branchInfos) {
                    let output = info.output;
                    lines.push(rawSvgLine(output.x, maxY + topMargin * 2, output.x, output.y));
                }
            }
            lines.push(rawSvgLine(branchInfos[0].output.x, maxY + topMargin * 2, branchInfos[branchInfos.length - 1].output.x, maxY + topMargin * 2));
            if (nextBlock != null && nextBlock.isEmpty()) {
                lines.push(rawSvgLine(centerXCursor.value, cursorY.value - topMargin, centerXCursor.value, maxY + topMargin * 2));
            }
            else {
                lines.push(rawSvgLine(centerXCursor.value, cursorY.value, centerXCursor.value, maxY + topMargin * 2));
            }
            svgResult.push(makePath(lines.join(" ")));
        }
    }
    addBlock(block) {
        this.innerElements.push(block);
        return this;
    }
    addElement(element) {
        return this.next(new BlockOfElements()).addElement(element);
    }
    apply(applier) {
        applier.apply(this);
        return this;
    }
    calculateBoundingBox(compileInfo) {
        let width = 0;
        let height = 0;
        let boxes = this.innerElements.map(it => it.calculateBoundingBox(compileInfo));
        for (let bb of boxes) {
            width += bb.bounds.width();
            // debugPoint()
            height = Math.max(height, bb.bounds.height());
        }
        height += compileInfo.topMargin;
        height += compileInfo.topMargin * 3;
        return BlockBoundingBoxWithChildren.makeCenter(width + this.marginBetweenBlocks * (boxes.length - 1), height, 0, boxes);
    }
    compile(centerXCursor, cursorY, compileInfo) {
        const topMargin = compileInfo.topMargin;
        let svgResult = [
            "<g class='block horizontal'>",
            bbToSvg("horiz", this.calculateBoundingBox(compileInfo), Vector.new(centerXCursor, cursorY), "red", compileInfo),
        ];
        const margin = this.marginBetweenBlocks;
        let amount = this.innerElements.length;
        let myBB = this.calculateBoundingBox(compileInfo);
        let branchInfos;
        {
            let xOffset = -myBB.bounds.width() / 2 + BlockBoundingBox.extraSize.x;
            branchInfos = this.innerElements.map((element, i) => {
                let info = new HorizontalBranchInfo();
                info.setElement(element);
                info.setBB(myBB.children[i]);
                info.offset = new Vector(xOffset - info.bounds.left, 0);
                xOffset += info.bounds.width() + margin;
                return info;
            });
        }
        cursorY.move(topMargin);
        HorizontalBranchBlockOfBlocks.displayBranches(this, cursorY, branchInfos, centerXCursor, compileInfo, svgResult, topMargin);
        svgResult.push("</g>");
        return new CompileResult(Vector.new(centerXCursor, cursorY), svgResult);
    }
}
