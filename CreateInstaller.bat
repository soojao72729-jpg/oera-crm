@echo off
echo ==========================================
echo    OERA SALES CRM - INSTALLER BUILDER
echo ==========================================
echo.
echo Checking for Node.js...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed! 
    echo Please install it from https://nodejs.org/ first.
    pause
    exit /b
)

echo [1/3] Installing Desktop Engine (Electron)...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Installation failed. Check your internet connection.
    pause
    exit /b
)

echo [2/3] Confirming Software Status...
echo Software will open for a second, please close it to continue building.
call npm start

echo [3/3] Creating Final Installer (.exe)...
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Build failed.
    pause
    exit /b
)

echo.
echo ==========================================
echo    SUCCESS! Installer created in 'dist' folder.
echo ==========================================
pause
