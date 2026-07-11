/*
ESP32-S3 Line Lock & RWD Control
For Waveshare ESP32-S3-Touch-LCD-1.28
*/

#include <BLEDevice.h>
#include <BLEUtils.h>
#include <BLEScan.h>
#include <BLEAdvertisedDevice.h>
#include <WiFi.h>
#include <Wire.h>
#include <SPI.h>
#include "CST816S.h"  // Touch controller in same directory

// BLE Relay Board configuration - Replace with your actual values
#define RELAY_BOARD_NAME "RelayBoard"
#define RELAY_SERVICE_UUID "0000xxxx-0000-1000-8000-00805f9b34fb"  // Replace with your service UUID
#define RELAY_CHAR_UUID    "0000yyyy-0000-1000-8000-00805f9b34fb"  // Replace with your characteristic UUID

// Display pin definitions
#define LCD_DC_PIN      8
#define LCD_CS_PIN      9
#define LCD_CLK_PIN     10
#define LCD_MOSI_PIN    11
#define LCD_MISO_PIN    12
#define LCD_RST_PIN     14
#define LCD_BL_PIN      2

// Display dimensions
#define LCD_WIDTH  240
#define LCD_HEIGHT 240

// Color definitions
#define COLOR_BLACK     0x0000
#define COLOR_WHITE     0xFFFF
#define COLOR_RED       0xF800
#define COLOR_GREEN     0x07E0
#define COLOR_BLUE      0x001F
#define COLOR_GRAY      0x7BEF
#define COLOR_DARKRED   0x3186  // Dark red for buttons
#define COLOR_ORANGE    0xFD20  // Orange accent
#define COLOR_LIGHTRED  0xF9A7  // Light red for gradients
#define COLOR_DARKGREEN 0x0400  // Dark green for gradients

// Display and UI dimensions
#define SCREEN_MARGIN 10
#define BUTTON_WIDTH 140
#define BUTTON_HEIGHT 50
#define BUTTON_RADIUS 5
#define LINE_LOCK_Y 60
#define RWD_Y 140

// Simulation mode
#define SIMULATION_MODE true  // Set to false when BLE board is ready

// Connection states
enum ConnectionType {
  CONNECTION_NONE,
  BLE,
  WIFI
};

// State variables
bool lineLockActive = false;
bool rwdModeActive = false;
bool awdModeActive = true;
unsigned long rwdActivationTime = 0;
const int BURNOUT_DELAY = 3000; // 3 second delay
ConnectionType activeConnection = CONNECTION_NONE;

// Initialize touch controller
CST816S touch(6, 7, 13, 5);  // sda, scl, rst, irq

// BLE scanning
BLEScan* pBLEScan;
const int scanTime = 5; // Seconds to scan for BLE devices

// BLE client and relay characteristic
BLEClient* pClient = nullptr;
BLERemoteCharacteristic* pRelayCharacteristic = nullptr;

// SPI instance for display
SPIClass * spi = NULL;

// Function declarations
void initBLE();
void initWiFi();
void scanForDevices();
bool connectToRelayBoard(BLEAdvertisedDevice advDevice);
void handleConnection();
void sendRelayCommand(bool lineLock, bool rwd);
void drawInterface();
void drawButton(int x, int y, const char* label, bool active);
void drawStatusIndicator(int y, const char* status, uint16_t color);
void drawConnectionStatus();
void handleTouch();

// Display functions
void LCD_Reset();
void LCD_SendCommand(uint8_t cmd);
void LCD_SendData(uint8_t data);
void LCD_SendData16(uint16_t data);
void LCD_Init();
void LCD_SetWindow(uint16_t Xstart, uint16_t Ystart, uint16_t Xend, uint16_t Yend);
void LCD_Clear(uint16_t Color);
void LCD_DisplayON();
void LCD_DisplayOFF();
void LCD_DrawRect(int16_t x, int16_t y, int16_t w, int16_t h, uint16_t color);
void LCD_FillRect(int16_t x, int16_t y, int16_t w, int16_t h, uint16_t color);
void LCD_DrawChar(int16_t x, int16_t y, char c, uint16_t color, uint16_t bg, uint8_t size);
void LCD_DrawText(int16_t x, int16_t y, const char* text, uint16_t color, uint16_t bg, uint8_t size);

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\nESP32-S3 Line Lock & RWD Control Starting...");
 
  // Initialize touch controller
  Serial.println("Initializing touch controller...");
  Wire.begin(6, 7);
  Wire.setClock(400000);
  
  pinMode(13, OUTPUT); // RST pin
  pinMode(5, INPUT);   // IRQ pin
  
  digitalWrite(13, LOW);
  delay(10);
  digitalWrite(13, HIGH);
  delay(50);
  
  touch.begin();
  Serial.println("Touch controller initialized");
  
  // Initialize display pins
  pinMode(LCD_DC_PIN, OUTPUT);
  pinMode(LCD_CS_PIN, OUTPUT);
  pinMode(LCD_RST_PIN, OUTPUT);
  pinMode(LCD_BL_PIN, OUTPUT);

  digitalWrite(LCD_CS_PIN, HIGH);
  digitalWrite(LCD_DC_PIN, HIGH);
  digitalWrite(LCD_BL_PIN, LOW); // Backlight off initially

  // Initialize SPI
  Serial.println("Initializing SPI...");
  spi = new SPIClass(FSPI);
  spi->begin(LCD_CLK_PIN, LCD_MISO_PIN, LCD_MOSI_PIN, -1);
  spi->beginTransaction(SPISettings(10000000, MSBFIRST, SPI_MODE0));

  // Initialize display
  Serial.println("Initializing display...");
  LCD_Init();
  LCD_DisplayON();
  
  // Turn on backlight
  Serial.println("Turning on backlight...");
  digitalWrite(LCD_BL_PIN, HIGH);
  
  if (!SIMULATION_MODE) {
    // Initialize wireless
    Serial.println("Initializing BLE...");
    initBLE();
    
    Serial.println("Initializing WiFi...");
    initWiFi();
    
    // Start device scanning
    Serial.println("Starting device scan...");
    scanForDevices();
  } else {
    Serial.println("Running in simulation mode - BLE disabled");
  }
  
  // Draw initial interface
  Serial.println("Drawing interface...");
  drawInterface();
  
  Serial.println("Setup complete!");
}

