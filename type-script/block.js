"use strict";
class BlockBoundingBox {
    static make(input, width, height) {
        input.x += 5;
        return new BlockBoundingBox(input, width + 10, height + 4);
    }
    constructor(input, width, height) {
        this.anchor = input;
        this.width = width;
        this.height = height;
    }
}
function bbToSvg(name, bb, vector, color, compileInfo) {
    let x = vector.x - bb.width / 2;
    let y = vector.y;
    if (compileInfo.drawBB) {
        return `<rect class="bounding-box" x="${x}" y="${y}" width="${(bb.width)}" height="${(bb.height)}" style="fill: none" data-type="${name}" stroke-width="3" stroke="${color}"/>`;
    }
    else {
        return `<!--<rect x="${x}" y="${y}" width="${(bb.width)}" height="${(bb.height)}" style="fill: none" data-type="${name}" stroke="${color}"/>-->`;
    }
}
class ParentInfo {
    constructor(parent, inParentIndex) {
        this.parent = parent;
        this.inParentIndex = inParentIndex;
    }
    siblingIndex(siblingIndex) {
        return this.parent.innerElements[this.inParentIndex + siblingIndex];
    }
}
class AbstractBlock {
    next(block) {
        let parentInfo = this.assertHasParent();
        parentInfo.parent.innerElements.splice(parentInfo.inParentIndex + 1, 0, block);
        return block;
    }
    assertHasParent() {
        if (this.parentInfo == null)
            throw new Error("Parent is null");
        return this.parentInfo;
    }
    nextElement(error = false) {
        var _a;
        if (error)
            return this.assertHasParent().siblingIndex(1);
        return (_a = this.parentInfo) === null || _a === void 0 ? void 0 : _a.siblingIndex(1);
    }
}
class BlockOfBlocks extends AbstractBlock {
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
function svgLine(x1, y1, x2, y2) {
    return makePath(`M ${x1} ${y1} L ${x2} ${y2}`);
}
function rawSvgLine(x1, y1, x2, y2) {
    return `M ${x1} ${y1} L ${x2} ${y2}`;
}
