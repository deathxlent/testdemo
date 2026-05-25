import re
from xml.etree import ElementTree as ET

with open('Xbox-One-S-Controller.svg', 'r') as f:
    content = f.read()

root = ET.fromstring(content)
ns = {'svg': 'http://www.w3.org/2000/svg'}

paths = root.findall('.//svg:path', ns)
print(f"Found {len(paths)} paths")

for i, path in enumerate(paths):
    d = path.get('d', '')
    fill = path.get('fill', 'none')
    stroke = path.get('stroke', 'none')
    opacity = path.get('opacity', '1')
    
    print(f"\nPath {i}:")
    print(f"  fill: {fill}")
    print(f"  stroke: {stroke}")
    print(f"  opacity: {opacity}")
    print(f"  d: {d[:100]}...")
