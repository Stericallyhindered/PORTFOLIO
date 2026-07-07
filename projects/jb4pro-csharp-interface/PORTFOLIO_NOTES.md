# JB4Pro C# Interface

Legacy Windows desktop interface for JB4Pro hardware communication.

## What To Review

- `Form1.Designer.cs` - WinForms UI surface for a hardware/tuning interface.
- `BGLib.cs` - Bluetooth/BLE support library code used by the interface.
- `SerialPortWatcher.cs` - serial port detection and monitoring.
- `JB4pro.csproj` - Windows desktop project structure and dependencies.

## Why It Matters

This is useful as historical context beside the newer Flutter JB4Pro work. It shows that the hardware/device interface work existed across desktop and mobile: serial/BLE communication, Windows UI, device discovery, and tuning-tool ergonomics.

## Public Snapshot Notes

Build artifacts, binaries, user files, and local IDE output were excluded before publishing.
