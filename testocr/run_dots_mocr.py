import os
import sys
import json
import subprocess
from pathlib import Path

BASE_DIR = Path(__file__).parent.resolve()
MODEL_DIR = BASE_DIR / "models" / "DotsMOCR"
REPO_DIR = BASE_DIR / "dots_mocr_repo"
OUTPUT_DIR = BASE_DIR / "output_dots_mocr"

IMAGES = sorted([f for f in os.listdir(BASE_DIR) if f.lower().endswith(('.jpg', '.jpeg', '.png')) and f.startswith('page_')])

DOTS_MOCR_REPO_URL = "https://github.com/rednote-hilab/dots.mocr.git"
DOTS_MOCR_MODEL_ID = "rednote-hilab/dots.mocr"


def clone_repo():
    if REPO_DIR.exists() and (REPO_DIR / "dots_mocr").exists():
        print(f"[OK] dots.mocr repo already exists at: {REPO_DIR}")
        return

    print(f"[CLONE] Cloning dots.mocr repository ...")
    try:
        subprocess.run(
            ["git", "clone", DOTS_MOCR_REPO_URL, str(REPO_DIR)],
            check=True,
            capture_output=True,
            text=True,
        )
        print(f"[DONE] Repository cloned to {REPO_DIR}")
    except subprocess.CalledProcessError as e:
        print(f"[ERROR] Failed to clone: {e.stderr}")
        sys.exit(1)
    except FileNotFoundError:
        print("[ERROR] git not found. Please install git first.")
        sys.exit(1)


def install_repo():
    dots_pkg = REPO_DIR / "dots_mocr"
    if not dots_pkg.exists():
        print(f"[ERROR] Repository not found at {REPO_DIR}")
        sys.exit(1)

    try:
        import dots_mocr
        print(f"[OK] dots_mocr package already installed")
        return
    except ImportError:
        pass

    print(f"[INSTALL] Installing dots_mocr package ...")
    try:
        subprocess.run(
            [sys.executable, "-m", "pip", "install", "-e", str(REPO_DIR)],
            check=True,
            capture_output=True,
            text=True,
        )
        print(f"[DONE] dots_mocr package installed")
    except subprocess.CalledProcessError as e:
        print(f"[WARN] Install failed: {e.stderr}")
        print(f"       Will try running with sys.path fallback")


