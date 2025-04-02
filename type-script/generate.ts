setTimeout(function () {
    let svgRootElement = document.querySelector("svg")!;

    let textAreaElement: HTMLTextAreaElement = document.querySelector("textarea.input_area")!;
    /**@type HTMLLabelElement*/
    let labelElement: HTMLLabelElement = document.querySelector("label.error_label")!;
    /**@type HTMLButtonElement*/
    let generateButton: HTMLButtonElement = document.querySelector("button.generate_button")!;
    let downloadButton: HTMLButtonElement = document.querySelector("button.download_button")!;
    let autoformatButton: HTMLButtonElement = document.querySelector("button.auto_format")!;
    autoformatButton.onclick = function () {

        let text: string = textAreaElement.value
        Tools.autoformatInArea(textAreaElement)

    }

    document.querySelector("body")!.addEventListener("keydown", ev => {
        console.log(ev)
        if (ev.key == "l" && ev.ctrlKey && ev.altKey) {
            ev.preventDefault()
            // @ts-ignore
            autoformatButton.onclick()
        } else if (ev.key == "Enter" && ev.ctrlKey) {
            ev.preventDefault()
            // @ts-ignore
            generateButton.onclick()
        }
    })
    const TEST_COMPILE_INFO = new CompileInfo(1, 0, 0);

    function inputElement(selectors: string) {
        let element: HTMLInputElement = document.querySelector(selectors)!;
        return element;
    }

    generateButton.onclick = function () {
        let result = Parser.parse((textAreaElement as unknown as { value: string }).value);
        if (result.error != null) {
            labelElement.innerHTML = result.error;
        } else {
            labelElement.innerHTML = ""

            let data = result.data!;
            // svgRootElement.innerHTML = data.strings.map(it => defaultCenterText(0, 0, 0, 0, it))
            //     .join("\n")

            let width = 1;
            {
                let defaultCenterText_prev = defaultCenterText
                let mergedBounds = Bounds.makeZero()
                // @ts-ignore
                defaultCenterText = function (x, y, width, height, text, baseline, anchor, widthAspect) {

                    let bBox = defaultCenterText0(text, baseline, anchor, width);
                    let w = bBox.width;
                    let h = bBox.height;
                    mergedBounds.expandBound(bBox.toBounds(1, 1))
                    let aspect = widthAspect;
                    if (aspect != 0 && Number.isFinite(aspect)) {
                        let expectedHeight = w * aspect;
                        if (h > expectedHeight) {
                            w = bBox.height / aspect / widthAspect
                            h = expectedHeight;
                        }
                    }
                    mergedBounds.expand(w, h)
                    return ""
                }
                data.block.compile(new Cursor(0), new Cursor(0), TEST_COMPILE_INFO)
                // @ts-ignore
                defaultCenterText = defaultCenterText_prev
                // @ts-ignore
                window.mergedBounds = mergedBounds;
                width = mergedBounds.width() + 10;
            }
            let extraWidth = inputElement("input#extra-width").valueAsNumber;
            width += extraWidth
            let topMargin = 15;
            let compileInfo = new CompileInfo(
                width, topMargin, extraWidth
            );
            compileInfo.drawBB = inputElement("input#draw-bb").checked;
            // @ts-ignore
            defaultCenterText.drawBB = compileInfo.drawBB
            let blockBoundingBox = data.block.calculateBoundingBox(compileInfo);
            let boundingBox = blockBoundingBox.bounds
            console.log(width, blockBoundingBox)
            let cursorX = new Cursor(0);
            let cursorY = new Cursor(5);
            svgRootElement.innerHTML = SVG_STYLE_PREFIX + data.block.compile(cursorX, cursorY, compileInfo).svgCode.join("\n");
            let safeSpace = topMargin;
            let currentBox = new DOMRect(
                boundingBox.x(), boundingBox.y(), boundingBox.width(), boundingBox.height() + safeSpace
            )
            svgRootElement.width.baseVal.value = currentBox.width
            svgRootElement.height.baseVal.value = currentBox.height
            if (inputElement("#add-back").checked) {
                svgRootElement.innerHTML = `<rect x="${currentBox.x}" y="${currentBox.y}" width="${currentBox.width}" height="${currentBox.height}" fill="white"></rect>\n` + svgRootElement.innerHTML
            }
            svgRootElement.setAttribute("viewBox", `${currentBox.x} ${currentBox.y} ${currentBox.width} ${currentBox.height}`)
            svgRootElement.setAttribute("width", `${currentBox.width}px`)
            svgRootElement.setAttribute("height", `${currentBox.height}px`)

            // svgRootElement.width.baseVal.value = currentBox.width-currentBox.x + 10
            // svgRootElement.height.baseVal.value = currentBox.height-currentBox.y + 10
            svgRootElement.width.baseVal.value = currentBox.width + 10
            svgRootElement.height.baseVal.value = currentBox.height + 10
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

        download("brace_preview.svg", svgRootElement.outerHTML)

    }
})
