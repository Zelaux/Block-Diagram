

/**
 * @param {string|null|undefined} text
 * @param {string} fallback
 */
function textOr(text, fallback) {

    return (text === undefined) || (text == null) || text.length === 0 ? fallback : text;
}

/**
 * @param {number} x
 * @param {number} y
 * @param {number} width
 * @param {number} height
 * @param {string|null} text
 */
function defaultCenterText(x, y, width, height, text) {
    return `<text x="${x + width / 2}" y="${y + height / 2}" dominant-baseline="middle" text-anchor="middle">${(textOr(text, ""))}</text>`;
}


function makeRect(x, y, width, height) {
    return `<rect x="${x}" y="${y}" width="${width}" height="${height}" style="fill: none" stroke="black"/>`;
}

function makePath(path) {
    return `<path d="${path}" style="fill: none" stroke="black" />`;
}

const startKeyWord = () => "Начало";
const endKeyWord = () => "Конец";


/**
 * @param {()=> string} isNullProvider
 */
function terminatorConstructor(isNullProvider) {
    return (x, y, width, height, text) => {
        let hh = height / 2;//half_height
        let wl = width - height;//width_left
        return [
            makePath(`M ${x} ${y + hh} q 0 ${hh} ${hh} ${hh} l ${wl} 0 q ${hh} 0 ${hh} ${-hh} q 0 ${-hh} ${-hh} ${-hh} l ${-wl} 0 q ${-hh} 0 ${-hh} ${hh}`),
            defaultCenterText(x, y, width, height, textOr(text, isNullProvider()))
        ]
    };
}

let blockList = [
    graphElement("start", 1 / 3, simpleHandler(terminatorConstructor(startKeyWord))),
    graphElement(["end", "stop"], 1 / 3, simpleHandler(terminatorConstructor(endKeyWord))),
    graphElement("process", 2 / 3, simpleHandler((x, y, width, height, text) => [
        makeRect(x, y, width, height),
        defaultCenterText(x, y, width, height, text)
    ])),
    graphElement("data", 2 / 3, simpleHandler((x, y, width, height, text) => {
        const padding = 10
        return [
            makePath(`M ${x - padding} ${y} l ${padding} ${height} l ${width + padding} 0 l ${-padding} ${-height} Z`),
            defaultCenterText(x, y, width, height, text)
        ]
    })),
    graphElement("function", 2 / 3, simpleHandler((x, y, width, height, text) => {
        const padding = 6
        return [
            makeRect(x - padding, y, width + padding * 2, height),
            makePath(`M ${x} ${y} l 0 ${height} M ${x + width} ${y} l 0 ${height}`),
            defaultCenterText(x, y, width, height, text)
        ]
    })),
    graphElement("if", 2 / 3,ifStatementHandler( (x, y, width, height, text) => [
        makePath(`M ${x + width / 2} ${y + height} l ${width / 2} ${-height / 2} l ${-width / 2} ${-height / 2} l ${-width / 2} ${height / 2} Z`),
        defaultCenterText(x, y, width, height, text)
    ])),
    graphElement("loop", 2 / 3, openCloseHandler(
        (x, y, width, height, text) => {
            let part_size = Math.min(20, height / 3)
            return [
                makePath(`M ${x} ${y + height} l ${width} 0 l 0 ${-(height - part_size)} l ${-part_size} ${-part_size} l ${-(width - part_size * 2)} 0 l ${-part_size} ${part_size} Z`),
                defaultCenterText(x, y, width, height, text)
            ];
        },
        (x, y, width, height, text) => {
            let part_size = Math.min(20, height / 3)
            return [
                makePath(`M ${x} ${y} l ${width} 0 l 0 ${height - part_size} l ${-part_size} ${part_size} l ${-(width - part_size * 2)} 0 l ${-part_size} ${-part_size} Z`),
                defaultCenterText(x, y, width, height, text)
            ];
        }
    ))
]

/**@type {{[name:string]: RawGraphElement}}*/
const blockMap = {}
for (let blockListElement of blockList) {
    blockMap[blockListElement.name] = blockListElement
}
/*
*
* <rect x="--x" y="--y" width="--width" height="--height"/>
        <text style="x: calc(--x + calc())" dominant-baseline="middle" text-anchor="middle">TEXT</text>
*
* */