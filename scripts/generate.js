
setTimeout(function () {
    let y = 0;
    let svgElement = document.querySelector("svg");
    /**@type HTMLTextAreaElement*/
    let textAreaElement = document.querySelector("textarea.input_area");
    /**@type HTMLLabelElement*/
    let labelElement = document.querySelector("label.error_label");
    /**@type HTMLButtonElement*/
    let generateButton = document.querySelector("button.generate_button");
    generateButton.onclick = function () {
        let result = parse(textAreaElement.value);
        if (result.error !== undefined) {
            labelElement.innerHTML = result.error;
        } else {
            labelElement.innerHTML = ""
            /**@type {{info: RawGraphElement,content: string[]|string}[]}*/
            let data = result.data;
            svgElement.innerHTML = data.map(it => defaultCenterText(0, 0, 0, 0, it.content))
                .join("\n")
            let width = 1;

            for (let child of svgElement.children) {
                width=Math.max(child.getBBox().width+10,width)
            }
            let y = 10;
            let x = 10;
            console.log(width)
            svgElement.innerHTML = data.flatMap(it => {
                let number = it.info.aspect * width;

                let strings = it.info.make(x, y, width, number, it.content);
                y += number + 10;
                return strings;
            }).join("\n");
        }
    }
})