const cursorElement = `<div class="cursor"><div></div></div>`;
(function () {
    function time() {
        return new Date().getTime();
    }


    const BLINK_DELAY = 500;

    function blink() {
        let value = Math.floor(time() / BLINK_DELAY) % 2


        try {
            // @ts-ignore
            document.body.style.setProperty('--cursor-blink', value + "");
        } catch (e) {
        }
        setTimeout(() => {
            blink()
        }, 100)
    }

    setTimeout(blink)
})()

const TextareaExtension = (function () {
    function setStyleOptions(target: HTMLTextAreaElement, preItem: HTMLPreElement) {
        preItem.className = "editor-highlight";
        target.parentNode!.appendChild(preItem);

        // target.style.width = preItem.style.width = target.offsetWidth + "px";
        // target.style.height = preItem.style.height = target.offsetHeight + "px";

        // preItem.style.top = target.offsetTop + "px";
        // preItem.style.left = target.offsetLeft + "px";
        target.style.background = "transparent";
        target.style.color = "transparent";
        target.style.overflow = "scroll";
        preItem.style.overflow = "scroll";
        preItem.style.margin = "0px 0px";
    }

    class SelectionInserter {
        cursorsList: number[] = []
        cursorI: number = 0
        text: string

        constructor(target: HTMLTextAreaElement, text: string) {
            this.cursorsList.push(target.selectionStart)
            this.text = text;

            /*let selection = window.getSelection();
            if (selection != null) {
                for (let i = 0; i < selection.rangeCount; i++) {
                    let range = selection.getRangeAt(i);
                    if (!range.collapsed || range.startContainer != target) continue
                    cursorsList.push(range.startOffset)
                }
            }*/

        }

        substring(start: number, end: number,includeEnd:boolean=false) {
            let text = this.text;
            let currentCursor = this.skipCursors(start);

            if (currentCursor === undefined || currentCursor >= end && !includeEnd) return text.substring(start, end)
            if (start == currentCursor) return cursorElement + text.substring(start, end)
            return text.substring(start, currentCursor) + cursorElement + text.substring(currentCursor, end)
        }

        private skipCursors(start: number): number | undefined {
            let currentCursor: number | undefined = this.cursorsList[this.cursorI]
            while (currentCursor != undefined && currentCursor < start) {
                this.cursorI++;

                currentCursor = this.cursorsList[this.cursorI]
            }
            return currentCursor;
        }
    }


    return function (target: HTMLTextAreaElement) {

        let preItem = document.createElement("pre");
        setStyleOptions(target, preItem);


        function analyse() {
            let text = target.value;

            let cursorInserter = new SelectionInserter(target, text)
            // let cursorStart = target.selectionStart;
            target.ariaMultiSelectable
            // text = text.substring(0, cursorStart) + "\x00" + text.substring(cursorStart, target.selectionEnd)/*+"\x01"*/ + text.substring(target.selectionEnd)
            let tokens = Lexer.lex(text, false);
            let result = "";
            let prevEnd = 0
            for (let token of tokens) {
                let range = token.range;

                result += cursorInserter.substring(prevEnd, range.start)
                let s = cursorInserter.substring(range.start, range.end);
                result+= "<span class='token-" + TokenKind[token.kind] + "'>" + s + "</span>"

                prevEnd = range.end
            }

            result += cursorInserter.substring(prevEnd, text.length,true)
            let innerHTML = result;
            preItem.innerHTML = `<div style="height: ${target.scrollHeight}px;">${innerHTML}</div>`;
        }

        function scrollSync() {
            preItem.scrollTop = target.scrollTop;
            preItem.scrollLeft = target.scrollLeft;
        }

        function resize() {
            preItem.style.width = target.style.width;
            preItem.style.height = target.style.height;
        }

        if (target.addEventListener) {
            target.addEventListener("change", analyse, false);
            target.addEventListener("mouseup", analyse, false);
            target.addEventListener("mousedown", analyse, false);
            target.addEventListener("mousemove", analyse, false);

            const TAB_SYMBOL = " ";
            const TAB_INCREASER = 4;
            const tabSymbol = TAB_SYMBOL.repeat(TAB_INCREASER)
            target.onkeydown = ev => {


                function calculateTabSize(text: string, nlStart: number) {
                    let tabSize = 0;
                    for (; text[nlStart + tabSize] == TAB_SYMBOL; tabSize++) {
                    }
                    return tabSize;
                }

                let text = target.value;
                let beforeSelection = text.substring(0, target.selectionStart);
                let afterSelection = text.substring(target.selectionEnd);
                let selectionValue = text.substring(target.selectionStart, target.selectionEnd)
                let selectionValueTrim = selectionValue.trim()
                let openedBrace = Lexer.OPEN_BRACES.indexOf(ev.key);

                if (openedBrace != -1) {
                    if (selectionValueTrim.length == 0) {
                        if(Lexer.CLOSE_BRACES[openedBrace]!=afterSelection[0]) {
                            ev.preventDefault()
                            target.value = beforeSelection + ev.key + Lexer.CLOSE_BRACES[openedBrace] + afterSelection;
                            target.setSelectionRange(beforeSelection.length + 1, beforeSelection.length + 1, "forward")
                        }
                    } else {
                        let tokens = Lexer.lex(text,false);
                        ev.preventDefault()
                        switch (selectionValue.length){
                            case 1:
                                let tryToReplaceBrace = Lexer.OPEN_BRACES.indexOf(selectionValue);

                                if (tryToReplaceBrace == -1) {
                                    break
                                }
                                let tokenI = Lexer.getTokenAtChar(tokens, beforeSelection.length)

                                if (tokenI == -1) break

                                let token = tokens[tokenI];
                                if (token.range.length() != 1) break
                                let closeToken = tokens[token.payload];


                                target.value=
                                    beforeSelection+
                                    Lexer.OPEN_BRACES[openedBrace]+
                                    text.substring(token.range.end,closeToken.range.start)+
                                    Lexer.CLOSE_BRACES[openedBrace]+
                                    text.substring(closeToken.range.end)


                                target.setSelectionRange(beforeSelection.length+1, beforeSelection.length+1, "forward")
                                analyse()
                                return;
                        }
                        target.value = beforeSelection + ev.key + selectionValue + Lexer.CLOSE_BRACES[openedBrace] + afterSelection;
                        target.setSelectionRange(beforeSelection.length, target.value.length - afterSelection.length, "forward")
                    }
                }
                switch (ev.key) {
                    case "Tab": {
                        if (selectionValue.length == 0) {
                            target.value = beforeSelection + TAB_SYMBOL.repeat(TAB_INCREASER) + afterSelection
                            let idx = beforeSelection.length + TAB_INCREASER
                            target.setSelectionRange(idx, idx, "forward")
                        } else {
                            let nlStart = Math.max(text.lastIndexOf("\n", target.selectionStart - 1), 0);
                            let newLinesSymbolsStart = [nlStart]
                            while (newLinesSymbolsStart[newLinesSymbolsStart.length - 1] < target.selectionEnd) {
                                let idx = text.indexOf("\n", newLinesSymbolsStart[newLinesSymbolsStart.length - 1] + 1);
                                newLinesSymbolsStart.push(idx == -1 ? text.length : idx)
                            }
                            let newLines = []
                            for (let i = 0; i < newLinesSymbolsStart.length - 1; i++) {
                                newLines.push(text.substring(newLinesSymbolsStart[i] + 1, newLinesSymbolsStart[i + 1]))
                            }
                            let before = text.substring(0, newLinesSymbolsStart[0])
                            let after = text.substring(newLinesSymbolsStart[newLinesSymbolsStart.length - 1] + 1)
                            let firstL = newLines[0].length
                            let totalL = 0
                            for (let mapElement of newLines.map(it => it.length)) {
                                totalL += mapElement;
                            }
                            let selectionStart = target.selectionStart;
                            let selectionEnd = target.selectionEnd;
                            if (ev.shiftKey) {
                                newLines = newLines.map(it => {
                                    return TAB_SYMBOL.repeat(Math.max(0, calculateTabSize(it, 0) - TAB_INCREASER)) +
                                        it.trim()
                                })
                                selectionStart -= firstL - newLines[0].length
                                for (let mapElement of newLines.map(it => it.length)) {
                                    totalL -= mapElement;
                                }
                                selectionEnd -= totalL
                            } else {
                                newLines = newLines.map(it => {
                                    return TAB_SYMBOL.repeat(TAB_INCREASER) + it
                                })
                                selectionStart += TAB_INCREASER
                                selectionEnd += TAB_INCREASER * newLines.length
                            }
                            let updatedLines = newLines.join("\n");
                            target.value = before + "\n" + updatedLines + "\n" + after
                            target.setSelectionRange(selectionStart, selectionEnd)

                        }
                        ev.preventDefault()
                        break
                    }
                    case "Enter": {
                        if (ev.ctrlKey) {
                            setTimeout(analyse, 1)
                            setTimeout(resize, 1)
                            return
                        }
                        let nlStart = Math.max(text.lastIndexOf("\n", target.selectionStart - 1) + 1, 0);
                        let tabSize = calculateTabSize(text, nlStart);
                        let newBlock = text[target.selectionStart - 1] == "{";

                        let tabSymbols = TAB_SYMBOL.repeat(tabSize);
                        let part1 = beforeSelection + "\n" + tabSymbols
                        let part2 = afterSelection
                        let nlStart1 = text.indexOf("\n", target.selectionEnd);
                        let tabSize2 = nlStart1 == -1 ? -1 : calculateTabSize(text, nlStart1 + 1);

                        if (newBlock) {
                            part1 += tabSymbol
                            if (tabSize2 == tabSize + TAB_INCREASER) {
                                text = part1 + part2

                            } else {
                                text = part1 + "\n" + tabSymbols + part2
                            }
                        } else {
                            text = part1 + part2
                        }
                        target.value = text
                        target.selectionStart = target.selectionEnd = part1.length
                        ev.preventDefault()
                        target.selectionDirection = "none"
                        break;
                    }
                    case "{": {
                        if (selectionValue.trim().length == 0) {
                            if(afterSelection[0]=="}"){
                                break
                            }
                            ev.preventDefault()
                            target.value = beforeSelection + "{}" + afterSelection
                            let index = beforeSelection.length + 1
                            target.setSelectionRange(index, index)
                        } else {

                            ev.preventDefault()
                            let nlStart = Math.max(text.lastIndexOf("\n", target.selectionStart - 1) + 1, 0);
                            let tabSize = calculateTabSize(text, nlStart);
                            let tabSymbols = TAB_SYMBOL.repeat(tabSize + TAB_INCREASER)
                            selectionValue = selectionValue.split("\n").map(it => tabSymbols + it.trim())
                                .join("\n")

                            target.value = beforeSelection + "{\n" + selectionValue + "\n" + TAB_SYMBOL.repeat(tabSize) + "}" + afterSelection
                            target.setSelectionRange(
                                beforeSelection.length,
                                target.value.length - afterSelection.length,
                                "forward"
                            )
                        }
                        break
                    }
                }

                analyse()
            }
            // target.addEventListener("keypress", )
            target.addEventListener("keyup", analyse, false);
            target.addEventListener("scroll", scrollSync, false);
            target.addEventListener("mousemove", resize, false);
        } else { // @ts-ignore
            if (target.attachEvent) {
                // @ts-ignore
                target.attachEvent("onchange", analyse);
                // @ts-ignore
                target.attachEvent("onkeyup", analyse);
                // @ts-ignore
                target.attachEvent("onscroll", scrollSync);
                // @ts-ignore
                target.attachEvent("mousemove", resize);
            }
        }
        setTimeout(analyse)
        setTimeout(function () {

            let updateAll = function () {
                setTimeout(analyse)
                setTimeout(resize)
                setTimeout(scrollSync)
            };
            setTimeout(function () {
                window.addEventListener('resize', updateAll)
            }, 0.5)
            setTimeout(() => {
                let btn: HTMLButtonElement = document.querySelector("button.generate_button")!;
                let prev = btn.onclick!;
                btn.onclick = function (ev: MouseEvent) {
                    prev.call(this, ev)
                    setTimeout(updateAll)
                }
            })
        })


    }
})();

