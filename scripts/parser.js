/**@param open {string}
 * @param close {string|null}
 *
 * @return string[]
 * */

function bracePair(open, close) {
    return [open, close == null ? open : close]
}

// noinspection JSCheckFunctionSignatures
const BRACES = [
    bracePair("`"),
    bracePair("(", ")"),
    bracePair("\""),
]
const OPEN_BRACES = BRACES.map(it => it[0])
const CLOSE_BRACES = BRACES.map(it => it[1])
const SEARCH_COMMAND = 0;
const SEARCH_CONTENT_BRACE = 1;
const SEARCH_CHILD_BRACE = 2;
const TERMINATE_SYMBOLS = RegExp("\\W")
const SPACE_SYMBOLS = RegExp("\\s")

const NL_SYMBOLS = RegExp("(\n|\r|\n\r)")

class ParsedNode {

    /**@type GraphElement*/
    element
    /**@type {ParsedNode|null}*/
    parent
    /**@type ParsedNode[][]*/
    children
    /**@type string[]*/
    content

    /**@param block {Block}*/
    /**@return Result<Block>*/
    addToBlock(block) {
        return this.element.handler(block, this)
    }

    static new(name) {
        let node = new ParsedNode();
        node.element = name;
        node.parent = null;
        node.children = []
        node.content = []
        return node
    }

    child(name) {
        let node = ParsedNode.new(name);
        node.parent = this;
        this.children[this.children.length - 1].push(node)
        return node;
    }

    newChildren() {
        this.children.push([])
    }
}

/**@param text {string}
 * @return Result<>
 * */
function parse(text) {
    let root = ParsedNode.new(null)
    root.newChildren()
    let current = root
    let prevIdx = 0
    let blockStack = []

    /**@type {0|1|2}*/
    let state = SEARCH_COMMAND;

    function findContentBrace(char, i) {
        let braceIndex = OPEN_BRACES.indexOf(char);
        if (braceIndex === -1) {
            return Result.error("Expected chars '" + OPEN_BRACES.join("', '") + "' but found '" + char + "'", i)
        }
        let startIdx = i;
        let hasSlash = false;
        let buffer = ""
        i++;
        for (; ; i++) {
            if (i === text.length) {
                return Result.error(`No close symbol for '${char}'`, startIdx)
            }
            let _char = text[i];
            if (_char === "\\" && !hasSlash) {
                hasSlash = true;
                continue
            }
            if (!hasSlash && CLOSE_BRACES[braceIndex] === _char) {
                break
            }
            buffer += _char
            hasSlash = false;
        }
        current.content.push(buffer)
        return Result.ok(i);//i - pointed on close part
    }

    for (let i = 0; i <= text.length; i++) {
        let char = i >= text.length ? '' : text.at(i);
        switch (state) {
            case SEARCH_COMMAND:
                if (char === "}") {
                    if (current.parent == null) return Result.error("Nothing to close", i)
                    state = SEARCH_CONTENT_BRACE
                    prevIdx = i + 1;
                    continue
                }
                if ((SPACE_SYMBOLS.test(char) || NL_SYMBOLS.test(char)) && (prevIdx === i - 1)) {
                    prevIdx = i;
                    continue;
                }
                if (!TERMINATE_SYMBOLS.test(char) && i + 1 <= text.length) continue
                let blockName = text.substring(prevIdx, i).trim();
                if (blockName.length === 0) continue
                let foundBlock = blockMap[blockName];
                if (foundBlock == null) {
                    let beginElement = blockMap[blockName + "_start"];
                    if (beginElement == null) return Result.error("Unknown block `" + blockName + "`", [prevIdx, i])
                    state = SEARCH_CHILD_BRACE
                } else {
                    state = SEARCH_CONTENT_BRACE
                }
                i--;//substring stuff? and regexp stuff reason
                current = current.child(blockName)
                continue
            case SEARCH_CONTENT_BRACE:
                /*if (char === '') continue
                if (NL_SYMBOLS.test(char)) {
                    current = current.parent;
                    state = SEARCH_COMMAND;
                    prevIdx = i + 1
                    continue
                }
                if (SPACE_SYMBOLS.test(char)) continue
                let result = findContentBrace(char, i);
                if (result.error != null) return result;
                i = result.data;
                break;*/
            case SEARCH_CHILD_BRACE:
                if (char === '') continue
                if (SPACE_SYMBOLS.test(char) || NL_SYMBOLS.test(char)) continue
                let result_ = findContentBrace(char, i)
                if (result_.error == null) {
                    i = result_.data;
                    continue
                }
                if (char !== "{") return Result.error("'{' expected ", i)
                state = SEARCH_COMMAND
                current.newChildren()
                prevIdx = i + 1;
                break;

        }
    }
    console.log(root)

    /**@param nodes {ParsedNode[]}*/
    function buildBlock(nodes) {

        let block = new Block();

        for (let node of nodes) {
            let result = node.addToBlock(block);
            if (result.error != null) return result;
            block = result.data;
        }
        return currentX;
    }

    let data = buildBlock(root.children[0]);
    console.log(data)
    return Result.ok(data)
}