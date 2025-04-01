"use strict";
//depends: block
class IfBlockBoundingBox extends BlockBoundingBox {
    constructor(bounds, output, children) {
        super(bounds, output);
        this.children = children;
    }
    static makeCenter(width, height, output, children) {
        return new IfBlockBoundingBox(makeCenteredBounds(width, height), output, children);
    }
    static make(bounds, output, children) {
        bounds = bounds.copy();
        bounds.left -= 5;
        let topOffset = 2;
        bounds.top -= topOffset;
        bounds.right += 5;
        bounds.bottom += topOffset;
        return new IfBlockBoundingBox(bounds, output, children);
    }
}
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
        return new IfBlockBoundingBox(bounds, 0, boxes);
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
        class BranchInfo {
        }
        let branchInfos = this.innerElements.map(() => new BranchInfo());
        let amountOfInner = this.innerElements.length;
        let positions = IfHorizontalBlock.POSITIONS[amountOfInner];
        for (let i = 0; i < positions.length; i++) {
            let position = positions[i];
            let info = branchInfos[i];
            info.bb = myBB.children[i];
            info.bounds = info.bb.bounds;
            info.rootPosition = position.copy()
                .mul(rootW, rootH)
                .add(centerXCursor.value, cursorY.value)
                .add(-rootW / 2, 0);
        }
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
        let maxY = cursorY.value;
        //Drawing inner elements
        for (let i = 0; i < amountOfInner; i++) {
            let info = branchInfos[i];
            let innerElement = this.innerElements[i];
            info.isEmpty = innerElement.isEmpty();
            centerXCursor.withOffset(info.offset.x, centerXCursor => {
                let yClone = cursorY.clone();
                let compileResult = innerElement.compile(centerXCursor, yClone, compileInfo);
                svgResult.push.apply(svgResult, compileResult.svgCode);
                maxY = Math.max(maxY, cursorY.value + info.bounds.height());
                info.output = compileResult.output;
            });
            debugPoint();
        }
        cursorY.value = maxY + topMargin * 3;
        //Drawing lines from root to inner
        for (let i = 0; i < branchInfos.length; i++) {
            let titlePosition = IfHorizontalBlock.TITLE_POSITION[branchInfos.length][i];
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
            let branchTitles = this.branchTitles;
            if (branchTitles != null) {
                svgResult.push(defaultCenterText(from.x + titlePosition.offset.x, from.y + titlePosition.offset.y, 0, 0, branchTitles[i], titlePosition.baseline, titlePosition.anchor));
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
