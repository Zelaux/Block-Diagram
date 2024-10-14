//depends: block
class HorizontalBranchBlockOfBlocks extends BlockOfBlocks {
    type = HorizontalBranchBlockOfBlocks

    addBlock(block: Block): BlockOfBlocks {
        this.innerElements.push(block)
        return this;
    }

    addElement(element: PreparedGraphElement): BlockOfElements {
        return this.next(new BlockOfElements()).addElement(element);
    }

    constructor(rootElement: PreparedGraphElement | null) {
        super(rootElement);
    }


    apply(applier: (this: HorizontalBranchBlockOfBlocks) => void): HorizontalBranchBlockOfBlocks {
        applier.apply(this)
        return this
    }

    calculateBoundingBox(compileInfo: CompileInfo): BlockBoundingBox {
        let width = (this.innerElements.length - 1) * this.marginBetweenBlocks
        let height = 0
        for (let innerElement of this.innerElements) {
            let bb = innerElement.calculateBoundingBox(compileInfo);
            width += bb.width
            // debugPoint()
            height = Math.max(height, bb.height)
        }
        if (this.rootElement != null) {
            height += this.rootElement.aspect * compileInfo.width + compileInfo.topMargin;
        }
        height += compileInfo.topMargin
        height += compileInfo.topMargin * 3
        return new BlockBoundingBox(Vector.new(width / 2, 0), width, height);
    }


    static TITLE_POSITION: TitlePosition[][] = (function () {
        let center = TitlePosition.new("hanging", "start", Vector.new(5, 0));
        let left = TitlePosition.new("auto", "end", Vector.new(0, -5));
        let right = TitlePosition.new("auto", "start", Vector.new(0, -5));
        return [
            [],
            [center],
            [left, right],
            [left, center, right],
        ]
    })()
    static POSITIONS: Vector[][] = [
        [],
        [Vector.new(0.5, 1)],
        [Vector.new(0, 0.5), Vector.new(1, 0.5)],
        [Vector.new(0, 0.5), Vector.new(0.5, 1), Vector.new(1, 0.5)],
    ];

    compile(centerXCursor: Cursor, cursorY: Cursor, compileInfo: CompileInfo) {

        const topMargin = compileInfo.topMargin;
        const width = compileInfo.width;
        let svgResult: string[] = [
            bbToSvg(this.rootElement?.name, this.calculateBoundingBox(compileInfo), Vector.new(centerXCursor, cursorY),"red",compileInfo)
        ]

        const margin = this.marginBetweenBlocks
        let amount = this.innerElements.length;
        let sizes: BlockBoundingBox[] = []

        for (let i = 0; i < amount; i++) {
            sizes[i] = this.innerElements[i].calculateBoundingBox(compileInfo)
        }
        let myBB = this.calculateBoundingBox(compileInfo)


        class BranchInfo {
            rootPosition?: Vector
            // @ts-ignore
            output: Vector//late init
            // @ts-ignore
            isEmpty: boolean//late init
        }

        let branchInfos: BranchInfo[] = this.innerElements.map(() => new BranchInfo())
        let currentXOffset = -myBB.width / 2

        if (this.rootElement != null) {
            let height = this.rootElement.aspect * width


            let positions = HorizontalBranchBlockOfBlocks.POSITIONS[amount];
            for (let i = 0; i < positions.length; i++) {
                let position = positions[i];
                branchInfos[i].rootPosition = position.copy()
                    .mul(width, height)
                    .add(centerXCursor.value, cursorY.value)
                    .add(-width / 2, 0)
            }
            svgResult.push.apply(svgResult, this.rootElement.compile(centerXCursor.value - width / 2, cursorY.value, width, height))

            cursorY.move(height)
        }
        cursorY.move(topMargin)
        let startY = cursorY.value
        let maxY = cursorY.value
        //Drawing inner elements
        for (let i = 0; i < amount; i++) {
            let branchInfo = branchInfos[i];
            let innerElement = this.innerElements[i];
            branchInfo.isEmpty = innerElement.isEmpty()
            let bb = sizes[i];
            let outputXOffset = currentXOffset;
            centerXCursor.withOffset(outputXOffset + bb.anchor.x, centerXCursor => {
                let yClone = cursorY.clone();
                yClone.value += bb.anchor.y;
                let compileResult = innerElement.compile(centerXCursor, yClone, compileInfo);
                svgResult.push.apply(svgResult, compileResult.svgCode)
                maxY = Math.max(maxY, cursorY.value + bb.height)
                branchInfo.output = compileResult.output
            })
            currentXOffset += bb.width + margin;
        }
        cursorY.value = maxY + topMargin * 3;
        if (this.rootElement != null) {//Drawing lines from root to inner


            for (let i = 0; i < branchInfos.length; i++) {
                let titlePosition = HorizontalBranchBlockOfBlocks.TITLE_POSITION[branchInfos.length][i];
                let branchInfo = branchInfos[i];
                if (branchInfo.isEmpty && branchInfos.length == 3 && i == 1) continue
                let from = branchInfo.rootPosition!;
                let to = branchInfo.output;
                let tox = to.x;
                if (!branchInfo.isEmpty) {
                    svgResult.push(makePath([
                        rawSvgLine(tox, from.y, from.x, from.y),
                        rawSvgLine(tox, from.y, tox, startY)
                    ]))
                } else {
                    svgResult.push(makePath([
                        rawSvgLine(tox, from.y, from.x, from.y),
                        rawSvgLine(tox, from.y, tox, to.y)
                    ]))
                }
                let branchTitles = this.branchTitles;
                if (branchTitles != null) {
                    svgResult.push(defaultCenterText(
                        from.x + titlePosition.offset.x, from.y + titlePosition.offset.y
                        , 0, 0,
                        branchTitles[i],
                        titlePosition.baseline, titlePosition.anchor))
                }
            }
        }

        let nextBlock = this.parentInfo !== undefined ? this.parentInfo.siblingIndex(1) : undefined;

        let hasAfter = !compileInfo.isLast;
       if(!hasAfter) {
            let myParent = this.parentInfo;

            // debugPoint()
            while (myParent !== undefined) {
                if (myParent.siblingIndex(1) !== undefined) {
                    hasAfter = true
                }
                myParent = myParent.parent.parentInfo
            }
        }
        if (hasAfter) {//Drawing output lines
            let lines: string[] = [];
            {
                for (let info of branchInfos) {
                    let output = info.output;
                    lines.push(rawSvgLine(output.x, maxY + topMargin * 2, output.x, output.y))
                }

            }


            lines.push(rawSvgLine(branchInfos[0].output.x, maxY + topMargin * 2, branchInfos[branchInfos.length - 1].output.x, maxY + topMargin * 2))
            if (nextBlock != null && nextBlock.isEmpty()) {
                lines.push(rawSvgLine(centerXCursor.value, cursorY.value - topMargin, centerXCursor.value, maxY + topMargin * 2))
            } else {
                lines.push(rawSvgLine(centerXCursor.value, cursorY.value, centerXCursor.value, maxY + topMargin * 2))
            }
            svgResult.push(makePath(lines.join(" ")))
        }
        return new CompileResult(Vector.new(centerXCursor, cursorY), svgResult)
    }

}