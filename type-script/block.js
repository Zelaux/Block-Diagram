"use strict";
class AbstractBlock {
    constructor() {
        this.prevBlock = null;
        this.nextBlock = null;
    }
    next(exited) {
        let block = exited;
        this.nextBlock = block;
        let block1 = block;
        block1.prevBlock = this;
        return block;
    }
    prev(exited) {
        let block = exited;
        this.prevBlock = block;
        if (block !== null) {
            let block1 = block;
            block1.nextBlock = this;
        }
        return block;
    }
}
class BlockOfBlocks extends AbstractBlock {
    calculateExtraWidth() {
        return this.marginBetweenBlocks * (this.innerElements.length - 1);
    }
    isEmpty() {
        return this.rootElement == null && this.innerElements.length == 0;
    }
    constructor(rootElement) {
        super();
        this.marginBetweenBlocks = 15;
        this.branchTitles = null;
        this.innerElements = [];
        this.rootElement = rootElement;
    }
    addBlock(block) {
        console.log(block);
        this.innerElements.push(block);
        return this;
    }
    addElement(element) {
        let elementBlock = this.next(new ElementBlock());
        return elementBlock.addElement(element);
    }
    isBlockContainer() {
        return true;
    }
}
class TitlePosition {
    constructor(baseline, anchor, offset) {
        this.baseline = baseline;
        this.anchor = anchor;
        this.offset = offset;
    }
    static new(baseline, anchor, offset = Vector.ZERO) {
        return new TitlePosition(baseline, anchor, offset);
    }
}
class HorizontalBlockOfBlocks extends BlockOfBlocks {
    constructor(rootElement) {
        super(rootElement);
        this.type = HorizontalBlockOfBlocks;
    }
    apply(applier) {
        applier.apply(this);
        return this;
    }
    calculateHeight() {
        let max = { totalElements: 0, unscaledHeight: 0 };
        for (let innerElement of this.innerElements) {
            let values = innerElement.calculateHeight();
            max.totalElements = Math.max(values.totalElements, max.totalElements);
            max.unscaledHeight = Math.max(values.unscaledHeight, max.unscaledHeight);
        }
        if (this.rootElement != null) {
            max.totalElements++;
            max.unscaledHeight += this.rootElement.aspect;
        }
        if (this.nextBlock != null) {
            let next = this.nextBlock.calculateHeight();
            max.totalElements += next.totalElements;
            max.unscaledHeight += next.unscaledHeight;
        }
        return max;
    }
    ;
    compile(x, cursorY, width) {
        const gap = 15;
        let svgResult = [];
        let maxY = cursorY.value;
        const margin = this.marginBetweenBlocks;
        let amount = this.innerElements.length;
        let sizes = [];
        let myBlockWidth = 0;
        for (let i = 0; i < amount; i++) {
            sizes[i] = this.innerElements[i].calculateWidth(width);
            myBlockWidth += sizes[i];
            if (i > 0) {
                myBlockWidth += margin;
            }
        }
        class BranchInfo {
        }
        let branchInfos = this.innerElements.map(() => new BranchInfo());
        let currentX = (x + width / 2) - myBlockWidth / 2;
        // if ((amount & 1) == 0) {
        //     currentX +=
        // }
        if (this.rootElement != null) {
            let height = this.rootElement.aspect * width;
            let positions = HorizontalBlockOfBlocks.POSITIONS[amount];
            for (let i = 0; i < positions.length; i++) {
                let position = positions[i];
                branchInfos[i].rootPosition = position.copy().mul(width, height).add(x, cursorY.value);
            }
            svgResult.push.apply(svgResult, this.rootElement.compile(x, cursorY.value, width, height));
            cursorY.move(height + gap);
        }
        cursorY.move(gap);
        let startY = cursorY.value;
        //Drawing inner elements
        for (let i = 0; i < amount; i++) {
            let branchInfo = branchInfos[i];
            let innerElement = this.innerElements[i];
            branchInfo.isEmpty = innerElement.isEmpty();
            let cloneY = cursorY.clone();
            let blockWidth = sizes[i];
            let outputX = currentX + blockWidth / 2;
            svgResult.push.apply(svgResult, innerElement.compile(outputX - width / 2, cloneY, width));
            maxY = Math.max(maxY, cloneY.value);
            branchInfo.output = Vector.new(outputX, cloneY.value - gap);
            currentX += blockWidth + margin;
        }
        cursorY.value = maxY + gap * 4;
        if (this.nextBlock != null) { //Drawing output lines
            for (let info of branchInfos) {
                let output = info.output;
                svgResult.push(svgLine(output.x, maxY + gap * 2, output.x, output.y));
            }
        }
        if (this.rootElement != null) { //Drawing lines from root to inner
            for (let i = 0; i < branchInfos.length; i++) {
                let titlePosition = HorizontalBlockOfBlocks.TITLE_POSITION[branchInfos.length][i];
                let branchInfo = branchInfos[i];
                if (branchInfo.isEmpty && branchInfos.length == 3 && i == 1)
                    continue;
                let from = branchInfo.rootPosition;
                let to = branchInfo.output;
                let tox = to.x;
                if (!branchInfo.isEmpty) {
                    svgResult.push(svgLine(tox, from.y, from.x, from.y), svgLine(tox, from.y, tox, startY));
                }
                else {
                    svgResult.push(svgLine(tox, from.y, from.x, from.y), svgLine(tox, from.y, tox, to.y));
                }
                let branchTitles = this.branchTitles;
                if (branchTitles != null) {
                    svgResult.push(defaultCenterText(from.x + titlePosition.offset.x, from.y + titlePosition.offset.y, 0, 0, branchTitles[i], titlePosition.baseline, titlePosition.anchor));
                }
            }
        }
        if (this.nextBlock != null) {
            svgResult.push(svgLine(branchInfos[0].output.x, maxY + gap * 2, branchInfos[branchInfos.length - 1].output.x, maxY + gap * 2));
            if (this.nextBlock.isEmpty()) {
                svgResult.push(svgLine(x + width / 2, cursorY.value - gap, x + width / 2, maxY + gap * 2));
            }
            else {
                svgResult.push(svgLine(x + width / 2, cursorY.value, x + width / 2, maxY + gap * 2));
            }
            svgResult.push.apply(svgResult, this.nextBlock.compile(x, cursorY, width));
        }
        return svgResult;
    }
    calculateWidth(width) {
        let result = this.calculateExtraWidth();
        for (let element of this.innerElements) {
            result += element.calculateWidth(width);
        }
        if (this.nextBlock == null) {
            return Math.max(width, result);
        }
        return Math.max(width, result, this.nextBlock.calculateWidth(width));
    }
}
HorizontalBlockOfBlocks.TITLE_POSITION = (function () {
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
HorizontalBlockOfBlocks.POSITIONS = [
    [],
    [Vector.new(0.5, 1)],
    [Vector.new(0, 0.5), Vector.new(1, 0.5)],
    [Vector.new(0, 0.5), Vector.new(0.5, 1), Vector.new(1, 0.5)],
];
function svgLine(x1, y1, x2, y2) {
    return makePath(`M ${x1} ${y1} L ${x2} ${y2}`);
}
class ElementBlock extends AbstractBlock {
    constructor() {
        super(...arguments);
        this.innerElements = [];
    }
    calculateExtraWidth() {
        return 0;
    }
    isEmpty() {
        return this.innerElements.length == 0;
    }
    addBlock(block) {
        throw new Error("Unsupported operation");
    }
    addElement(element) {
        this.innerElements.push(element);
        return this;
    }
    isBlockContainer() {
        return false;
    }
    compile(x, y, width) {
        const gap = 15;
        let svgResult = [];
        let prevPosition = undefined;
        for (let innerElement of this.innerElements) {
            let height = innerElement.aspect * width;
            if (prevPosition !== undefined) {
                svgResult.push(svgLine(x + width / 2, y.value, x + width / 2, y.value - gap));
            }
            svgResult.push.apply(svgResult, innerElement.compile(x, y.value, width, height));
            y.move(gap + height);
            prevPosition = [x, y.value];
        }
        if (this.nextBlock != null) {
            svgResult.push(svgLine(x + width / 2, y.value, x + width / 2, y.value - gap));
            svgResult.push.apply(svgResult, this.nextBlock.compile(x, y, width));
        }
        return svgResult;
    }
    calculateHeight() {
        let info = {
            totalElements: this.innerElements.length,
            unscaledHeight: 0
        };
        for (let innerElement of this.innerElements) {
            info.unscaledHeight += innerElement.aspect;
        }
        if (this.nextBlock != null) {
            let nextinfo = this.nextBlock.calculateHeight();
            info.totalElements += nextinfo.totalElements;
            info.unscaledHeight += nextinfo.unscaledHeight;
        }
        return info;
    }
    calculateWidth(width) {
        let number = 1.50 * width;
        if (this.nextBlock == null) {
            return number;
        }
        return Math.max(number, this.nextBlock.calculateWidth(width));
    }
}
