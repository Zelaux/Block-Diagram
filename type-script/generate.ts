
setTimeout(function () {
    let y = 0;
    let svgElement = document.querySelector("svg")!;
    /***/

    function cast<T>(it:unknown):T{
        return it as T
    }

    let textAreaElement:HTMLAreaElement = document.querySelector("textarea.input_area")!;
    /**@type HTMLLabelElement*/
    let labelElement:HTMLLabelElement = document.querySelector("label.error_label")!;
    /**@type HTMLButtonElement*/
    let generateButton:HTMLButtonElement = document.querySelector("button.generate_button")!;
    generateButton.onclick = function () {
        let result = parse((textAreaElement as unknown as {value:string}).value);
        if (result.error !=null) {
            labelElement.innerHTML = result.error;
        } else {
            labelElement.innerHTML = ""

            let data = result.data!;
            svgElement.innerHTML = data.strings.map(it => defaultCenterText(0, 0, 0, 0, it))
                .join("\n")
            let width = 1;

            for (let child of svgElement.children) {
                width=Math.max((child as SVGGraphicsElement).getBBox().width+10,width)
            }
            let calculateWidth = data.block.calculateWidth();
            let totalWidth=calculateWidth*width +calculateWidth*15+40
            let y = 10;
            let x = totalWidth/2-width/2;
            svgElement.width.baseVal.value=totalWidth
            console.log(width)
            svgElement.innerHTML = data.block.compile(x,new Cursor(y),width).join("\n");
        }
    }
})