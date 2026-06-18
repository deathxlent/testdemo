import urllib.request
import json
import os
import time

BASE_URL = "https://zelda.ali213.net/data/"
HEADERS = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
OUTPUT_DIR = "zeldamap/data"

os.makedirs(OUTPUT_DIR, exist_ok=True)

def fetch_json(url):
    req = urllib.request.Request(url)
    for k, v in HEADERS.items():
        req.add_header(k, v)
    response = urllib.request.urlopen(req, timeout=15)
    return json.loads(response.read().decode("utf-8"))

# 1. 获取分类数据
print("获取分类数据...")
categories = fetch_json(BASE_URL + "ajax_category.php?mapid=1")
with open(os.path.join(OUTPUT_DIR, "categories.json"), "w", encoding="utf-8") as f:
    json.dump(categories, f, ensure_ascii=False, indent=2)
print(f"共 {len(categories)} 个分类")

# 2. 获取每个分类的坐标数据
all_coords = {}
for cat in categories:
    cat_id = cat["id"]
    cat_name = cat["name"]
    url = BASE_URL + f"ajax_coords.php?mapid=1&categoryid={cat_id}"
    try:
        coords = fetch_json(url)
        all_coords[cat_id] = {
            "name": cat_name,
            "id": cat_id,
            "zoom": cat.get("zoom", ""),
            "iconurl": cat.get("iconurl", ""),
            "iconsize": cat.get("iconsize", ""),
            "iconanchor": cat.get("iconanchor", ""),
            "popupanchor": cat.get("popupanchor", ""),
            "coords": coords
        }
        print(f"  {cat_name} (ID={cat_id}): {len(coords)} 个坐标")
    except Exception as e:
        print(f"  {cat_name} (ID={cat_id}): 获取失败 - {e}")
    time.sleep(0.1)

# 3. 保存完整数据
with open(os.path.join(OUTPUT_DIR, "pois.json"), "w", encoding="utf-8") as f:
    json.dump(all_coords, f, ensure_ascii=False, indent=2)

# 4. 下载图标
icons_dir = os.path.join(OUTPUT_DIR, "icons")
os.makedirs(icons_dir, exist_ok=True)
downloaded_icons = 0
for cat_id, cat_data in all_coords.items():
    icon_url = cat_data.get("iconurl", "")
    if icon_url:
        icon_name = icon_url.split("/")[-1]
        icon_path = os.path.join(icons_dir, icon_name)
        if not os.path.exists(icon_path):
            try:
                req = urllib.request.Request(icon_url)
                for k, v in HEADERS.items():
                    req.add_header(k, v)
                response = urllib.request.urlopen(req, timeout=10)
                data = response.read()
                with open(icon_path, "wb") as f:
                    f.write(data)
                downloaded_icons += 1
                cat_data["icon_local"] = f"data/icons/{icon_name}"
            except Exception as e:
                print(f"  图标下载失败 {icon_name}: {e}")
                cat_data["icon_local"] = icon_url
        else:
            cat_data["icon_local"] = f"data/icons/{icon_name}"

print(f"\n图标下载: {downloaded_icons} 个新图标")

# 5. 重新保存带有本地图标路径的数据
with open(os.path.join(OUTPUT_DIR, "pois.json"), "w", encoding="utf-8") as f:
    json.dump(all_coords, f, ensure_ascii=False, indent=2)

print("完成！")
