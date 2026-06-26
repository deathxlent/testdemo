#!/bin/bash

echo "========================================"
echo "  ImageTools 启动脚本 (macOS/Linux)"
echo "========================================"
echo ""

# 检查 Python3
if command -v python3 &> /dev/null; then
    echo "[√] 检测到 Python3"
    python3 --version
    echo ""
    echo "正在启动 HTTP 服务器..."
    echo ""
    echo "服务器地址: http://localhost:8326"
    echo "按 Ctrl+C 停止服务器"
    echo "========================================"
    echo ""
    cd "$(dirname "$0")"
    python3 -m http.server 8326
else
    # 检查 Python 2
    if command -v python &> /dev/null; then
        echo "[√] 检测到 Python 2"
        python --version
        echo ""
        echo "正在启动 HTTP 服务器..."
        echo ""
        echo "服务器地址: http://localhost:8326"
        echo "按 Ctrl+C 停止服务器"
        echo "========================================"
        echo ""
        cd "$(dirname "$0")"
        python -m SimpleHTTPServer 8326
    else
        echo "[×] 未检测到 Python"
        echo ""
        echo "========================================"
        echo "  无法启动 HTTP 服务器"
        echo "========================================"
        echo ""
        echo "您可以直接在浏览器中打开 index.html 文件"
        echo ""
        echo "以下功能可能受限:"
        echo "  - 剪贴板粘贴功能 (Ctrl+V)"
        echo "  - 某些文件上传功能"
        echo "  - 跨域相关功能"
        echo ""
        echo "如需完整功能，请安装 Python:"
        if [[ "$OSTYPE" == "darwin"* ]]; then
            echo "  macOS: brew install python3"
            echo "  或访问: https://www.python.org/downloads/"
        else
            echo "  Ubuntu/Debian: sudo apt install python3"
            echo "  Fedora: sudo dnf install python3"
            echo "  Arch: sudo pacman -S python"
            echo "  或访问: https://www.python.org/downloads/"
        fi
        echo ""
        echo "按 Enter 键继续..."
        read
        
        # 尝试在默认浏览器中打开
        if [[ "$OSTYPE" == "darwin"* ]]; then
            open "$(dirname "$0")/index.html"
        elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
            xdg-open "$(dirname "$0")/index.html" 2>/dev/null || echo "请手动打开 index.html 文件"
        fi
    fi
fi