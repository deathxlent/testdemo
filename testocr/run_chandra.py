import os
import sys
import json
import shutil
from pathlib import Path

BASE_DIR = Path(__file__).parent.resolve()
MODEL_DIR = BASE_DIR / "models" / "chandra-ocr-2"
OUTPUT_DIR = BASE_DIR / "output_chandra"

IMAGES = sorted([f for f in os.listdir(BASE_DIR) if f.lower().endswith(('.jpg', '.jpeg', '.png')) and f.startswith('page_')])

MODEL_CHECKPOINT = "datalab-to/chandra-ocr-2"


def download_model():
    if MODEL_DIR.exists() and any(MODEL_DIR.iterdir()):
        print(f"[OK] Chandra model already exists at: {MODEL_DIR}")
        return

    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    print(f"[DOWN] Downloading Chandra OCR 2 model to: {MODEL_DIR}")
    print("       This may take a while (model is ~10GB) ...")

    try:
        from huggingface_hub import snapshot_download
        snapshot_download(
            repo_id=MODEL_CHECKPOINT,
            local_dir=str(MODEL_DIR),
            local_dir_use_symlinks=False,
            resume_download=True,
        )
        print(f"[DONE] Model downloaded to {MODEL_DIR}")
    except ImportError:
        print("[ERROR] huggingface_hub not installed. Run: pip install huggingface_hub")
        sys.exit(1)
    except Exception as e:
        print(f"[ERROR] Failed to download model: {e}")
        print("        You can manually download from: https://huggingface.co/datalab-to/chandra-ocr-2")
        sys.exit(1)


def process_images():
    print("\n" + "=" * 60)
    print("  Chandra OCR 2 - Document to Markdown/HTML/JSON")
    print("=" * 60)

    try:
        import torch
    except ImportError:
        print("[ERROR] PyTorch not installed. Run: pip install torch")
        sys.exit(1)

    try:
        from transformers import AutoProcessor, Qwen2_5_VLForConditionalGeneration
    except ImportError:
        try:
            from transformers import AutoModelForCausalLM as Qwen2_5_VLForConditionalGeneration
            from transformers import AutoProcessor
        except ImportError:
            print("[ERROR] transformers not installed. Run: pip install transformers")
            sys.exit(1)

    try:
        from qwen_vl_utils import process_vision_info
    except ImportError:
        print("[ERROR] qwen_vl_utils not installed. Run: pip install qwen_vl_utils")
        sys.exit(1)

    device = "cuda" if _has_cuda() else "cpu"
    dtype = "bfloat16" if _has_cuda() and _supports_bf16() else "float32"
    torch_dtype = getattr(torch, dtype)

    print(f"[INFO] Using device: {device}, dtype: {dtype}")
    print(f"[INFO] Loading model from: {MODEL_DIR}")

    try:
        attn_impl = "flash_attention_2" if _has_flash_attn() else "eager"
        print(f"[INFO] Attention implementation: {attn_impl}")

        processor = AutoProcessor.from_pretrained(str(MODEL_DIR), trust_remote_code=True)

        model = Qwen2_5_VLForConditionalGeneration.from_pretrained(
            str(MODEL_DIR),
            torch_dtype=torch_dtype,
            device_map=device if device == "cuda" else "auto",
            attn_implementation=attn_impl,
            trust_remote_code=True,
        )
        model.eval()
        print("[OK] Model loaded successfully")
    except Exception as e:
        print(f"[ERROR] Failed to load model: {e}")
        print("        Try installing: pip install accelerate")
        sys.exit(1)

    chandra_prompt = "Convert this document image to markdown, preserving the layout, tables, and formatting."

    all_results = []

    for img_name in IMAGES:
        img_path = str(BASE_DIR / img_name)
        img_out_dir = OUTPUT_DIR / Path(img_name).stem
        img_out_dir.mkdir(parents=True, exist_ok=True)

        print(f"\n[PROC] Processing: {img_name}")

        try:
            messages = [
                {
                    "role": "user",
                    "content": [
                        {"type": "image", "image": img_path},
                        {"type": "text", "text": chandra_prompt},
                    ],
                }
            ]

            text = processor.apply_chat_template(
                messages, tokenize=False, add_generation_prompt=True
            )
            image_inputs, video_inputs = process_vision_info(messages)
            inputs = processor(
                text=[text],
                images=image_inputs,
                videos=video_inputs,
                padding=True,
                return_tensors="pt",
            ).to(model.device)

            with torch.no_grad():
                generated_ids = model.generate(**inputs, max_new_tokens=16384)

            generated_ids_trimmed = [
                out_ids[len(in_ids):]
                for in_ids, out_ids in zip(inputs.input_ids, generated_ids)
            ]
            output_text = processor.batch_decode(
                generated_ids_trimmed,
                skip_special_tokens=True,
                clean_up_tokenization_spaces=False,
            )[0]

            md_path = img_out_dir / f"{Path(img_name).stem}.md"
            with open(md_path, "w", encoding="utf-8") as f:
                f.write(output_text)
            print(f"       Saved markdown: {md_path}")

            json_path = img_out_dir / f"{Path(img_name).stem}.json"
            with open(json_path, "w", encoding="utf-8") as f:
                json.dump({"image": img_name, "output": output_text}, f, ensure_ascii=False, indent=2)

            result = {
                "image": img_name,
                "output_md": output_text,
                "md_path": str(md_path),
                "error": None,
            }
            all_results.append(result)

        except Exception as e:
            print(f"       [ERROR] {e}")
            import traceback
            traceback.print_exc()
            all_results.append({"image": img_name, "output_md": "", "md_path": "", "error": str(e)})

    return all_results


