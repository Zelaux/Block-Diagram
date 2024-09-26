"use strict";
function TextareaExtension(target, processor, font) {
    //Прямой поиск
    function findText(text, word) {
        for (let i = 0; i < text.length - word.length + 1; i++) {
            let equals = true;
            for (let j = 0; j < word.length && equals; j++) {
                equals = (word[j] == text[i + j]);
            }
            if (equals)
                return i;
        }
        return -1;
    }
    let setStyleOptions = function () {
        preItem.className = "text-area-selection";
        target.parentNode.appendChild(preItem);
        target.style.font = preItem.style.font = font || "14px Arial";
        target.style.width = preItem.style.width = target.offsetWidth + "px";
        target.style.height = preItem.style.height = target.offsetHeight + "px";
        preItem.style.top = target.offsetTop + "px";
        preItem.style.left = target.offsetLeft + "px";
        target.style.background = "transparent";
        target.style.color = "transparent";
        target.style.overflow = "scroll";
        preItem.style.margin = "0px 0px";
    };
    let self = {};
    self.analyse = function () {
        let cursorStart = target.selectionStart;
        let text = target.value;
        text = text.substring(0, cursorStart) + "\x00" + text.substring(cursorStart, target.selectionEnd) /*+"\x01"*/ + text.substring(target.selectionEnd);
        let tokens = Lexer.lex(text, false);
        let result = "";
        let prevEnd = 0;
        for (let token of tokens) {
            result += text.substring(prevEnd, token.range.start)
                + "<span class='token-" + TokenKind[token.kind] + "'>" + text.substring(token.range.start, token.range.end) + "</span>";
            prevEnd = token.range.end;
        }
        preItem.innerHTML = result.replace("\x00", 
        // `<span class="cursor">|</span>`
        `<svg class="cursor">${makePath("m 0 0 l 0 100%")}</svg>`);
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
        target.addEventListener("keyup", ev => {
            function calculateTabSize(text, nlStart) {
                let tabSize = 0;
                for (; text[nlStart + tabSize] == ' '; tabSize++) {
                }
                return tabSize;
            }
            switch (ev.key) {
                case "Enter":
                    let text = target.value;
                    let nlStart = Math.max(text.lastIndexOf("\n", target.selectionStart - 2) + 1, 0);
                    console.log(nlStart, text[nlStart]);
                    let tabSize = calculateTabSize(text, nlStart);
                    let newBlock = text[target.selectionStart - 2] == "{";
                    let tabSymbols = " ".repeat(tabSize);
                    let part1 = text.substring(0, target.selectionStart) + tabSymbols;
                    let part2 = text.substring(target.selectionEnd);
                    let nlStart1 = text.indexOf("\n", target.selectionEnd);
                    let tabSize2 = nlStart1 == -1 ? -1 : calculateTabSize(text, nlStart1 + 1);
                    if (newBlock) {
                        let tabSymbol = " ".repeat(4);
                        part1 += tabSymbol;
                        if (tabSize2 == tabSize + 4) {
                            text = part1 + part2;
                        }
                        else {
                            text = part1 + "\n" + tabSymbols + "}" + part2;
                        }
                    }
                    else {
                        text = part1 + part2;
                    }
                    target.value = text;
                    target.selectionStart = target.selectionEnd = part1.length;
                    target.selectionDirection = "none";
                    ev.preventDefault();
                    break;
                case "(":
                    console.log(ev);
                    break;
            }
            self.analyse();
        }, false);
        target.addEventListener("scroll", self.scrollSync, false);
        target.addEventListener("mousemove", self.resize, false);
    }
    else { // @ts-ignore
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
    setTimeout(self.analyse);
}
/*

//Example
let a, b;
window.onload = function () {
    a = TextareaExtension(document.getElementById("areaId")!, function (a) {
        return a.indexOf('а') >= 0;
    });

    b = TextareaExtension(document.getElementById("areaId2")!, function (a) {
        return a.indexOf('а') >= 0;
    });
}*/
