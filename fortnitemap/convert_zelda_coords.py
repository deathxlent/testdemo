import json
import os

INPUT_FILE = "zeldamap/data/pois.json"
OUTPUT_FILE = "zeldamap/data/pois_converted.json"

with open(INPUT_FILE, "r", encoding="utf-8") as f:
    data = json.load(f)

converted = {}
for cat_id, cat in data.items():
    coords = []
    for poi in cat["coords"]:
        game_x = float(poi["x"])
        game_y = float(poi["y"])
        
        lat = (game_x - 16384) / 128
        lng = (game_y + 16384) / 128
        
        coords.append({
            "title": poi["ctitle"],
            "content": poi.get("ccontent"),
            "lat": round(lat, 2),
            "lng": round(lng, 2)
        })
    
    icon_parts = cat.get("iconsize", "0,0").split(",")
    anchor_parts = cat.get("iconanchor", "0,0").split(",")
    popup_parts = cat.get("popupanchor", "0,0").split(",")
    
    converted[cat_id] = {
        "name": cat["name"],
        "id": cat["id"],
        "zoom": cat.get("zoom", ""),
        "icon_local": cat.get("icon_local", ""),
        "icon_size": [int(icon_parts[0]), int(icon_parts[1])] if len(icon_parts) == 2 else [20, 20],
        "icon_anchor": [int(anchor_parts[0]), int(anchor_parts[1])] if len(anchor_parts) == 2 else [10, 10],
        "popup_anchor": [int(popup_parts[0]), int(popup_parts[1])] if len(popup_parts) == 2 else [0, 0],
        "coords": coords
    }

with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
    json.dump(converted, f, ensure_ascii=False, indent=2)

total = sum(len(c["coords"]) for c in converted.values())
print(f"转换完成: {len(converted)} 个分类, {total} 个 POI")
