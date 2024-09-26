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
        let block1 = block;
        block1.nextBlock = this;
        return block;
    }
}
class BlockOfBlocks extends AbstractBlock {
    constructor(rootElement) {
        super();
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
class HorizontalBlockOfBlocks extends BlockOfBlocks {
    constructor(rootElement) {
        super(rootElement);
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
    compile(x, y, width) {
        const gap = 15;
        let svgResult = [];
        if (this.rootElement != null) {
            let height = this.rootElement.aspect * width;
            svgResult.push.apply(svgResult, this.rootElement.compile(x, y.v, width, height));
            y.move(height + gap);
        }
        let maxY = y.v;
        const margin = 15;
        let amount = this.innerElements.length;
        let sizes = [];
        let sum = 0;
        for (let i = 0; i < amount; i++) {
            sizes[i] = this.innerElements[i].calculateWidth();
            sum += sizes[i];
        }
        let myBlockWidth = sum * width + (sum - 1) * margin;
        let currentX = (x + width / 2) - myBlockWidth / 2;
        // if ((amount & 1) == 0) {
        //     currentX +=
        // }
        for (let i = 0; i < amount; i++) {
            let innerElement = this.innerElements[i];
            let cloneY = y.clone();
            let size = sizes[i];
            let blockWidth = (width * size + margin * (size - 1));
            svgResult.push.apply(svgResult, innerElement.compile(currentX + blockWidth / 2 - width / 2, cloneY, width));
            maxY = Math.max(maxY, cloneY.v);
            currentX += blockWidth + margin;
        }
        y.v = maxY + gap * 4;
        if (this.nextBlock != null) {
            svgResult.push.apply(svgResult, this.nextBlock.compile(x, y, width));
        }
        return svgResult;
    }
    calculateWidth() {
        let result = 0;
        for (let element of this.innerElements) {
            result += element.calculateWidth();
        }
        if (this.nextBlock == null) {
            return Math.max(1, result);
        }
        return Math.max(1, result, this.nextBlock.calculateWidth());
    }
}
class ElementBlock extends AbstractBlock {
    constructor() {
        super(...arguments);
        this.innerElements = [];
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
        for (let innerElement of this.innerElements) {
            let height = innerElement.aspect * width;
            svgResult.push.apply(svgResult, innerElement.compile(x, y.v, width, height));
            y.move(gap + height);
        }
        if (this.nextBlock != null) {
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
    calculateWidth() {
        if (this.nextBlock == null) {
            return 1;
        }
        return Math.max(1, this.nextBlock.calculateWidth());
    }
}