void loop() {
  handleTouch();
  
  if (!SIMULATION_MODE) {
    handleConnection();
    
    // Periodically scan for devices if not connected
    static unsigned long lastScan = 0;
    if (activeConnection == CONNECTION_NONE && (millis() - lastScan > 10000)) {
      scanForDevices();
      lastScan = millis();
    }
  }
  
  // Update interface periodically when in RWD mode to show countdown
  if (rwdModeActive && (millis() - rwdActivationTime < BURNOUT_DELAY)) {
    drawInterface();
  }
}

// Display Functions
void LCD_Reset() {
  digitalWrite(LCD_RST_PIN, HIGH);
  delay(100);
  digitalWrite(LCD_RST_PIN, LOW);
  delay(100);
  digitalWrite(LCD_RST_PIN, HIGH);
  delay(100);
}

void LCD_SendCommand(uint8_t cmd) {
  digitalWrite(LCD_DC_PIN, LOW);
  digitalWrite(LCD_CS_PIN, LOW);
  spi->transfer(cmd);
  digitalWrite(LCD_CS_PIN, HIGH);
}

void LCD_SendData(uint8_t data) {
  digitalWrite(LCD_DC_PIN, HIGH);
  digitalWrite(LCD_CS_PIN, LOW);
  spi->transfer(data);
  digitalWrite(LCD_CS_PIN, HIGH);
}

void LCD_SendData16(uint16_t data) {
  digitalWrite(LCD_DC_PIN, HIGH);
  digitalWrite(LCD_CS_PIN, LOW);
  spi->transfer16(data);
  digitalWrite(LCD_CS_PIN, HIGH);
}