def download_model():
    if MODEL_DIR.exists() and any(MODEL_DIR.iterdir()):
        print(f"[OK] dots.mocr model already exists at: {MODEL_DIR}")
        return

    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    print(f"[DOWN] Downloading dots.mocr model to: {MODEL_DIR}")
    print("       This may take a while (model is ~6GB) ...")

    try:
        from huggingface_hub import snapshot_download
        snapshot_download(
            repo_id=DOTS_MOCR_MODEL_ID,
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
        print(f"        You can manually download from: https://huggingface.co/{DOTS_MOCR_MODEL_ID}")
        sys.exit(1)


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


def process_images():
    print("\n" + "=" * 60)
    print("  dots.mocr - Document Layout Analysis & OCR")
    print("=" * 60)

    try:
        import torch
    except ImportError:
        print("[ERROR] PyTorch not installed. Run: pip install torch")
        sys.exit(1)

    if (REPO_DIR / "dots_mocr").exists():
        sys.path.insert(0, str(REPO_DIR))

    try:
        from dots_mocr.utils.prompts import dict_promptmode_to_prompt
    except ImportError:
        print("[ERROR] Cannot import dots_mocr. Make sure the repo is cloned and installed.")
        sys.exit(1)

    try:
        from transformers import AutoModelForCausalLM, AutoProcessor
    except ImportError:
        print("[ERROR] transformers not installed. Run: pip install transformers")
        sys.exit(1)

    try:
        from qwen_vl_utils import process_vision_info
    except ImportError:
        print("[ERROR] qwen_vl_utils not installed. Run: pip install qwen_vl_utils")
        sys.exit(1)

    try:
        from dots_mocr.utils.layout_utils import post_process_output, draw_layout_on_image
        from dots_mocr.utils.image_utils import fetch_image
        from dots_mocr.utils.format_transformer import layoutjson2md
        has_layout_utils = True
    except ImportError:
        print("[WARN] Could not import layout utilities, will use basic output")
        has_layout_utils = False

    device = "cuda" if _has_cuda() else "cpu"
    dtype = "bfloat16" if _has_cuda() and _supports_bf16() else "float32"
    torch_dtype = getattr(torch, dtype)
    attn_impl = "flash_attention_2" if _has_flash_attn() else "eager"

    print(f"[INFO] Using device: {device}, dtype: {dtype}, attention: {attn_impl}")
    print(f"[INFO] Loading model from: {MODEL_DIR}")

    try:
        processor = AutoProcessor.from_pretrained(str(MODEL_DIR), trust_remote_code=True, use_fast=True)
        model = AutoModelForCausalLM.from_pretrained(
            str(MODEL_DIR),
            attn_implementation=attn_impl,
            torch_dtype=torch_dtype,
            device_map="auto" if _has_cuda() else device,
            trust_remote_code=True,
        )
        model.eval()
        print("[OK] Model loaded successfully")
    except Exception as e:
        print(f"[ERROR] Failed to load model: {e}")
        sys.exit(1)

    prompt_mode = "prompt_layout_all_en"
    prompt = dict_promptmode_to_prompt[prompt_mode]
    print(f"[INFO] Using prompt mode: {prompt_mode}")

    all_results = []

    for img_name in IMAGES:
        img_path = str(BASE_DIR / img_name)
        img_out_dir = OUTPUT_DIR / Path(img_name).stem
        img_out_dir.mkdir(parents=True, exist_ok=True)

        print(f"\n[PROC] Processing: {img_name}")

        try:
            pil_image = None
            if has_layout_utils:
                try:
                    pil_image = fetch_image(img_path)
                except Exception:
                    from PIL import Image
                    pil_image = Image.open(img_path).convert("RGB")

            messages = [
                {
                    "role": "user",
                    "content": [
                        {"type": "image", "image": img_path},
                        {"type": "text", "text": prompt},
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
                generated_ids = model.generate(**inputs, max_new_tokens=24000)

            generated_ids_trimmed = [
                out_ids[len(in_ids):]
                for in_ids, out_ids in zip(inputs.input_ids, generated_ids)
            ]
            output_text = processor.batch_decode(
                generated_ids_trimmed,
                skip_special_tokens=True,
                clean_up_tokenization_spaces=False,
            )[0]

            result = {
                "image": img_name,
                "raw_output": output_text,
                "layout_cells": [],
                "md_content": "",
                "error": None,
            }

            if has_layout_utils and pil_image:
                try:
                    cells, filtered = post_process_output(
                        output_text, prompt_mode, pil_image, pil_image
                    )

                    with open(img_out_dir / f"{Path(img_name).stem}.json", "w", encoding="utf-8") as f:
                        json.dump(cells, f, ensure_ascii=False, indent=2)
                    result["layout_cells"] = cells

                    try:
                        img_with_layout = draw_layout_on_image(pil_image, cells)
                        img_with_layout.save(str(img_out_dir / "layout_visualization.jpg"), quality=95)
                        print(f"       Saved layout visualization")
                    except Exception as e:
                        print(f"       [WARN] Could not draw layout: {e}")
                        pil_image.save(str(img_out_dir / "layout_visualization.jpg"), quality=95)

                    md_content = layoutjson2md(pil_image, cells, text_key="text")
                    with open(img_out_dir / f"{Path(img_name).stem}.md", "w", encoding="utf-8") as f:
                        f.write(md_content)
                    result["md_content"] = md_content
                    print(f"       Saved markdown and layout JSON")

                except Exception as e:
                    print(f"       [WARN] Layout post-processing failed: {e}")
                    with open(img_out_dir / f"{Path(img_name).stem}.md", "w", encoding="utf-8") as f:
                        f.write(output_text)
                    result["md_content"] = output_text
                    pil_image.save(str(img_out_dir / "layout_visualization.jpg"), quality=95)
            else:
                with open(img_out_dir / f"{Path(img_name).stem}.md", "w", encoding="utf-8") as f:
                    f.write(output_text)
                result["md_content"] = output_text
                from PIL import Image
                img = Image.open(img_path).convert("RGB")
                img.save(str(img_out_dir / "layout_visualization.jpg"), quality=95)

            with open(img_out_dir / f"{Path(img_name).stem}_raw.json", "w", encoding="utf-8") as f:
                json.dump({"image": img_name, "raw_output": output_text}, f, ensure_ascii=False, indent=2)

            all_results.append(result)

        except Exception as e:
            print(f"       [ERROR] {e}")
            import traceback
            traceback.print_exc()
            all_results.append({
                "image": img_name, "raw_output": "", "layout_cells": [],
                "md_content": "", "error": str(e)
            })

    return all_results


def generate_report(results):
    html_parts = ["""<!DOCTYPE html>
<html lang="zh-CN"><head><meta charset="utf-8">
<title>dots.mocr Results</title>
<style>
body { font-family: 'Segoe UI', Arial, sans-serif; margin: 20px; background: #f5f5f5; }
h1 { color: #333; border-bottom: 2px solid #FF5722; padding-bottom: 10px; }
h2 { color: #555; margin-top: 30px; }
h3 { color: #777; }
.card { background: white; border-radius: 8px; padding: 20px; margin: 15px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
.row { display: flex; gap: 20px; flex-wrap: wrap; }
.img-box { flex: 1; min-width: 300px; }
.img-box img { max-width: 100%; border: 1px solid #ddd; border-radius: 4px; }
.img-box p { text-align: center; color: #666; font-size: 14px; margin-top: 5px; }
.text-box { flex: 1; min-width: 300px; }
.text-box pre { background: #f8f8f8; padding: 15px; border-radius: 4px; overflow-x: auto; font-size: 13px; line-height: 1.6; white-space: pre-wrap; word-wrap: break-word; max-height: 600px; overflow-y: auto; }
.error { color: red; background: #fee; padding: 10px; border-radius: 4px; }
.summary { background: #fbe9e7; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
.layout-stats { background: #fff3e0; padding: 10px 15px; border-radius: 4px; margin: 10px 0; font-size: 14px; }
.md-render { padding: 15px; background: #fafafa; border: 1px solid #eee; border-radius: 4px; max-height: 600px; overflow-y: auto; }
.md-render table { border-collapse: collapse; width: 100%; }
.md-render th, .md-render td { border: 1px solid #ddd; padding: 6px 10px; }
.md-render th { background: #f0f0f0; }
.tab-btn { padding: 8px 16px; border: 1px solid #ddd; background: #f8f8f8; cursor: pointer; border-radius: 4px 4px 0 0; margin-right: 2px; }
.tab-btn.active { background: white; border-bottom: none; font-weight: bold; }
.tab-content { display: none; border: 1px solid #ddd; border-top: none; padding: 15px; border-radius: 0 0 4px 4px; }
.tab-content.active { display: block; }
</style></head><body>
<h1>🔴 dots.mocr - Layout Analysis & OCR Results</h1>
"""]

    success = sum(1 for r in results if not r.get("error"))
    total_elements = sum(len(r.get("layout_cells", [])) for r in results)
    html_parts.append(f'<div class="summary">')
    html_parts.append(f'<strong>Summary:</strong> Processed {len(results)} images, {success} successful, {total_elements} layout elements detected')
    html_parts.append(f'</div>')

    for r in results:
        html_parts.append(f'<div class="card">')
        html_parts.append(f'<h2>{r["image"]}</h2>')

        if r.get("error"):
            html_parts.append(f'<div class="error">Error: {r["error"]}</div>')
        else:
            orig_img = BASE_DIR / r["image"]
            layout_img = OUTPUT_DIR / Path(r["image"]).stem / "layout_visualization.jpg"

            cells = r.get("layout_cells", [])
            if cells:
                categories = {}
                for c in cells:
                    cat = c.get("category", "unknown")
                    categories[cat] = categories.get(cat, 0) + 1
                stats = ", ".join(f"{k}: {v}" for k, v in sorted(categories.items()))
                html_parts.append(f'<div class="layout-stats">Layout elements: {len(cells)} ({stats})</div>')

            html_parts.append(f'<div class="row">')
            html_parts.append(f'<div class="img-box">')
            if orig_img.exists():
                html_parts.append(f'<img src="{orig_img}" />')
                html_parts.append(f'<p>Original</p>')
            html_parts.append(f'</div>')
            html_parts.append(f'<div class="img-box">')
            if layout_img.exists():
                html_parts.append(f'<img src="{layout_img}" />')
                html_parts.append(f'<p>Layout Detection</p>')
            html_parts.append(f'</div>')
            html_parts.append(f'</div>')

            html_parts.append(f'<div style="margin-top:15px;">')
            html_parts.append(f'<button class="tab-btn active" onclick="switchTab(this, \'dots-{r["image"]}\', \'md\')">Markdown</button>')
            html_parts.append(f'<button class="tab-btn" onclick="switchTab(this, \'dots-{r["image"]}\', \'raw\')">Raw Output</button>')
            html_parts.append(f'<button class="tab-btn" onclick="switchTab(this, \'dots-{r["image"]}\', \'json\')">Layout JSON</button>')
            html_parts.append(f'</div>')

            md_escaped = r.get("md_content", "").replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;")
            raw_escaped = r.get("raw_output", "").replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;")
            json_escaped = json.dumps(cells, ensure_ascii=False, indent=2).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

            html_parts.append(f'<div id="dots-{r["image"]}-md" class="tab-content active"><pre>{md_escaped}</pre></div>')
            html_parts.append(f'<div id="dots-{r["image"]}-raw" class="tab-content"><pre>{raw_escaped}</pre></div>')
            html_parts.append(f'<div id="dots-{r["image"]}-json" class="tab-content"><pre>{json_escaped}</pre></div>')

        html_parts.append(f'</div>')

    html_parts.append("""
<script>
function switchTab(btn, prefix, tab) {
    var parent = btn.parentElement;
    var btns = parent.querySelectorAll('.tab-btn');
    btns.forEach(function(b) { b.classList.remove('active'); });
    btn.classList.add('active');
    ['md', 'raw', 'json'].forEach(function(t) {
        var el = document.getElementById(prefix + '-' + t);
        if (el) el.classList.remove('active');
    });
    var activeEl = document.getElementById(prefix + '-' + tab);
    if (activeEl) activeEl.classList.add('active');
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


if __name__ == "__main__":
    print("Step 1: Clone dots.mocr repository")
    clone_repo()
    print("\nStep 2: Install dots.mocr package")
    install_repo()
    print("\nStep 3: Download model (if needed)")
    download_model()
    print("\nStep 4: Process images")
    results = process_images()
    print("\nStep 5: Generate report")
    generate_report(results)
