@echo off
cd /d "%~dp0"
pythonw main.py 2>nul || python main.py
