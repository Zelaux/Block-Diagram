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
var download = Utils.download;
var emulateClick = Utils.emulateClick;
setTimeout(function () {
    function buttonAction(element, action) {
        element.onclick = action;
    }
    let input_area = document.body.querySelector(".input_area");
    let myRoot = document.body.querySelector(".saves-setting");
    let nameInput = myRoot.querySelector("#save-name");
    let saveButton = myRoot.querySelector(".save-button");
    let saveContainer = myRoot.querySelector(".save-container");
    const SETTING_KEY = "block_graph_zelaux";
    const LAST_SETTING_KEY = "block_graph_zelaux.last";
    buttonAction(myRoot.querySelector("#download-all"), () => {
        let item = localStorage.getItem(SETTING_KEY);
        download("block_graph_save.json", item == null ? "{}" : item);
    });
    buttonAction(myRoot.querySelector(".clear-button"), () => {
        if (!window.confirm("Are you sure to delete all saves?"))
            return;
        let shouldDownload = window.confirm("Maybe you want to download saves before deleting?");
        let item = localStorage.getItem(SETTING_KEY);
        if (shouldDownload)
            download("block_graph_save.json", item == null ? "{}" : item);
        localStorage.setItem(SETTING_KEY, "{}");
        rebuildSaved(loadSaves());
    });
    buttonAction(myRoot.querySelector("#download-clear-all"), () => {
        let item = localStorage.getItem(SETTING_KEY);
        download("block_graph_save.json", item == null ? "{}" : item);
        localStorage.setItem(SETTING_KEY, "{}");
        rebuildSaved(loadSaves());
    });
    buttonAction(myRoot.querySelector("#download-all-svg"), () => {
        let saves = loadSaves();
        if (saves == null) {
            alert("No saves");
            return;
        }
        let resultFileName = prompt("File name?", "all-svg");
        if (resultFileName == null)
            return;
        let downloadButton = document.querySelector("button.download_button");
        let currentSave = createSaveInfo();
        let savesList = [];
        for (let key in saves) {
            savesList.push(saves[key]);
        }
        setTimeout(function () {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    let realDownload = Utils.download;
                    let zip = new JSZip();
                    let fakeDownload;
                    fakeDownload = (filename, text) => {
                        zip.file(filename, text);
                    };
                    // zip.file("Hello.txt", "Hello world\n");
                    for (let i = 0; i < savesList.length; i++) {
                        let save = savesList[i];
                        restore(save);
                        yield Utils.sleep(1);
                        Utils.download = fakeDownload;
                        try { // @ts-ignore
                            downloadButton.onclick();
                        }
                        finally {
                            Utils.download = realDownload;
                        }
                    }
                    Utils.downloadZip(resultFileName, zip);
                }
                finally {
                    restore(currentSave);
                }
            });
        });
    });
    let loadSavesZone = myRoot.querySelector("#load-saves");
    loadSavesZone.ondrop = ev => {
        ev.preventDefault();
        for (let item of ev.dataTransfer.items) {
            let file = item.getAsFile();
            file.text().then(text => {
                let b = window.confirm("Override existed saves");
                if (b) {
                    localStorage.setItem(SETTING_KEY, text);
                    rebuildSaved(loadSaves());
                }
                else {
                    let loadSaves1 = loadSaves();
                    localStorage.setItem(SETTING_KEY, text);
                    let newSaves = loadSaves();
                    if (loadSaves1 != null) {
                        for (let key in loadSaves1) {
                            newSaves[key] = loadSaves1[key];
                        }
                        storeSaves(newSaves);
                    }
                    rebuildSaved(newSaves);
                }
            });
        }
    };
    let nodes = Array.from(document
        .querySelector(".fields")
        .querySelectorAll(".serialize"))
        .map(it => it.querySelector("input"))
        .map(it => it);
    let idToNode = {};
    for (let node of nodes) {
        idToNode[node.id] = node;
    }
    function restore(save) {
        input_area.value = save.code;
        nameInput.value = save.name;
        for (let settingsKey in save.settings) {
            let node = idToNode[settingsKey];
            if (node === null || node === undefined)
                continue;
            node.value = save.settings[settingsKey];
        }
        // @ts-ignore
        input_area.dispatchEvent(new Event("change"));
        document.body.querySelector(".svg_container>svg").innerHTML = "";
        // @ts-ignore
        Utils.emulateClick(document.body.querySelector(".generate_button"));
    }
    function createSaveInfo() {
        let settings = {};
        for (let node of nodes) {
            settings[node.id] = node.value;
        }
        return {
            name: nameInput.value, code: input_area.value, settings: settings
        };
    }
    function rebuildSaved(saved) {
        saveContainer.innerHTML = "";
        for (let savedKey in saved) {
            let save = saved[savedKey];
            let entry = document.createElement("div");
            entry.className = "save-entry";
            saveContainer.appendChild(entry);
            let p = document.createElement("p");
            p.innerText = save.name;
            entry.appendChild(p);
            let button = document.createElement("button");
            button.className = "base-button delete-save-button";
            button.onclick = () => alert("TODO");
            button.innerHTML = "Delete";
            entry.appendChild(button);
            button = document.createElement("button");
            button.className = "base-button load-save-button";
            button.onclick = () => {
                restore(save);
            };
            button.innerHTML = "Load";
            entry.appendChild(button);
        }
    }
    saveButton.onclick = () => {
        let saves = loadSaves() || {};
        let newInfo = createSaveInfo();
        saves[newInfo.name] = newInfo;
        storeSaves(saves);
    };
    function loadSaves() {
        let existed = localStorage.getItem(SETTING_KEY);
        let saved;
        if (existed != null) {
            return JSON.parse(existed);
        }
        else {
            return null;
        }
    }
    function storeSaves(saves) {
        localStorage.setItem(SETTING_KEY, JSON.stringify(saves));
        rebuildSaved(saves);
    }
    {
        let saved = loadSaves();
        if (saved !== null)
            rebuildSaved(saved);
    }
    {
        let last = localStorage.getItem(LAST_SETTING_KEY);
        if (last != null)
            restore(JSON.parse(last));
    }
    function savelast() {
        let s = JSON.stringify(createSaveInfo());
        localStorage.setItem(LAST_SETTING_KEY, s);
    }
    for (let node of nodes) {
        node.addEventListener("change", savelast);
    }
    input_area.addEventListener("change", savelast);
});
