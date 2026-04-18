#include <stdint.h>

// The packed attribute tells the compiler: "Do NOT add padding bytes"
typedef struct __attribute__((packed)) {
    uint16_t packet_id;       // 2 bytes - To catch dropped packets
    uint32_t packet_timestamp_us;    // 4 bytes - Microsecond timing
    uint64_t impact_timestamp; // 8 bytes - Array for your 4 sensor timings
    uint16_t battery_mv;      // 2 bytes - System status
    uint8_t heartrate_BPM;     // 1 byte for heartrate, if greater than or equal, flag as dangerous in dashboard
    uint8_t o2_percentage;  //1 byte, self explanatory, calculated on ESP
    uint8_t posX_cm;
    uint8_t posY_cm
} BlePayload;                 // Total = 18 bytes

int main(){

    return 0;
}