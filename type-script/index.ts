

function textOr(text:NullableGraphText, fallback:GraphText) {

    return (text === undefined) || (text == null) || text.length === 0 ? fallback : text;
}


function defaultCenterText(x: number, y: number, width: number, height: number, text: NullableGraphText) {
    return `<text x="${x + width / 2}" y="${y + height / 2}" dominant-baseline="middle" text-anchor="middle">${(textOr(text, ""))}</text>`;
}


function makeRect(x: number, y: number, width: number, height: number) {
    return `<rect x="${x}" y="${y}" width="${width}" height="${height}" style="fill: none" stroke="black"/>`;
}

function makePath(path: string) {
    return `<path d="${path}" style="fill: none" stroke="black" />`;
}

const startKeyWord = () => "Начало";
const endKeyWord = () => "Конец";



function terminatorConstructor(isNullProvider:()=>string) {
    return (x: number, y: number, width: number, height: number, text: NullableGraphText) => {
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
    graphElement("program",1/3,openCloseHandler(terminatorConstructor(startKeyWord),terminatorConstructor(endKeyWord))),
    graphElement(["process","block"], 2 / 3, simpleHandler((x, y, width, height, text) => [
        makeRect(x, y, width, height),
        defaultCenterText(x, y, width, height, text)
    ])),
    graphElement(["data","io"], 2 / 3, simpleHandler((x, y, width, height, text) => {
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
    graphElement("if", 2 / 3, ifStatementHandler((x, y, width, height, text) => [
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


const blockMap:{[name:string]:GraphElement} = {}
for (let blockListElement of blockList) {
    let name = blockListElement.name;
    if (typeof name=="string") {
        blockMap[name] = blockListElement
    } else {
        for (let alias of name) {
            blockMap[alias] = blockListElement
        }
    }
}
/*
*
* <rect x="--x" y="--y" width="--width" height="--height"/>
        <text style="x: calc(--x + calc())" dominant-baseline="middle" text-anchor="middle">TEXT</text>
*
* */