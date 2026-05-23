WhereIsMyMouse - Windows鼠标定位工具
=======================================

功能介绍：
1. 快速晃动鼠标时，在鼠标周围显示红色圆圈，帮助快速找到鼠标位置（类似Mac功能）
2. 支持快捷键触发脉冲动画效果
3. 系统托盘运行，资源占用极小
4. 支持开机自启动
5. 全屏应用（如游戏）时自动暂停功能

使用方法：
1. 安装依赖：
   pip install -r requirements.txt

2. 运行程序：
   - 双击 run.bat（后台运行，无控制台窗口）
   - 或执行：pythonw main.py

3. 系统托盘菜单：
   - 开机自启动：设置是否随系统启动
   - 全屏检测：是否在全屏应用时暂停功能
   - 测试晃动放大：立即测试放大效果
   - 测试脉冲效果：立即测试脉冲动画效果
   - 退出：关闭程序

默认快捷键：Ctrl+Shift+M
- 按下后鼠标周围会出现循环变大变小的红色圆圈

配置文件位置：
%APPDATA%\WhereIsMyMouse\config.json

可调参数：
- shake_threshold: 晃动检测阈值（像素），默认500
- shake_time: 晃动检测时间窗口（秒），默认1.0
- cursor_scale: 放大倍数，默认3.0
- magnify_duration: 放大持续时间（秒），默认1.5
- hotkey: 快捷键设置，默认ctrl+shift+m
- pulse_duration: 脉冲动画持续时间（秒），默认2.0
- pulse_min_scale: 脉冲最小倍数，默认1.0
- pulse_max_scale: 脉冲最大倍数，默认3.0
- check_fullscreen: 是否检测全屏应用，默认true
- autostart: 是否开机自启动，默认false

注意：
- 本工具使用tkinter实现透明窗口，是Python内置库，无需额外安装
- 快速晃动鼠标大约1秒即可触发放大效果
- 红色圆圈会自动跟随鼠标移动
