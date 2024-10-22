"use strict";
class BlockBoundingBox {
    constructor(bounds, output) {
        this.outputWire = output;
        this.bounds = bounds;
        this.width = bounds.width();
        this.height = bounds.height();
        if (output != 0) {
            debugPoint();
        }
    }
    static makeCenter(width, height, output) {
        let hw = width / 2 + 5;
        return new BlockBoundingBox(new Bounds(-hw, -2, hw, height + 2), output);
    }
    static make(bounds, output) {
        bounds = bounds.copy();
        bounds.left -= 5;
        let topOffset = 2;
        bounds.top -= topOffset;
        bounds.right += 5;
        bounds.bottom += topOffset;
        return new BlockBoundingBox(bounds, output);
    }
    updateBounds(bounds = this.bounds) {
        // @ts-ignore
        this["width"] = bounds.width();
        // @ts-ignore
        this["height"] = bounds.height();
        this.bounds = bounds;
    }
}
function bbToSvg(name, bb, vector, color, compileInfo) {
    let width = bb.bounds.width();
    let height = bb.bounds.height();
    let x = vector.x + bb.bounds.x();
    let y = vector.y + bb.bounds.y();
    if (compileInfo.drawBB) {
        return `<rect class="bounding-box" x="${x}" y="${y}" width="${(width)}" height="${(height)}" style="fill: none" data-type="${name}" stroke-width="3" stroke="${color}"/>`;
    }
    else {
        return `<!--<rect x="${x}" y="${y}" width="${(width)}" height="${(height)}" style="fill: none" data-type="${name}" stroke="${color}"/>-->`;
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
    constructor(rootElement) {
        super();
        this.marginBetweenBlocks = 15;
        this.branchTitles = null;
        this.innerElements = [];
        this.rootElement = rootElement;
    }
    isEmpty() {
        return this.rootElement == null && this.innerElements.length == 0;
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
