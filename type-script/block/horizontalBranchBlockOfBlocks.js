"use strict";
//depends: block
class HorizontalBranchBlockOfBlocks extends BlockOfBlocks {
    constructor() {
        super(null);
        this.type = HorizontalBranchBlockOfBlocks;
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
        for (let innerElement of this.innerElements) {
            let bb = innerElement.calculateBoundingBox(compileInfo);
            width += bb.bounds.width();
            // debugPoint()
            height = Math.max(height, bb.bounds.height());
        }
        height += compileInfo.topMargin;
        height += compileInfo.topMargin * 3;
        return BlockBoundingBox.makeCenter(width, height, 0);
    }
    compile(centerXCursor, cursorY, compileInfo) {
        const topMargin = compileInfo.topMargin;
        const width = compileInfo.width;
        let rootElement = null;
        let svgResult = [
            "<g class='block horizontal'>",
            bbToSvg("horiz", this.calculateBoundingBox(compileInfo), Vector.new(centerXCursor, cursorY), "red", compileInfo),
        ];
        const margin = this.marginBetweenBlocks;
        let amount = this.innerElements.length;
        let sizes = [];
        for (let i = 0; i < amount; i++) {
            sizes[i] = this.innerElements[i].calculateBoundingBox(compileInfo);
        }
        let myBB = this.calculateBoundingBox(compileInfo);
        class BranchInfo {
        }
        let branchInfos = this.innerElements.map(() => new BranchInfo());
        let currentXOffset = -myBB.width / 2;
        cursorY.move(topMargin);
        let startY = cursorY.value;
        let maxY = cursorY.value;
        //Drawing inner elements
        for (let i = 0; i < amount; i++) {
            let branchInfo = branchInfos[i];
            let innerElement = this.innerElements[i];
            branchInfo.isEmpty = innerElement.isEmpty();
            let bb = sizes[i];
            let outputXOffset = currentXOffset - bb.bounds.left;
            centerXCursor.withOffset(outputXOffset, centerXCursor => {
                let yClone = cursorY.clone();
                let compileResult = innerElement.compile(centerXCursor, yClone, compileInfo);
                svgResult.push.apply(svgResult, compileResult.svgCode);
                maxY = Math.max(maxY, cursorY.value + bb.bounds.height());
                branchInfo.output = compileResult.output;
            });
            debugPoint();
            let it = 0;
            currentXOffset += bb.bounds.width() + margin;
        }
        cursorY.value = maxY + topMargin * 3;
        let nextBlock = this.parentInfo !== undefined ? this.parentInfo.siblingIndex(1) : undefined;
        let hasAfter = !compileInfo.isLast;
        if (!hasAfter) {
            let myParent = this.parentInfo;
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
        svgResult.push("</g>");
        return new CompileResult(Vector.new(centerXCursor, cursorY), svgResult);
    }
}
