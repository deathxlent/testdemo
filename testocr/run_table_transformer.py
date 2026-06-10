import os
import sys
import json
import urllib.request
from pathlib import Path

BASE_DIR = Path(__file__).parent.resolve()
MODEL_DIR = BASE_DIR / "models" / "table_transformer"
OUTPUT_DIR = BASE_DIR / "output_table_transformer"

DETECTION_MODEL_URL = "https://huggingface.co/bsmock/tatr-pubtables1m-v1.0/resolve/main/pubtables1m_detection_detr_r18.pth"
STRUCTURE_MODEL_URL = "https://huggingface.co/bsmock/TATR-v1.1-All/resolve/main/TATR-v1.1-All-msft.pth"
DETECTION_MODEL_PATH = MODEL_DIR / "pubtables1m_detection_detr_r18.pth"
STRUCTURE_MODEL_PATH = MODEL_DIR / "TATR-v1.1-All-msft.pth"

IMAGES = sorted([f for f in os.listdir(BASE_DIR) if f.lower().endswith(('.jpg', '.jpeg', '.png')) and f.startswith('page_')])


def download_file(url, dest, desc=""):
    if dest.exists():
        print(f"[OK] {desc} already exists: {dest}")
        return
    print(f"[DOWN] Downloading {desc} ...")
    print(f"       URL: {url}")
    dest.parent.mkdir(parents=True, exist_ok=True)
    tmp = dest.with_suffix(dest.suffix + ".tmp")
    try:
        urllib.request.urlretrieve(url, str(tmp), reporthook=lambda n, b, t: print_progress(n, b, t, desc))
        tmp.rename(dest)
        print(f"\n[DONE] {desc} saved to {dest}")
    except Exception as e:
        if tmp.exists():
            tmp.unlink()
        print(f"\n[ERROR] Failed to download {desc}: {e}")
        sys.exit(1)


def print_progress(block_num, block_size, total_size, desc=""):
    downloaded = block_num * block_size
    if total_size > 0:
        pct = min(downloaded / total_size * 100, 100)
        mb_down = downloaded / (1024 * 1024)
        mb_total = total_size / (1024 * 1024)
        sys.stdout.write(f"\r       {desc}: {mb_down:.1f}/{mb_total:.1f} MB ({pct:.1f}%)")
        sys.stdout.flush()


def download_models():
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    download_file(DETECTION_MODEL_URL, DETECTION_MODEL_PATH, "Detection Model")
    download_file(STRUCTURE_MODEL_URL, STRUCTURE_MODEL_PATH, "Structure Model")


def process_images():
    try:
        from table_transformer import TableExtractionPipeline
    except ImportError:
        print("[ERROR] table-transformer not installed. Run: pip install table-transformer")
        sys.exit(1)

    try:
        import easyocr
    except ImportError:
        print("[WARN] easyocr not installed, text recognition may not work. Run: pip install easyocr")

    print("\n" + "=" * 60)
    print("  Table Transformer - Table Extraction Pipeline")
    print("=" * 60)

    device = "cuda" if _has_cuda() else "cpu"
    print(f"[INFO] Using device: {device}")

    pipe = TableExtractionPipeline(
        det_device=device,
        str_device=device,
        det_model_path=str(DETECTION_MODEL_PATH),
        str_model_path=str(STRUCTURE_MODEL_PATH),
    )

    all_results = []

    for img_name in IMAGES:
        img_path = str(BASE_DIR / img_name)
        img_out_dir = OUTPUT_DIR / Path(img_name).stem
        img_out_dir.mkdir(parents=True, exist_ok=True)

        print(f"\n[PROC] Processing: {img_name}")

        try:
            table_objects, table_cells_coords, table_cells_text = pipe(img_path)
            result = {
                "image": img_name,
                "num_tables": len(table_objects) if table_objects else 0,
                "tables": [],
                "error": None
            }

            if table_objects:
                print(f"       Found {len(table_objects)} table(s)")
                for i, (objs, coords, text) in enumerate(
                    zip(
                        table_objects if table_objects else [],
                        table_cells_coords if table_cells_coords else [],
                        table_cells_text if table_cells_text else [],
                    )
                ):
                    table_info = {"index": i + 1}
                    if hasattr(text, 'to_html'):
                        html_str = text.to_html(index=False, escape=False)
                        table_info["html"] = html_str
                        with open(img_out_dir / f"table_{i+1}.html", "w", encoding="utf-8") as f:
                            f.write(_wrap_html(html_str, f"Table {i+1} - {img_name}"))
                        print(f"       Table {i+1}: saved HTML")

                    if hasattr(text, 'to_csv'):
                        csv_str = text.to_csv(index=False)
                        table_info["csv"] = csv_str
                        with open(img_out_dir / f"table_{i+1}.csv", "w", encoding="utf-8", newline="") as f:
                            f.write(csv_str)
                        print(f"       Table {i+1}: saved CSV")

                    result["tables"].append(table_info)
            else:
                print(f"       No tables detected")

            _draw_detection_visualization(img_path, table_objects, img_out_dir / "detection_result.jpg")
            _draw_structure_visualization(img_path, table_cells_coords, img_out_dir / "structure_result.jpg")

            result["detection_image"] = str(img_out_dir / "detection_result.jpg")
            result["structure_image"] = str(img_out_dir / "structure_result.jpg")

        except Exception as e:
            print(f"       [ERROR] {e}")
            result = {"image": img_name, "num_tables": 0, "tables": [], "error": str(e)}

        all_results.append(result)

    return all_results


