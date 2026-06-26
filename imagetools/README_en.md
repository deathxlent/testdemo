# LocalPix

<div align="center">

**🎨 A powerful pure-frontend image editing tool**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-blue.svg)](https://github.com)
[![Browser](https://img.shields.io/badge/browser-Chrome%20%7C%20Firefox%20%7C%20Safari%20%7C%20Edge-green.svg)](https://github.com)

</div>

---

## ⚠️ Important Notice

**This software is completely free forever, without any ads!**

- ✅ **Completely Free**: Free to use forever, no hidden fees
- ✅ **No Ads**: Pure and ad-free, focused on user experience
- ✅ **Free to Use**: Free to deploy, modify, and even commercialize
- ✅ **Local Processing**: All processing is done locally, protecting privacy
- ✅ **Offline Available**: No internet connection required
- ✅ **Cross-Platform**: Supports Windows, macOS, Linux
- ✅ **Open Source**: MIT License, just keep the original link

---

## 🚀 Quick Start

### Method 1: Using Startup Scripts (Recommended)

#### Windows
Double-click `start.bat`

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

After starting, visit: `http://localhost:8326`

### Method 2: Direct Double-Click

Double-click `index.html` to open in your browser.

**⚠️ Note**: Some features may be limited when opened directly (see comparison below)

---

## 📊 Feature Comparison

| Feature | Script Launch | Direct Open |
|---------|--------------|-------------|
| Image Editing | ✅ Fully Available | ✅ Fully Available |
| Puzzle Feature | ✅ Fully Available | ✅ Fully Available |
| Selection Tools | ✅ Fully Available | ✅ Fully Available |
| Watermark Feature | ✅ Fully Available | ✅ Fully Available |
| Clipboard Paste (Ctrl+V) | ✅ Fully Available | ⚠️ May Be Limited |
| File Upload | ✅ Fully Available | ⚠️ May Be Limited |
| Cross-Origin Features | ✅ Fully Available | ⚠️ May Be Limited |

**Recommended to use startup scripts** for full feature experience.

---

## 🎯 Core Features

### 🖼️ Image Editing

- **Rotation**: 90°, 180°, 270° rotation
- **Flip**: Horizontal flip, Vertical flip
- **Crop**: Free crop, Fixed ratio crop
- **Adjustments**: Brightness, Contrast, Saturation, Hue
- **Filters**: Grayscale, Blur, Sharpen, Invert, etc.

### 🧩 Puzzle Feature

- **Multiple Templates**: 2-grid, 3-grid, 4-grid, 9-grid, etc.
- **Custom Templates**: Supports square, circle, ellipse, triangle, star shapes
- **Template Cell Editing**:
  - Drag to move position
  - Proportional scaling
  - Image crop editing
  - Confirm/Delete operations
- **Background Upload**: Supports custom background images
- **Export**: One-click export of puzzle results

### ✂️ Selection Tools

- **Multiple Selection Modes**:
  - Rectangle selection
  - Circle selection
  - Ellipse selection
  - Polygon selection
  - Magic wand selection
- **Keyboard Shortcuts**:
  - `Ctrl+I`: Invert selection
  - `Ctrl+C`: Copy to clipboard
  - `Ctrl+V`: Paste image as watermark
  - `Delete`: Delete selection content
  - `ESC`: Clear selection
- **Blinking Border**: Selection shows prominent red blinking border

### 💧 Watermark Feature

- **Multiple Addition Methods**:
  - Upload local image
  - Drag image to upload area
  - Select from currently editing image
- **Watermark Adjustments**:
  - Size adjustment
  - Rotation angle
  - Opacity
  - Layer order

### 📝 Text Tool

- Add text to images
- Custom font, size, color
- Text rotation, opacity adjustment

### 🎨 Other Features

- **History**: Supports undo/redo
- **Batch Processing**: Batch adjust images
- **Export**: Supports multiple format exports

---

## 🎨 Interface Preview

### Main Interface
- Left toolbar: All function buttons
- Center canvas: Image editing area
- Right property panel: Parameter adjustments

### Toolbar Icon Descriptions

| Icon | Function | Description |
|------|----------|-------------|
| 📂 | Open | Open local image files |
| 💾 | Save | Save currently editing image |
| ↩️ | Undo | Undo last operation |
| ↪️ | Redo | Redo undone operation |
| 🔄 | Rotate | Rotate image 90° |
| ↔️ | Horizontal Flip | Flip image horizontally |
| ↕️ | Vertical Flip | Flip image vertically |
| ✂️ | Crop | Crop image |
| 🎨 | Adjust | Adjust brightness, contrast, etc. |
| 🌈 | Filters | Apply various filter effects |
| 🧩 | Puzzle | Puzzle feature |
| ✏️ | Text | Add text |
| 💧 | Watermark | Add watermark |
| 🔲 | Selection | Selection tools |
| 📊 | Batch | Batch processing |

---

## 💻 System Requirements

### Minimum Requirements
- **OS**: Windows, macOS, Linux (mainstream distributions)
- **Browser**: Chrome 60+, Firefox 55+, Safari 11+, Edge 79+

---

## 📖 Usage Guide

### Basic Workflow

1. **Open Image**: Click "Open" button or drag image to canvas
2. **Select Tool**: Choose needed function from left toolbar
3. **Edit Image**: Use various tools to edit image
4. **Save Result**: Click "Save" button to export image

### Puzzle Feature Details

1. **Set Canvas**: Click "Apply Canvas" to set puzzle dimensions
2. **Select Template**: Choose suitable layout from template list
3. **Upload Images**: Click template cells to upload corresponding images
4. **Custom Templates**:
   - Click "Custom" to expand panel
   - Select shape and add template cells
   - Click top-left corner of cell to enter edit mode
   - Drag to move position, drag bottom-right corner to proportionally scale
   - Click ✓ to confirm, click ✕ to delete
5. **Export Puzzle**: Click "Export Puzzle" to save result

### Selection Tool Usage

1. **Create Selection**: Use mouse to draw selection on image
2. **Adjust Selection**: Drag selection edges to adjust size
3. **Shortcut Operations**:
   - `Ctrl+I`: Invert selection
   - `Ctrl+C`: Copy selection to clipboard
   - `Delete`: Delete selection content
   - `ESC`: Clear all selections

---

## 🔧 Advanced Features

### Custom Template Cells

1. **Add Template Cell**:
   - Click "Custom" to expand panel
   - Select shape from dropdown (square, circle, ellipse, triangle, star)
   - Click "Add Template Cell" button

2. **Edit Template Cell**:
   - Click ⊕ button at top-left of cell to enter edit mode
   - Drag cell to move position
   - Drag red handle at bottom-right corner to proportionally scale
   - Click ✓ to confirm changes
   - Click ✕ to delete cell

3. **Upload Image**:
   - Click bottom half of cell to upload image
   - After upload, click to enter crop mode
   - Adjust crop frame to select area to display
   - Click "Confirm Crop" to save

### Watermark Feature

1. **Add Watermark**:
   - Click "Upload Watermark" button
   - In popup dialog, choose addition method:
     - Drag image to upload area
     - Click "Select Image" button to upload
     - Select from current image list

2. **Adjust Watermark**:
   - Drag watermark to adjust position
   - Adjust size, rotation, opacity in right panel
   - Adjust layer order

---

## 🛠️ Technical Architecture

### Tech Stack
- **Pure Frontend**: HTML5 + CSS3 + JavaScript (ES6+)
- **No Dependencies**: No third-party libraries required
- **Canvas API**: Core image processing
- **File API**: File upload handling
- **Clipboard API**: Clipboard operations

### Architecture Features
- **Modular Design**: Independent function modules, easy to maintain
- **Responsive Layout**: Adapts to different screen sizes
- **Performance Optimized**: Uses Canvas for processing efficiency
- **Offline Support**: All features run locally

---

## 📦 Deployment Guide

### Local Deployment

Simply download the project folder and use startup scripts or directly open `index.html`.

### Server Deployment

Upload project files to any web server:

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

#### Static Hosting
- GitHub Pages
- Netlify
- Vercel
- Cloudflare Pages

### Docker Deployment

```dockerfile
FROM nginx:alpine
COPY . /usr/share/nginx/html
EXPOSE 80
```

---

## 🤝 Contribution Guide

Issues and Pull Requests are welcome!

### Development Environment
1. Clone the project
2. Run using startup scripts
3. Modify code
4. Test features
5. Submit PR

---

## 📄 License

This project uses the **MIT License** open source license.

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

## 📞 Contact

- **Project Home**: [GitHub](https://github.com/deathxlent/LocalPix)
- **Bug Reports**: [Issues](https://github.com/deathxlent/LocalPix/issues)
- **Feature Requests**: [Discussions](https://github.com/deathxlent/LocalPix/discussions)

---

## 🙏 Acknowledgments

Thank you to all users!

---

<div align="center">

**If you find this project useful, please give it a ⭐️ Star!**

Made with ❤️ by xlent

</div>
