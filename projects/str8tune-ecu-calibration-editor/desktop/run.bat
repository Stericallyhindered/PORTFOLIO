@echo off
setlocal

where py >nul 2>nul
if errorlevel 1 (
  echo Python launcher not found.
  echo Install Python 3 for Windows first, then run this again.
  pause
  exit /b 1
)

py app.py
