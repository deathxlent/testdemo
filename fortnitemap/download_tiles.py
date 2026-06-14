import urllib.request
import os
import time
import concurrent.futures
import threading
import json

BASE_URL = "https://fortnite.gg/maps/41.00/{z}/{x}/{y}.webp"
TILES_DIR = "tiles"
MAX_WORKERS = 16

lock = threading.Lock()
stats = {'downloaded': 0, 'existed': 0, 'failed': 0, 'total': 0, 'exists': 0}

def check_tile_exists(z, x, y):
    url = BASE_URL.format(z=z, x=x, y=y)
    try:
        req = urllib.request.Request(url, headers={
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Referer': 'https://fortnite.gg/'
        })
        req.get_method = lambda: 'HEAD'
        with urllib.request.urlopen(req, timeout=5) as response:
            if response.status == 200 and int(response.headers.get('Content-Length', 1000)) > 100:
                return True
    except:
        pass
    return False

def download_tile(z, x, y):
    url = BASE_URL.format(z=z, x=x, y=y)
    dir_path = os.path.join(TILES_DIR, str(z), str(x))
    file_path = os.path.join(dir_path, f"{y}.webp")
    
    if os.path.exists(file_path) and os.path.getsize(file_path) > 0:
        with lock:
            stats['existed'] += 1
        return True
    
    os.makedirs(dir_path, exist_ok=True)
    
    for attempt in range(3):
        try:
            req = urllib.request.Request(url, headers={
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://fortnite.gg/'
            })
            with urllib.request.urlopen(req, timeout=15) as response:
                if response.status == 200:
                    data = response.read()
                    if len(data) > 100:
                        with open(file_path, 'wb') as f:
                            f.write(data)
                        with lock:
                            stats['downloaded'] += 1
                        return True
        except Exception as e:
            if attempt < 2:
                time.sleep(0.5)
                continue
    
    with lock:
        stats['failed'] += 1
    return False

def probe_tiles():
    print("正在探测瓦片存在范围...")
    
    tile_ranges = {}
    
    for z in [4, 5, 6]:
        print(f"\n探测 zoom {z}...")
        
        max_x = 2 ** z
        max_y = 2 ** z
        
        x_exists = []
        for x in range(max_x):
            if check_tile_exists(z, x, max_y // 2):
                x_exists.append(x)
        
        if not x_exists:
            print(f"  未找到 x 方向的瓦片")
            continue
        
        min_x, max_x_found = x_exists[0], x_exists[-1]
        
        y_exists = []
        mid_x = (min_x + max_x_found) // 2
        for y in range(max_y):
            if check_tile_exists(z, mid_x, y):
                y_exists.append(y)
        
        if not y_exists:
            print(f"  未找到 y 方向的瓦片")
            continue
        
        min_y, max_y_found = y_exists[0], y_exists[-1]
        
        tile_ranges[z] = {'x': (min_x, max_x_found), 'y': (min_y, max_y_found)}
        print(f"  初步范围: x={min_x}-{max_x_found}, y={min_y}-{max_y_found}")
    
    return tile_ranges

def main():
    tile_ranges = probe_tiles()
    
    print("\n\n最终瓦片范围:")
    for z in sorted(tile_ranges.keys()):
        r = tile_ranges[z]
        count = (r['x'][1] - r['x'][0] + 1) * (r['y'][1] - r['y'][0] + 1)
        print(f"  Zoom {z}: x={r['x'][0]}-{r['x'][1]}, y={r['y'][0]}-{r['y'][1]} ({count} 个瓦片)")
    
    all_tiles = []
    for z in sorted(tile_ranges.keys()):
        r = tile_ranges[z]
        for x in range(r['x'][0], r['x'][1] + 1):
            for y in range(r['y'][0], r['y'][1] + 1):
                all_tiles.append((z, x, y))
    
    stats['total'] = len(all_tiles)
    print(f"\n总共需要处理 {len(all_tiles)} 个瓦片")
    
    print(f"\n开始下载 (并发数: {MAX_WORKERS})...")
    
    start_time = time.time()
    last_report = start_time
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = [executor.submit(download_tile, z, x, y) for z, x, y in all_tiles]
        
        done = 0
        for future in concurrent.futures.as_completed(futures):
            done += 1
            now = time.time()
            if now - last_report > 2:
                elapsed = now - start_time
                rate = done / elapsed if elapsed > 0 else 0
                remaining = (stats['total'] - done) / rate if rate > 0 else 0
                print(f"进度: {done}/{stats['total']} | 下载: {stats['downloaded']} | 已存在: {stats['existed']} | 失败: {stats['failed']} | 速度: {rate:.1f}/s | 剩余: {remaining:.0f}s")
                last_report = now
    
    elapsed = time.time() - start_time
    print(f"\n下载完成! 总耗时: {elapsed:.1f}秒")
    print(f"下载: {stats['downloaded']}, 已存在: {stats['existed']}, 失败: {stats['failed']}")

if __name__ == "__main__":
    main()
