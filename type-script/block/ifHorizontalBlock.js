"use strict";
//depends: block
class IfHorizontalBlock extends BlockOfBlocks {
    constructor(rootElement) {
        super(rootElement);
        this.justParallel = true;
        this.type = IfHorizontalBlock;
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
        let rootElement = this.rootElement;
        let rootH = rootElement.aspect * compileInfo.width;
        let rootW = compileInfo.width;
        let bounds;
        let boxes = this.innerElements.map(it => it.calculateBoundingBox(compileInfo));
        let hrootW = rootW / 2;
        let size = this.innerElements.length;
        let left, right;
        if (size == 3) {
            bounds = boxes[1].bounds.copy();
            left = boxes[0].bounds;
            right = boxes[2].bounds;
            let leftIn = bounds.left - this.marginBetweenBlocks - left.right;
            let rightIn = bounds.right + this.marginBetweenBlocks + right.left;
            left.right += Math.max(hrootW + leftIn, 0);
            right.left -= Math.max(hrootW - rightIn, 0);
        }
        else {
            bounds = Bounds.makeZero();
            left = boxes[0].bounds;
            right = boxes[1].bounds;
            left.right += Math.max(hrootW - left.right, 0);
            right.left -= Math.max(hrootW + right.left, 0);
        }
        let margin = size == 3 ? this.marginBetweenBlocks : this.marginBetweenBlocks / 2;
        bounds.merge(left, Direction.Left, margin);
        bounds.merge(right, Direction.Right, margin);
        bounds.bottom += rootH + compileInfo.topMargin;
        bounds.bottom += compileInfo.topMargin * 4;
        return new BlockBoundingBoxWithChildren(bounds, 0, boxes);
    }
    compile(centerXCursor, cursorY, compileInfo) {
        const topMargin = compileInfo.topMargin;
        let rootElement = this.rootElement;
        const rootH = rootElement.aspect * compileInfo.width;
        const rootW = compileInfo.width;
        let myBB = this.calculateBoundingBox(compileInfo);
        let svgResult = [
            "<g class='block if horizontal'>",
            bbToSvg(rootElement.name, myBB, Vector.new(centerXCursor, cursorY), "red", compileInfo),
        ];
        let branchTitles = this.branchTitles;
        let amountOfInner = this.innerElements.length;
        let positions = IfHorizontalBlock.POSITIONS[amountOfInner];
        let branchInfos = this.innerElements.map((element, i) => {
            let position = positions[i];
            let info = new HorizontalBranchInfo();
            info.element = element;
            info.bb = myBB.children[i];
            info.bounds = info.bb.bounds;
            info.rootPosition = position.copy()
                .mul(rootW, rootH)
                .add(centerXCursor.value, cursorY.value)
                .add(-rootW / 2, 0);
            if (branchTitles != null) {
                info.title = new BranchTitle(branchTitles[i], IfHorizontalBlock.TITLE_POSITION[amountOfInner][i]);
            }
            info.isEmpty = element.isEmpty();
            return info;
        });
        switch (amountOfInner) {
            case 2: {
                let left = branchInfos[0];
                let right = branchInfos[1];
                left.offset = new Vector(-left.bounds.right - this.marginBetweenBlocks / 2, 0);
                right.offset = new Vector(-right.bounds.left + this.marginBetweenBlocks / 2, 0);
                break;
            }
            case 3:
                {
                    let left = branchInfos[0];
                    let center = branchInfos[1];
                    let right = branchInfos[2];
                    let leftIn = center.bounds.left - this.marginBetweenBlocks - left.bounds.right;
                    let rightIn = center.bounds.right + this.marginBetweenBlocks - right.bounds.left;
                    left.offset = new Vector(leftIn, 0);
                    right.offset = new Vector(rightIn, 0);
                    center.offset = Vector.ZERO;
                }
                break;
        }
        svgResult.push.apply(svgResult, rootElement.compile(centerXCursor.value - rootW / 2, cursorY.value, rootW, rootH));
        cursorY.move(rootH);
        cursorY.move(topMargin);
        let startY = cursorY.value;
        HorizontalBranchBlockOfBlocks.displayBranches(this, cursorY, branchInfos, centerXCursor, compileInfo, svgResult, topMargin);
        {
            //Drawing lines from root to inner
            for (let i = 0; i < branchInfos.length; i++) {
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
IfHorizontalBlock.TITLE_POSITION = (function () {
    let center = TitlePosition.new("hanging", "start", Vector.new(5, 0));
    let left = TitlePosition.new("auto", "end", Vector.new(0, -5));
    let right = TitlePosition.new("auto", "start", Vector.new(0, -5));
    return [
        [],
        [center],
        [left, right],
        [left, center, right],
    ];
})();
IfHorizontalBlock.POSITIONS = [
    [],
    [Vector.new(0.5, 1)],
    [Vector.new(0, 0.5), Vector.new(1, 0.5)],
    [Vector.new(0, 0.5), Vector.new(0.5, 1), Vector.new(1, 0.5)],
];
