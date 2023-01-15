import { SerialPort } from "serialport";
import { fetchETS2 } from "./api/fetch";

const port = new SerialPort({
    path: "COM4",
    baudRate: 9600,
    lock: false,
});

port.on('open', async () => {
    console.log('Port open')
    setTimeout(() => {
        fetchLoop();
    }, 2000);
});

const fetchLoop = () => {
    const intErval = setInterval(async () => {
        const data = await fetchETS2();
        const speed = Math.round(data.truck!.speed!);
        port.write(`${speed} km/h\n`, (err) => {
            if (err) {
                return console.log('Error on write: ', err.message)
            }
            console.log('message written')
        });
    }, 200);
}
