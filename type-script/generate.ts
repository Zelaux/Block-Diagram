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
    generateButton.onclick = function () {
        let result = Parser.parse((textAreaElement as unknown as { value: string }).value);
        if (result.error != null) {
            labelElement.innerHTML = result.error;
        } else {
            labelElement.innerHTML = ""

            let data = result.data!;
            svgElement.innerHTML = data.strings.map(it => defaultCenterText(0, 0, 0, 0, it))
                .join("\n")
            let width = 1;

            for (let child of svgElement.children) {
                width = Math.max((child as SVGGraphicsElement).getBBox().width + 10, width)
            }
            let calculateWidth = data.block.calculateWidth();
            let totalWidth = calculateWidth * width + calculateWidth * 15 + 40
            let y = 0;
            let x = totalWidth / 2 - width / 2;
            let heightInfo = data.block.calculateHeight();
            let totalHeight = heightInfo.unscaledHeight * width + (heightInfo.totalElements + 4) * 15
            svgElement.width.baseVal.value = totalWidth
            console.log(width, heightInfo)
            let cursor = new Cursor(y);
            svgElement.innerHTML = data.block.compile(x, cursor, width).join("\n");
            svgElement.height.baseVal.value = cursor.value
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

        download("block-graph.svg", svgElement.outerHTML)

    }
})
