#include <stdint.h>
#include <stdio.h>
#include <stdbool.h>

// ---------------------------------------------------------
// 1. MOCK HARDWARE REGISTERS 
// (Replace these with your MCU's actual device header files)
// ---------------------------------------------------------
#define ADC_BASE_ADDR       0x40012000
// Volatile is mandatory here. It tells the compiler: "The hardware 
// can change this memory address at any time, do not optimize this read."
#define ADC_DATA_REG        (*((volatile uint32_t *)(ADC_BASE_ADDR + 0x4C)))
#define ADC_CONTROL_REG     (*((volatile uint32_t *)(ADC_BASE_ADDR + 0x04)))
#define ADC_STATUS_REG      (*((volatile uint32_t *)(ADC_BASE_ADDR + 0x00)))

// ---------------------------------------------------------
// 2. GLOBAL VARIABLES
// ---------------------------------------------------------
// Volatile because it is modified inside the ISR and read in main
volatile uint16_t latest_adc_sample = 0;
volatile bool new_data_available = false;

// ---------------------------------------------------------
// 3. HARDWARE SETUP
// ---------------------------------------------------------
void init_free_running_adc(void) {
    // 1. Enable peripheral clock for the ADC (MCU specific)
    
    // 2. Configure ADC for Continuous Conversion Mode / Free-Running
    // This typically involves setting a specific bit in a control register.
    ADC_CONTROL_REG |= (1 << 1); // Example: Set "CONT" bit
    
    // 3. Enable ADC Interrupts 
    // You want the hardware to tell the CPU exactly when a conversion finishes.
    ADC_CONTROL_REG |= (1 << 5); // Example: Set "EOCIE" (End of Conv Interrupt Enable) bit
    
    // 4. Start the first conversion to kick off the free-running loop
    ADC_CONTROL_REG |= (1 << 0); // Example: Set "START" bit
}

// ---------------------------------------------------------
// 4. INTERRUPT SERVICE ROUTINE (ISR)
// ---------------------------------------------------------
// This function is called automatically by the hardware 
// every time the ADC finishes reading a sample.
void ADC_IRQHandler(void) {
    // 1. Clear the interrupt flag so it doesn't trigger infinitely
    ADC_STATUS_REG &= ~(1 << 1); // Example: Clear "EOC" flag
    
    // 2. Read the raw register data 
    // (Masking with 0xFFF assumes a 12-bit ADC: 0 to 4095)
    latest_adc_sample = (ADC_DATA_REG & 0xFFF); 
    
    // 3. Set a flag to tell the main loop we have new data
    new_data_available = true;
    
    // NOTE: In a real TDOA paddle project, you would store this in a 
    // circular array/buffer here instead of a single variable, so you 
    // can capture the entire acoustic waveform.
}

// ---------------------------------------------------------
// 5. MAIN LOOP
// ---------------------------------------------------------
int main(void) {
    // System initialization (Clocks, UART for printf, etc.)
    // system_init();
    // uart_init(115200); 

    init_free_running_adc();

    printf("ADC Initialized. Starting free-running capture...\n");

    while (1) {
        // Check if the ISR has handed us new data
        if (new_data_available) {
            
            // Disable interrupts briefly while we copy the volatile variable.
            // This prevents the ISR from overwriting the variable while 
            // we are in the middle of reading it (Race Condition).
            // __disable_irq(); // MCU specific macro
            uint16_t sample_to_print = latest_adc_sample;
            new_data_available = false;
            // __enable_irq();  // MCU specific macro
            
            // Now it is safe to do the slow process of printing
            printf("Raw ADC Register Value: %u\n", sample_to_print);
            
            // Optional: Convert raw 12-bit reading to actual Voltage (assuming 3.3V reference)
            // float voltage = ((float)sample_to_print / 4095.0f) * 3.3f;
            // printf("Voltage: %.3f V\n", voltage);
        }
        
        // The CPU can do other tasks here while the ADC hardware 
        // handles the next sample in the background.
    }
    
    return 0;
}