void LCD_Init() {
  LCD_Reset();

  LCD_SendCommand(0xEF);
  LCD_SendCommand(0xEB);
  LCD_SendData(0x14);

  LCD_SendCommand(0xFE);
  LCD_SendCommand(0xEF);

  LCD_SendCommand(0xEB);
  LCD_SendData(0x14);

  LCD_SendCommand(0x84);
  LCD_SendData(0x40);

  LCD_SendCommand(0x85);
  LCD_SendData(0xFF);

  LCD_SendCommand(0x86);
  LCD_SendData(0xFF);

  LCD_SendCommand(0x87);
  LCD_SendData(0xFF);

  LCD_SendCommand(0x88);
  LCD_SendData(0x0A);

  LCD_SendCommand(0x89);
  LCD_SendData(0x21);

  LCD_SendCommand(0x8A);
  LCD_SendData(0x00);

  LCD_SendCommand(0x8B);
  LCD_SendData(0x80);

  LCD_SendCommand(0x8C);
  LCD_SendData(0x01);

  LCD_SendCommand(0x8D);
  LCD_SendData(0x01);

  LCD_SendCommand(0x8E);
  LCD_SendData(0xFF);

  LCD_SendCommand(0x8F);
  LCD_SendData(0xFF);

  LCD_SendCommand(0xB6);
  LCD_SendData(0x00);
  LCD_SendData(0x20);

  LCD_SendCommand(0x36);
  LCD_SendData(0x08);

  LCD_SendCommand(0x3A);
  LCD_SendData(0x05);

  LCD_SendCommand(0x90);
  LCD_SendData(0x08);
  LCD_SendData(0x08);
  LCD_SendData(0x08);
  LCD_SendData(0x08);

  LCD_SendCommand(0xBD);
  LCD_SendData(0x06);

  LCD_SendCommand(0xBC);
  LCD_SendData(0x00);

  LCD_SendCommand(0xFF);
  LCD_SendData(0x60);
  LCD_SendData(0x01);
  LCD_SendData(0x04);

  LCD_SendCommand(0xC3);
  LCD_SendData(0x13);
  LCD_SendCommand(0xC4);
  LCD_SendData(0x13);

  LCD_SendCommand(0xC9);
  LCD_SendData(0x22);

  LCD_SendCommand(0xBE);
  LCD_SendData(0x11);

  LCD_SendCommand(0xE1);
  LCD_SendData(0x10);
  LCD_SendData(0x0E);

  LCD_SendCommand(0xDF);
  LCD_SendData(0x21);
  LCD_SendData(0x0c);
  LCD_SendData(0x02);

  LCD_SendCommand(0xF0);
  LCD_SendData(0x45);
  LCD_SendData(0x09);
  LCD_SendData(0x08);
  LCD_SendData(0x08);
  LCD_SendData(0x26);
  LCD_SendData(0x2A);

  LCD_SendCommand(0xF1);
  LCD_SendData(0x43);
  LCD_SendData(0x70);
  LCD_SendData(0x72);
  LCD_SendData(0x36);
  LCD_SendData(0x37);
  LCD_SendData(0x6F);

  LCD_SendCommand(0xF2);
  LCD_SendData(0x45);
  LCD_SendData(0x09);
  LCD_SendData(0x08);
  LCD_SendData(0x08);
  LCD_SendData(0x26);
  LCD_SendData(0x2A);

  LCD_SendCommand(0xF3);
  LCD_SendData(0x43);
  LCD_SendData(0x70);
  LCD_SendData(0x72);
  LCD_SendData(0x36);
  LCD_SendData(0x37);
  LCD_SendData(0x6F);

  LCD_SendCommand(0xED);
  LCD_SendData(0x1B);
  LCD_SendData(0x0B);

  LCD_SendCommand(0xAE);
  LCD_SendData(0x77);

  LCD_SendCommand(0xCD);
  LCD_SendData(0x63);

  LCD_SendCommand(0x70);
  LCD_SendData(0x07);
  LCD_SendData(0x07);
  LCD_SendData(0x04);
  LCD_SendData(0x0E);
  LCD_SendData(0x0F);
  LCD_SendData(0x09);
  LCD_SendData(0x07);
  LCD_SendData(0x08);
  LCD_SendData(0x03);

  LCD_SendCommand(0xE8);
  LCD_SendData(0x34);

  LCD_SendCommand(0x62);
  LCD_SendData(0x18);
  LCD_SendData(0x0D);
  LCD_SendData(0x71);
  LCD_SendData(0xED);
  LCD_SendData(0x70);
  LCD_SendData(0x70);
  LCD_SendData(0x18);
  LCD_SendData(0x0F);
  LCD_SendData(0x71);
  LCD_SendData(0xEF);
  LCD_SendData(0x70);
  LCD_SendData(0x70);

  LCD_SendCommand(0x63);
  LCD_SendData(0x18);
  LCD_SendData(0x11);
  LCD_SendData(0x71);
  LCD_SendData(0xF1);
  LCD_SendData(0x70);
  LCD_SendData(0x70);
  LCD_SendData(0x18);
  LCD_SendData(0x13);
  LCD_SendData(0x71);
  LCD_SendData(0xF3);
  LCD_SendData(0x70);
  LCD_SendData(0x70);

  LCD_SendCommand(0x64);
  LCD_SendData(0x28);
  LCD_SendData(0x29);
  LCD_SendData(0xF1);
  LCD_SendData(0x01);
  LCD_SendData(0xF1);
  LCD_SendData(0x00);
  LCD_SendData(0x07);

  LCD_SendCommand(0x66);
  LCD_SendData(0x3C);
  LCD_SendData(0x00);
  LCD_SendData(0xCD);
  LCD_SendData(0x67);
  LCD_SendData(0x45);
  LCD_SendData(0x45);
  LCD_SendData(0x10);
  LCD_SendData(0x00);
  LCD_SendData(0x00);
  LCD_SendData(0x00);

  LCD_SendCommand(0x67);
  LCD_SendData(0x00);
  LCD_SendData(0x3C);
  LCD_SendData(0x00);
  LCD_SendData(0x00);
  LCD_SendData(0x00);
  LCD_SendData(0x01);
  LCD_SendData(0x54);
  LCD_SendData(0x10);
  LCD_SendData(0x32);
  LCD_SendData(0x98);

  LCD_SendCommand(0x74);
  LCD_SendData(0x10);
  LCD_SendData(0x85);
  LCD_SendData(0x80);
  LCD_SendData(0x00);
  LCD_SendData(0x00);
  LCD_SendData(0x4E);
  LCD_SendData(0x00);

  LCD_SendCommand(0x98);
  LCD_SendData(0x3e);
  LCD_SendData(0x07);

  LCD_SendCommand(0x35);
  LCD_SendCommand(0x21);

  LCD_SendCommand(0x11);
  delay(120);
  LCD_SendCommand(0x29);
  delay(20);
}

