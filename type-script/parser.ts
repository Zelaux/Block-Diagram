class ParsedNode {
    element: GraphElement
    parent: ParsedNode | null
    children: ParsedNode[][]
    content: string[]
    titles: string[]

    private constructor(element: GraphElement) {
        this.element = element;
        this.parent = null;
        this.children = [];
        this.content = [];
        this.titles = [];
    }

    addToBlock(block: Block) {
        return this.element.handler(block, this)
    }


    static new(element: GraphElement | null) {
        return new ParsedNode(element as GraphElement)
    }

    child(name: GraphElement) {
        let node = ParsedNode.new(name);
        node.parent = this;
        this.children[this.children.length - 1].push(node)
        return node;
    }

    newChildren() {
        this.children.push([])
    }
}

namespace Parser {


    export function parse(text: string): Result<{ block: Block, strings: NullableGraphText[] }> {
        let root = ParsedNode.new(null)
        root.newChildren()
        let current = root
        let nodeStack = [current]
        let tokens = Lexer.lex(text, true);
        for (let token of tokens) {
            if (token.kind == TokenKind.Error) {
                return Result.error(token.payload)
            }
        }
        let level = 0
        for (let i = 0; i < tokens.length; i++) {
            let prevToken = i - 1 < 0 ? null : tokens[i - 1]
            let token = tokens[i];
            let nextToken = i + 1 >= tokens.length ? null : tokens[i + 1]

            function log(...args: any[]) {
                let newVar = [["--".repeat(level + 1)], args];

                // @ts-ignore
                console.log.apply(console, newVar.flatMap(it => it))
            }

            switch (token.kind) {
                case TokenKind.GraphName:
                    let currentName = current.element == null ? null : current.element.oneName();
                    if (current.children.length == 0 && prevToken != null && (prevToken.kind == TokenKind.ContentBraceClose || prevToken.kind == TokenKind.GraphName) || prevToken != null && prevToken.kind == TokenKind.ChildrenBraceClose) {
                        current = current.parent!.child(token.payload)
                        log("add sibling `", current.element.oneName(), "`[", currentName, ']')
                    } else {
                        current = current.child(token.payload)
                        log("add child `", current.element.oneName(), "`[", currentName, ']')
                    }
                    nodeStack[level] = current
                    break;
                case TokenKind.Content:
                    current.content.push(token.payload)
                    break;
                case TokenKind.ContentBraceOpen:
                case TokenKind.ContentBraceClose:
                    break;
                case TokenKind.Comment:
                    break;
                case TokenKind.ChildrenBraceOpen:
                    log("{children enter")
                    current.newChildren()
                    level++;
                    break;
                case TokenKind.ChildrenBraceClose:
                    if (current.parent == null) {
                        throw new Error("Some stuff happened")
                    }
                    if (current.children.length == 0) {
                        level--;
                        current = current.parent
                        log("}children close (" + current.element.oneName() + ")")
                    } else if (current.children[current.children.length - 1].length == 0) {

                        level--;
                        if (prevToken != null && prevToken.kind == TokenKind.ChildrenBraceClose) {
                            current = current.parent
                        }
                        log("}empty children close (" + current.element.oneName() + ")")
                    } else {
                        level--;
                        current = current.parent
                        log("}children close (" + current.element.oneName() + ")")
                    }
                    break;
                case TokenKind.Title:
                    current.titles.push(token.payload)
                    break
                case TokenKind.TitleBraceOpen:
                case TokenKind.TitleBraceClose:
                    break;
            }
        }

        console.log(root)


        function buildBlock(nodes: ParsedNode[]): Result<Block> {

            let first = new ElementBlock();
            let block: Block = first;

            for (let node of nodes) {
                let result = node.addToBlock(block);
                if (result.error != null) return result;
                block = result.data!;
            }
            return Result.ok(first);
        }

        let strings: NullableGraphText[] = []


        function collectStrings(nodes: ParsedNode[]) {
            for (let node of nodes) {
                strings.push(node.content)
                node.children.forEach(collectStrings)
            }
        }

        collectStrings(root.children[0])
        let data = buildBlock(root.children[0]);
        if (data.isError()) return Result.error(data.error!)
        console.log(data)
        return Result.ok({block: data.data!, strings})
    }
}