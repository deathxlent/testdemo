#!/bin/bash

echo "========================================"
echo "  ImageTools 启动脚本 (Linux)"
echo "========================================"
echo ""

# 检测 Linux 发行版
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$NAME
    VERSION=$VERSION_ID
else
    OS="Unknown Linux"
fi

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
        echo "检测到的系统: $OS"
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
        echo ""
        case "$OS" in
            *"Ubuntu"*|*"Debian"*)
                echo "  Ubuntu/Debian:"
                echo "    sudo apt update"
                echo "    sudo apt install python3"
                ;;
            *"Fedora"*)
                echo "  Fedora:"
                echo "    sudo dnf install python3"
                ;;
            *"CentOS"*|*"Red Hat"*)
                echo "  CentOS/RHEL:"
                echo "    sudo yum install python3"
                ;;
            *"Arch"*)
                echo "  Arch Linux:"
                echo "    sudo pacman -S python"
                ;;
            *)
                echo "  通用方法:"
                echo "    sudo apt install python3  # Debian/Ubuntu"
                echo "    sudo dnf install python3  # Fedora"
                echo "    sudo yum install python3  # CentOS/RHEL"
                echo "    sudo pacman -S python     # Arch"
                ;;
        esac
        echo ""
        echo "或访问: https://www.python.org/downloads/"
        echo ""
        echo "按 Enter 键继续..."
        read
        
        # 尝试在默认浏览器中打开
        if command -v xdg-open &> /dev/null; then
            xdg-open "$(dirname "$0")/index.html"
        elif command -v gnome-open &> /dev/null; then
            gnome-open "$(dirname "$0")/index.html"
        elif command -v kde-open &> /dev/null; then
            kde-open "$(dirname "$0")/index.html"
        else
            echo "请手动在浏览器中打开 index.html 文件"
        fi
    fi
fi