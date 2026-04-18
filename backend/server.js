const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

let latestData = {
  heartRate: 72,
  calories: 0,
  swingSpeed: 0,
  swingForce: 0,
  hitLocation: "center",
  accuracy: 0,
  precision: 0,
  totalSwings: 0,
};

app.get("/", (req, res) => {
  res.send("Backend is running");
});

app.get("/latest", (req, res) => {
  res.json(latestData);
});

app.post("/sensor-data", (req, res) => {
  latestData = {
    ...latestData,
    ...req.body,
  };

  io.emit("sensorUpdate", latestData);

  res.json({
    success: true,
    message: "Sensor data received",
    data: latestData,
  });
});

io.on("connection", (socket) => {
  console.log("Frontend connected:", socket.id);
  socket.emit("sensorUpdate", latestData);

  socket.on("disconnect", () => {
    console.log("Frontend disconnected:", socket.id);
  });
});

server.listen(3001, () => {
  console.log("Server running on http://localhost:3001");
});