void LCD_SetWindow(uint16_t Xstart, uint16_t Ystart, uint16_t Xend, uint16_t Yend) {
  LCD_SendCommand(0x2A);
  LCD_SendData(Xstart >> 8);
  LCD_SendData(Xstart & 0xFF);
  LCD_SendData((Xend - 1) >> 8);
  LCD_SendData((Xend - 1) & 0xFF);

  LCD_SendCommand(0x2B);
  LCD_SendData(Ystart >> 8);
  LCD_SendData(Ystart & 0xFF);
  LCD_SendData((Yend - 1) >> 8);
  LCD_SendData((Yend - 1) & 0xFF);

  LCD_SendCommand(0x2C);
}

void LCD_Clear(uint16_t Color) {
  uint16_t i, j;
  LCD_SetWindow(0, 0, LCD_WIDTH, LCD_HEIGHT);
  digitalWrite(LCD_DC_PIN, HIGH);
  digitalWrite(LCD_CS_PIN, LOW);
  
  for(i = 0; i < LCD_WIDTH; i++) {
    for(j = 0; j < LCD_HEIGHT; j++) {
      spi->transfer16(Color);
    }
  }
  
  digitalWrite(LCD_CS_PIN, HIGH);
}

void LCD_DisplayON(void) {
  LCD_SendCommand(0x29);
}

void LCD_DisplayOFF(void) {
  LCD_SendCommand(0x28);
}

// Function to draw a single rounded corner
void LCD_DrawCorner(int16_t x, int16_t y, int16_t w, int16_t h, int16_t r, uint8_t corner, uint16_t color) {
  int16_t f = 1 - r;
  int16_t ddF_x = 1;
  int16_t ddF_y = -2 * r;
  int16_t xi = 0;
  int16_t yi = r;

  while (xi < yi) {
    if (f >= 0) {
      yi--;
      ddF_y += 2;
      f += ddF_y;
    }
    xi++;
    ddF_x += 2;
    f += ddF_x;

    if (corner & 0x1) { // Top left
      if (xi < yi) LCD_FillRect(x+r-yi, y+r-xi, 1, 1, color);
      if (yi > xi) LCD_FillRect(x+r-xi, y+r-yi, 1, 1, color);
    }
    if (corner & 0x2) { // Top right
      if (xi < yi) LCD_FillRect(x+w-r-1+yi, y+r-xi, 1, 1, color);
      if (yi > xi) LCD_FillRect(x+w-r-1+xi, y+r-yi, 1, 1, color);
    }
    if (corner & 0x4) { // Bottom right
      if (xi < yi) LCD_FillRect(x+w-r-1+yi, y+h-r-1+xi, 1, 1, color);
      if (yi > xi) LCD_FillRect(x+w-r-1+xi, y+h-r-1+yi, 1, 1, color);
    }
    if (corner & 0x8) { // Bottom left
      if (xi < yi) LCD_FillRect(x+r-yi, y+h-r-1+xi, 1, 1, color);
      if (yi > xi) LCD_FillRect(x+r-xi, y+h-r-1+yi, 1, 1, color);
    }
  }
}

// Draw a rounded rectangle outline
void LCD_DrawRoundRect(int16_t x, int16_t y, int16_t w, int16_t h, int16_t r, uint16_t color) {
  if (r > w/2 || r > h/2) r = min(w/2, h/2); // Ensure radius isn't too large
  
  // Draw straight edges
  LCD_FillRect(x+r, y, w-2*r, 1, color);         // Top
  LCD_FillRect(x+r, y+h-1, w-2*r, 1, color);     // Bottom
  LCD_FillRect(x, y+r, 1, h-2*r, color);         // Left
  LCD_FillRect(x+w-1, y+r, 1, h-2*r, color);     // Right
  
  // Draw corners
  LCD_DrawCorner(x, y, w, h, r, 0x1, color);     // Top left
  LCD_DrawCorner(x, y, w, h, r, 0x2, color);     // Top right
  LCD_DrawCorner(x, y, w, h, r, 0x4, color);     // Bottom right
  LCD_DrawCorner(x, y, w, h, r, 0x8, color);     // Bottom left
}

