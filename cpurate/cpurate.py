import threading
import time
import math
import tkinter as tk
from PIL import Image, ImageDraw, ImageTk
import pystray
import psutil

ICON_SIZE = 64
GRID_CELL_SIZE = 48
FPS = 8
CPU_THRESHOLD = 10.0

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
    
    def create_run_frames(self):
        frames = []
        for phase in range(8):
            img = Image.new('RGBA', (self.size, self.size), (0, 0, 0, 0))
            draw = ImageDraw.Draw(img)
            
            body_y = 7
            head_offset = 1 if phase < 4 else 0
            
            head_pattern = [
                (2+head_offset, body_y-3), (7+head_offset, body_y-3),
                (1+head_offset, body_y-2), (2+head_offset, body_y-2), (3+head_offset, body_y-2),
                (6+head_offset, body_y-2), (7+head_offset, body_y-2), (8+head_offset, body_y-2),
                (1+head_offset, body_y-1), (2+head_offset, body_y-1), (3+head_offset, body_y-1),
                (4+head_offset, body_y-1), (5+head_offset, body_y-1), (6+head_offset, body_y-1),
                (7+head_offset, body_y-1), (8+head_offset, body_y-1),
            ]
            
            body_pattern = []
            for i in range(8):
                body_pattern.append((1+i, body_y))
                body_pattern.append((1+i, body_y+1))
            
            if phase == 0:
                legs = [(2, body_y+2), (2, body_y+3), (6, body_y+2), (6, body_y+3)]
            elif phase == 1:
                legs = [(1, body_y+2), (1, body_y+3), (7, body_y+2), (7, body_y+3)]
            elif phase == 2:
                legs = [(2, body_y+2), (7, body_y+2), (7, body_y+3), (7, body_y+4)]
            elif phase == 3:
                legs = [(1, body_y+2), (1, body_y+3), (1, body_y+4), (6, body_y+2)]
            elif phase == 4:
                legs = [(3, body_y+2), (3, body_y+3), (5, body_y+2), (5, body_y+3)]
            elif phase == 5:
                legs = [(2, body_y+2), (2, body_y+3), (6, body_y+2), (6, body_y+3)]
            elif phase == 6:
                legs = [(3, body_y+2), (6, body_y+2), (6, body_y+3), (6, body_y+4)]
            else:
                legs = [(2, body_y+2), (2, body_y+3), (2, body_y+4), (5, body_y+2)]
            
            tail_wave = int(math.sin(phase * 0.8) * 1.5)
            tail = [
                (8, body_y),
                (9, body_y-1+tail_wave),
                (10, body_y-2+tail_wave),
            ]
            
            for x, y in head_pattern + body_pattern + legs + tail:
                if 0 <= x < 16 and 0 <= y < 16:
                    self.draw_pixel(draw, x, y, self.cat_color)
            
            self.draw_pixel(draw, 1+head_offset, body_y-3, self.ear_color)
            self.draw_pixel(draw, 8+head_offset, body_y-3, self.ear_color)
            
            self.draw_pixel(draw, 3+head_offset, body_y-1, self.eye_color)
            self.draw_pixel(draw, 6+head_offset, body_y-1, self.eye_color)
            
            frames.append(img)
        
        return frames


class CPUMonitor:
    def __init__(self):
        self.cpu_count = psutil.cpu_count(logical=True)
        self.overall_usage = 0.0
        self.per_core_usage = [0.0] * self.cpu_count
        self._running = True
    
    def start(self):
        psutil.cpu_percent(interval=None)
        psutil.cpu_percent(interval=None, percpu=True)
        
        def monitor_loop():
            while self._running:
                try:
                    self.overall_usage = psutil.cpu_percent(interval=0.3)
                    self.per_core_usage = psutil.cpu_percent(interval=None, percpu=True)
                except:
                    time.sleep(0.3)
        
        t = threading.Thread(target=monitor_loop, daemon=True)
        t.start()
    
    def stop(self):
        self._running = False
    
    def get_overall(self):
        return self.overall_usage
    
    def get_per_core(self):
        return list(self.per_core_usage)


