type SVGTextAnchor = "start" | "middle" | "end"
type SVGDominantBaseline =
    "auto"
    // | "text-bottom"
    // | "alphabetic"
    // | "ideographic"
    | "middle"
    // | "central"
    // | "mathematical"
    | "hanging"

// | "text-top"
function debugPoint() {
    let i = 0;
}

function textOr(text: NullableGraphText, fallback: GraphText) {

    return (text === undefined) || (text == null) || text.length === 0 ? fallback : text;
}

var FONT_SIZE=16
function defaultCenterText(x: number, y: number, width: number, height: number, text: NullableGraphText, baseline: SVGDominantBaseline = "middle", anchor: SVGTextAnchor = "middle", widthAspect: number = 1) {
    let notNullText = textOr(text, "");
    let arrayText: string[];
    if (typeof notNullText == "string") {
        arrayText = notNullText.split("\n")
    } else {
        arrayText = notNullText
    }

    // @ts-ignore
    arrayText = arrayText.flatMap((it: string) => it.split("\n"))
    for (let i = 0; i < arrayText.length; i++) {
        let it = arrayText[i];
        if (i == 0) {
            arrayText[i] = `<tspan x="0" dy="${1.2 * (0.5 - arrayText.length / 2)}em">${it}</tspan>`
        } else {
            arrayText[i] = `<tspan x="0" dy="1.2em">${it}</tspan>`
        }

    }
    let aspect = height / width;
    let compiledText = arrayText.join("\n")
    let cx = x + width / 2;
    let cy = y + height / 2;
    return `<g class="text-group" font-size="${FONT_SIZE}px" transform="translate(${cx} ${cy})" data-aspect="${JSON.stringify(aspect)}" data-widthAspect="${JSON.stringify(widthAspect)}">
<text x="0" y="0" dominant-baseline="${baseline}" text-anchor="${anchor}">${compiledText}</text>
</g>`;
    // return `<text x="${x + width / 2}" y="${y + height / 2}" dominant-baseline="middle" text-anchor="middle">${compiledText}</text>`;
}


function makeRect(x: number, y: number, width: number, height: number) {
    return `<rect x="${x}" y="${y}" width="${width}" height="${height}" style="fill: none" stroke="black"/>`;
}

function makePath(path: string | string[]) {
    if (typeof path != "string") {
        path = path.join(" ")
    }
    return `<path d="${path}" style="fill: none" stroke="black" />`;
}