// Fill a rounded rectangle
void LCD_FillRoundRect(int16_t x, int16_t y, int16_t w, int16_t h, int16_t r, uint16_t color) {
  // Fill center
  LCD_FillRect(x+r, y, w-2*r, h, color);
  
  // Fill sides
  LCD_FillRect(x, y+r, r, h-2*r, color);
  LCD_FillRect(x+w-r, y+r, r, h-2*r, color);
  
  // Fill corners
  for(int16_t i = -r; i <= r; i++) {
    for(int16_t j = -r; j <= r; j++) {
      if((i*i + j*j) <= (r*r)) {
        LCD_FillRect(x+r+i, y+r+j, 1, 1, color);           // Top left
        LCD_FillRect(x+w-r-1-i, y+r+j, 1, 1, color);      // Top right
        LCD_FillRect(x+w-r-1-i, y+h-r-1-j, 1, 1, color);  // Bottom right
        LCD_FillRect(x+r+i, y+h-r-1-j, 1, 1, color);      // Bottom left
      }
    }
  }
}

void LCD_FillRect(int16_t x, int16_t y, int16_t w, int16_t h, uint16_t color) {
  LCD_SetWindow(x, y, x+w, y+h);
  digitalWrite(LCD_DC_PIN, HIGH);
  digitalWrite(LCD_CS_PIN, LOW);
  
  for(int16_t i = 0; i < w*h; i++) {
    spi->transfer16(color);
  }
  
  digitalWrite(LCD_CS_PIN, HIGH);
}

// Basic 5x7 font - ASCII characters from 0x20 (space) to 0x7E (~)
const uint8_t font5x7[] = {
    0x00, 0x00, 0x00, 0x00, 0x00,// (space)
    0x00, 0x00, 0x5F, 0x00, 0x00,// !
    0x00, 0x07, 0x00, 0x07, 0x00,// "
    0x14, 0x7F, 0x14, 0x7F, 0x14,// #
    0x24, 0x2A, 0x7F, 0x2A, 0x12,// $
    0x23, 0x13, 0x08, 0x64, 0x62,// %
    0x36, 0x49, 0x55, 0x22, 0x50,// &
    0x00, 0x05, 0x03, 0x00, 0x00,// '
    0x00, 0x1C, 0x22, 0x41, 0x00,// (
    0x00, 0x41, 0x22, 0x1C, 0x00,// )
    0x08, 0x2A, 0x1C, 0x2A, 0x08,// *
    0x08, 0x08, 0x3E, 0x08, 0x08,// +
    0x00, 0x50, 0x30, 0x00, 0x00,// ,
    0x08, 0x08, 0x08, 0x08, 0x08,// -
    0x00, 0x60, 0x60, 0x00, 0x00,// .
    0x20, 0x10, 0x08, 0x04, 0x02,// /
    0x3E, 0x51, 0x49, 0x45, 0x3E,// 0
    0x00, 0x42, 0x7F, 0x40, 0x00,// 1
    0x42, 0x61, 0x51, 0x49, 0x46,// 2
    0x21, 0x41, 0x45, 0x4B, 0x31,// 3
    0x18, 0x14, 0x12, 0x7F, 0x10,// 4
    0x27, 0x45, 0x45, 0x45, 0x39,// 5
    0x3C, 0x4A, 0x49, 0x49, 0x30,// 6
    0x01, 0x71, 0x09, 0x05, 0x03,// 7
    0x36, 0x49, 0x49, 0x49, 0x36,// 8
    0x06, 0x49, 0x49, 0x29, 0x1E,// 9
    0x00, 0x36, 0x36, 0x00, 0x00,// :
    0x00, 0x56, 0x36, 0x00, 0x00,// ;
    0x00, 0x08, 0x14, 0x22, 0x41,// <
    0x14, 0x14, 0x14, 0x14, 0x14,// =
    0x41, 0x22, 0x14, 0x08, 0x00,// >
    0x02, 0x01, 0x51, 0x09, 0x06,// ?
    0x32, 0x49, 0x79, 0x41, 0x3E,// @
    0x7E, 0x11, 0x11, 0x11, 0x7E,// A
    0x7F, 0x49, 0x49, 0x49, 0x36,// B
    0x3E, 0x41, 0x41, 0x41, 0x22,// C
    0x7F, 0x41, 0x41, 0x22, 0x1C,// D
    0x7F, 0x49, 0x49, 0x49, 0x41,// E
    0x7F, 0x09, 0x09, 0x01, 0x01,// F
    0x3E, 0x41, 0x41, 0x51, 0x32,// G
    0x7F, 0x08, 0x08, 0x08, 0x7F,// H
    0x00, 0x41, 0x7F, 0x41, 0x00,// I
    0x20, 0x40, 0x41, 0x3F, 0x01,// J
    0x7F, 0x08, 0x14, 0x22, 0x41,// K
    0x7F, 0x40, 0x40, 0x40, 0x40,// L
    0x7F, 0x02, 0x04, 0x02, 0x7F,// M
    0x7F, 0x04, 0x08, 0x10, 0x7F,// N
    0x3E, 0x41, 0x41, 0x41, 0x3E,// O
    0x7F, 0x09, 0x09, 0x09, 0x06,// P
    0x3E, 0x41, 0x51, 0x21, 0x5E,// Q
    0x7F, 0x09, 0x19, 0x29, 0x46,// R
    0x46, 0x49, 0x49, 0x49, 0x31,// S
    0x01, 0x01, 0x7F, 0x01, 0x01,// T
    0x3F, 0x40, 0x40, 0x40, 0x3F,// U
    0x1F, 0x20, 0x40, 0x20, 0x1F,// V
    0x7F, 0x20, 0x18, 0x20, 0x7F,// W
    0x63, 0x14, 0x08, 0x14, 0x63,// X
    0x03, 0x04, 0x78, 0x04, 0x03,// Y
    0x61, 0x51, 0x49, 0x45, 0x43,// Z
    0x00, 0x00, 0x7F, 0x41, 0x41,// [
    0x02, 0x04, 0x08, 0x10, 0x20,// "\"
    0x41, 0x41, 0x7F, 0x00, 0x00,// ]
    0x04, 0x02, 0x01, 0x02, 0x04,// ^
    0x40, 0x40, 0x40, 0x40, 0x40,// _
    0x00, 0x01, 0x02, 0x04, 0x00,// `
    0x20, 0x54, 0x54, 0x54, 0x78,// a
    0x7F, 0x48, 0x44, 0x44, 0x38,// b
    0x38, 0x44, 0x44, 0x44, 0x20,// c
    0x38, 0x44, 0x44, 0x48, 0x7F,// d
    0x38, 0x54, 0x54, 0x54, 0x18,// e
    0x08, 0x7E, 0x09, 0x01, 0x02,// f
    0x08, 0x14, 0x54, 0x54, 0x3C,// g
    0x7F, 0x08, 0x04, 0x04, 0x78,// h
    0x00, 0x44, 0x7D, 0x40, 0x00,// i
    0x20, 0x40, 0x44, 0x3D, 0x00,// j
    0x00, 0x7F, 0x10, 0x28, 0x44,// k
    0x00, 0x41, 0x7F, 0x40, 0x00,// l
    0x7C, 0x04, 0x18, 0x04, 0x78,// m
    0x7C, 0x08, 0x04, 0x04, 0x78,// n
    0x38, 0x44, 0x44, 0x44, 0x38,// o
    0x7C, 0x14, 0x14, 0x14, 0x08,// p
    0x08, 0x14, 0x14, 0x18, 0x7C,// q
    0x7C, 0x08, 0x04, 0x04, 0x08,// r
    0x48, 0x54, 0x54, 0x54, 0x20,// s
    0x04, 0x3F, 0x44, 0x40, 0x20,// t
    0x3C, 0x40, 0x40, 0x20, 0x7C,// u
    0x1C, 0x20, 0x40, 0x20, 0x1C,// v
    0x3C, 0x40, 0x30, 0x40, 0x3C,// w
    0x44, 0x28, 0x10, 0x28, 0x44,// x
    0x0C, 0x50, 0x50, 0x50, 0x3C,// y
    0x44, 0x64, 0x54, 0x4C, 0x44,// z
    0x00, 0x08, 0x36, 0x41, 0x00,// {
    0x00, 0x00, 0x7F, 0x00, 0x00,// |
    0x00, 0x41, 0x36, 0x08, 0x00,// }
    0x08, 0x08, 0x2A, 0x1C, 0x08,// ->
    0x08, 0x1C, 0x2A, 0x08, 0x08 // <-
};

