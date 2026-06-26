# 本地图匠

<div align="center">

**🎨 一款功能还算丰富的纯前端图片编辑工具**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-blue.svg)](https://github.com)
[![Browser](https://img.shields.io/badge/browser-Chrome%20%7C%20Firefox%20%7C%20Safari%20%7C%20Edge-green.svg)](https://github.com)

</div>

---

## ⚠️ 重要声明

**本软件永久完全免费，不加任何广告！**

- ✅ **完全免费**：永久免费使用，无任何隐藏费用
- ✅ **无广告**：纯净无广告，专注用户体验
- ✅ **自由使用**：允许随意部署、修改，甚至商用
- ✅ **本地计算**：所有处理均在本地完成，保护隐私
- ✅ **离线可用**：无需联网，离线浏览器即可使用
- ✅ **跨平台**：支持 Windows、macOS、Linux
- ✅ **开源协议**：MIT License，只需保留原链接即可

---

## 🚀 快速开始

### 方法一：使用启动脚本（推荐）

#### Windows
双击运行 `start.bat`

#### macOS
```bash
chmod +x start_macos.sh
./start_macos.sh
```

#### Linux
```bash
chmod +x start_linux.sh
./start_linux.sh
```

启动后访问：`http://localhost:8326`

### 方法二：直接双击

直接双击 `index.html` 文件在浏览器中打开。

**⚠️ 注意**：直接打开时部分功能可能受限（详见下方功能对比）

---

## 📊 功能对比

| 功能 | 脚本启动 | 直接双击 |
|------|---------|---------|
| 图片编辑 | ✅ 完全可用 | ✅ 完全可用 |
| 拼图功能 | ✅ 完全可用 | ✅ 完全可用 |
| 选择工具 | ✅ 完全可用 | ✅ 完全可用 |
| 水印功能 | ✅ 完全可用 | ✅ 完全可用 |
| 剪贴板粘贴 (Ctrl+V) | ✅ 完全可用 | ⚠️ 可能受限 |
| 文件上传 | ✅ 完全可用 | ⚠️ 可能受限 |
| 跨域功能 | ✅ 完全可用 | ⚠️ 可能受限 |

**推荐使用启动脚本**，以获得完整功能体验。

---

## 🎯 核心功能

### 🖼️ 图片编辑

- **旋转**：90°、180°、270° 旋转
- **翻转**：水平翻转、垂直翻转
- **裁剪**：自由裁剪、固定比例裁剪
- **调整**：亮度、对比度、饱和度、色相
- **滤镜**：灰度、模糊、锐化、反色等

### 🧩 拼图功能

- **多种模板**：2宫格、3宫格、4宫格、九宫格等
- **自定义模板**：支持方形、圆形、椭圆、三角形、星形
- **模板框编辑**：
  - 拖动移动位置
  - 等比缩放大小
  - 图片裁剪编辑
  - 确认/删除操作
- **背景上传**：支持自定义背景图片
- **导出功能**：一键导出拼图结果

### ✂️ 选择工具

- **多种选择方式**：
  - 矩形选择
  - 圆形选择
  - 椭圆选择
  - 多边形选择
  - 魔棒选择
- **快捷键支持**：
  - `Ctrl+I`：反选
  - `Ctrl+C`：复制到剪贴板
  - `Ctrl+V`：粘贴图片为水印
  - `Delete`：删除选区内容
  - `ESC`：清除选区
- **闪烁边框**：选区显示醒目的红色闪烁边框

### 💧 水印功能

- **多种添加方式**：
  - 上传本地图片
  - 拖拽图片到上传区域
  - 从当前编辑的图片中选择
- **水印调整**：
  - 大小调整
  - 旋转角度
  - 透明度
  - 图层顺序

### 📝 文字工具

- 添加文字到图片
- 自定义字体、大小、颜色
- 文字旋转、透明度调整

### 🎨 其他功能

- **历史记录**：支持撤销/重做
- **批量处理**：批量调整图片
- **导出功能**：支持多种格式导出

---

## 🎨 界面预览

### 主界面
- 左侧工具栏：所有功能按钮
- 中间画布：图片编辑区域
- 右侧属性面板：参数调整

### 工具栏图标说明

| 图标 | 功能 | 说明 |
|------|------|------|
| 📂 | 打开 | 打开本地图片文件 |
| 💾 | 保存 | 保存当前编辑的图片 |
| ↩️ | 撤销 | 撤销上一步操作 |
| ↪️ | 重做 | 重做已撤销的操作 |
| 🔄 | 旋转 | 旋转图片 90° |
| ↔️ | 水平翻转 | 水平翻转图片 |
| ↕️ | 垂直翻转 | 垂直翻转图片 |
| ✂️ | 裁剪 | 裁剪图片 |
| 🎨 | 调整 | 调整亮度、对比度等 |
| 🌈 | 滤镜 | 应用各种滤镜效果 |
| 🧩 | 拼图 | 拼图功能 |
| ✏️ | 文字 | 添加文字 |
| 💧 | 水印 | 添加水印 |
| 🔲 | 选择 | 选择工具 |
| 📊 | 批量 | 批量处理 |

---

## 💻 系统要求

### 最低要求
- **操作系统**：Windows、macOS、Linux（主流发行版）
- **浏览器**：Chrome 60+、Firefox 55+、Safari 11+、Edge 79+

---

## 📖 使用说明

### 基本操作流程

1. **打开图片**：点击"打开"按钮或拖拽图片到画布
2. **选择工具**：从左侧工具栏选择需要的功能
3. **编辑图片**：使用各种工具编辑图片
4. **保存结果**：点击"保存"按钮导出图片

### 拼图功能详解

1. **设置画布**：点击"应用画布"设置拼图尺寸
2. **选择模板**：从模板列表中选择合适的布局
3. **上传图片**：点击模板框上传对应图片
4. **自定义模板**：
   - 点击"自定义"展开自定义面板
   - 选择形状并添加模板框
   - 点击模板框左上角进入编辑模式
   - 拖动调整位置，拖动右下角等比缩放
   - 点击 ✓ 确认，点击 ✕ 删除
5. **导出拼图**：点击"导出拼图"保存结果

### 选择工具使用

1. **创建选区**：使用鼠标在图片上绘制选区
2. **调整选区**：拖动选区边缘调整大小
3. **快捷键操作**：
   - `Ctrl+I`：反选选区
   - `Ctrl+C`：复制选区到剪贴板
   - `Delete`：删除选区内容
   - `ESC`：清除所有选区

---

## 🔧 高级功能

### 自定义模板框

1. **添加模板框**：
   - 点击"自定义"展开面板
   - 从下拉框选择形状（方形、圆形、椭圆、三角形、星形）
   - 点击"添加模板框"按钮

2. **编辑模板框**：
   - 点击模板框左上角的 ⊕ 按钮进入编辑模式
   - 拖动模板框移动位置
   - 拖动右下角红色手柄等比缩放
   - 点击 ✓ 确认修改
   - 点击 ✕ 删除模板框

3. **上传图片**：
   - 点击模板框下半部分上传图片
   - 上传后点击可进入裁剪模式
   - 调整裁剪框选择要显示的区域
   - 点击"确认裁剪"保存

### 水印功能

1. **添加水印**：
   - 点击"上传水印"按钮
   - 在弹出的对话框中选择添加方式：
     - 拖拽图片到上传区域
     - 点击"选择图片"按钮上传
     - 从当前图片列表中选择

2. **调整水印**：
   - 拖动水印调整位置
   - 在右侧面板调整大小、旋转、透明度
   - 调整图层顺序

---

## 🛠️ 技术架构

### 技术栈
- **纯前端**：HTML5 + CSS3 + JavaScript (ES6+)
- **无依赖**：不依赖任何第三方库
- **Canvas API**：图片处理核心
- **File API**：文件上传处理
- **Clipboard API**：剪贴板操作

### 架构特点
- **模块化设计**：功能模块独立，易于维护
- **响应式布局**：适配不同屏幕尺寸
- **性能优化**：使用 Canvas 提升处理效率
- **离线支持**：所有功能本地运行

---

## 📦 部署说明

### 本地部署

直接下载项目文件夹，使用启动脚本或直接打开 `index.html` 即可。

### 服务器部署

将项目文件上传到任意 Web 服务器即可：

#### Apache
```apache
# .htaccess
Options +Indexes
DirectoryIndex index.html
```

#### Nginx
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/imagetools;
    index index.html;
}
```

#### 静态托管
- GitHub Pages
- Netlify
- Vercel
- Cloudflare Pages

### Docker 部署

```dockerfile
FROM nginx:alpine
COPY . /usr/share/nginx/html
EXPOSE 80
```

---

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

### 开发环境
1. 克隆项目
2. 使用启动脚本运行
3. 修改代码
4. 测试功能
5. 提交 PR

---

## 📄 许可证

本项目采用 **MIT License** 开源协议。

```
MIT License

Copyright (c) 2024 ImageTools

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 📞 联系方式

- **项目主页**：[GitHub](https://github.com/deathxlent/LocalPix)
- **问题反馈**：[Issues](https://github.com/deathxlent/LocalPix/issues)
- **功能建议**：[Discussions](https://github.com/deathxlent/LocalPix/discussions)

---

## 🙏 致谢

感谢所有用户！

---

<div align="center">

**如果觉得这个项目有用，请给个 ⭐️ Star 支持一下！**

Made with ❤️ by xlent

</div>