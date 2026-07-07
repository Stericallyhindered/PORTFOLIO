# ESP32-S3 Mouse Controller

A configurable USB HID mouse controller using ESP32-S3 DevKit with Python GUI for real-time configuration.

## Features

- **ESP32-S3 USB HID Mouse**: Acts as a USB mouse device
- **Configurable Speed**: Adjustable pixels per move (1-127)
- **Configurable Delay**: Adjustable delay between moves (1-1000ms)
- **Real-time Control**: Start/stop dragging via Python GUI
- **Serial Communication**: ESP32 receives commands over USB serial
- **Modern GUI**: PyQt5 interface with dark theme

## Hardware Requirements

- ESP32-S3 DevKit C1 (or compatible ESP32-S3 board)
- USB cable for programming and power
- Computer with USB port

## Software Requirements

### ESP32-S3 Arduino IDE Setup

1. Install Arduino IDE (1.8.19 or 2.x)
2. Add ESP32 board support:
   - File → Preferences → Additional Board Manager URLs
   - Add: `https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json`
3. Tools → Board → Boards Manager → Search "ESP32" → Install "esp32 by Espressif Systems"
4. Select Board: "ESP32S3 Dev Module"
5. USB CDC On Boot: "Enabled"
6. USB Mode: "Hardware CDC and JTAG"

### Python Requirements

```bash
pip install -r requirements.txt
```

## Installation & Usage

### 1. Flash ESP32-S3

1. Connect ESP32-S3 to computer via USB
2. Open `esp32_mouse_controller.ino` in Arduino IDE
3. Select correct board and port
4. Upload the sketch

### 2. Run Python GUI

```bash
python mouse_controller_gui.py
```

### 3. Connect and Configure

1. In the GUI, select the ESP32-S3 serial port from dropdown
2. Click "Connect" to establish communication
3. Adjust speed and delay settings using sliders/spinboxes
4. Click "START DRAG" to begin downward mouse movement
5. Click "STOP DRAG" to stop

## How It Works

### ESP32-S3 Side
- Uses TinyUSB library for USB HID mouse functionality
- Listens for serial commands over USB CDC
- Sends HID mouse reports to move cursor down
- Maintains left mouse button state during drag

### Python GUI Side
- Provides real-time configuration interface
- Communicates with ESP32 over serial
- Sends commands: SPEED, DELAY, START, STOP
- Displays status and log messages

## Commands

The ESP32 accepts these serial commands:

- `SPEED <value>` - Set pixels per move (1-127)
- `DELAY <value>` - Set delay between moves in ms (1-1000)
- `START` - Begin downward drag
- `STOP` - Stop dragging
- `STATUS` - Show current settings

## Configuration

### Speed Control
- **Range**: 1-127 pixels per move
- **Default**: 2 pixels
- **Higher values**: Faster movement
- **Lower values**: Smoother movement

### Delay Control
- **Range**: 1-1000ms between moves
- **Default**: 10ms
- **Lower values**: Faster updates
- **Higher values**: Slower, more controlled movement

## Troubleshooting

### ESP32 Not Detected
- Check USB cable (data cable, not just power)
- Install ESP32 drivers if needed
- Try different USB port
- Press and hold BOOT button while connecting

### GUI Connection Issues
- Ensure ESP32 is flashed with the correct sketch
- Check that USB CDC is enabled in Arduino IDE
- Try different baud rate (default: 115200)
- Restart both ESP32 and GUI

### Mouse Not Moving
- Check that ESP32 is recognized as USB HID device
- Verify serial communication in GUI log
- Ensure START command was sent successfully
- Check Windows/macOS/Linux HID device permissions

## Safety Notes

- This tool can control your system cursor
- Use responsibly and only on your own systems
- Some antivirus software may flag automated mouse input
- Test in a safe environment first

## License

MIT License - Use at your own risk
