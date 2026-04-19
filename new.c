#include <Arduino.h>

// --- Global Struct & Variables ---
struct ImpactData {
  float x;
  float y;
  int winnerPin;
  float dt15;
  float dt16;
  float dt17;
} currentHit;

volatile unsigned long t15 = 0, t16 = 0, t17 = 0;
volatile bool p15_f = false, p16_f = false, p17_f = false;
volatile int hitCount = 0;

// --- ISRs (IRAM_ATTR for speed) ---
void IRAM_ATTR handle15() {
  if (!p15_f) { t15 = micros(); p15_f = true; hitCount++; }
}
void IRAM_ATTR handle16() {
  if (!p16_f) { t16 = micros(); p16_f = true; hitCount++; }
}
void IRAM_ATTR handle17() {
  if (!p17_f) { t17 = micros(); p17_f = true; hitCount++; }
}

void setup() {
  Serial.begin(115200);
  
  pinMode(15, INPUT_PULLDOWN);
  pinMode(16, INPUT_PULLDOWN);
  pinMode(17, INPUT_PULLDOWN);

  attachInterrupt(digitalPinToInterrupt(15), handle15, RISING);
  attachInterrupt(digitalPinToInterrupt(16), handle16, RISING);
  attachInterrupt(digitalPinToInterrupt(17), handle17, RISING);

  Serial.println("System Initialized. Awaiting Impact...");
}

void loop() {
  // Check if we have a complete set of data
  if (hitCount >= 3) {
    processImpact();
    
    // Lockout period to prevent echo-triggering
    delay(300); 
    
    // Reset volatile flags
    noInterrupts();
    t15 = t16 = t17 = 0;
    p15_f = p16_f = p17_f = false;
    hitCount = 0;
    interrupts();
  }
}

void processImpact() {
  // 1. Identify the reference (first trigger)
  unsigned long tStart = t15;
  int winner = 15;
  
  if (t16 < tStart) { tStart = t16; winner = 16; }
  if (t17 < tStart) { tStart = t17; winner = 17; }

  // 2. Calculate raw delta times (DT) in microseconds
  // These represent how much later each pin fired compared to the winner
  currentHit.dt15 = (float)(t15 - tStart);
  currentHit.dt16 = (float)(t16 - tStart);
  currentHit.dt17 = (float)(t17 - tStart);
  currentHit.winnerPin = winner;

  // 3. Coordinate Calculation (Placeholders for your specific paddle geometry)
  // Assuming a coordinate system where 0,0 is the center of the paddle.
  // Logic: The larger the DT, the further the ball hit from that sensor.
  currentHit.x = (currentHit.dt15 - currentHit.dt17) * 0.05; // Example scaling
  currentHit.y = (currentHit.dt16) * -0.05 + 10.0;          // Example scaling

  // 4. Output Data
  Serial.println("--- NEW IMPACT DETECTED ---");
  Serial.print("First Pin Hit:  "); Serial.println(currentHit.winnerPin);
  Serial.print("Raw DT15 (us): "); Serial.println(currentHit.dt15);
  Serial.print("Raw DT16 (us): "); Serial.println(currentHit.dt16);
  Serial.print("Raw DT17 (us): "); Serial.println(currentHit.dt17);
  Serial.print("Calculated X:  "); Serial.println(currentHit.x);
  Serial.print("Calculated Y:  "); Serial.println(currentHit.y);
  Serial.println("---------------------------\n");
}