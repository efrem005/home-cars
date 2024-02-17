const { contextBridge, ipcRenderer } = require('electron')

window.addEventListener('DOMContentLoaded', () => {
    const replaceText = (selector, text) => {
        const element = document.getElementById(selector)
        if (element) element.innerText = text
    }

    for (const dependency of ['chrome', 'node', 'electron']) {
        replaceText(`${dependency}-version`, process.versions[dependency])
    }
})




contextBridge.exposeInMainWorld('electronAPI', {
    carsVolt: (callback) => ipcRenderer.on('cars-volt', callback),
    carsOnline: (callback) => ipcRenderer.on('cars-online', callback)
})

