// console.log(window.mqtt.client)

const {carsVolt, carsOnline} = window.electronAPI


carsVolt((e, data) => {
    const cars = document.querySelector('#cars')
    cars.innerText = data
})

carsOnline((e, data) => {
    const carsOn = document.querySelector('#online_cars')
    if (data) {
        carsOn.style.color = 'green'
    } else {
        carsOn.style.color = 'red'
    }
})