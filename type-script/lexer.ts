enum TokenKind {
    Error,
    NL,
    WhiteSpace,
    Comment,
    GraphName,
    ContentBraceOpen,
    Content,
    ContentBraceClose,
    ChildrenBraceOpen,
    ChildrenBraceClose,
    TitleBraceOpen,
    Title,
    TitleBraceClose,
}

enum BracesType {
    Content, Children, Title
}

class TokenRange {
    start: number
    end: number

    constructor(start: number, end: number) {
        this.start = start;
        this.end = end;
        if (start > end) {
            throw new Error("Why?")
        }
    }

    static range(start: number, end?: number) {
        return new TokenRange(start, end === undefined ? start + 1 : end);
    }

    length() {
        return this.end - this.start
    }

    substring(text: string) {
        return text.substring(this.start, this.end)
    }
}

class Token {
    kind: TokenKind
    range: TokenRange
    payload: any

    constructor(kind: TokenKind, range: TokenRange, payload?: any) {
        this.kind = kind;
        this.range = range;
        this.payload = payload;
    }
}

namespace Lexer {
    const range = TokenRange.range

    function token(kind: TokenKind, range: TokenRange, payload?: any) {
        return new Token(kind, range, payload)
    }

    function bracePair(open: string, close?: string) {
        close = close === undefined ? open : close;
        return {open, close}
    }

    function contentPair(open: string, close?: string) {
        return pair(bracePair(open, close), tokenKindPair(TokenKind.ContentBraceOpen, TokenKind.Content, TokenKind.ContentBraceClose))
    }

    function titlePair(open: string, close?: string) {
        return pair(bracePair(open, close), tokenKindPair(TokenKind.TitleBraceOpen, TokenKind.Title, TokenKind.TitleBraceClose))
    }

    function tokenKindPair(open: TokenKind, inside: TokenKind, close: TokenKind) {
        return {open, inside, close}
    }

    function pair<A, B>(braces: A, token: B) {
        return {braces, token}
    }

// noinspection JSCheckFunctionSignatures
    export const BRACES = [
        contentPair("`"),
        contentPair("(", ")"),
        contentPair("\""),
        titlePair("[", "]")
    ]
    export const OPEN_BRACES = BRACES.map(it => it.braces.open)
    export const CLOSE_BRACES = BRACES.map(it => it.braces.close)
    const SEARCH_COMMAND = 0;
    const SEARCH_BRACES = 1;
    const TERMINATE_SYMBOLS = RegExp("[^\\w]")
    const SPACE_SYMBOLS = RegExp("\\s")

    const NL_SYMBOLS = RegExp("(\n|\r|\n\r)")
    const STATIC_ERROR = Result.error("")

    export function lex(text: string, useError: boolean): Token[] {
        let tokens: Token[] = []
        let blockNameStart = 0

        /**@type {0|1}*/
        let state = SEARCH_COMMAND;

        function findContentBrace(char: string, i: number): number {
            let braceIndex = OPEN_BRACES.indexOf(char);
            if (braceIndex === -1) {
                // tokens.push(token(TokenKind.Error, range(i, i + 1), ("Expected chars '" + OPEN_BRACES.join("', '") + "' but found '" + char + "'", i)))
                return -1
            }
            let braceInfo = BRACES[braceIndex]
            let open = token(braceInfo.token.open, range(i));
            let openIdx = tokens.length
            tokens.push(open)
            let startIdx = i;
            let hasSlash = false;
            let buffer = ""
            i++;
            for (; ; i++) {
                if (i === text.length) {
                    if (startIdx + 1 < i - 1) {
                        tokens.push(token(braceInfo.token.inside, range(startIdx + 1, i - 1), buffer))
                    }
                    tokens.push(token(TokenKind.Error, range(i), `No close symbol for '${char}'`))
                    hasError = true
                    return i
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
            tokens.push(token(braceInfo.token.inside, range(startIdx + 1, i), buffer))
            open.payload = tokens.length
            tokens.push(token(braceInfo.token.close, range(i), openIdx))
            return i;//i - pointed on close part
        }

        let openedChildrenBraces: number[] = []
        let hasError = false
        for (let i = 0; i <= text.length; i++) {
            let char = i >= text.length ? '' : text[i];
            if (hasError) {
                if (char != "\n") {
                    tokens[tokens.length - 1].range.end = i
                    continue
                }
                hasError = false;
            }
            switch (state) {
                case SEARCH_COMMAND:
                    if (char === "}") {
                        if (openedChildrenBraces.length == 0) {
                            tokens.push(token(TokenKind.Error, range(i), "Nothing to close"))
                            hasError = true
                            continue
                        }
                        let idx = openedChildrenBraces.pop()!;
                        tokens[idx].payload = tokens.length
                        tokens.push(token(TokenKind.ChildrenBraceClose, range(i), idx))
                        state = SEARCH_BRACES
                        blockNameStart = i + 1;
                        continue
                    }
                    if ((SPACE_SYMBOLS.test(char) || NL_SYMBOLS.test(char)) && (blockNameStart === i - 1 || blockNameStart === i)) {
                        blockNameStart = i + 1;
                        continue;
                    }
                    if (!TERMINATE_SYMBOLS.test(char) && i + 1 <= text.length) continue
                    let blockName = text.substring(blockNameStart, i).trim();
                    if (blockName.length === 0) continue
                    let foundBlock = blockMap[blockName];
                    if (foundBlock == null) {
                        tokens.push(token(TokenKind.Error, range(blockNameStart, i), "Unknown graph element `" + blockName + "`"))
                        state = SEARCH_BRACES
                        blockNameStart = i
                        i--;//substring stuff? and regexp stuff reason
                        continue
                    }
                    state = SEARCH_BRACES
                    tokens.push(token(TokenKind.GraphName, range(blockNameStart, i), foundBlock))
                    blockNameStart = i
                    i--;//substring stuff? and regexp stuff reason
                    continue
                case SEARCH_BRACES:
                    if (char === '') continue
                    if (NL_SYMBOLS.test(char)) {

                        state = SEARCH_COMMAND
                        blockNameStart = i + 1
                        // current = current.parent!
                        continue
                    }
                    if (SPACE_SYMBOLS.test(char)) continue
                    let result_ = findContentBrace(char, i)
                    if (result_ != -1) {
                        i = result_;
                        continue
                    }
                    if (char !== "{") {
                        tokens.push(token(TokenKind.Error, range(i), "'{' expected "));
                        hasError = true
                        continue
                    }
                    state = SEARCH_COMMAND
                    openedChildrenBraces.push(tokens.length)
                    tokens.push(token(TokenKind.ChildrenBraceOpen, range(i)))
                    blockNameStart = i + 1;
                    break;

            }
        }
        /* console.log(tokens.map(it => {
             let token1 = Object.assign({}, it);
             token1.kind = TokenKind[token1.kind] as any
             return token1
         }))*/
        return tokens
    }


    export function getTokenAtChar(tokens: Token[], charIndex: number, canBeInEnd: boolean = false) {
        for (let i = 0; i < tokens.length; i++) {
            let range = tokens[i].range;
            if (range.end < charIndex || !canBeInEnd && range.end == charIndex) continue;
            return i;

        }
        return -1;
    }

}