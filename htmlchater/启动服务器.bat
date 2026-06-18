@echo off
chcp 65001 >nul
title LLM Chat 本地服务器

cd /d "%~dp0"

echo ========================================
echo   LLM Chat 本地服务器
echo ========================================
echo.

set PORT=8000

where python >nul 2>nul
if %errorlevel%==0 (
    goto :start_python
)

where py >nul 2>nul
if %errorlevel%==0 (
    goto :start_python
)

echo [错误] 未检测到 Python！
echo.
echo 请安装 Python 后再运行此脚本:
echo   https://www.python.org/downloads/
echo.
echo 安装时请勾选 "Add Python to PATH"
echo.
pause
exit /b 1

:start_python
echo.
echo 服务器启动中...
echo.
echo ========================================
echo   启动成功！
echo.
echo   请在浏览器中打开:
echo   http://localhost:%PORT%/chat.html
echo ========================================
echo.
echo 按 Ctrl+C 停止服务器
echo.

python -m http.server %PORT% 2>nul || py -m http.server %PORT%

echo.
echo 服务器已停止。
pause