void LCD_DrawChar(int16_t x, int16_t y, char c, uint16_t color, uint16_t bg, uint8_t size) {
  // Simple implementation for basic text
  LCD_FillRect(x, y, 6*size, 8*size, bg);
  if(c >= ' ') {
    for(int8_t i=0; i<5; i++) {
      uint8_t line = font5x7[(c-' ')*5 + i];
      for(int8_t j=0; j<8; j++) {
        if(line & 0x1) {
          LCD_FillRect(x+i*size, y+j*size, size, size, color);
        }
        line >>= 1;
      }
    }
  }
}

void LCD_DrawText(int16_t x, int16_t y, const char* text, uint16_t color, uint16_t bg, uint8_t size) {
  while(*text) {
    LCD_DrawChar(x, y, *text++, color, bg, size);
    x += 6*size;
  }
}

void drawButton(int x, int y, const char* label, bool active) {
  // Center the button horizontally
  x = LCD_WIDTH/2 - (BUTTON_WIDTH/2);
  
  // Draw button background with rounded corners
  LCD_FillRoundRect(x, y, BUTTON_WIDTH, BUTTON_HEIGHT, BUTTON_RADIUS, COLOR_DARKRED);
  
  // Draw button border
  LCD_DrawRoundRect(x, y, BUTTON_WIDTH, BUTTON_HEIGHT, BUTTON_RADIUS, active ? COLOR_GREEN : COLOR_RED);
  
  // Draw label
  int16_t textX = x + (BUTTON_WIDTH/2) - (strlen(label)*6*2/2);
  int16_t textY = y + (BUTTON_HEIGHT/2) - 8;
  LCD_DrawText(textX, textY, label, COLOR_WHITE, COLOR_DARKRED, 2);
}

