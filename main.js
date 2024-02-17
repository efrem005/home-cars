const {app, Menu, Notification, Tray, nativeImage} = require('electron')
const path = require('path')
const mqtt = require('mqtt')
const {autoUpdater, AppUpdater} = require('electron-updater')

let icon = nativeImage.createFromPath(path.join(__dirname, '/renderer/img/cars2.png'))
let client = mqtt.connect('ws://5.189.193.132:8080/', {clientId: `clientId_${Math.random().toString(16).slice(2)}`})
let store = {
    volt: 0
}
autoUpdater.autoDownload = false
autoUpdater.autoInstallOnAppQuit = true

const createMqtt = async (tray) => {

    client.on('connect', () => {
        client.subscribe('cars')
        client.subscribe('cars/indications')
    })

    client.on('message', (topic, payload, packet) => {
        switch (topic) {
            case "cars":
                const onlineCar = payload.toString()
                const online = onlineCar === '1'
                if (online) {
                    setTimeout(() => {new Notification({title: 'Машинка', body: `В сети, напряжение ${store.volt} в`}).show()}, 200)
                    tray.setImage(nativeImage.createFromPath(path.join(__dirname, '/renderer/img/cars1.png')))
                    break;
                } else {
                    new Notification({title: 'Машинка', body: 'Не в сети'}).show()
                    tray.setImage(nativeImage.createFromPath(path.join(__dirname, '/renderer/img/cars2.png')))
                }
                break;
            case "cars/indications":
                const voltRes = JSON.parse(payload.toString()).volt.volt
                const volt = Number(voltRes).toFixed(2)
                store.volt = volt
                tray.setToolTip(`Напряжение: ${volt} в`)
                break;
            default:
                break;
        }
    })
}

const diagnosticBtn = () => {
    if (store.volt < 3.30) {
        new Notification({title: 'Машинка батарея', body: `низкое напряжение батарей ${store.volt} в`}).show()
    }
    if (store.volt > 4.20) {
        new Notification({title: 'Машинка батарея', body: `Батарея заряжена напряжение батарей ${store.volt} в`}).show()
    }
}

const updateApp = () => {
    autoUpdater.checkForUpdates().then()

    autoUpdater.on('update-not-available', () => {
        new Notification({title: 'Машинка', body: `Нет доступных обновлений`}).show()
    })
}

const nextUpdateApp = () => {
    autoUpdater.checkForUpdates().then()
}

autoUpdater.on('update-available', ({releaseName, version}) => {
    autoUpdater.downloadUpdate().then()
    new Notification({
        title: 'Машинка',
        body: `Есть обновления. Установленая версия ${app.getVersion()} Новая версия ${releaseName}`
    }).show()
})

autoUpdater.on('update-downloaded', ({releaseName, version}) => {
    new Notification({title: 'Машинка', body: `Обновления готовый к установки. Новая версия ${releaseName}`}).show()
    autoUpdater.quitAndInstall()
})

autoUpdater.on('error', (info) => {
    new Notification({title: 'Машинка', body: `${info}`}).show()
})


app.whenReady().then(() => {

    let tray = new Tray(icon)

    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'update',
            click: () => updateApp()
        },
        {type: 'separator'},
        {role: 'quit'},
    ])

    tray.setContextMenu(contextMenu)

    createMqtt(tray).then()

    setTimeout(nextUpdateApp, 10000)

    setInterval(nextUpdateApp, Number(60 * 1000))

    setInterval(diagnosticBtn, Number(5 * 1000))
})

