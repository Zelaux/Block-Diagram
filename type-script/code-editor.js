"use strict";
const CODE_CLASS_PREFIX = "code-";
const FOCUSED_CLASS = CODE_CLASS_PREFIX + "focused";
/**@param div has class textarea-container*/
function setup(div) {
    div.addEventListener("click", ev => {
        div.classList.add(FOCUSED_CLASS);
    });
    div.addEventListener("selectstart", ev => {
        console.log("Selection chang");
    });
    let areaElement = div.querySelector("textarea");
    let mokArea = div.querySelector(".code-textarea");
    TextareaExtension(areaElement, "16px \"JetBrains Mono\", monospace");
    // div.innerHTML+=
}
setup(document.querySelector(".textarea-container"));
function hightligh(code) {
    return code;
}
