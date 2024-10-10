"use strict";
var TokenKind;
(function (TokenKind) {
    TokenKind[TokenKind["Error"] = 0] = "Error";
    TokenKind[TokenKind["NL"] = 1] = "NL";
    TokenKind[TokenKind["WhiteSpace"] = 2] = "WhiteSpace";
    TokenKind[TokenKind["Comment"] = 3] = "Comment";
    TokenKind[TokenKind["GraphName"] = 4] = "GraphName";
    TokenKind[TokenKind["ContentBraceOpen"] = 5] = "ContentBraceOpen";
    TokenKind[TokenKind["Content"] = 6] = "Content";
    TokenKind[TokenKind["ContentBraceClose"] = 7] = "ContentBraceClose";
    TokenKind[TokenKind["ChildrenBraceOpen"] = 8] = "ChildrenBraceOpen";
    TokenKind[TokenKind["ChildrenBraceClose"] = 9] = "ChildrenBraceClose";
    TokenKind[TokenKind["TitleBraceOpen"] = 10] = "TitleBraceOpen";
    TokenKind[TokenKind["Title"] = 11] = "Title";
    TokenKind[TokenKind["TitleBraceClose"] = 12] = "TitleBraceClose";
})(TokenKind || (TokenKind = {}));
var BracesType;
(function (BracesType) {
    BracesType[BracesType["Content"] = 0] = "Content";
    BracesType[BracesType["Children"] = 1] = "Children";
    BracesType[BracesType["Title"] = 2] = "Title";
})(BracesType || (BracesType = {}));
class TokenRange {
    constructor(start, end) {
        this.start = start;
        this.end = end;
        if (start > end) {
            throw new Error("Why?");
        }
    }
    static range(start, end) {
        return new TokenRange(start, end === undefined ? start + 1 : end);
    }
}
class Token {
    constructor(kind, range, payload) {
        this.kind = kind;
        this.range = range;
        this.payload = payload;
    }
}
var Lexer;
(function (Lexer) {
    const range = TokenRange.range;
    function token(kind, range, payload) {
        return new Token(kind, range, payload);
    }
    function bracePair(open, close) {
        close = close === undefined ? open : close;
        return { open, close };
    }
    function contentPair(open, close) {
        return pair(bracePair(open, close), tokenKindPair(TokenKind.ContentBraceOpen, TokenKind.Content, TokenKind.ContentBraceClose));
    }
    function titlePair(open, close) {
        return pair(bracePair(open, close), tokenKindPair(TokenKind.TitleBraceOpen, TokenKind.Title, TokenKind.TitleBraceClose));
    }
    function tokenKindPair(open, inside, close) {
        return { open, inside, close };
    }
    function pair(braces, token) {
        return { braces, token };
    }
    // noinspection JSCheckFunctionSignatures
    Lexer.BRACES = [
        contentPair("`"),
        contentPair("(", ")"),
        contentPair("\""),
        titlePair("[", "]")
    ];
    Lexer.OPEN_BRACES = Lexer.BRACES.map(it => it.braces.open);
    Lexer.CLOSE_BRACES = Lexer.BRACES.map(it => it.braces.close);
    const SEARCH_COMMAND = 0;
    const SEARCH_BRACES = 1;
    const TERMINATE_SYMBOLS = RegExp("[^\\w\\x01\\x00]");
    const SPACE_SYMBOLS = RegExp("\\s");
    const NL_SYMBOLS = RegExp("(\n|\r|\n\r)");
    const STATIC_ERROR = Result.error("");
    function lex(text, useError) {
        let tokens = [];
        let prevIdx = 0;
        /**@type {0|1}*/
        let state = SEARCH_COMMAND;
        function findContentBrace(char, i) {
            let braceIndex = Lexer.OPEN_BRACES.indexOf(char);
            if (braceIndex === -1) {
                // tokens.push(token(TokenKind.Error, range(i, i + 1), ("Expected chars '" + OPEN_BRACES.join("', '") + "' but found '" + char + "'", i)))
                return -1;
            }
            let braceInfo = Lexer.BRACES[braceIndex];
            let open = token(braceInfo.token.open, range(i));
            let openIdx = tokens.length;
            tokens.push(open);
            let startIdx = i;
            let hasSlash = false;
            let buffer = "";
            i++;
            for (;; i++) {
                if (i === text.length) {
                    if (startIdx + 1 < i - 1) {
                        tokens.push(token(braceInfo.token.inside, range(startIdx + 1, i - 1), buffer));
                    }
                    tokens.push(token(TokenKind.Error, range(i), `No close symbol for '${char}'`));
                    hasError = true;
                    return i;
                }
                let _char = text[i];
                if (_char == '\x00' || _char == '\x01')
                    continue;
                if (_char === "\\" && !hasSlash) {
                    hasSlash = true;
                    continue;
                }
                if (!hasSlash && Lexer.CLOSE_BRACES[braceIndex] === _char) {
                    break;
                }
                buffer += _char;
                hasSlash = false;
            }
            tokens.push(token(braceInfo.token.inside, range(startIdx + 1, i), buffer));
            open.payload = tokens.length;
            tokens.push(token(braceInfo.token.close, range(i), openIdx));
            return i; //i - pointed on close part
        }
        let openedChildrenBraces = [];
        let hasError = false;
        for (let i = 0; i <= text.length; i++) {
            let char = i >= text.length ? '' : text[i];
            if (hasError) {
                if (char != "\n") {
                    tokens[tokens.length - 1].range.end = i;
                    continue;
                }
                hasError = false;
            }
            switch (state) {
                case SEARCH_COMMAND:
                    if (char === "}") {
                        if (openedChildrenBraces.length == 0) {
                            tokens.push(token(TokenKind.Error, range(i), "Nothing to close"));
                            hasError = true;
                            continue;
                        }
                        let idx = openedChildrenBraces.pop();
                        tokens[idx].payload = tokens.length;
                        tokens.push(token(TokenKind.ChildrenBraceClose, range(i), idx));
                        state = SEARCH_BRACES;
                        prevIdx = i + 1;
                        continue;
                    }
                    if ((SPACE_SYMBOLS.test(char) || NL_SYMBOLS.test(char)) && (prevIdx === i - 1)) {
                        prevIdx = i;
                        continue;
                    }
                    if (!TERMINATE_SYMBOLS.test(char) && i + 1 <= text.length)
                        continue;
                    let blockName = text.substring(prevIdx, i).replace('\x00', '').replace('\x01', '').trim();
                    if (blockName.length === 0)
                        continue;
                    let foundBlock = blockMap[blockName];
                    if (foundBlock == null) {
                        tokens.push(token(TokenKind.Error, range(prevIdx, i), "Unknown graph element `" + blockName + "`"));
                        state = SEARCH_BRACES;
                        prevIdx = i;
                        i--; //substring stuff? and regexp stuff reason
                        continue;
                    }
                    state = SEARCH_BRACES;
                    tokens.push(token(TokenKind.GraphName, range(prevIdx, i), foundBlock));
                    prevIdx = i;
                    i--; //substring stuff? and regexp stuff reason
                    continue;
                case SEARCH_BRACES:
                    if (char === '')
                        continue;
                    if (NL_SYMBOLS.test(char)) {
                        state = SEARCH_COMMAND;
                        prevIdx = i + 1;
                        // current = current.parent!
                        continue;
                    }
                    if (SPACE_SYMBOLS.test(char))
                        continue;
                    let result_ = findContentBrace(char, i);
                    if (result_ != -1) {
                        i = result_;
                        continue;
                    }
                    if (char !== "{") {
                        tokens.push(token(TokenKind.Error, range(i), "'{' expected "));
                        hasError = true;
                        continue;
                    }
                    state = SEARCH_COMMAND;
                    openedChildrenBraces.push(tokens.length);
                    tokens.push(token(TokenKind.ChildrenBraceOpen, range(i)));
                    prevIdx = i + 1;
                    break;
            }
        }
        /* console.log(tokens.map(it => {
             let token1 = Object.assign({}, it);
             token1.kind = TokenKind[token1.kind] as any
             return token1
         }))*/
        return tokens;
    }
    Lexer.lex = lex;
})(Lexer || (Lexer = {}));
