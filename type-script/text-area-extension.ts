const cursorElement = `<div class="cursor"><div></div></div>`;
(function () {
    function time() {
        return new Date().getTime();
    }

    let lastTime = time()
    let value = true

    const DELAY_MILLIS = 500;

    function blink() {
        let time_ = time()
        let delta = time_ - lastTime
        let delay = DELAY_MILLIS
        delay = delay * 2 - delta
        // @ts-ignore
        document.body.style.setProperty('--cursor-blink', (value = !value) * 1 + "");
        setTimeout(blink, delay)
        lastTime = time_ + DELAY_MILLIS - delta
    }

    setTimeout(blink)
})()

function TextareaExtension(target: HTMLTextAreaElement, font?: string) {
    //Прямой поиск


    function findText(text: string, word: string): number {
        for (let i = 0; i < text.length - word.length + 1; i++) {
            let equals = true;
            for (let j = 0; j < word.length && equals; j++) {
                equals = (word[j] == text[i + j]);
            }
            if (equals) return i;
        }
        return -1;
    }

    let setStyleOptions = function () {
        preItem.className = "text-area-selection";
        target.parentNode!.appendChild(preItem);
        target.style.font = preItem.style.font = font || "14px Arial";

        target.style.width = preItem.style.width = target.offsetWidth + "px";
        target.style.height = preItem.style.height = target.offsetHeight + "px";
        preItem.style.top = target.offsetTop + "px";
        preItem.style.left = target.offsetLeft + "px";
        target.style.background = "transparent";
        target.style.color = "transparent";
        target.style.overflow = "scroll";
        preItem.style.margin = "0px 0px";
    }


    let self: any = {}
    self.analyse = function () {

        let cursorStart = target.selectionStart;
        let text = target.value;
        text = text.substring(0, cursorStart) + "\x00" + text.substring(cursorStart, target.selectionEnd)/*+"\x01"*/ + text.substring(target.selectionEnd)
        let tokens = Lexer.lex(text, false);
        let result = "";
        let prevEnd = 0
        for (let token of tokens) {
            result += text.substring(prevEnd, token.range.start)
                + "<span class='token-" + TokenKind[token.kind] + "'>" + text.substring(token.range.start, token.range.end) + "</span>"
            prevEnd = token.range.end
        }

        preItem.innerHTML = result.replace("\x00",
            // `<span class="cursor">|</span>`
            target.selectionStart == target.selectionEnd + 1 ? "" :
                cursorElement
        );
    };

    self.scrollSync = function () {
        preItem.scrollTop = target.scrollTop;
    };

    self.resize = function () {
        preItem.style.width = target.style.width;
        preItem.style.height = target.style.height;
        preItem.style.top = target.offsetTop + "px";
        preItem.style.left = target.offsetLeft + "px";
    };

    let preItem = document.createElement("pre");

    setStyleOptions();

    if (target.addEventListener) {
        target.addEventListener("change", self.analyse, false);
        target.addEventListener("mouseup", self.analyse, false);
        target.addEventListener("mousedown", self.analyse, false);
        target.addEventListener("mousemove", self.analyse, false);

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
                ev.preventDefault()
                if (selectionValueTrim.length == 0) {
                    target.value = beforeSelection + ev.key + Lexer.CLOSE_BRACES[openedBrace] + afterSelection;
                    target.setSelectionRange(beforeSelection.length + 1, beforeSelection.length + 1, "forward")
                } else {
                    target.value = beforeSelection + ev.key + selectionValue + Lexer.CLOSE_BRACES[openedBrace] + afterSelection;
                    target.setSelectionRange(beforeSelection.length, target.value.length - afterSelection.length, "forward")
                }
            }
            switch (ev.key) {
                case "Tab": {
                    // console.log(JSON.stringify(selectionValue), selectionValue.length)
                    if (selectionValue.length == 0) {
                        target.value = beforeSelection + TAB_SYMBOL.repeat(TAB_INCREASER) + afterSelection
                        let idx = beforeSelection.length + TAB_INCREASER
                        target.setSelectionRange(idx, idx, "forward")
                    } else {
                        let nlStart = Math.max(text.lastIndexOf("\n", target.selectionStart - 1), 0);
                        let newLinesSymbolsStart = [nlStart]
                        while (newLinesSymbolsStart[newLinesSymbolsStart.length - 1] < target.selectionEnd) {
                            newLinesSymbolsStart.push(text.indexOf("\n", newLinesSymbolsStart[newLinesSymbolsStart.length - 1] + 1))
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
                        // ev.preventDefault()
                        setTimeout(self.analyse,1)
                        setTimeout(self.resize,1)
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
                    ev.preventDefault()
                    if (selectionValue.trim().length == 0) {
                        target.value = beforeSelection + "{}" + afterSelection
                        let index = beforeSelection.length + 1
                        target.setSelectionRange(index, index)
                    } else {
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

            self.analyse()
        }
        // target.addEventListener("keypress", )
        target.addEventListener("keyup", self.analyse, false);
        target.addEventListener("scroll", self.scrollSync, false);
        target.addEventListener("mousemove", self.resize, false);
    } else { // @ts-ignore
        if (target.attachEvent) {
            // @ts-ignore
            target.attachEvent("onchange", self.analyse);
            // @ts-ignore
            target.attachEvent("onkeyup", self.analyse);
            // @ts-ignore
            target.attachEvent("onscroll", self.scrollSync);
            // @ts-ignore
            target.attachEvent("mousemove", self.resize);
        }
    }
    setTimeout(self.analyse)


}

