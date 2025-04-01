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
class SidedIfBlock extends AbstractBlock {
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
                bounds = secondData.bounds.copy().merge(firstData.bounds, Direction.Left, this.marginBetweenBlocks);
                break;
            case IfBranchType.Right:
                bounds = firstData.bounds.copy().merge(secondData.bounds, Direction.Right, this.marginBetweenBlocks);
                break;
        }
        let rootH = this.rootElement.aspect * compileInfo.width;
        let fullWidth = compileInfo.width * 1.5;
        bounds.shift(0, rootH + compileInfo.topMargin);
        bounds.expand(-fullWidth / 2, 0);
        bounds.expand(fullWidth / 2, rootH);
        bounds.expand(0, bounds.bottom + compileInfo.topMargin);
        bounds.expand(0, bounds.bottom + compileInfo.topMargin * 3);
        return BlockBoundingBoxWithChildren.make(bounds, 0, [firstData, secondData]);
    }
    compile(centerXCursor, cursorY, compileInfo) {
        const topMargin = compileInfo.topMargin;
        const rootElement = this.rootElement;
        const rootW = compileInfo.width;
        const rootH = rootElement.aspect * rootW;
        const myBB = this.calculateBoundingBox(compileInfo);
        const svgResult = [
            "<g class='block ifBlock'>",
            bbToSvg(rootElement.name, myBB, Vector.new(centerXCursor, cursorY), this.bbColor, compileInfo),
        ];
        let elements = [this.firstBlock, this.secondBlock];
        let branchInfos = elements.map((element, i) => {
            let info = new HorizontalBranchInfo();
            info.setElement(element.block);
            info.setBB(myBB.children[i]);
            let iShifted = i + this.branchType;
            info.title = new BranchTitle(element.title, IfHorizontalBlock.TITLE_POSITION[3][iShifted]);
            info.rootPosition = IfHorizontalBlock.POSITIONS[3][iShifted].copy()
                .mul(rootW, rootH)
                .add(centerXCursor.value, cursorY.value)
                .add(-rootW / 2, 0);
            return info;
        });
        svgResult.push.apply(svgResult, rootElement.compile(centerXCursor.value - rootW / 2, cursorY.value, rootW, rootH));
        cursorY.move(rootH);
        cursorY.move(topMargin);
        let leftInfo = branchInfos[0];
        let rightInfo = branchInfos[1];
        switch (this.branchType) {
            case IfBranchType.Left:
                leftInfo.offset = Vector.new(rightInfo.bounds.left - leftInfo.bounds.right - this.marginBetweenBlocks, 0);
                rightInfo.offset = Vector.ZERO;
                break;
            case IfBranchType.Right:
                leftInfo.offset = Vector.new(0, 0);
                rightInfo.offset = Vector.new(leftInfo.bounds.right - rightInfo.bounds.left + this.marginBetweenBlocks, 0);
                break;
        }
        let startY = cursorY.value;
        HorizontalBranchBlockOfBlocks.displayBranches(this, cursorY, branchInfos, centerXCursor, compileInfo, svgResult, topMargin);
        {
            //Drawing lines from root to inner
            for (let i = 0; i < branchInfos.length; i++) {
                let titlePosition = IfHorizontalBlock.TITLE_POSITION[3][i + this.branchType];
                let info = branchInfos[i];
                if (info.isEmpty && branchInfos.length == 3 && i == 1)
                    continue;
                let from = info.rootPosition;
                let to = info.output;
                let tox = to.x;
                if (!info.isEmpty) {
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
                if (info.title !== undefined) {
                    let title = info.title;
                    let titlePosition = title.position;
                    svgResult.push(defaultCenterText(from.x + titlePosition.offset.x, from.y + titlePosition.offset.y, 0, 0, title.text, titlePosition.baseline, titlePosition.anchor));
                }
            }
        }
        svgResult.push("</g>");
        return new CompileResult(Vector.new(centerXCursor, cursorY), svgResult);
    }
}
