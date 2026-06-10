# OCR 工具对比实验 - 安装与使用文档

本文档介绍三种文档 OCR/表格提取工具的安装与使用方法：
- **Table Transformer** (microsoft/table-transformer) — 表格检测与结构识别
- **Chandra OCR 2** (datalab-to/chandra) — 全文档 OCR，输出 Markdown/HTML/JSON
- **dots.mocr** (rednote-hilab/dots.mocr) — 文档布局分析 + OCR + SVG 生成

---

## 目录

1. [环境要求](#1-环境要求)
2. [Table Transformer](#2-table-transformer)
3. [Chandra OCR 2](#3-chandra-ocr-2)
4. [dots.mocr](#4-dotsmocr)
5. [输出结果说明](#5-输出结果说明)
6. [常见问题](#6-常见问题)

---

## 1. 环境要求

| 项目 | 最低要求 | 推荐 |
|------|---------|------|
| 操作系统 | Windows 10/11 | Windows 11 |
| Python | 3.10+ | 3.11 或 3.12 |
| GPU | 无（CPU 也可运行） | NVIDIA GPU, 8GB+ VRAM |
| CUDA | 无 | 11.8+ / 12.x |
| 内存 | 16GB | 32GB+ |
| 磁盘 | 20GB（模型+输出） | 50GB+ |

### GPU 显存需求

| 工具 | 最低显存 (推理) | 推荐显存 |
|------|----------------|---------|
| Table Transformer | ~1GB | 2GB+ |
| Chandra OCR 2 | ~10GB (bf16) | 12GB+ |
| dots.mocr | ~6GB (bf16) | 8GB+ |

> **注意**: 如果没有 GPU 或显存不足，所有工具都支持 CPU 运行，但速度会慢很多。Chandra OCR 2 和 dots.mocr 在 CPU 上运行会非常慢（每张图可能需要数分钟）。

---

## 2. Table Transformer

### 2.1 简介

Table Transformer (TATR) 是微软研究院开发的深度学习模型，专门用于：
- **表格检测** (Table Detection)：从文档图像中检测出表格的位置
- **表格结构识别** (Table Structure Recognition)：识别表格的行、列、单元格、表头等结构
- **端到端表格提取** (Table Extraction)：检测 + 识别 + 文本提取，输出 HTML/CSV

基于 DETR (Detection Transformer) 架构，模型体积小（~110MB），推理速度快。

### 2.2 安装

#### 方式一：pip 安装（推荐）

```bash
# 创建虚拟环境（推荐）
python -m venv venv_tatr
venv_tatr\Scripts\activate

# 安装基础包
pip install table-transformer

# 安装 OCR 支持（用于提取表格文本）
pip install easyocr

# 如果有 GPU，安装 CUDA 版 PyTorch（根据你的 CUDA 版本选择）
# CUDA 11.8:
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu118
# CUDA 12.1:
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121
```

#### 方式二：从源码安装

```bash
git clone https://github.com/microsoft/table-transformer.git
cd table-transformer
conda env create -f environment.yml
conda activate tables-detr
```

### 2.3 使用

#### 一键运行脚本

```bash
python run_table_transformer.py
```

脚本会自动：
1. 下载模型权重到 `models/table_transformer/` 目录
   - `pubtables1m_detection_detr_r18.pth` (~110MB) — 表格检测模型
   - `TATR-v1.1-All-msft.pth` (~110MB) — 表格结构识别模型
2. 处理当前目录下所有 `page_*.jpg` 图片
3. 生成结果到 `output_table_transformer/` 目录
4. 生成可视化 HTML 报告 `output_table_transformer/report.html`

#### 手动使用 Python API

```python
from table_transformer import TableExtractionPipeline

pipe = TableExtractionPipeline(
    det_device="cuda",          # 或 "cpu"
    str_device="cuda",          # 或 "cpu"
    det_model_path="models/table_transformer/pubtables1m_detection_detr_r18.pth",
    str_model_path="models/table_transformer/TATR-v1.1-All-msft.pth",
)

# 处理单张图片
table_objects, table_cells_coords, table_cells_text = pipe("page_1.jpg")

# table_objects: 检测到的表格对象列表
# table_cells_coords: 表格单元格坐标
# table_cells_text: 表格文本（DataFrame 格式）

for i, df in enumerate(table_cells_text):
    print(f"Table {i+1}:")
    print(df.to_string())
    print(df.to_html())  # HTML 格式
    print(df.to_csv())   # CSV 格式
```

### 2.4 输出说明

```
output_table_transformer/
├── report.html                          ← 总览报告（浏览器打开）
├── page_1/
│   ├── detection_result.jpg             ← 表格检测结果图（红框标注）
│   ├── structure_result.jpg             ← 表格结构识别结果图
│   ├── table_1.html                     ← 提取的表格 HTML
│   └── table_1.csv                      ← 提取的表格 CSV
├── page_3/
│   └── ...
└── page_7/
    └── ...
```

---

## 3. Chandra OCR 2

### 3.1 简介

Chandra OCR 2 是 Datalab.to 开发的最先进 OCR 模型，核心能力：
- **文档转 Markdown/HTML/JSON**，保留完整布局信息
- **90+ 语言** 支持（中文、英文、日文等）
- **表格、数学公式、手写体** 高精度识别
- **表单识别**，包括复选框状态
- **图表/图片提取**，添加标题和结构化数据

在 olmOCR 基准测试中综合得分 85.9，超过 GPT-4o 和 Gemini Flash 2。

### 3.2 安装

#### 方式一：pip 安装（推荐）

```bash
# 创建虚拟环境（推荐）
python -m venv venv_chandra
venv_chandra\Scripts\activate

# 安装 Chandra OCR（包含 HuggingFace 后端）
pip install chandra-ocr[hf]

# 如果有 GPU，安装 flash-attn 加速（可选，需要 CUDA 编译环境）
pip install flash-attn --no-build-isolation

# 安装 qwen_vl_utils（必需）
pip install qwen_vl_utils
```

#### 方式二：使用 CLI

```bash
# 安装后直接使用命令行
pip install chandra-ocr[hf]

# 处理单个文件
chandra page_1.jpg ./output --method hf

# 处理整个目录
chandra ./ ./output --method hf
```

### 3.3 使用

#### 一键运行脚本

```bash
python run_chandra.py
```

脚本会自动：
1. 下载模型到 `models/chandra-ocr-2/` 目录 (~10GB)
2. 使用 HuggingFace Transformers 加载模型
3. 处理当前目录下所有 `page_*.jpg` 图片
4. 生成结果到 `output_chandra/` 目录
5. 生成可视化 HTML 报告 `output_chandra/report.html`

#### 手动使用 Python API

```python
import torch
from transformers import AutoProcessor, AutoModelForCausalLM
from qwen_vl_utils import process_vision_info

model_path = "models/chandra-ocr-2"
processor = AutoProcessor.from_pretrained(model_path, trust_remote_code=True)
model = AutoModelForCausalLM.from_pretrained(
    model_path,
    torch_dtype=torch.bfloat16,
    device_map="auto",
    trust_remote_code=True,
)

# 处理图片
messages = [
    {
        "role": "user",
        "content": [
            {"type": "image", "image": "page_1.jpg"},
            {"type": "text", "text": "Convert this document image to markdown, preserving the layout, tables, and formatting."},
        ],
    }
]

text = processor.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
image_inputs, video_inputs = process_vision_info(messages)
inputs = processor(text=[text], images=image_inputs, videos=video_inputs, padding=True, return_tensors="pt").to(model.device)

with torch.no_grad():
    generated_ids = model.generate(**inputs, max_new_tokens=16384)

generated_ids_trimmed = [out_ids[len(in_ids):] for in_ids, out_ids in zip(inputs.input_ids, generated_ids)]
output_text = processor.batch_decode(generated_ids_trimmed, skip_special_tokens=True, clean_up_tokenization_spaces=False)[0]

print(output_text)  # Markdown 格式的 OCR 结果
```

#### 使用 CLI

```bash
# 处理单张图片
chandra page_1.jpg ./output --method hf

# 处理 PDF
chandra document.pdf ./output --method hf

# 指定最大输出 token 数
chandra page_1.jpg ./output --method hf --max-output-tokens 16000
```

### 3.4 输出说明

```
output_chandra/
├── report.html                          ← 总览报告（浏览器打开）
├── page_1/
│   ├── page_1.md                        ← Markdown 格式 OCR 结果
│   └── page_1.json                      ← 原始输出 JSON
├── page_3/
│   └── ...
└── page_7/
    └── ...
```

---

## 4. dots.mocr

### 4.1 简介

dots.mocr 是小红书 (rednote) HiLab 开发的多模态 OCR 模型，核心能力：
- **文档布局分析** — 检测标题、正文、表格、图片、公式、脚注等 11 种布局元素
- **多语言 OCR** — 支持 90+ 语言
- **结构化图形解析** — 图表、UI 布局、科学图表直接转为 SVG 代码
- **场景文字识别** — 自然场景中的文字检测和识别
- **通用视觉问答** — 保留 Qwen3-VL-4B 的通用视觉能力

3B 参数模型，在 olmOCR 基准测试中综合得分 83.9。

### 4.2 安装

```bash
# 创建虚拟环境（推荐）
python -m venv venv_dots
venv_dots\Scripts\activate

# 克隆仓库
git clone https://github.com/rednote-hilab/dots.mocr.git dots_mocr_repo

# 安装依赖
cd dots_mocr_repo
pip install -e .
cd ..

# 安装额外依赖
pip install qwen_vl_utils
pip install huggingface_hub

# 如果有 GPU，安装 flash-attn 加速（可选）
pip install flash-attn --no-build-isolation
```

### 4.3 使用

#### 一键运行脚本

```bash
python run_dots_mocr.py
```

脚本会自动：
1. 克隆 dots.mocr 仓库到 `dots_mocr_repo/` 目录
2. 安装 dots_mocr 包
3. 下载模型到 `models/DotsMOCR/` 目录 (~6GB)
4. 处理当前目录下所有 `page_*.jpg` 图片
5. 生成结果到 `output_dots_mocr/` 目录
6. 生成可视化 HTML 报告 `output_dots_mocr/report.html`

#### 手动使用 Python API

```python
import torch
from transformers import AutoModelForCausalLM, AutoProcessor
from qwen_vl_utils import process_vision_info

model_path = "models/DotsMOCR"
processor = AutoProcessor.from_pretrained(model_path, trust_remote_code=True, use_fast=True)
model = AutoModelForCausalLM.from_pretrained(
    model_path,
    attn_implementation="flash_attention_2",  # 或 "eager"
    torch_dtype=torch.bfloat16,
    device_map="auto",
    trust_remote_code=True,
)

# 布局分析 prompt
prompt = """Please output the layout information from the PDF image, including each layout element's bbox, its category, and the corresponding text content within the bbox.
1. Bbox format: [x1, y1, x2, y2]
2. Layout Categories: The possible categories are ['Caption', 'Footnote', 'Formula', 'List-item', 'Page-footer', 'Page-header', 'Picture', 'Section-header', 'Table', 'Text', 'Title'].
3. Text Extraction & Formatting Rules:
    - Picture: For the 'Picture' category, the text field should be omitted.
    - Formula: Format its text as LaTeX.
    - Table: Format its text as HTML.
    - All Others (Text, Title, etc.): Format their text as Markdown.
4. Constraints:
    - The output text must be the original text from the image, with no translation.
    - All layout elements must be sorted according to human reading order.
5. Final Output: The entire output must be a single JSON object.
"""

messages = [
    {
        "role": "user",
        "content": [
            {"type": "image", "image": "page_1.jpg"},
            {"type": "text", "text": prompt},
        ],
    }
]

text = processor.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
image_inputs, video_inputs = process_vision_info(messages)
inputs = processor(text=[text], images=image_inputs, videos=video_inputs, padding=True, return_tensors="pt").to(model.device)

with torch.no_grad():
    generated_ids = model.generate(**inputs, max_new_tokens=24000)

generated_ids_trimmed = [out_ids[len(in_ids):] for in_ids, out_ids in zip(inputs.input_ids, generated_ids)]
output_text = processor.batch_decode(generated_ids_trimmed, skip_special_tokens=True, clean_up_tokenization_spaces=False)[0]

print(output_text)  # JSON 格式的布局分析结果
```

#### 使用仓库内置 Parser

```bash
cd dots_mocr_repo

# 布局分析 + OCR
python dots_mocr/parser.py ../page_1.jpg

# 仅布局检测
python dots_mocr/parser.py ../page_1.jpg --prompt prompt_layout_only_en

# 仅 OCR 文本
python dots_mocr/parser.py ../page_1.jpg --prompt prompt_ocr

# 使用 HuggingFace 推理（不用 vLLM）
python dots_mocr/parser.py ../page_1.jpg --use_hf true
```

### 4.4 可用的 Prompt 模式

| Prompt 模式 | 功能 | 输出格式 |
|-------------|------|---------|
| `prompt_layout_all_en` | 完整布局分析 + OCR | JSON（含 bbox、类别、文本） |
| `prompt_layout_only_en` | 仅布局检测（无文本） | JSON（含 bbox、类别） |
| `prompt_ocr` | 仅提取文本（排除页眉页脚） | 纯文本 |
| `prompt_grounding_ocr` | 提取指定区域的文本 | 文本 |
| `prompt_web_parsing` | 网页布局解析 | JSON |
| `prompt_scene_spotting` | 自然场景文字检测 | JSON |
| `prompt_image_to_svg` | 图片转 SVG 代码 | SVG |

### 4.5 输出说明

```
output_dots_mocr/
├── report.html                          ← 总览报告（浏览器打开）
├── page_1/
│   ├── layout_visualization.jpg         ← 布局检测结果图（彩色框标注各类元素）
│   ├── page_1.md                        ← Markdown 格式 OCR 结果
│   ├── page_1.json                      ← 布局分析 JSON（bbox + 类别 + 文本）
│   └── page_1_raw.json                  ← 模型原始输出
├── page_3/
│   └── ...
└── page_7/
    └── ...
```

---

## 5. 输出结果说明

### 5.1 目录结构总览

```
d:\Zeta\testocr\
├── page_1.jpg, page_3.jpg, ...          ← 输入图片
├── run_table_transformer.py             ← Table Transformer 脚本
├── run_chandra.py                       ← Chandra OCR 脚本
├── run_dots_mocr.py                     ← dots.mocr 脚本
├── OCR_TOOLS_GUIDE.md                   ← 本文档
├── models\                              ← 模型权重（自动下载）
│   ├── table_transformer\               ← ~220MB
│   │   ├── pubtables1m_detection_detr_r18.pth
│   │   └── TATR-v1.1-All-msft.pth
│   ├── chandra-ocr-2\                   ← ~10GB
│   │   └── (model files)
│   └── DotsMOCR\                        ← ~6GB
│       └── (model files)
├── dots_mocr_repo\                      ← dots.mocr 仓库（自动克隆）
├── output_table_transformer\            ← Table Transformer 结果
│   ├── report.html
│   └── page_*/...
├── output_chandra\                      ← Chandra OCR 结果
│   ├── report.html
│   └── page_*/...
└── output_dots_mocr\                    ← dots.mocr 结果
    ├── report.html
    └── page_*/...
```

### 5.2 三种工具对比

| 特性 | Table Transformer | Chandra OCR 2 | dots.mocr |
|------|------------------|---------------|-----------|
| 主要功能 | 表格检测+结构识别 | 全文档 OCR | 布局分析+OCR |
| 模型大小 | ~220MB | ~10GB | ~6GB |
| 显存需求 | ~1GB | ~10GB | ~6GB |
| CPU 运行 | 快 | 很慢 | 很慢 |
| 表格识别 | ★★★★★ | ★★★★☆ | ★★★★☆ |
| 布局分析 | ❌ | ✓ | ★★★★★ |
| 全文 OCR | ❌（需额外 OCR） | ★★★★★ | ★★★★☆ |
| 数学公式 | ❌ | ★★★★☆ | ★★★★☆ |
| 手写体 | ❌ | ★★★★☆ | ★★★☆☆ |
| SVG 生成 | ❌ | ❌ | ★★★★★ |
| 输出格式 | HTML/CSV | Markdown/HTML/JSON | Markdown/JSON/SVG |
| 语言支持 | N/A | 90+ 语言 | 90+ 语言 |

### 5.3 HTML 报告

每个工具都会生成一个 `report.html` 文件，在浏览器中打开可以看到：
- 原始图片与处理结果的对比
- 提取的文本内容
- 布局检测可视化
- 表格 HTML 渲染

---

## 6. 常见问题

### Q1: 运行时提示 CUDA out of memory

**解决方案**:
- Table Transformer: 改用 CPU 运行 (`det_device="cpu", str_device="cpu"`)
- Chandra/dots.mocr: 关闭其他 GPU 程序，或使用 `device_map="auto"` 让模型自动分配
- 减小输入图片分辨率

### Q2: flash-attn 安装失败

**解决方案**:
- flash-attn 需要 CUDA 编译环境，Windows 上安装可能失败
- 不安装 flash-attn 也可以运行，脚本会自动回退到 `eager` 注意力实现
- 速度会稍慢，但结果完全一致

### Q3: 模型下载速度慢

**解决方案**:
- 使用 HuggingFace 镜像:
  ```bash
  set HF_ENDPOINT=https://hf-mirror.com
  python run_chandra.py
  ```
- 手动下载模型文件放到 `models/` 目录下
- 使用断点续传（脚本已支持）

### Q4: dots.mocr 的模型路径中不能有句号

**注意**: dots.mocr 的模型保存路径不能包含 `.`，脚本中已使用 `DotsMOCR`（而非 `dots.mocr`）作为目录名。

### Q5: Windows 下 git clone 失败

**解决方案**:
- 确保已安装 git: https://git-scm.com/download/win
- 或手动下载仓库 ZIP 并解压到 `dots_mocr_repo/` 目录

### Q6: chandra-ocr[hf] 安装冲突

**解决方案**:
- 使用独立虚拟环境:
  ```bash
  python -m venv venv_chandra
  venv_chandra\Scripts\activate
  pip install chandra-ocr[hf]
  ```

### Q7: 图片中没有检测到表格

Table Transformer 专用于表格检测，如果图片中没有表格或表格不清晰，可能检测不到。建议：
- 确保图片中有明显的表格结构
- 尝试不同的模型权重（如 `TATR-v1.1-Fin` 对财务表格更好）
- 调整检测阈值

---

## 快速开始（三步走）

```bash
# 1. 安装基础依赖
pip install torch torchvision

# 2. 运行 Table Transformer（最轻量，推荐先试）
pip install table-transformer easyocr
python run_table_transformer.py

# 3. 运行 Chandra OCR（全功能文档 OCR）
pip install chandra-ocr[hf] qwen_vl_utils
python run_chandra.py

# 4. 运行 dots.mocr（布局分析 + SVG）
pip install qwen_vl_utils huggingface_hub accelerate
python run_dots_mocr.py
```

每个脚本运行完成后，在对应的 `output_*/report.html` 中查看结果。
