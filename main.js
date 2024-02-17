const {app, Menu, Notification, Tray, nativeImage} = require('electron')
const path = require('path')
const mqtt = require('mqtt')
const global = require('global')
const { autoUpdater, AppUpdater } = require('electron-updater')

let icon = nativeImage.createFromPath(path.join(__dirname, '/renderer/img/cars2.png'))
let client = mqtt.connect(process.env.MQTT_URL, {clientId: `clientId_${Math.random().toString(16).slice(2)}`})
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
                    new Notification({title: 'Машинка', body: 'В сети'}).show()
                    tray.setImage(nativeImage.createFromPath(path.join(__dirname, '/renderer/img/cars1.png')))
                    break;
                } else {
                    new Notification({title: 'Машинка', body: 'Не в сети'}).show()
                    tray.setImage(nativeImage.createFromPath(path.join(__dirname, '/renderer/img/cars2.png')))
                }
                break;
            case "cars/indications":
                const volt = JSON.parse(payload.toString()).volt.volt
                tray.setToolTip(`Напряжение: ${Number(volt).toFixed(2)} в`)
                break;
            default:
                break;
        }
    })

    client.on('offline', (e) => {
        console.log(e)
    })
}


app.whenReady().then(() => {

    let tray = new Tray(icon)

    const contextMenu = Menu.buildFromTemplate([
        { role: 'quit'},
    ])

    tray.setContextMenu(contextMenu)

    createMqtt(tray).then()

    autoUpdater.checkForUpdates().then((data) => {
        console.log(data)
        new Notification({title: 'Машинка', body: `Checking for updates. Current version ${app.getVersion()}`}).show()
    })

    autoUpdater.on('update-available', () => {
        autoUpdater.downloadUpdate().then(() => {
            new Notification({title: 'Машинка', body: `Update available. Current version ${app.getVersion()}`}).show()
        })
    })

    autoUpdater.on('update-not-available', () => {
        new Notification({title: 'Машинка', body: `No update available. Current version ${app.getVersion()}`}).show()
    })

    autoUpdater.on('update-downloaded', () => {
        new Notification({title: 'Машинка', body: `Update downloaded. Current version ${app.getVersion()}`}).show()
    })

    autoUpdater.on('error', (info) => {
        new Notification({title: 'Машинка', body: `${info}`}).show()
    })
})

