@echo off
echo ====================================
echo Bass Clown Co - Local Setup Script
echo ====================================
echo.

echo Step 1: Installing dependencies...
call bun install
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo Step 2: Checking for .env.local...
if not exist .env.local (
    echo .env.local not found. Creating from .env.example...
    copy .env.example .env.local
    echo.
    echo IMPORTANT: Please edit .env.local and add your DATABASE_URL and other credentials
    echo Press any key to continue after you've edited .env.local...
    pause >nul
) else (
    echo .env.local already exists
)

echo.
echo Step 3: Setting up database...
call bun run create-admin
if errorlevel 1 (
    echo ERROR: Database setup failed. Please check your DATABASE_URL in .env.local
    pause
    exit /b 1
)

echo.
echo ====================================
echo Setup Complete!
echo ====================================
echo.
echo To start the development server, run:
echo   bun dev
echo.
echo Then open http://localhost:3000 in your browser
echo.
echo Default admin login:
echo   Email: david@solheim.tech
echo   Password: bassclown25
echo.
pause

