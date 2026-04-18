# Smart Pickleball Paddle Dashboard

This project is a live web dashboard for a sensor-packed pickleball paddle. It is built for a hardware hackathon workflow: the hardware team can keep changing sensors and firmware, while the website team still has a working screen with simulated data.

## What The Dashboard Tracks

- Ball impact location on the paddle face
- Swing speed in miles per hour
- Estimated force in newtons
- Accuracy score
- Precision score
- Heart rate from the handle sensor
- Estimated calories
- Total hit count

## Technologies Used

### Python

Python runs the local server because it is fast to build with, easy to explain, and already common in hardware projects. It also has good support for serial, Bluetooth, Wi-Fi, UDP, and data processing if the hardware connection changes later.

### HTTP

The browser loads the dashboard from a normal local web server. That means the front end can be opened from a phone, laptop, or tablet on the same network once the host is changed from `127.0.0.1` to your computer's LAN IP.

### Server-Sent Events

The live browser updates use Server-Sent Events, also called SSE. SSE keeps one long connection open from the browser to Python and lets Python push every new paddle reading immediately.

This is similar to the reason people mention sockets: the page should not refresh every second. It should receive live data as soon as the paddle sends it. For this hackathon, SSE is easier than WebSockets because it works in the browser and Python standard library without installing packages.

### UDP Packets

The dashboard listens for sensor data on UDP port `9000`. UDP is simple for microcontrollers and works well for quick telemetry. The hardware can send a small JSON object every time the paddle detects a hit.

Example packet:

```json
{
  "impact_x": 0.52,
  "impact_y": 0.43,
  "swing_speed_mph": 31.8,
  "force_n": 215.4,
  "heart_rate_bpm": 118,
  "calories": 23.5,
  "hits": 42
}
```

`impact_x` and `impact_y` should be normalized between `0` and `1`.

- `impact_x: 0` means left edge of the paddle
- `impact_x: 1` means right edge of the paddle
- `impact_y: 0` means top edge of the paddle
- `impact_y: 1` means bottom edge of the paddle

## How To Run It

Start the dashboard:

```bash
python3 dashboard.py
```

Open:

```text
http://127.0.0.1:8080
```

The dashboard starts with demo data automatically, so it works before the hardware is ready.

To send fake UDP packets from a second terminal:

```bash
python3 network.py
```

To run with only real hardware data:

```bash
python3 dashboard.py --no-demo
```

## How The Data Flows

1. Sensors collect readings on the paddle.
2. The microcontroller calculates or estimates values like impact location, speed, force, and heart rate.
3. The microcontroller sends a JSON packet over Wi-Fi or through a computer bridge.
4. `dashboard.py` receives the packet on UDP port `9000`.
5. `dashboard.py` updates the latest reading.
6. The browser receives the new reading through `/events`.
7. The dashboard updates the metrics, impact marker, and accuracy chart.

## Hardware Integration Plan

Start by making the hardware send only one value, such as heart rate or swing speed. Once that works, add the rest of the JSON fields one at a time.

Recommended order:

1. Send a hardcoded JSON packet from the microcontroller.
2. Send one real sensor value.
3. Add hit count.
4. Add impact location.
5. Add swing speed and force.
6. Add heart rate and calories.
7. Turn off demo mode with `--no-demo`.

## If You Actually Need WebSockets Later

WebSockets are useful when the browser also needs to send frequent messages back to the server, such as calibration commands, start/stop session controls, or live coaching settings. For this version, the data mostly moves from paddle to dashboard, so SSE is simpler and more reliable under time pressure.

If you upgrade later, use:

- Flask or FastAPI for the Python web server
- Socket.IO or native WebSockets for two-way live communication
- SQLite for saving sessions
- Chart.js for more advanced charts

## Files

- `dashboard.py`: web server, live dashboard, demo data, UDP receiver
- `network.py`: fake UDP packet sender for testing
- `embedded_sampling.c`: early embedded-side sampling notes
