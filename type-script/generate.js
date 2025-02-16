"use strict";
setTimeout(function () {
    let svgRootElement = document.querySelector("svg");
    let textAreaElement = document.querySelector("textarea.input_area");
    /**@type HTMLLabelElement*/
    let labelElement = document.querySelector("label.error_label");
    /**@type HTMLButtonElement*/
    let generateButton = document.querySelector("button.generate_button");
    let downloadButton = document.querySelector("button.download_button");
    document.querySelector("body").addEventListener("keypress", ev => {
        if (ev.key == "Enter" && ev.ctrlKey) {
            ev.preventDefault();
            // @ts-ignore
            generateButton.onclick();
        }
    });
    const TEST_COMPILE_INFO = new CompileInfo(1, 0, 0);
    function inputElement(selectors) {
        let element = document.querySelector(selectors);
        return element;
    }
    generateButton.onclick = function () {
        let result = Parser.parse(textAreaElement.value);
        if (result.error != null) {
            labelElement.innerHTML = result.error;
        }
        else {
            labelElement.innerHTML = "";
            let data = result.data;
            // svgRootElement.innerHTML = data.strings.map(it => defaultCenterText(0, 0, 0, 0, it))
            //     .join("\n")
            svgRootElement.innerHTML = data.block.compile(new Cursor(0), new Cursor(0), TEST_COMPILE_INFO).svgCode.join("\n");
            let width = 1;
            for (let child of svgRootElement.querySelectorAll(".text-group")) {
                let bBox = child.getBBox();
                let aspect = JSON.parse(child.dataset.aspect);
                let widthAspect = JSON.parse(child.dataset.widthaspect);
                let myWidth = bBox.width / widthAspect + 10;
                if (aspect != 0 && Number.isFinite(aspect)) {
                    let expectedHeight = bBox.width * aspect;
                    if (bBox.height > expectedHeight) {
                        myWidth = bBox.height / aspect / widthAspect + 10;
                    }
                }
                width = Math.max(myWidth, width);
            }
            let extraWidth = inputElement("input#extra-width").valueAsNumber;
            width += extraWidth;
            let topMargin = 15;
            let compileInfo = new CompileInfo(width, topMargin, extraWidth);
            compileInfo.drawBB = inputElement("input#draw-bb").checked;
            let blockBoundingBox = data.block.calculateBoundingBox(compileInfo);
            let boundingBox = blockBoundingBox.bounds;
            console.log(width, blockBoundingBox);
            let cursorX = new Cursor(0);
            let cursorY = new Cursor(5);
            svgRootElement.innerHTML = data.block.compile(cursorX, cursorY, compileInfo).svgCode.join("\n");
            if (compileInfo.drawBB || true) {
                let safeSpace = topMargin;
                let currentBox = new DOMRect(boundingBox.x(), boundingBox.y(), boundingBox.width(), boundingBox.height() + safeSpace);
                svgRootElement.width.baseVal.value = currentBox.width;
                svgRootElement.height.baseVal.value = currentBox.height;
                if (inputElement("#add-back").checked) {
                    svgRootElement.innerHTML = `<rect x="${currentBox.x}" y="${currentBox.y}" width="${currentBox.width}" height="${currentBox.height}" fill="white"></rect>\n` + svgRootElement.innerHTML;
                }
                svgRootElement.setAttribute("viewBox", `${currentBox.x} ${currentBox.y} ${currentBox.width} ${currentBox.height}`);
                svgRootElement.setAttribute("width", `${currentBox.width}px`);
                svgRootElement.setAttribute("height", `${currentBox.height}px`);
                svgRootElement.width.baseVal.value = currentBox.width + 10;
                svgRootElement.height.baseVal.value = currentBox.height + 10;
            }
            else {
                let currentBox = undefined;
                let propToSize = {
                    "x": "width",
                    "y": "height"
                };
                function otherSide(rect, prop) {
                    return rect[prop] + rect[propToSize[prop]];
                }
                for (let rawElement of svgRootElement.querySelectorAll("rect:not(.bounding-box), path")) {
                    let svgElement = rawElement;
                    let box = svgElement.getBBox();
                    if (currentBox === undefined) {
                        currentBox = box;
                        let strings = ["x", "y"];
                        for (let prop of strings) {
                            currentBox[prop] = currentBox[prop] - 5;
                            let size = propToSize[prop];
                            currentBox[size] = currentBox[size] + 5;
                        }
                        continue;
                    }
                    // if (box.x < 0) debugPoint()
                    for (let prop_ of Object.keys(propToSize)) {
                        let prop = prop_;
                        let other1 = otherSide(currentBox, prop) + 5;
                        let other2 = otherSide(box, prop) + 5;
                        let other = Math.max(other1, other2);
                        currentBox[prop] = Math.min(currentBox[prop], box[prop] - 5);
                        currentBox[propToSize[prop]] = other - currentBox[prop];
                    }
                }
                currentBox = currentBox;
                if (inputElement("#add-back").checked) {
                    svgRootElement.innerHTML = `<rect x="${currentBox.x}" y="${currentBox.y}" width="${currentBox.width}" height="${currentBox.height}" fill="white"></rect>\n` + svgRootElement.innerHTML;
                }
                svgRootElement.setAttribute("viewBox", `${currentBox.x} ${currentBox.y} ${currentBox.width} ${currentBox.height}`);
                svgRootElement.setAttribute("width", `${currentBox.width}px`);
                svgRootElement.setAttribute("height", `${currentBox.height}px`);
                svgRootElement.width.baseVal.value = currentBox.width + 10;
                svgRootElement.height.baseVal.value = currentBox.height + 10;
            }
        }
    };
    downloadButton.onclick = function () {
        // @ts-ignore
        generateButton.onclick();
        function download(filename, text) {
            let element = document.createElement('a');
            element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
            element.setAttribute('download', filename);
            element.style.display = 'none';
            document.body.appendChild(element);
            element.click();
            document.body.removeChild(element);
        }
        download("brace_preview.svg", svgRootElement.outerHTML);
    };
});
