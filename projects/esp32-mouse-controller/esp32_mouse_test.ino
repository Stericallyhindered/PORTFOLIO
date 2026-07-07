/*
 * ESP32-S3 HID Mouse Test
 * Super minimal test to verify USB HID mouse enumeration
 * 
 * This sketch will:
 * - Enumerate as USB HID mouse device
 * - Continuously move cursor down slowly
 * - Flash onboard LED to show it's working
 * 
 * Upload this, then check Device Manager (Windows) or 
 * watch your cursor move down automatically
 */

#include "USB.h"
#include "USBHIDMouse.h"

USBHIDMouse mouse;

// LED pin for ESP32-S3 DevKit C1
#define LED_PIN 2  // Built-in LED (adjust for your board)

void setup() {
  // Initialize USB HID mouse
  USB.begin();
  mouse.begin();
  
  // Setup LED
  pinMode(LED_PIN, OUTPUT);
  
  // Flash LED to show startup
  for(int i = 0; i < 3; i++) {
    digitalWrite(LED_PIN, HIGH);
    delay(200);
    digitalWrite(LED_PIN, LOW);
    delay(200);
  }
  
  // Wait a moment for USB enumeration
  delay(1000);
}

void loop() {
  // Move mouse down slowly (2 pixels every 100ms)
  mouse.move(0, 2);
  
  // Flash LED to show activity
  digitalWrite(LED_PIN, HIGH);
  delay(50);
  digitalWrite(LED_PIN, LOW);
  
  delay(100);  // Total cycle: 150ms
}