def _has_cuda():
    try:
        import torch
        return torch.cuda.is_available()
    except ImportError:
        return False


def _wrap_html(table_html, title="Table"):
    return f"""<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>{title}</title>
<style>
body {{ font-family: Arial, sans-serif; margin: 20px; }}
table {{ border-collapse: collapse; width: 100%; }}
th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
th {{ background-color: #4CAF50; color: white; }}
tr:nth-child(even) {{ background-color: #f2f2f2; }}
</style></head><body><h2>{title}</h2>{table_html}</body></html>"""


def _draw_detection_visualization(img_path, table_objects, out_path):
    from PIL import Image, ImageDraw
    img = Image.open(img_path).convert("RGB")
    draw = ImageDraw.Draw(img)
    colors = ["red", "blue", "green", "orange", "purple", "cyan"]

    if table_objects:
        for i, tbl in enumerate(table_objects):
            if isinstance(tbl, list):
                for obj in tbl:
                    bbox = obj.get("bbox", obj) if isinstance(obj, dict) else obj
                    if len(bbox) == 4:
                        color = colors[i % len(colors)]
                        draw.rectangle(bbox, outline=color, width=3)
                        draw.text((bbox[0], bbox[1] - 15), f"Table {i+1}", fill=color)
            elif isinstance(tbl, dict):
                bbox = tbl.get("bbox", tbl)
                if isinstance(bbox, (list, tuple)) and len(bbox) == 4:
                    color = colors[0]
                    draw.rectangle(bbox, outline=color, width=3)

    img.save(str(out_path), quality=95)
    print(f"       Saved detection visualization: {out_path}")


def _draw_structure_visualization(img_path, table_cells_coords, out_path):
    from PIL import Image, ImageDraw
    img = Image.open(img_path).convert("RGB")
    draw = ImageDraw.Draw(img)

    colors = {
        "row": "blue",
        "column": "green",
        "header": "red",
        "cell": "orange",
    }

    if table_cells_coords:
        for tbl_cells in table_cells_coords:
            if isinstance(tbl_cells, list):
                for cell in tbl_cells:
                    if isinstance(cell, dict):
                        bbox = cell.get("bbox", [])
                        if len(bbox) == 4:
                            color = colors.get(cell.get("type", "cell"), "orange")
                            draw.rectangle(bbox, outline=color, width=2)

    img.save(str(out_path), quality=95)
    print(f"       Saved structure visualization: {out_path}")


