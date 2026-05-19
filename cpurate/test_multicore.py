import tkinter as tk
from PIL import Image, ImageDraw
import math

ICON_SIZE = 64
GRID_CELL_SIZE = 48

class CatIconGenerator:
    def __init__(self, size=ICON_SIZE):
        self.size = size
        self.pixel_size = size // 16
        self.cat_color = (255, 180, 180)
        self.ear_color = (220, 120, 120)
        self.eye_color = (60, 60, 60)
        self.nose_color = (255, 120, 140)
    
    def draw_pixel(self, draw, x, y, color):
        px = self.pixel_size
        draw.rectangle([x*px, y*px, (x+1)*px, (y+1)*px], fill=color)
    
    def create_head_icon(self):
        img = Image.new('RGBA', (self.size, self.size), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        
        cat_head = [
            (5, 2), (10, 2),
            (4, 3), (5, 3), (6, 3), (9, 3), (10, 3), (11, 3),
            (3, 4), (4, 4), (5, 4), (6, 4), (7, 4), (8, 4), (9, 4), (10, 4), (11, 4), (12, 4),
            (3, 5), (4, 5), (5, 5), (6, 5), (7, 5), (8, 5), (9, 5), (10, 5), (11, 5), (12, 5),
            (3, 6), (4, 6), (5, 6), (6, 6), (7, 6), (8, 6), (9, 6), (10, 6), (11, 6), (12, 6),
            (3, 7), (4, 7), (5, 7), (6, 7), (7, 7), (8, 7), (9, 7), (10, 7), (11, 7), (12, 7),
            (4, 8), (5, 8), (6, 8), (7, 8), (8, 8), (9, 8), (10, 8), (11, 8),
            (5, 9), (6, 9), (7, 9), (8, 9), (9, 9), (10, 9),
            (6, 10), (7, 10), (8, 10), (9, 10),
            (7, 11), (8, 11),
        ]
        
        for x, y in cat_head:
            self.draw_pixel(draw, x, y, self.cat_color)
        
        self.draw_pixel(draw, 4, 3, self.ear_color)
        self.draw_pixel(draw, 5, 2, self.ear_color)
        self.draw_pixel(draw, 10, 2, self.ear_color)
        self.draw_pixel(draw, 11, 3, self.ear_color)
        
        self.draw_pixel(draw, 5, 6, self.eye_color)
        self.draw_pixel(draw, 10, 6, self.eye_color)
        
        self.draw_pixel(draw, 7, 8, self.nose_color)
        self.draw_pixel(draw, 8, 8, self.nose_color)
        
        self.draw_pixel(draw, 6, 9, self.eye_color)
        self.draw_pixel(draw, 9, 9, self.eye_color)
        
        return img

def test_multicore_display(core_count=12):
    generator = CatIconGenerator()
    head_icon = generator.create_head_icon()
    
    window = tk.Tk()
    window.title(f"多核心显示测试 ({core_count}核)")
    window.configure(bg='#f0f0f0')
    
    cols = min(4, core_count)
    rows = (core_count + cols - 1) // cols
    
    cell_size = GRID_CELL_SIZE
    padding = 10
    
    max_display_rows = min(rows, 6)
    window_height = max_display_rows * cell_size + padding * 2 + 60
    window_width = cols * cell_size + padding * 2 + (20 if rows > max_display_rows else 0)
    
    window.geometry(f"{window_width}x{window_height}")
    
    title_frame = tk.Frame(window, bg='#f0f0f0')
    title_frame.pack(fill='x', padx=padding, pady=(padding, 5))
    tk.Label(title_frame, text=f"CPU核心使用率 ({core_count}核)", 
             bg='#f0f0f0', font=('Arial', 9, 'bold')).pack(side='left')
    
    container = tk.Frame(window, bg='#f0f0f0')
    container.pack(fill='both', expand=True, padx=padding, pady=(0, padding))
    
    canvas = tk.Canvas(container, bg='#f0f0f0', highlightthickness=0)
    from tkinter import ttk
    scrollbar = ttk.Scrollbar(container, orient="vertical", command=canvas.yview)
    scrollable_frame = tk.Frame(canvas, bg='#f0f0f0')
    
    scrollable_frame.bind(
        "<Configure>",
        lambda e: canvas.configure(scrollregion=canvas.bbox("all"))
    )
    
    canvas.create_window((0, 0), window=scrollable_frame, anchor="nw")
    canvas.configure(yscrollcommand=scrollbar.set)
    
    if rows > max_display_rows:
        canvas.pack(side="left", fill="both", expand=True)
        scrollbar.pack(side="right", fill="y")
    else:
        canvas.pack(fill="both", expand=True)
    
    def on_mousewheel(event):
        canvas.yview_scroll(int(-1*(event.delta/120)), "units")
    
    canvas.bind_all("<MouseWheel>", on_mousewheel)
    
    grid_frame = tk.Frame(scrollable_frame, bg='#f0f0f0')
    grid_frame.pack()
    
    head_icon_resized = head_icon.resize((GRID_CELL_SIZE - 12, GRID_CELL_SIZE - 12), Image.NEAREST)
    
    photo = ImageTk.PhotoImage(head_icon_resized)
    from PIL import ImageTk
    
    cell_labels = []
    for i in range(core_count):
        row = i // cols
        col = i % cols
        
        frame = tk.Frame(grid_frame, bg='white', relief='solid', bd=1, width=cell_size, height=cell_size)
        frame.grid(row=row, column=col, padx=2, pady=2)
        frame.grid_propagate(False)
        
        label = tk.Label(frame, bg='white', image=photo)
        label.image = photo
        label.pack(padx=2, pady=(2, 0))
        
        usage_label = tk.Label(frame, text=f"CPU{i}: {i*8 % 100}%", bg='white', font=('Arial', 7))
        usage_label.pack(pady=(0, 2))
        
        cell_labels.append((label, usage_label))
    
    print(f"✓ 已创建 {core_count} 个核心网格")
    print(f"  - 列数: {cols}, 行数: {rows}")
    print(f"  - 显示行数: {max_display_rows}")
    print(f"  - 窗口尺寸: {window_width}x{window_height}")
    print(f"  - 滚动条: {'启用' if rows > max_display_rows else '不需要'}")
    
    window.mainloop()

if __name__ == '__main__':
    import sys
    core_count = int(sys.argv[1]) if len(sys.argv) > 1 else 12
    test_multicore_display(core_count)
