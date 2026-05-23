import ctypes
import time
import threading
import math

user32 = ctypes.windll.user32

def get_cursor_pos():
    pt = type('POINT', (ctypes.Structure,), {'_fields_': [('x', ctypes.c_long), ('y', ctypes.c_long)]})()
    user32.GetCursorPos(ctypes.byref(pt))
    return (pt.x, pt.y)

class MouseMagnifier:
    def __init__(self, config):
        self.config = config
        self.pulse_thread = None
        self.pulse_stop_event = threading.Event()
        self.magnify_thread = None
        self.magnify_stop_event = threading.Event()
        self.shake_positions = []
        
    def check_shake(self):
        current_time = time.time()
        current_pos = get_cursor_pos()
        
        self.shake_positions.append((current_time, current_pos))
        
        cutoff_time = current_time - self.config['shake_time']
        self.shake_positions = [(t, pos) for t, pos in self.shake_positions if t >= cutoff_time]
        
        if len(self.shake_positions) < 5:
            return False
        
        total_distance = 0
        for i in range(1, len(self.shake_positions)):
            dx = self.shake_positions[i][1][0] - self.shake_positions[i-1][1][0]
            dy = self.shake_positions[i][1][1] - self.shake_positions[i-1][1][1]
            total_distance += math.sqrt(dx*dx + dy*dy)
        
        return total_distance > self.config['shake_threshold']
    
    def _create_overlay(self, scale, duration, stop_event, pulse=False):
        import tkinter as tk
        
        root = tk.Tk()
        root.overrideredirect(True)
        root.attributes('-topmost', True)
        root.attributes('-alpha', 0.7)
        root.attributes('-transparentcolor', 'white')
        root.configure(bg='white')
        
        canvas = tk.Canvas(root, bg='white', highlightthickness=0)
        canvas.pack(fill=tk.BOTH, expand=True)
        
        start_time = time.time()
        
        try:
            while time.time() - start_time < duration:
                if stop_event.is_set():
                    break
                
                if pulse:
                    elapsed = time.time() - start_time
                    phase = (elapsed * 3) % 2
                    if phase > 1:
                        phase = 2 - phase
                    current_scale = (self.config['pulse_min_scale'] + 
                                   (self.config['pulse_max_scale'] - self.config['pulse_min_scale']) * phase)
                else:
                    current_scale = scale
                
                cx, cy = get_cursor_pos()
                size = int(32 * current_scale)
                
                root.geometry(f'{size*2}x{size*2}+{cx-size}+{cy-size}')
                canvas.delete('all')
                canvas.create_oval(
                    2, 2, size*2-2, size*2-2,
                    outline='red',
                    width=3
                )
                root.update()
                time.sleep(0.03)
        finally:
            root.destroy()
    
    def temporary_magnify(self):
        if self.magnify_thread and self.magnify_thread.is_alive():
            return
        
        self.magnify_stop_event.clear()
        
        def task():
            try:
                self._create_overlay(
                    self.config['cursor_scale'],
                    self.config['magnify_duration'],
                    self.magnify_stop_event,
                    pulse=False
                )
            except Exception as e:
                print(f'Magnify error: {e}')
        
        self.magnify_thread = threading.Thread(target=task, daemon=True)
        self.magnify_thread.start()
    
    def stop_temporary_magnify(self):
        self.magnify_stop_event.set()
    
    def start_pulse_animation(self):
        if self.pulse_thread and self.pulse_thread.is_alive():
            self.stop_pulse_animation()
            time.sleep(0.1)
        
        self.pulse_stop_event.clear()
        
        def task():
            try:
                self._create_overlay(
                    1.0,
                    self.config['pulse_duration'],
                    self.pulse_stop_event,
                    pulse=True
                )
            except Exception as e:
                print(f'Pulse error: {e}')
        
        self.pulse_thread = threading.Thread(target=task, daemon=True)
        self.pulse_thread.start()
    
    def stop_pulse_animation(self):
        self.pulse_stop_event.set()
    
    def cleanup(self):
        self.stop_temporary_magnify()
        self.stop_pulse_animation()
