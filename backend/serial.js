const { SerialPort } = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");
const fetch = require("node-fetch"); // if needed

const port = new SerialPort({
  path: "/dev/cu.usbmodem1401",
  baudRate: 9600,
});

const parser = port.pipe(new ReadlineParser({ delimiter: "\n" }));

parser.on("data", async (line) => {
  try {
    const data = JSON.parse(line);
    console.log("Arduino:", data);

    await fetch("http://localhost:3001/sensor-data", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

  } catch (err) {
    console.log("Bad data:", line);
  }
});