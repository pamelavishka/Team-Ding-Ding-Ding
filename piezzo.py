#include <stdio.h>
#include "pico/stdlib.h"
#include "hardware/gpio.h"

// Your Pins
#define PIN_R 18  
#define PIN_T 19  
#define PIN_L 20  

// Volatile variables for ISR-to-Main communication
volatile uint64_t t_r = 0, t_t = 0, t_l = 0;
volatile bool processing = false;

// Interrupt Service Routine
void gpio_callback(uint gpio, uint32_t events) {
    // Grab the 64-bit microsecond timestamp immediately
    uint64_t ts = time_us_64();

    // Only record if we aren't currently calculating a previous hit
    if (!processing) {
        if (gpio == PIN_R && t_r == 0) t_r = ts;
        else if (gpio == PIN_T && t_t == 0) t_t = ts;
        else if (gpio == PIN_L && t_l == 0) t_l = ts;
    }
}

int main() {
    // Initialize standard I/O (Serial over USB)
    stdio_init_all();

    uint pins[] = {PIN_R, PIN_T, PIN_L};

    for(int i = 0; i < 3; i++) {
        gpio_init(pins[i]);
        gpio_set_dir(pins[i], GPIO_IN);
        
        // Since you want to see if the pin is "hit" (logic 1), 
        // we use a Pull-Down to keep it at 0 when idle.
        gpio_pull_down(pins[i]); 

        // Set the interrupt to trigger on a RISING edge (0 to 1)
        gpio_set_irq_enabled_with_callback(pins[i], GPIO_IRQ_EDGE_RISE, true, &gpio_callback);
    }

    printf("RP2350 Triangulation System Online\n");
    printf("Waiting for sensor hits (Rising Edge)...\n");

    while (true) {
        // If any sensor has been triggered
        if (t_r > 0 || t_t > 0 || t_l > 0) {
            
            // Short window to allow other sensors to fire
            sleep_ms(20); 
            processing = true;

            int count = (t_r > 0) + (t_t > 0) + (t_l > 0);

            if (count > 0) {
                printf("--- Event Detected ---\n");
                if (t_r > 0) printf("Right Sensor: %llu us\n", t_r);
                if (t_t > 0) printf("Top Sensor:   %llu us\n", t_t);
                if (t_l > 0) printf("Left Sensor:  %llu us\n", t_l);
                
                // Simple Delta Analysis
                if (count == 3) {
                    int32_t deltaX = (int32_t)(t_l - t_r);
                    int32_t deltaY = (int32_t)(((t_l + t_r) / 2) - t_t);
                    printf("Result -> DeltaX: %d | DeltaY: %d\n", deltaX, deltaY);
                }
            }

            // Cooldown period to prevent double-triggering
            sleep_ms(500); 
            
            // Reset state
            t_r = 0; t_t = 0; t_l = 0;
            processing = false;
        }
        
        // Keeps the second core/background tasks happy
        tight_loop_contents();
    }

    return 0;
}