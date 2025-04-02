namespace Tools {
    class TokenWithPosition {
        static END: TokenWithPosition = new TokenWithPosition(null!, 0);
        token: Token
        inTokenPosition: number
        newStart: number = 0

        constructor(token: Token, inTokenPosition: number) {
            this.token = token;
            this.inTokenPosition = inTokenPosition;
        }

        position(len:number) {
            if(this===TokenWithPosition.END)return len
            return this.newStart+this.inTokenPosition
        }
    }

    function isSkipable(token: Token) {
        return token.kind == TokenKind.WhiteSpace || token.kind == TokenKind.NL;
    }

    export function autoformatInArea(target: HTMLTextAreaElement) {
        let text = target.value;
        let tokens = Lexer.lex(text, false);
        let errors: string[] = []
        for (let token of tokens) {
            if (token.kind == TokenKind.Error) {
                errors.push(token.payload)
            }
        }
        if (errors.length > 0) {
            alert(errors.join("\n"))
            return
        }

        function findTokenPosition(position: number, stickyForward: boolean): TokenWithPosition {
            let i = Lexer.getTokenAtChar(tokens, position,!stickyForward);
            if (i == -1) {
                if (position == text.length) return TokenWithPosition.END
                i=tokens.length-1
                // alert("Some cursors error occurred")
                // throw new Error("Cannot find token to stick")
            }
            let token = tokens[i];
            while (token !== undefined && isSkipable(token)) {
                if (stickyForward) i++
                else i--;
                token = tokens[i]
            }
            if (token == undefined) {
                if (stickyForward) return TokenWithPosition.END
                return findTokenPosition(position, true)
            }
            return new TokenWithPosition(token, position - token.range.start)
        }


        let cursors=[
             findTokenPosition(target.selectionStart,true),
             findTokenPosition(target.selectionEnd,false),
        ]

        const TAB_SYMBOL = " ";
        const TAB_INCREASER = 4;
        const tabSymbol = TAB_SYMBOL.repeat(TAB_INCREASER)

        let indent = 0;
        let newText = ""
        let wasNL = false

        function addContent(content: string, token: Token|undefined) {
            let start = newText.length;
            for (let c of content) {
                if (c == "\n") {
                    if (wasNL) continue
                    wasNL = true;
                    newText += "\n"
                    continue
                } else {
                    if (wasNL) {
                        if(newText.length===start){
                            start+=tabSymbol.length*indent
                        }
                        newText += tabSymbol.repeat(indent)
                    }
                    wasNL = false;
                }
                newText += c
            }
            if(token===undefined)return
            for (let cursor of cursors) {
                if (cursor.token !== token) continue
                cursor.newStart=start
            }
        }

        function nextNonSpaceKind(i: number) {
            i++;
            let token = tokens[i];
            while (token !== undefined && isSkipable(token)) {
                i++;
                token = tokens[i]
            }
            return token === undefined ? undefined : token.kind;

        }

        for (let i = 0; i < tokens.length; i++) {
            let token = tokens[i];
            let nextTokenKind = nextNonSpaceKind(i)
            let content = token.range.substring(text);
            switch (token.kind) {
                case TokenKind.ChildrenBraceOpen:
                    addContent(content,token)
                    indent++;
                    addContent("\n",undefined)
                    continue
                case TokenKind.ChildrenBraceClose:
                    indent--;
                    addContent("\n",undefined)
                    addContent(content,token)
                    if (nextTokenKind !== TokenKind.ChildrenBraceOpen)
                        addContent("\n",undefined)
                    continue
                case TokenKind.NL:
                    addContent("\n",undefined)
                    continue
                case TokenKind.WhiteSpace:
                    continue
            }
            addContent(content,token)
        }
        target.value = newText
        target.setSelectionRange(
            cursors[0].position(newText.length),
            cursors[1].position(newText.length),
            "forward"
        )
    }
}
