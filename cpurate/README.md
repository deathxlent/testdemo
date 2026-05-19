# CPU猫咪监控 (CPU Cat Monitor)

一个可爱的Windows托盘小工具，用猫咪的状态直观显示CPU使用率。

## 功能特性

- 🐱 **低负载状态**: CPU使用率低于10%时，显示一个可爱的点阵猫头
- 🏃 **高负载状态**: CPU使用率超过10%时，显示奔跑的猫咪动画
- ⚡ **速度感知**: CPU占用越高，猫咪跑得越快
- 🖥️ **多核监控**: 点击托盘图标可查看每个CPU核心的独立状态，每个核心都有自己的猫咪

## 安装

```bash
pip install -r requirements.txt
```

## 运行

```bash
python cpurate.py
```

程序启动后会在系统托盘显示猫咪图标。

## 使用说明

- 查看整体CPU使用率: 观察托盘图标的猫咪状态
- 查看各核心详情: 左键点击托盘图标，弹出网格窗口显示每个核心的猫咪状态
- 退出程序: 右键点击托盘图标，选择"退出"

## 打包成EXE

可以使用PyInstaller打包成独立的可执行文件：

```bash
pip install pyinstaller
pyinstaller --noconsole --onefile --name cpurate cpurate.py
```

打包后的文件在 `dist/cpurate.exe`，可以直接运行。

## 系统要求

- Windows 10/11
- Python 3.8+
