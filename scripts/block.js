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
        this.innerElements = []
        this.prevBlock = this.nextBlock = null;

    }

    /**@return Block*/
    next() {
        let block = arguments.length === 0 ? new Block() : arguments[0];
        this.nextBlock = block;
        block.prevBlock = this;
        return block
    }

    /**@param block {Block}*/
    addBlock(block) {
        console.assert(block.innerElements !== undefined)
        this.innerElements.push(block)
    }

    /**@param element {PreparedGraphElement}*/
    addElement(element) {
        console.assert(element.aspect !== undefined)
        this.innerElements.push(element)
    }

    /**@return Block*/
    prev() {
        let block = arguments.length === 0 ? new Block() : arguments[0];
        this.prevBlock = block;
        block.nextBlock = this;
        return block
    }

    isHorizontal(){
        return this.rootElement!=null
    }
    /**@param x {number}
     *@param y {Cursor}
     *@param width {number}*/
    compile(x, y, width) {
        const gap = 15;
        /**@type string[]*/
        let svgResult = []
        if (this.rootElement == null) {
            for (let /**@type PreparedGraphElement*/ innerElement of this.innerElements) {

                let height = innerElement.aspect * width;
                svgResult.push.apply(svgResult, innerElement.compile(x, y.v, width, height))
                y.move(gap + height)
            }

        } else {

            {
                let height = this.rootElement.aspect * width
                svgResult.push.apply(svgResult, this.rootElement.compile(x, y.v, width, height))
                y.move(height + gap)
            }
            let maxY = y.v;
            const margin = 15
            let amount = this.innerElements.length;

            let sizes=[]
            let sum=0;
            for (let i = 0; i < amount; i++) {
                sizes[i]=this.innerElements[i].calculateWidth()
                sum+=sizes[i]
            }
            let myBlockWidth = sum * width + (sum - 1) * margin;
            let currentX = (x+width/2)- myBlockWidth / 2
            // if ((amount & 1) == 0) {
            //     currentX +=
            // }
            for (let i = 0; i < amount; i++) {
                /**@type Block*/
                let innerElement = this.innerElements[i];
                let cloneY = y.clone();
                let size = sizes[i];
                let blockWidth = (width*size + margin*(size-1));
                svgResult.push.apply(svgResult, innerElement.compile(currentX+blockWidth/2-width/2, cloneY, width))
                maxY = Math.max(maxY, cloneY.v)
                currentX += blockWidth+margin;
            }
            y.v = maxY+gap*4;
        }
        if (this.nextBlock != null) {
            svgResult.push.apply(svgResult, this.nextBlock.compile(x, y, width))
        }
        return svgResult
    }

    calculateWidth() {
        let result = 0;
        if (this.rootElement != null) {
            for (let element of this.innerElements) {
                result += element.calculateWidth();
            }
        } else {
            result = 1
        }
        if (this.nextBlock == null) {
            return Math.max(1, result)
        }
        return Math.max(1, result, this.nextBlock.calculateWidth())
    }
}