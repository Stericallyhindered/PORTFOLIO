/*
 * ESP32-S3 GC9A01 Display Test - Simplified Version
 */

#include <SPI.h>
#include <Wire.h>

// Pin definitions
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

// SPI instance
SPIClass * spi = NULL;

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\nESP32-S3 GC9A01 Display Test Starting...");
  
  // Initialize pins
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
  spi->begin(LCD_CLK_PIN, LCD_MISO_PIN, LCD_MOSI_PIN, LCD_CS_PIN);
  spi->beginTransaction(SPISettings(27000000, MSBFIRST, SPI_MODE0));

  // Initialize display
  Serial.println("Initializing display...");
  LCD_Init();
  
  // Turn on backlight
  Serial.println("Turning on backlight...");
  digitalWrite(LCD_BL_PIN, HIGH);

  // Test display
  Serial.println("Testing display with colors...");
  
  // Test pattern 1: Solid colors
  LCD_Clear(COLOR_RED);
  Serial.println("Displaying RED");
  delay(2000);
  
  LCD_Clear(COLOR_GREEN);
  Serial.println("Displaying GREEN");
  delay(2000);
  
  LCD_Clear(COLOR_BLUE);
  Serial.println("Displaying BLUE");
  delay(2000);
  
  LCD_Clear(COLOR_BLACK);
  Serial.println("Displaying BLACK");
  delay(2000);
  
  LCD_Clear(COLOR_WHITE);
  Serial.println("Displaying WHITE");
  delay(2000);

  Serial.println("Test complete!");
}

void loop() {
  delay(1000);
}

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

void LCD_Init() {
  LCD_Reset();

  // Sleep out
  LCD_SendCommand(0x11);
  delay(120);

  // Display Inversion ON
  LCD_SendCommand(0x21);

  // Memory access control
  LCD_SendCommand(0x36);
  LCD_SendData(0x00);  // Normal orientation

  // JLX240 display initialization sequence
  LCD_SendCommand(0x3A);
  LCD_SendData(0x05);  // 65K RGB

  // Display ON
  LCD_SendCommand(0x29);
  delay(20);
}

void LCD_SetWindow(uint16_t Xstart, uint16_t Ystart, uint16_t Xend, uint16_t Yend) {
  // Column address set
  LCD_SendCommand(0x2A);
  LCD_SendData(Xstart >> 8);
  LCD_SendData(Xstart & 0xFF);
  LCD_SendData((Xend - 1) >> 8);
  LCD_SendData((Xend - 1) & 0xFF);

  // Row address set
  LCD_SendCommand(0x2B);
  LCD_SendData(Ystart >> 8);
  LCD_SendData(Ystart & 0xFF);
  LCD_SendData((Yend - 1) >> 8);
  LCD_SendData((Yend - 1) & 0xFF);

  // Memory write
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