def _has_cuda():
    try:
        import torch
        return torch.cuda.is_available()
    except ImportError:
        return False


def _supports_bf16():
    try:
        import torch
        return torch.cuda.is_available() and torch.cuda.is_bf16_supported()
    except Exception:
        return False


def _has_flash_attn():
    try:
        import flash_attn
        return True
    except ImportError:
        return False


def generate_report(results):
    html_parts = ["""<!DOCTYPE html>
<html lang="zh-CN"><head><meta charset="utf-8">
<title>Chandra OCR 2 Results</title>
<style>
body { font-family: 'Segoe UI', Arial, sans-serif; margin: 20px; background: #f5f5f5; }
h1 { color: #333; border-bottom: 2px solid #2196F3; padding-bottom: 10px; }
h2 { color: #555; margin-top: 30px; }
.card { background: white; border-radius: 8px; padding: 20px; margin: 15px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
.img-text-row { display: flex; gap: 20px; flex-wrap: wrap; }
.img-box { flex: 1; min-width: 300px; }
.img-box img { max-width: 100%; border: 1px solid #ddd; border-radius: 4px; }
.img-box p { text-align: center; color: #666; font-size: 14px; margin-top: 5px; }
.text-box { flex: 1; min-width: 300px; }
.text-box pre { background: #f8f8f8; padding: 15px; border-radius: 4px; overflow-x: auto; font-size: 13px; line-height: 1.6; white-space: pre-wrap; word-wrap: break-word; max-height: 600px; overflow-y: auto; }
.error { color: red; background: #fee; padding: 10px; border-radius: 4px; }
.summary { background: #e3f2fd; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
.md-render { padding: 15px; background: #fafafa; border: 1px solid #eee; border-radius: 4px; }
.md-render h1,.md-render h2,.md-render h3 { margin-top: 10px; }
.md-render table { border-collapse: collapse; width: 100%; }
.md-render th, .md-render td { border: 1px solid #ddd; padding: 6px 10px; }
.md-render th { background: #f0f0f0; }
.tab-btn { padding: 8px 16px; border: 1px solid #ddd; background: #f8f8f8; cursor: pointer; border-radius: 4px 4px 0 0; }
.tab-btn.active { background: white; border-bottom: none; }
.tab-content { display: none; border: 1px solid #ddd; border-top: none; padding: 15px; border-radius: 0 0 4px 4px; }
.tab-content.active { display: block; }
</style></head><body>
<h1>📄 Chandra OCR 2 - Document Parsing Results</h1>
"""]

    success = sum(1 for r in results if not r.get("error"))
    html_parts.append(f'<div class="summary">')
    html_parts.append(f'<strong>Summary:</strong> Processed {len(results)} images, {success} successful')
    html_parts.append(f'</div>')

    for r in results:
        html_parts.append(f'<div class="card">')
        html_parts.append(f'<h2>{r["image"]}</h2>')

        if r.get("error"):
            html_parts.append(f'<div class="error">Error: {r["error"]}</div>')
        else:
            orig_img = BASE_DIR / r["image"]
            html_parts.append(f'<div class="img-text-row">')
            html_parts.append(f'<div class="img-box">')
            if orig_img.exists():
                html_parts.append(f'<img src="{orig_img}" />')
                html_parts.append(f'<p>Original Image</p>')
            html_parts.append(f'</div>')
            html_parts.append(f'<div class="text-box">')
            html_parts.append(f'<div>')
            html_parts.append(f'<button class="tab-btn active" onclick="switchTab(this, \'md-{r["image"]}\', \'raw\')">Markdown (raw)</button>')
            html_parts.append(f'<button class="tab-btn" onclick="switchTab(this, \'md-{r["image"]}\', \'render\')">Markdown (rendered)</button>')
            html_parts.append(f'</div>')
            escaped_md = r["output_md"].replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;")
            html_parts.append(f'<div id="md-{r["image"]}-raw" class="tab-content active"><pre>{escaped_md}</pre></div>')
            html_parts.append(f'<div id="md-{r["image"]}-render" class="tab-content"><div class="md-render">{_md_to_html(r["output_md"])}</div></div>')
            html_parts.append(f'</div>')
            html_parts.append(f'</div>')

            if r.get("md_path") and Path(r["md_path"]).exists():
                html_parts.append(f'<p><a href="{r["md_path"]}" download>📥 Download Markdown</a></p>')

        html_parts.append(f'</div>')

    html_parts.append("""
<script>
function switchTab(btn, prefix, tab) {
    var parent = btn.parentElement;
    var btns = parent.querySelectorAll('.tab-btn');
    btns.forEach(function(b) { b.classList.remove('active'); });
    btn.classList.add('active');
    var rawEl = document.getElementById(prefix + '-raw');
    var renderEl = document.getElementById(prefix + '-render');
    if (tab === 'raw') {
        rawEl.classList.add('active');
        renderEl.classList.remove('active');
    } else {
        rawEl.classList.remove('active');
        renderEl.classList.add('active');
    }
}
</script>
""")
    html_parts.append("</body></html>")

    report_path = OUTPUT_DIR / "report.html"
    with open(report_path, "w", encoding="utf-8") as f:
        f.write("\n".join(html_parts))

    print(f"\n{'=' * 60}")
    print(f"  Report generated: {report_path}")
    print(f"  Open in browser to view results")
    print(f"{'=' * 60}")


