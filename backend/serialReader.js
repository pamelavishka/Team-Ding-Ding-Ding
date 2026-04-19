const { SerialPort } = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");

const port = new SerialPort({
  path: "/dev/cu.usbmodem1301",
  baudRate: 9600,
});

const parser = port.pipe(new ReadlineParser({ delimiter: "\n" }));

parser.on("data", async (line) => {
  try {
    const data = JSON.parse(line);
    console.log("Arduino:", data);

    const mappedData = {
      swingForce: data.swingForce ?? 0,
      swingSpeed: data.swingSpeed ?? 0,
      swingDistance: data.swingDistance ?? 0,
    };

    const response = await fetch("http://localhost:3001/sensor-data", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(mappedData),
    });

    const result = await response.json();
    console.log("Backend response:", result);
  } catch (err) {
    console.log("Bad line or POST error:", err.message);
    console.log("Raw line:", line);
  }
});