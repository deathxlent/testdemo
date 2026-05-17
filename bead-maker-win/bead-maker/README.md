# 拼豆图生成器

一款简洁的Windows拼豆图生成工具，可将JPG/PNG图片转换为拼豆图案。

## 功能特性

- 将图片转换为拼豆图（仅支持拼豆图生成，去掉了像素化预览功能）
- 自动匹配最接近的拼豆颜色（使用Mard拼豆色卡）
- 生成拼豆图统计信息（颜色、名称、数量，按数量降序排列）
- 一键保存：保存拼豆PNG图片和PDF统计报告
- 支持拖拽图片或点击选择
- 可注册到图片右键菜单，方便快速调用

## 使用说明

### 基本使用

1. 运行 `拼豆图生成器.exe`
2. 拖拽或选择JPG/PNG图片
3. 调整拼豆宽度（8-200像素）
4. 点击"生成拼豆图"按钮
5. 预览生成结果，查看颜色统计
6. 点击"保存图片和PDF"保存到原图同一目录

### 右键菜单集成

程序提供右键菜单注册功能：

1. 运行程序
2. 点击"注册右键菜单"按钮
3. 之后在PNG/JPG图片上右键，可以看到"用拼豆图生成器打开"选项

如需移除右键菜单，点击"移除右键菜单"按钮即可。

### 输出文件

保存时会生成两个文件（与原图同目录）：
- `原图名_bead.png` - 拼豆图图片
- `原图名_bead.pdf` - 拼豆统计PDF（第一页为统计信息，第二页为拼豆图）

## 打包说明

### 环境要求

- Node.js 18+
- Rust 1.70+
- Windows 10/11

### 安装依赖

```bash
cd bead-maker
npm install
```

### 开发调试

```bash
npm run tauri dev
```

### 打包发布

```bash
npm run tauri build
```

打包完成后，exe文件位于：
- `src-tauri/target/release/bundle/nsis/` (NSIS安装包)
- `src-tauri/target/release/bundle/msi/` (MSI安装包)
- `src-tauri/target/release/` (独立exe)

### 绿色版打包（不推荐，体积较大）

如需生成绿色版（便携版），可直接复制 `src-tauri/target/release/` 下的exe文件及必要资源。

但注意：推荐使用NSIS或MSI安装包版本，因为这些版本会自动包含必要的WebView2运行时。

### 排除old目录

打包后的安装包和exe不包含 `old/` 目录，这是原网页版本的备份文件。

## 技术栈

- Tauri 2.x (Rust后端 + Web前端)
- image crate (图片处理)
- printpdf (PDF生成)
- winreg (Windows注册表操作)

## 注意事项

1. 程序依赖 WebView2 运行时（Windows 10/11通常已预装）
2. 右键菜单注册需要管理员权限（程序会自动申请）
3. 保存文件时需要对该目录有写权限
4. PDF统计页最多显示前30种颜色