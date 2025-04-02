"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var Utils;
(function (Utils) {
    function downloadByDataHref(filename, dataHref) {
        let element = document.createElement('a');
        element.setAttribute('href', dataHref.startsWith("data:") ? dataHref : "data:" + dataHref);
        element.setAttribute('download', filename);
        element.style.display = 'none';
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    }
    function download(filename, text) {
        downloadByDataHref(filename, 'text/plain;charset=utf-8,' + encodeURIComponent(text));
    }
    Utils.download = download;
    function downloadZip(filename, zip) {
        zip.generateAsync({ type: "base64" }).then(function (base64) {
            downloadByDataHref(filename, "data:application/zip;base64," + base64);
        });
    }
    Utils.downloadZip = downloadZip;
    function emulateClick(element) {
        element.dispatchEvent(new Event("click"));
    }
    Utils.emulateClick = emulateClick;
    function sleep(ms) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise(resolve => setTimeout(resolve, ms));
        });
    }
    Utils.sleep = sleep;
})(Utils || (Utils = {}));
