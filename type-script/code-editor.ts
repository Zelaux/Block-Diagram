const CODE_CLASS_PREFIX = "code-"
const FOCUSED_CLASS = CODE_CLASS_PREFIX + "focused"

/**@param div has class textarea-container*/
function setup(div: HTMLDivElement) {
    div.addEventListener("click", ev => {

        div.classList.add(FOCUSED_CLASS)
    })
    div.addEventListener("selectstart", ev => {
        console.log("Selection chang")
    })
    let areaElement = div.querySelector("textarea")!;
    let mokArea: HTMLTextAreaElement = div.querySelector(".code-textarea")!;
    TextareaExtension(areaElement, (word) => blockMap[word] !== undefined)
    // div.innerHTML+=
}

setup(document.querySelector(".textarea-container")!)

function hightligh(code: string) {
    return code
}