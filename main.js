const {app, BrowserWindow, Menu, Notification, Tray, nativeImage} = require('electron')
const path = require('path')
const mqtt = require('mqtt')

let icon = nativeImage.createFromPath(path.join(__dirname, '/renderer/img/cars2.png'))
let client = mqtt.connect(process.env.MQTT_URL, {clientId: `clientId_${Math.random().toString(16).slice(2)}`})

const createMqtt = async (tray) => {

    const win = new BrowserWindow({
        width: 400,
        height: 400,
        webPreferences: {
            nodeIntegration: true
        }
    })

    win.webContents.openDevTools()

    app.setUserTasks([
        {
            program: process.execPath,
            arguments: '--new-window',
            iconPath: process.execPath,
            iconIndex: 0,
            title: 'New Window',
            description: 'Create a new window'
        }
    ])

    win.setThumbarButtons([
        {
            tooltip: 'button1',
            icon: nativeImage.createFromPath(path.join(__dirname, '/renderer/img/cars1.png')),
            click () { console.log('button1 clicked') }
        }, {
            tooltip: 'button2',
            icon: nativeImage.createFromPath(path.join(__dirname, '/renderer/img/cars2.png')),
            flags: ['enabled', 'dismissonclick'],
            click () { console.log('button2 clicked.') }
        }
    ])

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

})

