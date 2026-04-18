#include <Wire.h>
#include "MAX30105.h"

MAX30105 particleSensor;

void setup() {
  Serial.begin(115200);
  Wire.begin();

  if (!particleSensor.begin(Wire, I2C_SPEED_FAST)) {
    Serial.println("MAX30102 not found. Check wiring.");
    while (1);
  }

  // Configure sensor
  particleSensor.setup(); 
  particleSensor.setPulseAmplitudeRed(0x0A);
  particleSensor.setPulseAmplitudeIR(0x0A);

  Serial.println("Sensor initialized...");
}

void loop() {
  long irValue = particleSensor.getIR();

  Serial.print("IR Value: ");
  Serial.println(irValue);

  delay(200);
}