def generate_report(results):
    html_parts = ["""<!DOCTYPE html>
<html lang="zh-CN"><head><meta charset="utf-8">
<title>Table Transformer Results</title>
<style>
body { font-family: 'Segoe UI', Arial, sans-serif; margin: 20px; background: #f5f5f5; }
h1 { color: #333; border-bottom: 2px solid #4CAF50; padding-bottom: 10px; }
h2 { color: #555; margin-top: 30px; }
.card { background: white; border-radius: 8px; padding: 20px; margin: 15px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
.img-container { display: flex; gap: 20px; flex-wrap: wrap; }
.img-box { flex: 1; min-width: 300px; }
.img-box img { max-width: 100%; border: 1px solid #ddd; border-radius: 4px; }
.img-box p { text-align: center; color: #666; font-size: 14px; margin-top: 5px; }
.table-container { margin-top: 15px; overflow-x: auto; }
.table-container table { border-collapse: collapse; width: 100%; }
.table-container th, .table-container td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 13px; }
.table-container th { background-color: #4CAF50; color: white; }
.table-container tr:nth-child(even) { background-color: #f2f2f2; }
.error { color: red; background: #fee; padding: 10px; border-radius: 4px; }
.no-table { color: #888; font-style: italic; }
.summary { background: #e8f5e9; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
</style></head><body>
<h1>🔍 Table Transformer - Table Detection & Structure Recognition Results</h1>
"""]

    total_tables = sum(r["num_tables"] for r in results)
    html_parts.append(f'<div class="summary">')
    html_parts.append(f'<strong>Summary:</strong> Processed {len(results)} images, detected {total_tables} table(s)')
    html_parts.append(f'</div>')

    for r in results:
        html_parts.append(f'<div class="card">')
        html_parts.append(f'<h2>{r["image"]}</h2>')

        if r.get("error"):
            html_parts.append(f'<div class="error">Error: {r["error"]}</div>')
        elif r["num_tables"] == 0:
            html_parts.append(f'<p class="no-table">No tables detected in this image</p>')
            det_img = OUTPUT_DIR / Path(r["image"]).stem / "detection_result.jpg"
            if det_img.exists():
                html_parts.append(f'<div class="img-container"><div class="img-box">')
                html_parts.append(f'<img src="{det_img}" />')
                html_parts.append(f'<p>Detection Result (no tables found)</p>')
                html_parts.append(f'</div></div>')
        else:
            html_parts.append(f'<p>Detected <strong>{r["num_tables"]}</strong> table(s)</p>')

            img_container_parts = []
            det_img = OUTPUT_DIR / Path(r["image"]).stem / "detection_result.jpg"
            struct_img = OUTPUT_DIR / Path(r["image"]).stem / "structure_result.jpg"
            orig_img = BASE_DIR / r["image"]

            if orig_img.exists():
                img_container_parts.append(f'<div class="img-box"><img src="{orig_img}" /><p>Original</p></div>')
            if det_img.exists():
                img_container_parts.append(f'<div class="img-box"><img src="{det_img}" /><p>Detection Result</p></div>')
            if struct_img.exists():
                img_container_parts.append(f'<div class="img-box"><img src="{struct_img}" /><p>Structure Result</p></div>')

            if img_container_parts:
                html_parts.append(f'<div class="img-container">{"".join(img_container_parts)}</div>')

            for tbl in r.get("tables", []):
                if "html" in tbl:
                    html_parts.append(f'<h3>Table {tbl["index"]}</h3>')
                    html_parts.append(f'<div class="table-container">{tbl["html"]}</div>')
                    csv_path = OUTPUT_DIR / Path(r["image"]).stem / f'table_{tbl["index"]}.csv'
                    if csv_path.exists():
                        html_parts.append(f'<p><a href="{csv_path}" download>📥 Download CSV</a></p>')

        html_parts.append(f'</div>')

    html_parts.append("</body></html>")

    report_path = OUTPUT_DIR / "report.html"
    with open(report_path, "w", encoding="utf-8") as f:
        f.write("\n".join(html_parts))

    print(f"\n{'=' * 60}")
    print(f"  Report generated: {report_path}")
    print(f"  Open in browser to view results")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    print("Step 1: Download model weights")
    download_models()
    print("\nStep 2: Process images")
    results = process_images()
    print("\nStep 3: Generate report")
    generate_report(results)