class HoverWindow:
    def __init__(self, monitor, generator):
        self.monitor = monitor
        self.generator = generator
        self.window = None
        self._running = False
        self._frame = 0
    
    def show(self):
        if self.window is not None:
            return
        
        self._running = True
        self.window = tk.Tk()
        self.window.withdraw()
        self.window.overrideredirect(True)
        self.window.attributes('-topmost', True)
        self.window.configure(bg='#f0f0f0')
        
        core_count = self.monitor.cpu_count
        cols = min(4, core_count)
        rows = (core_count + cols - 1) // cols
        
        cell_size = GRID_CELL_SIZE
        padding = 10
        window_width = cols * cell_size + padding * 2
        window_height = rows * cell_size + padding * 2 + 30
        
        self.window.geometry(f"{window_width}x{window_height}")
        
        title_frame = tk.Frame(self.window, bg='#f0f0f0')
        title_frame.pack(fill='x', padx=padding, pady=(padding, 5))
        tk.Label(title_frame, text=f"CPU核心使用率 ({core_count}核)", 
                bg='#f0f0f0', font=('Arial', 9, 'bold')).pack(side='left')
        
        grid_frame = tk.Frame(self.window, bg='#f0f0f0')
        grid_frame.pack(padx=padding, pady=(0, padding))
        
        self.cell_labels = []
        self.photo_refs = []
        
        for i in range(core_count):
            row = i // cols
            col = i % cols
            
            frame = tk.Frame(grid_frame, bg='white', relief='solid', bd=1)
            frame.grid(row=row, column=col, padx=2, pady=2)
            
            label = tk.Label(frame, bg='white', width=cell_size//8, height=cell_size//12)
            label.pack(padx=2, pady=(2, 0))
            
            usage_label = tk.Label(frame, text=f"CPU{i}: 0%", bg='white', font=('Arial', 7))
            usage_label.pack(pady=(0, 2))
            
            self.cell_labels.append((label, usage_label))
        
        try:
            import ctypes
            user32 = ctypes.windll.user32
            class POINT(ctypes.Structure):
                _fields_ = [("x", ctypes.c_long), ("y", ctypes.c_long)]
            pt = POINT()
            user32.GetCursorPos(ctypes.byref(pt))
            pos_x = pt.x - window_width // 2
            pos_y = pt.y - window_height - 10
            self.window.geometry(f"+{max(0, pos_x)}+{max(0, pos_y)}")
        except:
            pass
        
        self.window.deiconify()
        self.window.bind('<Leave>', self._on_leave)
        self.window.focus_force()
        
        self._update_grid()
        self.window.mainloop()
    
    def _update_grid(self):
        if not self._running or self.window is None:
            return
        
        self._frame += 1
        usages = self.monitor.get_per_core()
        self.photo_refs.clear()
        
        for i, (label, usage_label) in enumerate(self.cell_labels):
            usage = usages[i] if i < len(usages) else 0
            
            if usage < CPU_THRESHOLD:
                img = self.generator.create_head_icon()
            else:
                speed = max(1, min(5, int(usage / 20) + 1))
                frame_idx = (self._frame * speed) % 8
                img = self.generator.run_frames[frame_idx]
            
            img = img.resize((GRID_CELL_SIZE - 12, GRID_CELL_SIZE - 12), Image.NEAREST)
            photo = ImageTk.PhotoImage(img)
            self.photo_refs.append(photo)
            
            label.configure(image=photo)
            usage_label.configure(text=f"CPU{i}: {usage:.0f}%")
        
        self.window.after(125, self._update_grid)
    
    def _on_leave(self, event):
        self._running = False
        if self.window:
            self.window.after(200, self._destroy)
    
    def _destroy(self):
        if self.window:
            try:
                self.window.destroy()
            except:
                pass
        self.window = None


class CPUCatApp:
    def __init__(self):
        self.generator = CatIconGenerator()
        self.monitor = CPUMonitor()
        self.head_icon = self.generator.create_head_icon()
        self.generator.run_frames = self.generator.create_run_frames()
        self.frame = 0
        self.running = True
        self.icon = None
        self.hover_window = None
    
    def _get_icon(self):
        usage = self.monitor.get_overall()
        if usage < CPU_THRESHOLD:
            return self.head_icon
        speed = max(1, min(5, int(usage / 20) + 1))
        frame_idx = (self.frame * speed) % 8
        return self.generator.run_frames[frame_idx]
    
    def _update_loop(self):
        while self.running:
            self.frame += 1
            try:
                if self.icon:
                    self.icon.icon = self._get_icon()
            except:
                pass
            time.sleep(1.0 / FPS)
    
    def _on_show_hover(self, icon, item):
        if self.hover_window is None or self.hover_window.window is None:
            self.hover_window = HoverWindow(self.monitor, self.generator)
            t = threading.Thread(target=self.hover_window.show, daemon=True)
            t.start()
    
    def _on_quit(self, icon, item):
        self.running = False
        self.monitor.stop()
        if self.hover_window:
            self.hover_window._running = False
            if self.hover_window.window:
                try:
                    self.hover_window.window.after(0, self.hover_window._destroy)
                except:
                    pass
        icon.stop()
    
    def run(self):
        self.monitor.start()
        
        menu = pystray.Menu(
            pystray.MenuItem('查看核心状态', self._on_show_hover, default=True),
            pystray.Menu.SEPARATOR,
            pystray.MenuItem('退出', self._on_quit)
        )
        
        self.icon = pystray.Icon(
            "cpurate",
            self.head_icon,
            "CPU猫咪监控",
            menu
        )
        
        update_thread = threading.Thread(target=self._update_loop, daemon=True)
        update_thread.start()
        
        self.icon.run()


if __name__ == '__main__':
    app = CPUCatApp()
    app.run()
