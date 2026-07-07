#include "USB.h"
#include "USBHIDMouse.h"
#include "Adafruit_NeoPixel.h"

USBHIDMouse mouse;

// Built-in RGB LED on ESP32-S3 DevKit C1 (WS2812 on GPIO48)
#define LED_PIN    48
#define LED_COUNT  1
Adafruit_NeoPixel pixels(LED_COUNT, LED_PIN, NEO_GRB + NEO_KHZ800);

// Configuration variables
int moveSpeed = 2;        // pixels per move
int moveDelay = 10;       // delay between moves in ms
bool isActive = false;    // whether dragging is active
bool leftButtonPressed = false;
bool wasLeftButtonPressed = false;  // Track previous button state

// Non-blocking timing
unsigned long lastMoveTime = 0;

// Serial communication
String inputString = "";
bool stringComplete = false;

void setup() {
  // Initialize USB CDC (Serial) first
  Serial.begin(115200);
  
  // Wait for serial to be ready
  while (!Serial) {
    delay(10);
  }
  
  // Initialize USB HID Mouse
  USB.begin();
  mouse.begin();
  
  // Initialize NeoPixel LED
  pixels.begin();
  pixels.setBrightness(50);  // Set brightness (0-255)
  
  // Initialize LED (all off)
  setLED(0, 0, 0);
  
  // Wait a moment for USB enumeration
  delay(1000);
  
  Serial.println("ESP32-S3 Mouse Controller Ready");
  Serial.println("Commands:");
  Serial.println("SPEED <value> - Set pixels per move (1-127)");
  Serial.println("DELAY <value> - Set delay between moves in ms (1-1000)");
  Serial.println("ENABLE - Enable recoil compensation");
  Serial.println("DISABLE - Disable recoil compensation");
  Serial.println("STATUS - Show current settings");
  Serial.println("Note: Use Python GUI to control recoil compensation");
  
  // Flash blue LED to indicate ready
  setLED(0, 0, 255);
  delay(500);
  setLED(0, 0, 0);
  
  // Send ready message
  Serial.println("System ready - waiting for commands");
}

void loop() {
  // Handle serial commands (non-blocking)
  if (stringComplete) {
    processCommand(inputString);
    inputString = "";
    stringComplete = false;
  }
  
  // Recoil compensation is controlled via serial commands from Python GUI
  // The GUI monitors the real mouse and sends ENABLE/DISABLE commands
  
  // If active (recoil compensation enabled), apply downward movement
  if (isActive) {
    // Check if it's time for the next recoil compensation move
    if (millis() - lastMoveTime >= moveDelay) {
      mouse.move(0, moveSpeed);  // Move down to counteract recoil
      lastMoveTime = millis();
    }
    
    // Red LED indicates active recoil compensation
    setLED(255, 0, 0);
  } else {
    // Green LED indicates ready/idle
    setLED(0, 255, 0);
  }
  
  // Small delay to prevent overwhelming the system
  delay(1);
}

void serialEvent() {
  while (Serial.available()) {
    char inChar = (char)Serial.read();
    if (inChar == '\n') {
      stringComplete = true;
    } else {
      inputString += inChar;
    }
  }
}

void processCommand(String command) {
  command.trim();
  command.toUpperCase();
  
  if (command.startsWith("SPEED ")) {
    int speed = command.substring(6).toInt();
    if (speed >= 1 && speed <= 127) {
      moveSpeed = speed;
      Serial.print("Speed set to: ");
      Serial.println(moveSpeed);
    } else {
      Serial.println("Error: Speed must be between 1-127");
    }
  }
  else if (command.startsWith("DELAY ")) {
    int delay = command.substring(6).toInt();
    if (delay >= 1 && delay <= 1000) {
      moveDelay = delay;
      Serial.print("Delay set to: ");
      Serial.println(moveDelay);
    } else {
      Serial.println("Error: Delay must be between 1-1000ms");
    }
  }
  else if (command == "ENABLE") {
    isActive = true;
    Serial.println("Recoil compensation enabled");
    Serial.println("Mouse will move down continuously");
    // Flash red LED to indicate enabled
    setLED(255, 0, 0);
    delay(100);
  }
  else if (command == "DISABLE") {
    isActive = false;
    Serial.println("Recoil compensation disabled");
    Serial.println("Mouse movement stopped");
    // Flash green LED to indicate disabled
    setLED(0, 255, 0);
    delay(100);
  }
  else if (command == "STATUS") {
    Serial.print("Current settings - Speed: ");
    Serial.print(moveSpeed);
    Serial.print(", Delay: ");
    Serial.print(moveDelay);
    Serial.print("ms, Active: ");
    Serial.println(isActive ? "YES" : "NO");
  }
  else {
    Serial.println("Unknown command. Use SPEED, DELAY, ENABLE, DISABLE, or STATUS");
  }
}

// LED control function using NeoPixel
void setLED(int red, int green, int blue) {
  pixels.setPixelColor(0, pixels.Color(red, green, blue));
  pixels.show();
}
