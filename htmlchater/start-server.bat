@echo off
title LLM Chat Local Server
cd /d "%~dp0"

echo ========================================
echo   LLM Chat Local Server
echo ========================================
echo.

where python >nul 2>nul
if %errorlevel%==0 (
    goto start_server
)

where py >nul 2>nul
if %errorlevel%==0 (
    goto start_server
)

echo [ERROR] Python not found!
echo.
echo Please install Python from:
echo   https://www.python.org/downloads/
echo.
echo Make sure to check "Add Python to PATH" during installation.
echo.
pause
exit /b 1

:start_server
echo.
echo Starting server...
echo.
echo ========================================
echo   Server started successfully!
echo.
echo   Open this URL in your browser:
echo   http://localhost:8000/chat.html
echo ========================================
echo.
echo Press Ctrl+C to stop the server.
echo.

python -m http.server 9740 2>nul
if errorlevel 1 (
    py -m http.server 9740
)

echo.
echo Server stopped.
pause
