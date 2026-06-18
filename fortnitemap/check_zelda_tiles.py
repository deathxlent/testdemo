import os
import urllib.request
import time

BASE_URL = "https://zelda.ali213.net/tiles/"
TILES_DIR = "zeldamap/tiles"
MIN_ZOOM = 2
MAX_ZOOM = 5
TILE_SIZE = 256
HEADERS = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}

bounds_info = {
    "min_lat": -206.5,
    "max_lat": -50.5,
    "min_lng": 34.75,
    "max_lng": 221.5
}

def latlng_to_tile(lat, lng, zoom):
    scale = 2 ** zoom
    pixel_x = lng * scale
    pixel_y = -lat * scale
    tile_x = int(pixel_x // TILE_SIZE)
    tile_y = int(pixel_y // TILE_SIZE)
    return tile_x, tile_y

def download_tile(z, x, y, retries=2):
    url = f"{BASE_URL}{z}_{x}_{y}.png"
    output_dir = os.path.join(TILES_DIR, str(z), str(x))
    output_path = os.path.join(output_dir, f"{y}.png")
    
    if os.path.exists(output_path):
        return "exists"
    
    os.makedirs(output_dir, exist_ok=True)
    
    for i in range(retries):
        try:
            req = urllib.request.Request(url)
            for k, v in HEADERS.items():
                req.add_header(k, v)
            response = urllib.request.urlopen(req, timeout=10)
            data = response.read()
            with open(output_path, "wb") as f:
                f.write(data)
            return "downloaded"
        except Exception as e:
            if i < retries - 1:
                time.sleep(0.3)
    return "missing"

missing_tiles = []
total_checked = 0
total_local = 0
total_downloaded = 0
total_missing = 0

for z in range(MIN_ZOOM, MAX_ZOOM + 1):
    min_tx, max_ty = latlng_to_tile(bounds_info["min_lat"], bounds_info["min_lng"], z)
    max_tx, min_ty = latlng_to_tile(bounds_info["max_lat"], bounds_info["max_lng"], z)
    
    min_tx = max(0, min_tx)
    min_ty = max(0, min_ty)
    
    # 也检查边界外一格
    min_tx = max(0, min_tx - 1)
    min_ty = max(0, min_ty - 1)
    max_tx += 1
    max_ty += 1
    
    z_missing = 0
    z_checked = 0
    z_local = 0
    z_downloaded = 0
    
    for x in range(min_tx, max_tx + 1):
        for y in range(min_ty, max_ty + 1):
            z_checked += 1
            result = download_tile(z, x, y)
            if result == "exists":
                z_local += 1
            elif result == "downloaded":
                z_downloaded += 1
            else:
                z_missing += 1
                missing_tiles.append((z, x, y))
    
    total_checked += z_checked
    total_local += z_local
    total_downloaded += z_downloaded
    total_missing += z_missing
    
    print(f"z={z}: 检查 {z_checked} 个, 已有 {z_local}, 新下载 {z_downloaded}, 缺失 {z_missing}")

print(f"\n总计: 检查 {total_checked}, 已有 {total_local}, 新下载 {total_downloaded}, 缺失 {total_missing}")
if missing_tiles:
    print(f"\n缺失瓦片列表:")
    for z, x, y in missing_tiles:
        print(f"  z={z}, x={x}, y={y}")
