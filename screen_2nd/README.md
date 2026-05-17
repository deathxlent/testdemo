# 第二屏幕 (Screen2nd)

一个跨平台的屏幕共享/第二屏幕应用，支持Windows和Android设备之间的屏幕共享和扩展。

## 功能特性

- 🔍 **局域网自动发现**：无需手动输入IP，设备自动在局域网内互相发现
- 🔒 **密码保护**：服务器端可设置连接密码，确保安全
- 🖥️ **屏幕共享**：任何一方都可作为服务器，共享屏幕给对方显示
- 📱 **第二屏幕扩展**（仅Windows服务器）：可将连接的设备作为第二显示器使用
- 👆 **触摸事件显示**：Android作为服务器时，显示客户端的触摸操作
- 🔄 **双向连接**：Windows和Android均可作为服务器或客户端

## 项目结构

```
screen_2nd/
├── common/
│   └── protocol.py          # 通用网络协议定义（Python版本）
├── windows_app/             # Windows桌面应用（Python + PyQt6）
│   ├── main.py              # 程序入口
│   ├── main_window.py       # 主窗口UI
│   ├── network_discovery.py # 网络发现模块
│   ├── tcp_connection.py    # TCP连接模块
│   ├── screen_capture.py    # 屏幕捕获模块
│   ├── second_screen.py     # 第二屏幕管理
│   └── requirements.txt     # Python依赖
└── android_app/             # Android应用（Kotlin）
    ├── build.gradle.kts     # Gradle构建配置
    ├── settings.gradle.kts  # Gradle设置
    ├── gradle.properties    # Gradle属性
    ├── gradle/              # Gradle wrapper
    └── app/
        ├── build.gradle.kts # App模块配置
        ├── proguard-rules.pro
        └── src/main/
            ├── AndroidManifest.xml
            ├── java/com/screen2nd/app/
            │   ├── MainActivity.kt
            │   ├── network/
            │   │   ├── Protocol.kt        # 网络协议定义（Kotlin版本）
            │   │   ├── NetworkDiscovery.kt # 网络发现模块
            │   │   └── TcpConnection.kt   # TCP连接模块
            │   └── screen/
            │       ├── ScreenCapturer.kt  # 屏幕捕获模块
            │       └── FrameDisplayView.kt # 帧显示视图
            └── res/                       # 资源文件
```

## 快速开始

### 一、Windows应用使用说明

#### 环境要求
- Windows 10/11
- Python 3.9+

#### 安装步骤

1. 进入Windows应用目录：
```bash
cd windows_app
```

2. 安装依赖：
```bash
pip install -r requirements.txt
```

3. 运行程序：
```bash
python main.py
```

#### 使用方法

**作为服务器：**
1. 点击"作为服务器"按钮
2. 设置连接密码
3. 调整帧率(10-60)、画质(10-100)、选择要共享的显示器
4. 如需启用第二屏幕扩展，勾选"启用第二屏幕模式"
5. 客户端连接后，自动开始共享屏幕

**作为客户端：**
1. 在设备列表中双击要连接的设备（或选中后点击"作为客户端"）
2. 输入服务器密码
3. 连接成功后自动显示对方屏幕
4. 点击"断开连接"可手动断开

### 二、Android应用使用说明

#### 环境要求
- Android 7.0 (API 24) 及以上
- Android Studio Giraffe 及以上（用于编译）

#### 编译步骤

1. 使用Android Studio打开 `android_app` 目录
2. 等待Gradle同步完成
3. 连接Android设备或启动模拟器
4. 点击运行按钮安装应用

#### 使用方法

**作为服务器：**
1. 点击"作为服务器"按钮
2. 设置连接密码
3. 授权屏幕录制权限
4. 客户端连接后自动开始共享屏幕，并显示触摸操作

**作为客户端：**
1. 在设备列表中点击要连接的设备
2. 输入服务器密码
3. 连接成功后自动进入全屏显示对方屏幕
4. 触摸屏幕可发送触摸事件到服务器（支持点击、拖动）
5. 从屏幕边缘滑动可显示系统栏，点击返回键退出

## 网络协议说明

### 发现协议（UDP）
- 端口：45678
- 广播地址：255.255.255.255
- 广播间隔：2秒
- 设备超时：10秒

### 数据传输（TCP）
- 端口：45679
- 消息格式：
  ```
  [4字节: 负载长度][4字节: CRC32校验][2字节: 消息类型长度][消息类型][负载数据]
  ```

### 消息类型
- `hello`：客户端握手，包含密码和设备信息
- `password_ack`：密码验证结果
- `disconnect`：断开连接
- `frame`：视频帧数据（JPEG压缩 + zlib可选压缩）
- `touch`：触摸事件数据

## 第二屏幕模式说明

Windows作为服务器时支持第二屏幕模式：
- 需要系统有至少2个显示器
- 连接的设备会显示第二屏幕的内容
- 在客户端设备上的触摸操作会映射到第二屏幕

## 常见问题

**Q: 设备列表中找不到其他设备？**
A: 请确保所有设备连接到同一WiFi网络，检查防火墙是否允许应用访问网络。

**Q: Android无法捕获屏幕？**
A: 请确保授予了屏幕录制权限，部分系统需要手动授权。

**Q: 画面卡顿怎么办？**
A: 可以降低帧率或画质设置，确保网络连接稳定。

**Q: Windows第二屏幕模式不工作？**
A: 请确保系统已连接至少2台显示器，并且正确识别。

## 许可证

MIT License
