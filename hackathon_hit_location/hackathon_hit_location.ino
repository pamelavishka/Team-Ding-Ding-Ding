// Your Pins (Adjust these based on your specific Arduino board)
const int PIN_R = 18;  // Bottom Right
const int PIN_T = 19;  // Top
const int PIN_L = 20;  // Bottom Left

volatile uint32_t t_r = 0, t_t = 0, t_l = 0;
volatile bool processing = false;

// ISR for Right Sensor
void handle_R() {
  if (!processing && t_r == 0) t_r = micros();
}

// ISR for Top Sensor
void handle_T() {
  if (!processing && t_t == 0) t_t = micros();
}

// ISR for Left Sensor
void handle_L() {
  if (!processing && t_l == 0) t_l = micros();
}

void setup() {
  Serial.begin(115200);
  
  // Configure Pins with Pullups
  pinMode(PIN_R, INPUT_PULLUP);
  pinMode(PIN_T, INPUT_PULLUP);
  pinMode(PIN_L, INPUT_PULLUP);

  // Attach Interrupts (Falling edge as per your original code)
  attachInterrupt(digitalPinToInterrupt(PIN_R), handle_R, FALLING);
  attachInterrupt(digitalPinToInterrupt(PIN_T), handle_T, FALLING);
  attachInterrupt(digitalPinToInterrupt(PIN_L), handle_L, FALLING);

  Serial.println("Purdue Hackathon: 3-Sensor Triangulation Ready");
}

void loop() {
  // Check if any sensor has been triggered
  if (t_r > 0 || t_t > 0 || t_l > 0) {
    
    delay(15); // Wait 15ms for all waves to arrive
    processing = true;

    // Check how many sensors fired
    int count = (t_r > 0) + (t_t > 0) + (t_l > 0);

    if (count == 3) {
      // Determine the winner (First to fire has SMALLEST timestamp)
      if (t_t < t_l && t_t < t_r) {
        Serial.print("TOP HIT! (T=");
        Serial.print(t_l - t_t);
        Serial.println(" us early)");
      } else if (t_l < t_r && t_l < t_t) {
        Serial.print("LEFT HIT! (L=");
        Serial.print(t_r - t_l);
        Serial.println(" us early)");
      } else if (t_r < t_l && t_r < t_t) {
        Serial.print("RIGHT HIT! (R=");
        Serial.print(t_l - t_r);
        Serial.println(" us early)");
      }

      // X and Y Analysis
      int32_t deltaX = (int32_t)(t_l - t_r); // Positive = Closer to Right
      int32_t deltaY = (int32_t)(((t_l + t_r) / 2) - t_t); // Positive = Closer to Top

      Serial.print("Coords -> DeltaX: ");
      Serial.print(deltaX);
      Serial.print(" | DeltaY: ");
      Serial.println(deltaY);
      
    } else {
      Serial.print("Partial Hit: ");
      Serial.print(count);
      Serial.println(" sensors detected.");
    }

    delay(250); // Debounce/Cooldown
    
    // Reset for next detection
    t_r = 0; 
    t_t = 0; 
    t_l = 0;
    processing = false;
  }
}