def _md_to_html(md_text):
    lines = md_text.split("\n")
    html_lines = []
    in_table = False
    in_code = False

    for line in lines:
        if line.strip().startswith("```"):
            if in_code:
                html_lines.append("</code></pre>")
                in_code = False
            else:
                html_lines.append("<pre><code>")
                in_code = True
            continue

        if in_code:
            html_lines.append(line.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"))
            continue

        if "|" in line and line.strip().startswith("|"):
            if not in_table:
                html_lines.append("<table>")
                in_table = True
            cells = [c.strip() for c in line.strip().split("|")[1:-1]]
            if all(set(c) <= set("- :") for c in cells):
                continue
            tag = "th" if not any(html_lines) or html_lines[-1] == "<table>" else "td"
            row = "<tr>" + "".join(f"<{tag}>{c}</{tag}>" for c in cells) + "</tr>"
            html_lines.append(row)
        else:
            if in_table:
                html_lines.append("</table>")
                in_table = False

            if line.startswith("### "):
                html_lines.append(f"<h3>{line[4:]}</h3>")
            elif line.startswith("## "):
                html_lines.append(f"<h2>{line[3:]}</h2>")
            elif line.startswith("# "):
                html_lines.append(f"<h1>{line[2:]}</h1>")
            elif line.strip() == "":
                html_lines.append("<br/>")
            else:
                processed = line.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
                processed = processed.replace("**", "<strong>", 1)
                while "**" in processed:
                    processed = processed.replace("**", "</strong>", 1) if "</strong>" not in processed[:processed.index("**")] or processed.count("<strong>") > processed.count("</strong>") else processed.replace("**", "<strong>", 1)
                html_lines.append(f"<p>{processed}</p>")

    if in_table:
        html_lines.append("</table>")

    return "\n".join(html_lines)


if __name__ == "__main__":
    print("Step 1: Download model (if needed)")
    download_model()
    print("\nStep 2: Process images")
    results = process_images()
    print("\nStep 3: Generate report")
    generate_report(results)
