@echo off
echo ========================================
echo   ImageTools Launcher (Windows)
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% == 0 (
    echo [OK] Python detected
    python --version
    echo.
    echo Starting HTTP server...
    echo.
    echo Server: http://localhost:8326
    echo Press Ctrl+C to stop
    echo ========================================
    echo.
    cd /d "%~dp0"
    python -m http.server 8326
) else (
    echo [FAIL] Python not detected
    echo.
    echo ========================================
    echo   Cannot start HTTP server
    echo ========================================
    echo.
    echo You can double-click index.html to open
    echo.
    echo Limited features without Python:
    echo   - Clipboard paste (Ctrl+V)
    echo   - Some file upload features
    echo   - Cross-origin features
    echo.
    echo To install Python:
    echo   1. Visit https://www.python.org/downloads/
    echo   2. Download and install Python 3.x
    echo   3. Re-run this script
    echo.
    echo Press any key to open index.html...
    pause >nul
    start "" "%~dp0index.html"
)