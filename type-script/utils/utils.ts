namespace Utils {
    function downloadByDataHref(filename: string, dataHref: string) {
        let element = document.createElement('a');
        element.setAttribute('href', dataHref.startsWith("data:")?dataHref:"data:" + dataHref);
        element.setAttribute('download', filename);
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    }

    export function download(filename: string, text: string) {
        downloadByDataHref(filename, 'text/plain;charset=utf-8,' + encodeURIComponent(text));
    }
    export function downloadZip(filename:string,zip:JSZip){
        zip.generateAsync({type:"base64"}).then(function (base64) {
            downloadByDataHref(filename,"data:application/zip;base64," + base64)
        });
    }

    export function emulateClick(element: HTMLElement) {
        element.dispatchEvent(new Event("click"))
    }
    export async function sleep(ms:number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}