"use strict";
setTimeout(function () {
    let input_area = document.body.querySelector(".input_area");
    let myRoot = document.body.querySelector(".saves-setting");
    let nameInput = myRoot.querySelector("#save-name");
    let saveButton = myRoot.querySelector(".save-button");
    let saveContainer = myRoot.querySelector(".save-container");
    const SETTING_KEY = "block_graph_zelaux";
    const LAST_SETTING_KEY = "block_graph_zelaux.last";
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
        document.body.querySelector(".generate_button").dispatchEvent(new Event("click"));
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
