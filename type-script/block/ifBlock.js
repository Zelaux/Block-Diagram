"use strict";
var IfBranchType;
(function (IfBranchType) {
    IfBranchType[IfBranchType["Left"] = 0] = "Left";
    IfBranchType[IfBranchType["Right"] = 1] = "Right";
})(IfBranchType || (IfBranchType = {}));
class IfBlockBranch {
    constructor(block, title) {
        this.block = block;
        this.title = title;
    }
}
class IfBlock extends AbstractBlock {
    constructor(rootElement, firstBlock, secondBlock, branchType) {
        super();
        this.marginBetweenBlocks = 15;
        this.bbColor = "cyan";
        this.rootElement = rootElement;
        this.firstBlock = firstBlock;
        this.secondBlock = secondBlock;
        this.branchType = branchType;
    }
    isEmpty() {
        return false;
    }
    isBlockContainer() {
        return true;
    }
    addElement(element) {
        return this.next(new BlockOfElements()).addElement(element);
    }
    addBlock(block) {
        let parentInfo = this.assertHasParent();
        parentInfo.parent.addBlock(block);
        return parentInfo.parent;
    }
    calculateBoundingBox(compileInfo) {
        let firstData = this.firstBlock.block.calculateBoundingBox(compileInfo);
        let secondData = this.secondBlock.block.calculateBoundingBox(compileInfo);
        let bounds;
        switch (this.branchType) {
            case IfBranchType.Left:
                bounds = secondData.bounds.merge(firstData.bounds, Direction.Left, this.marginBetweenBlocks);
                break;
            case IfBranchType.Right:
                bounds = firstData.bounds.merge(secondData.bounds, Direction.Right, this.marginBetweenBlocks);
                break;
        }
        let rootH = this.rootElement.aspect * compileInfo.width;
        let fullWidth = compileInfo.width * 1.5;
        bounds.shift(0, rootH + compileInfo.topMargin);
        bounds.expand(-fullWidth / 2, 0);
        bounds.expand(fullWidth / 2, rootH);
        bounds.expand(0, bounds.bottom + compileInfo.topMargin);
        bounds.expand(0, bounds.bottom + compileInfo.topMargin * 3);
        return BlockBoundingBox.make(bounds, 0);
    }
    compile(centerXCursor, cursorY, compileInfo) {
        var _a;
        const topMargin = compileInfo.topMargin;
        const width = compileInfo.width;
        let svgResult = [
            bbToSvg((_a = this.rootElement) === null || _a === void 0 ? void 0 : _a.name, this.calculateBoundingBox(compileInfo), Vector.new(centerXCursor, cursorY), this.bbColor, compileInfo)
        ];
        const margin = this.marginBetweenBlocks;
        let amount = 2;
        let elements = [
            this.firstBlock, this.secondBlock
        ];
        let sizes = elements.map(it => it.block.calculateBoundingBox(compileInfo));
        let myBB = this.calculateBoundingBox(compileInfo);
        class BranchInfo {
        }
        let branchInfos = elements.map(() => new BranchInfo());
        let indecies;
        switch (this.branchType) {
            case IfBranchType.Left:
                indecies = [0, 1];
                break;
            case IfBranchType.Right:
                indecies = [1, 2];
                break;
        }
        if (this.rootElement != null) {
            let height = this.rootElement.aspect * width;
            let positions = indecies.map(it => HorizontalBranchBlockOfBlocks.POSITIONS[3][it]);
            for (let i = 0; i < positions.length; i++) {
                let position = positions[i];
                branchInfos[i].rootPosition = position.copy()
                    .mul(width, height)
                    .add(centerXCursor.value, cursorY.value)
                    .add(-width / 2, 0);
            }
            svgResult.push.apply(svgResult, this.rootElement.compile(centerXCursor.value - width / 2, cursorY.value, width, height));
            cursorY.move(height);
        }
        cursorY.move(topMargin);
        let startY = cursorY.value;
        let maxY = cursorY.value;
        let currentXOffsets;
        switch (this.branchType) {
            case IfBranchType.Left:
                currentXOffsets = [-this.marginBetweenBlocks + sizes[1].bounds.left + sizes[0].bounds.left, 0];
                break;
            case IfBranchType.Right:
                currentXOffsets = [0, this.marginBetweenBlocks + sizes[1].bounds.right + sizes[0].bounds.right];
                break;
        }
        //Drawing inner elements
        for (let i = 0; i < amount; i++) {
            let branchInfo = branchInfos[i];
            let innerElement = elements[i].block;
            branchInfo.isEmpty = innerElement.isEmpty();
            let bb = sizes[i];
            let outputXOffset = currentXOffsets[i];
            centerXCursor.withOffset(outputXOffset, centerXCursor => {
                let yClone = cursorY.clone();
                let compileResult = innerElement.compile(centerXCursor, yClone, compileInfo);
                svgResult.push.apply(svgResult, compileResult.svgCode);
                maxY = Math.max(maxY, cursorY.value + bb.height);
                branchInfo.output = compileResult.output;
            });
        }
        cursorY.value = maxY + topMargin * 3;
        if (this.rootElement != null) { //Drawing lines from root to inner
            for (let i = 0; i < branchInfos.length; i++) {
                let titlePosition = HorizontalBranchBlockOfBlocks.TITLE_POSITION[branchInfos.length][indecies[i]];
                let branchInfo = branchInfos[i];
                if (branchInfo.isEmpty && branchInfos.length == 3 && i == 1)
                    continue;
                let from = branchInfo.rootPosition;
                let to = branchInfo.output;
                let tox = to.x;
                if (!branchInfo.isEmpty) {
                    svgResult.push(makePath([
                        rawSvgLine(tox, from.y, from.x, from.y),
                        rawSvgLine(tox, from.y, tox, startY)
                    ]));
                }
                else {
                    svgResult.push(makePath([
                        rawSvgLine(tox, from.y, from.x, from.y),
                        rawSvgLine(tox, from.y, tox, to.y)
                    ]));
                }
                svgResult.push(defaultCenterText(from.x + titlePosition.offset.x, from.y + titlePosition.offset.y, 0, 0, elements[i].title, titlePosition.baseline, titlePosition.anchor));
            }
        }
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
        return new CompileResult(Vector.new(centerXCursor, cursorY), svgResult);
    }
}
