import urllib.request
import os
import time

BASE_URL = "https://zelda.ali213.net/tiles/"
OUTPUT_DIR = "zeldamap/tiles"
MIN_ZOOM = 2
MAX_ZOOM = 5
MIN_SIZE = 1024  # 小于 1KB 的视为无效瓦片

def download_file(url, output_path, retries=3):
    for i in range(retries):
        try:
            req = urllib.request.Request(url)
            req.add_header('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
            response = urllib.request.urlopen(req, timeout=10)
            data = response.read()
            if len(data) > MIN_SIZE:
                os.makedirs(os.path.dirname(output_path), exist_ok=True)
                with open(output_path, 'wb') as f:
                    f.write(data)
                return len(data)
            return 0
        except Exception as e:
            if i < retries - 1:
                time.sleep(0.5)
            else:
                print(f"  下载失败 {url}: {e}")
                return 0

def find_valid_tiles(z):
    valid_tiles = []
    max_xy = 2 ** z
    
    print(f"扫描缩放等级 {z} 的有效瓦片 (范围 0-{max_xy-1})...")
    
    for x in range(max_xy):
        for y in range(max_xy):
            url = f"{BASE_URL}{z}_{x}_{y}.png"
            try:
                req = urllib.request.Request(url, method='HEAD')
                req.add_header('User-Agent', 'Mozilla/5.0')
                response = urllib.request.urlopen(req, timeout=5)
                size = int(response.headers.get('Content-Length', 0))
                if size > MIN_SIZE:
                    valid_tiles.append((x, y, size))
            except:
                pass
    
    return valid_tiles

def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    all_valid = {}
    
    for z in range(MIN_ZOOM, MAX_ZOOM + 1):
        valid_tiles = find_valid_tiles(z)
        all_valid[z] = valid_tiles
        print(f"  找到 {len(valid_tiles)} 个有效瓦片")
        
        if valid_tiles:
            xs = [t[0] for t in valid_tiles]
            ys = [t[1] for t in valid_tiles]
            print(f"  X 范围: {min(xs)}-{max(xs)}, Y 范围: {min(ys)}-{max(ys)}")
        print()
    
    print("开始下载瓦片...")
    total_size = 0
    total_count = 0
    
    for z in range(MIN_ZOOM, MAX_ZOOM + 1):
        valid_tiles = all_valid[z]
        if not valid_tiles:
            continue
            
        z_dir = os.path.join(OUTPUT_DIR, str(z))
        os.makedirs(z_dir, exist_ok=True)
        
        print(f"\n下载缩放等级 {z} ({len(valid_tiles)} 个瓦片)...")
        
        for i, (x, y, _) in enumerate(valid_tiles):
            x_dir = os.path.join(z_dir, str(x))
            os.makedirs(x_dir, exist_ok=True)
            
            output_path = os.path.join(x_dir, f"{y}.png")
            url = f"{BASE_URL}{z}_{x}_{y}.png"
            
            size = download_file(url, output_path)
            if size > 0:
                total_size += size
                total_count += 1
            
            if (i + 1) % 10 == 0:
                print(f"  进度: {i+1}/{len(valid_tiles)}")
            
            time.sleep(0.05)
    
    print(f"\n下载完成！")
    print(f"共下载 {total_count} 个瓦片，总大小: {total_size/1024/1024:.2f} MB")

if __name__ == "__main__":
    main()
