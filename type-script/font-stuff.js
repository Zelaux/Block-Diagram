"use strict";
const FONT_W_H_RATIO = 600 / 1000;
class TextBounds {
    constructor(width, height, size, linesize, text) {
        this.width = width;
        this.height = height;
        this.size = size;
        this.linesize = linesize;
        this.text = text;
    }
    toBounds(xAlign, yAlign) {
        let bb = Bounds.makeZero();
        switch (xAlign) {
            case -1:
                bb.left = -this.width;
                break;
            case 0:
                bb.left = -this.width / 2;
                bb.right = this.width / 2;
                break;
            case 1:
                bb.right = this.width;
                break;
        }
        switch (yAlign) {
            case -1:
                bb.top = -this.height;
                break;
            case 0:
                bb.top = -this.height / 2;
                bb.bottom = this.height / 2;
                break;
            case 1:
                bb.bottom = this.height;
                break;
        }
        return bb;
    }
}
const TextUtil = {
    calculateBoundingBox: function (size, linesize, text) {
        const lineH = size * linesize;
        const charW = Math.round(size * FONT_W_H_RATIO);
        let lineW = 0;
        let w = 0, h = 0;
        let hasAny = false;
        for (let c of text) {
            if (!hasAny && /\s/.test(c) && c != '\n')
                continue;
            switch (c) {
                case '\t':
                    lineW += charW * 4;
                    continue;
                case '\r':
                    continue;
                case '\n':
                    w = Math.max(w, lineW);
                    h += lineH;
                    lineW = 0;
                    hasAny = false;
                    continue;
            }
            lineW += charW;
            hasAny = true;
        }
        w = Math.max(w, lineW);
        h += lineH;
        return new TextBounds(w, h, size, linesize, text);
    }
};
