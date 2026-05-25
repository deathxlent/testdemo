from PIL import Image, ImageDraw
import os

def create_gamepad_icon(size=64):
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    scale = size / 64.0
    line_width = max(2, int(2 * scale))
    
    outline_color = (100, 149, 237, 255)
    fill_color = (135, 206, 250, 200)
    
    body_left = int(8 * scale)
    body_top = int(16 * scale)
    body_right = int(56 * scale)
    body_bottom = int(48 * scale)
    radius = int(8 * scale)
    
    draw.rounded_rectangle([body_left, body_top, body_right, body_bottom], 
                          radius=radius, outline=outline_color, width=line_width)
    
    center_x = size // 2
    center_y = size // 2
    
    stick_radius = int(5 * scale)
    stick_offset = int(10 * scale)
    
    left_stick_x = center_x - stick_offset
    right_stick_x = center_x + stick_offset
    stick_y = center_y - int(2 * scale)
    
    draw.ellipse([left_stick_x - stick_radius, stick_y - stick_radius,
                  left_stick_x + stick_radius, stick_y + stick_radius],
                 fill=fill_color, outline=outline_color, width=line_width)
    
    draw.ellipse([right_stick_x - stick_radius, stick_y - stick_radius,
                  right_stick_x + stick_radius, stick_y + stick_radius],
                 fill=fill_color, outline=outline_color, width=line_width)
    
    dpad_radius = int(4 * scale)
    dpad_y = center_y + int(6 * scale)
    
    draw.ellipse([center_x - dpad_radius, dpad_y - dpad_radius,
                  center_x + dpad_radius, dpad_y + dpad_radius],
                 fill=fill_color, outline=outline_color, width=line_width)
    
    return img

def save_ico():
    sizes = [16, 24, 32, 48, 64, 256]
    images = []
    
    for size in sizes:
        img = create_gamepad_icon(size)
        images.append(img)
    
    icon_path = os.path.join(os.path.dirname(__file__), 'gamepad.ico')
    
    images[0].save(
        icon_path,
        format='ICO',
        sizes=[(s, s) for s in sizes],
        append_images=images[1:]
    )
    
    print(f"Icon saved to: {icon_path}")
    return icon_path

if __name__ == '__main__':
    save_ico()
