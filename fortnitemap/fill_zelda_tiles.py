import urllib.request
import os
import time

BASE_URL = "https://zelda.ali213.net/tiles/"
OUTPUT_DIR = "zeldamap/tiles"
MIN_ZOOM = 2
MAX_ZOOM = 5
TILE_SIZE = 256

bounds = {
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

def download_tile(z, x, y, retries=3):
    url = f"{BASE_URL}{z}_{x}_{y}.png"
    output_dir = os.path.join(OUTPUT_DIR, str(z), str(x))
    output_path = os.path.join(output_dir, f"{y}.png")
    
    if os.path.exists(output_path):
        return "exists"
    
    os.makedirs(output_dir, exist_ok=True)
    
    for i in range(retries):
        try:
            req = urllib.request.Request(url)
            req.add_header('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
            response = urllib.request.urlopen(req, timeout=10)
            data = response.read()
            
            with open(output_path, 'wb') as f:
                f.write(data)
            return "downloaded"
        except Exception as e:
            if i < retries - 1:
                time.sleep(0.3)
            else:
                return f"error: {e}"

def main():
    total_tiles = 0
    downloaded = 0
    existed = 0
    errors = 0
    
    for z in range(MIN_ZOOM, MAX_ZOOM + 1):
        min_tile_x, max_tile_y = latlng_to_tile(bounds["min_lat"], bounds["min_lng"], z)
        max_tile_x, min_tile_y = latlng_to_tile(bounds["max_lat"], bounds["max_lng"], z)
        
        min_tile_x = max(0, min_tile_x)
        min_tile_y = max(0, min_tile_y)
        
        num_tiles = (max_tile_x - min_tile_x + 1) * (max_tile_y - min_tile_y + 1)
        total_tiles += num_tiles
        
        print(f"缩放等级 {z}: x[{min_tile_x}-{max_tile_x}], y[{min_tile_y}-{max_tile_y}], 共 {num_tiles} 个瓦片")
        
        count = 0
        for x in range(min_tile_x, max_tile_x + 1):
            for y in range(min_tile_y, max_tile_y + 1):
                result = download_tile(z, x, y)
                if result == "downloaded":
                    downloaded += 1
                elif result == "exists":
                    existed += 1
                else:
                    errors += 1
                count += 1
                
                if count % 20 == 0:
                    print(f"  进度: {count}/{num_tiles}")
                
                time.sleep(0.02)
    
    print(f"\n完成！总计 {total_tiles} 个瓦片")
    print(f"  已下载: {downloaded}")
    print(f"  已存在: {existed}")
    print(f"  错误: {errors}")

if __name__ == "__main__":
    main()
