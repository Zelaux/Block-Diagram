setTimeout(function () {
    let y = 0;
    let svgElement = document.querySelector("svg")!;

    /***/

    function cast<T>(it: unknown): T {
        return it as T
    }

    let textAreaElement: HTMLAreaElement = document.querySelector("textarea.input_area")!;
    /**@type HTMLLabelElement*/
    let labelElement: HTMLLabelElement = document.querySelector("label.error_label")!;
    /**@type HTMLButtonElement*/
    let generateButton: HTMLButtonElement = document.querySelector("button.generate_button")!;
    let downloadButton: HTMLButtonElement = document.querySelector("button.download_button")!;
    document.querySelector("body")!.addEventListener("keypress", ev => {

        if (ev.key == "Enter" && ev.ctrlKey) {
            ev.preventDefault()
            // @ts-ignore
            generateButton.onclick()
        }
    })
    const TEST_COMPILE_INFO = new CompileInfo(1, 0, 0);
    generateButton.onclick = function () {
        let result = Parser.parse((textAreaElement as unknown as { value: string }).value);
        if (result.error != null) {
            labelElement.innerHTML = result.error;
        } else {
            labelElement.innerHTML = ""

            let data = result.data!;
            // svgElement.innerHTML = data.strings.map(it => defaultCenterText(0, 0, 0, 0, it))
            //     .join("\n")

            svgElement.innerHTML = data.block.compile(new Cursor(0), new Cursor(0), TEST_COMPILE_INFO).svgCode.join("\n")
            let width = 1;

            for (let child of svgElement.querySelectorAll(".text-group")) {
                let bBox = (child as SVGSVGElement).getBBox();
                let aspect: number = JSON.parse((child as SVGSVGElement).dataset.aspect!);
                let widthAspect: number = JSON.parse((child as SVGSVGElement).dataset.widthaspect!);
                let myWidth = bBox.width / widthAspect + 10;

                if (aspect != 0 && Number.isFinite(aspect)) {
                    let expectedHeight = bBox.width * aspect;
                    if (bBox.height > expectedHeight) {
                        myWidth = bBox.height / aspect / widthAspect + 10
                    }
                }

                width = Math.max(myWidth, width)
            }
            let element: HTMLInputElement = document.querySelector("input#extra-width")!;
            let extraWidth = element.valueAsNumber;
            width += extraWidth
            let compileInfo = new CompileInfo(
                width, 15, extraWidth
            );
            let boundingBox = data.block.calculateBoundingBox(compileInfo);

            svgElement.width.baseVal.value = boundingBox.width+10
            svgElement.height.baseVal.value = boundingBox.height+10
            console.log(width, boundingBox)
            let cursorY = new Cursor(boundingBox.anchor.y+5);
            let cursorX = new Cursor(boundingBox.anchor.x+5);
            svgElement.innerHTML = data.block.compile(cursorX, cursorY, compileInfo).svgCode.join("\n");
        }
    }
    downloadButton.onclick = function () {
        // @ts-ignore
        generateButton.onclick()

        function download(filename: string, text: string) {
            let element = document.createElement('a');
            element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
            element.setAttribute('download', filename);
            element.style.display = 'none';
            document.body.appendChild(element);
            element.click();
            document.body.removeChild(element);
        }

        download("brace_preview.svg", svgElement.outerHTML)

    }
})
