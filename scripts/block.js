class Block {
    /**@type {PreparedGraphElement|null}*/
    rootElement

    /**@type {Block[]|PreparedGraphElement[]}*/
    innerElements
    /**@type Block*/
    prevBlock
    /**@type Block*/
    nextBlock
    ;

    constructor() {
        this.subBlocks = []
        this.prevBlock = this.nextBlock = null;

    }

    /**@return Block*/
    next() {
        let block = arguments.length === 0 ? new Block() : arguments[0];
        this.nextBlock = block;
        block.prevBlock = this;
        return block
    }

    /**@return Block*/
    prev() {
        let block = arguments.length === 0 ? new Block() : arguments[0];
        this.prevBlock = block;
        block.nextBlock = this;
        return block
    }

    /**@param x {number}
     *@param y {Cursor}
     *@param width {number}*/
    compile(x, y, width) {
        const gap = 15;
        /**@type string[]*/
        let svgResult = []
        if (this.rootElement === null) {
            for (let /**@type PreparedGraphElement*/ innerElement of this.innerElements) {

                let height = innerElement.aspect * width;
                svgResult.push.apply(svgResult, innerElement.compile(x, y.v, width, height))
                y.move(gap + height)
            }
            return svgResult
        }
        let maxY = y.v;
        const margin = 15
        let amount = this.innerElements.length;
        let currentX = x - (amount * width + (amount - 1) * margin) / 2
        for (let i = 0; i < amount; i++) {
            /**@type Block*/
            let innerElement = this.innerElements[i];
            let cloneY = y.clone();
            svgResult.push.apply(svgResult, innerElement.compile(currentX, cloneY, width))
            maxY = Math.max(maxY, cloneY.v)
            currentX += width + margin;
        }
        y.v = maxY;
        return svgResult
    }

    calculateWidth() {
        let result = 0;
        if (this.rootElement === null) {
            for (let element of this.innerElements) {
                result += element.calculateWidth();
            }
        } else {
            result = 1;
        }
        return Math.max(1, result, this.nextBlock.calculateWidth())
    }
}