#!/bin/bash

echo "========================================"
echo "  ImageTools 启动脚本 (macOS)"
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
        echo "  方法1: 使用 Homebrew"
        echo "    brew install python3"
        echo ""
        echo "  方法2: 从官网下载"
        echo "    访问 https://www.python.org/downloads/"
        echo "    下载 macOS 安装包并安装"
        echo ""
        echo "按 Enter 键继续..."
        read
        
        # 在默认浏览器中打开
        open "$(dirname "$0")/index.html"
    fi
fi