void drawStatusIndicator(int y, const char* status, uint16_t color) {
  int x = LCD_WIDTH/2 - 40;
  
  // Draw status text only
  LCD_DrawText(x, y + BUTTON_HEIGHT + 5, status, COLOR_WHITE, COLOR_BLACK, 2);
}

void drawConnectionStatus() {
  String connStatus;
  uint16_t color;
  
  if (SIMULATION_MODE) {
    connStatus = "SIMULATION";
    color = COLOR_ORANGE;
  } else {
    switch(activeConnection) {
      case BLE:
        connStatus = "BLE Connected";
        color = COLOR_GREEN;
        break;
      case WIFI:
        connStatus = "WiFi Connected";
        color = COLOR_GREEN;
        break;
      default:
        connStatus = "Searching...";
        color = COLOR_RED;
    }
  }
  
  // Draw connection indicator with rounded corners
  LCD_FillRoundRect(LCD_WIDTH/2 - 40, 15, 10, 10, 2, color);
  LCD_DrawRoundRect(LCD_WIDTH/2 - 40, 15, 10, 10, 2, COLOR_WHITE);
  
  // Add highlight effect
  LCD_FillRect(LCD_WIDTH/2 - 39, 16, 4, 2, (color & 0xF7DE) + 0x0821);
  
  // Draw status text with shadow
  LCD_DrawText(LCD_WIDTH/2 - 19, 16, connStatus.c_str(), COLOR_BLACK, COLOR_BLACK, 1);
  LCD_DrawText(LCD_WIDTH/2 - 20, 15, connStatus.c_str(), COLOR_WHITE, COLOR_BLACK, 1);
}

void drawInterface() {
  // Clear screen
  LCD_Clear(COLOR_BLACK);
  
  // Draw Line Lock button and status
  drawButton(0, LINE_LOCK_Y, lineLockActive ? "LINE LOCK ON" : "LINE LOCK OFF", lineLockActive);
  
  // Draw RWD/AWD button and status
  drawButton(0, RWD_Y, rwdModeActive ? "RWD MODE" : "AWD MODE", true);
  
  // Draw status text at bottom
  const char* statusText;
  if (!lineLockActive && !rwdModeActive) {
    statusText = "Press brake + LINE LOCK";
  } else if (lineLockActive && !rwdModeActive) {
    statusText = "Stop completely for RWD";
  } else if (rwdModeActive) {
    unsigned long timeElapsed = millis() - rwdActivationTime;
    static char buf[20];
    if (timeElapsed < BURNOUT_DELAY) {
      sprintf(buf, "Wait %ds", (BURNOUT_DELAY - timeElapsed)/1000);
      statusText = buf;
    } else {
      statusText = "Ready for burnout";
    }
  }
  
  int16_t textX = LCD_WIDTH/2 - (strlen(statusText)*6)/2;
  LCD_DrawText(textX, 190, statusText, COLOR_WHITE, COLOR_BLACK, 1);
}

void initBLE() {
  if (SIMULATION_MODE) return;
  
  try {
    BLEDevice::init("ESP32_CONTROLLER");
    pBLEScan = BLEDevice::getScan();
    pBLEScan->setActiveScan(true);
    pBLEScan->setInterval(100);
    pBLEScan->setWindow(99);
  } catch (...) {
    Serial.println("Failed to initialize BLE - continuing in limited mode");
  }
}

void initWiFi() {
  if (SIMULATION_MODE) return;
  
  WiFi.mode(WIFI_STA);
  WiFi.disconnect();
  delay(100);
}

void scanForDevices() {
  if (SIMULATION_MODE || pBLEScan == nullptr) return;
  
  try {
    BLEScanResults* foundDevices = pBLEScan->start(scanTime, false);
    if (foundDevices != nullptr) {
      Serial.print("BLE Devices found: ");
      Serial.println(foundDevices->getCount());
      
      for (int i = 0; i < foundDevices->getCount(); i++) {
        BLEAdvertisedDevice advDevice = foundDevices->getDevice(i);
        if (advDevice.getName() == RELAY_BOARD_NAME) {
          Serial.println("Relay Board found, attempting to connect...");
          if (connectToRelayBoard(advDevice)) {
            activeConnection = BLE;
            Serial.println("Connected to Relay Board");
            break;
          }
        }
      }
      pBLEScan->clearResults();
      delete foundDevices;
    }
  } catch (...) {
    Serial.println("Error during BLE scan - continuing in limited mode");
  }
}

