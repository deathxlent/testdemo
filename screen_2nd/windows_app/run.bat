@echo off
chcp 65001
echo ========================================
echo 第二屏幕 - Windows应用
echo ========================================
echo.

cd /d "%~dp0"

echo 正在检查Python环境...
python --version >nul 2>&1
if errorlevel 1 (
    echo [错误] 未找到Python，请先安装Python 3.9+
    echo 下载地址: https://www.python.org/downloads/
    pause
    exit /b 1
)

echo 正在检查依赖...
python -c "import PyQt6" >nul 2>&1
if errorlevel 1 (
    echo [提示] 正在安装依赖...
    pip install -r requirements.txt
)

echo 正在启动程序...
python main.py

if errorlevel 1 (
    echo.
    echo 程序异常退出，请查看上面的错误信息
    pause
)
