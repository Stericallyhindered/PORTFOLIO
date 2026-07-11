# vehicle-touch-input-controller

Arduino hardware-input project using a CST816S capacitive touch controller. This snapshot shows low-level touch input handling, gesture/coordinate processing, and simple embedded control code that can be adapted for vehicle or hardware UI experiments.

## What It Shows

- Arduino firmware for touchpad-driven hardware input.
- CST816S touch controller integration in C++.
- Compact embedded code that separates driver behavior from sketch-level application logic.
- A smaller hardware example that complements the larger vehicle and BLE projects.

## Key Files

- `blake.ino` - main Arduino sketch with the fuller hardware behavior.
- `blake_simple.ino` - simplified sketch useful for review and bring-up.
- `CST816S.cpp` - touch controller implementation.
- `CST816S.h` - touch controller interface and data definitions.

## Portfolio Notes

This is a sanitized source snapshot for portfolio review. Archive files and local editor workspace files were intentionally excluded.