bool connectToRelayBoard(BLEAdvertisedDevice advDevice) {
  if (SIMULATION_MODE) return false;
  
  try {
    pClient = BLEDevice::createClient();
    Serial.println("Connecting to Relay Board...");
    pClient->connect(&advDevice);
    if (pClient->isConnected()) {
      BLERemoteService* pRemoteService = pClient->getService(RELAY_SERVICE_UUID);
      if (pRemoteService == nullptr) {
        Serial.println("Failed to find relay service UUID");
        pClient->disconnect();
        return false;
      }
      pRelayCharacteristic = pRemoteService->getCharacteristic(RELAY_CHAR_UUID);
      if (pRelayCharacteristic == nullptr) {
        Serial.println("Failed to find relay characteristic UUID");
        pClient->disconnect();
        return false;
      }
      return true;
    }
  } catch (...) {
    Serial.println("Error connecting to relay board - continuing in limited mode");
  }
  return false;
}

void handleConnection() {
  if (!SIMULATION_MODE && activeConnection == BLE) {
    if (pClient && !pClient->isConnected()) {
      Serial.println("Lost BLE connection");
      activeConnection = CONNECTION_NONE;
      pRelayCharacteristic = nullptr;
      pClient = nullptr;
    }
  }
}

void sendRelayCommand(bool lineLock, bool rwd) {
  if (SIMULATION_MODE) {
    Serial.println("SIMULATION: Sending relay commands");
    Serial.printf("Line Lock: %s\n", lineLock ? "ON" : "OFF");
    Serial.printf("RWD Mode: %s\n", rwd ? "ON" : "OFF");
    return;
  }
  
  if (activeConnection == CONNECTION_NONE || pRelayCharacteristic == nullptr) return;
  
  // Relay 1 (Line Lock)
  uint8_t cmd1[4];
  if (lineLock) {
    cmd1[0] = 0xA0; cmd1[1] = 0x01; cmd1[2] = 0x01; cmd1[3] = 0xA2;
  } else {
    cmd1[0] = 0xA0; cmd1[1] = 0x01; cmd1[2] = 0x00; cmd1[3] = 0xA1;
  }
  
  // Relay 2 (RWD Mode)
  uint8_t cmd2[4];
  if (rwd) {
    cmd2[0] = 0xA0; cmd2[1] = 0x02; cmd2[2] = 0x01; cmd2[3] = 0xA3;
  } else {
    cmd2[0] = 0xA0; cmd2[1] = 0x02; cmd2[2] = 0x00; cmd2[3] = 0xA2;
  }
  
  pRelayCharacteristic->writeValue(cmd1, 4);
  delay(50);
  pRelayCharacteristic->writeValue(cmd2, 4);
  
  Serial.print("Sent BLE command for Line Lock: ");
  for (int i = 0; i < 4; i++) {
    Serial.printf("%02X ", cmd1[i]);
  }
  Serial.println();
  
  Serial.print("Sent BLE command for RWD: ");
  for (int i = 0; i < 4; i++) {
    Serial.printf("%02X ", cmd2[i]);
  }
  Serial.println();
}

// State variables for touch handling
static unsigned long lastTouchTime = 0;
const unsigned long TOUCH_DEBOUNCE = 25; // 25ms debounce

void handleTouch() {
  if (touch.available()) {
    unsigned long currentTime = millis();
    if (currentTime - lastTouchTime < TOUCH_DEBOUNCE) {
      return; // Debounce - ignore touches too close together
    }
    lastTouchTime = currentTime;
    
    uint16_t t_x = touch.data.x;
    uint16_t t_y = touch.data.y;
    
    // Convert touch coordinates to screen coordinates
    t_x = map(t_x, 0, 240, 0, LCD_WIDTH);
    t_y = map(t_y, 0, 240, 0, LCD_HEIGHT);
    
    // Check LINE LOCK button
    if (t_y >= LINE_LOCK_Y - 10 && t_y <= (LINE_LOCK_Y + BUTTON_HEIGHT + 10) &&
        t_x >= (LCD_WIDTH/2 - BUTTON_WIDTH/2) && t_x <= (LCD_WIDTH/2 + BUTTON_WIDTH/2)) {
      lineLockActive = !lineLockActive;
      if (!lineLockActive) {
        rwdModeActive = false;
        awdModeActive = true;
      }
      sendRelayCommand(lineLockActive, rwdModeActive);
    }
    
    // Check RWD/AWD button
    if (t_y >= RWD_Y - 10 && t_y <= (RWD_Y + BUTTON_HEIGHT + 10) &&
        t_x >= (LCD_WIDTH/2 - BUTTON_WIDTH/2) && t_x <= (LCD_WIDTH/2 + BUTTON_WIDTH/2)) {
      if (lineLockActive) {
        rwdModeActive = !rwdModeActive;
        awdModeActive = !rwdModeActive;
        if (rwdModeActive) {
          rwdActivationTime = millis();
        }
        sendRelayCommand(lineLockActive, rwdModeActive);
      }
    }
    
    drawInterface();
  }
}
