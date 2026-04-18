#include <Wire.h>
#include "MAX30105.h"

MAX30105 particleSensor;

bool running = true;   // controls whether sensor keeps running

void setup()
{
  Serial.begin(115200);
  delay(1000);

  // Initialize I2C (adjust pins if needed)
  Wire.begin(8, 9);  // SDA = GPIO 8, SCL = GPIO 9

  // Initialize sensor
  if (!particleSensor.begin(Wire, I2C_SPEED_FAST))
  {
    Serial.println("MAX30102 not found. Check wiring.");
    while (1);
  }

  Serial.println("MAX30102 initialized.");
  Serial.println("Type 'q' to stop readings.");

  // Configure sensor
  particleSensor.setup();
  particleSensor.setPulseAmplitudeRed(0x0A);
  particleSensor.setPulseAmplitudeIR(0x0A);
}

void loop()
{
  // Check for user input to stop program
  if (Serial.available())
  {
    char c = Serial.read();
    if (c == 'q')
    {
      running = false;
      Serial.println("Program stopped.");
    }
  }

  // If stopped, do nothing
  if (!running) return;

  // Read IR value
  long irValue = particleSensor.getIR();

  Serial.print("IR: ");
  Serial.println(irValue);

  delay(100);
}
