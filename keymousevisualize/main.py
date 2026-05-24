import tkinter as tk
from tkinter import ttk
import threading
import time
from pynput import mouse, keyboard
import pystray
from PIL import Image, ImageDraw
import queue
import ctypes

user32 = ctypes.windll.user32
screen_width = user32.GetSystemMetrics(0)
screen_height = user32.GetSystemMetrics(1)

DOUBLE_CLICK_THRESHOLD = 0.3
POPUP_HEIGHT = 50
POPUP_SPACING = 5
BASE_Y_OFFSET = 140

class KeyMouseVisualizer:
    def __init__(self):
        self.root = tk.Tk()
        self.root.withdraw()
        
        self.is_visible = False
        self.active_windows = []
        self.mouse_window = None
        self.message_queue = queue.Queue()
        
        self.last_pause_time = 0
        self.pause_click_count = 0
        
        self.last_click_time = {}
        self.last_click_button = None
        self.click_after_ids = {}
        
        self.setup_tray()
        self.setup_listeners()
        self.process_queue()
        
    def setup_tray(self):
        image = Image.new('RGB', (64, 64), color='black')
        dc = ImageDraw.Draw(image)
        dc.ellipse([16, 16, 48, 48], fill='white')
        dc.ellipse([24, 24, 40, 40], fill='black')
        
        menu = pystray.Menu(
            pystray.MenuItem('显示/隐藏', self.toggle_visibility),
            pystray.MenuItem('退出', self.quit_app)
        )
        
        self.icon = pystray.Icon("KeyMouseVisualizer", image, "按键鼠标可视化", menu)
        self.icon.on_click = self.on_tray_click
        threading.Thread(target=self.icon.run, daemon=True).start()
        
    def on_tray_click(self, icon, button):
        if button == pystray.MouseButton.left:
            self.toggle_visibility()
            
    def toggle_visibility(self):
        self.is_visible = not self.is_visible
        if self.is_visible:
            self.show_mouse_window()
        else:
            self.hide_mouse_window()
            for win_data in self.active_windows:
                if win_data['window'].winfo_exists():
                    win_data['window'].destroy()
            self.active_windows = []
            
    def show_mouse_window(self):
        if self.mouse_window is None or not self.mouse_window.winfo_exists():
            self.mouse_window = tk.Toplevel(self.root)
            self.mouse_window.overrideredirect(True)
            self.mouse_window.attributes('-topmost', True)
            self.mouse_window.attributes('-alpha', 0.9)
            self.mouse_window.configure(bg='black')
            
            self.mouse_label = tk.Label(
                self.mouse_window,
                text="X: 0 Y: 0",
                font=('Arial', 14, 'bold'),
                fg='white',
                bg='black',
                padx=10,
                pady=5
            )
            self.mouse_label.pack()
            
            self.click_label = tk.Label(
                self.mouse_window,
                text="",
                font=('Arial', 12),
                fg='yellow',
                bg='black'
            )
            self.click_label.pack()
            
        self.update_mouse_position()
        
    def hide_mouse_window(self):
        if self.mouse_window and self.mouse_window.winfo_exists():
            self.mouse_window.withdraw()
            
    def update_mouse_position(self):
        if self.is_visible:
            self.root.after(50, self.update_mouse_position)
        
    def setup_listeners(self):
        self.mouse_listener = mouse.Listener(
            on_move=self.on_mouse_move,
            on_click=self.on_mouse_click
        )
        self.mouse_listener.start()
        
        self.keyboard_listener = keyboard.Listener(
            on_press=self.on_key_press
        )
        self.keyboard_listener.start()
        
    def on_mouse_move(self, x, y):
        if self.is_visible and self.mouse_window and self.mouse_window.winfo_exists():
            self.message_queue.put(('mouse_move', x, y))
            
    def on_mouse_click(self, x, y, button, pressed):
        if not self.is_visible or not pressed:
            return
            
        current_time = time.time()
        button_str = str(button)
        
        if button_str in self.last_click_time:
            time_diff = current_time - self.last_click_time[button_str]
            if time_diff < DOUBLE_CLICK_THRESHOLD:
                if button_str in self.click_after_ids:
                    self.root.after_cancel(self.click_after_ids[button_str])
                    del self.click_after_ids[button_str]
                
                self.message_queue.put(('mouse_double_click', x, y, button))
                del self.last_click_time[button_str]
                return
        
        self.last_click_time[button_str] = current_time
        after_id = self.root.after(int(DOUBLE_CLICK_THRESHOLD * 1000) + 50, 
                       lambda bs=button_str, bx=x, by=y, b=button: self.check_single_click(bs, bx, by, b))
        self.click_after_ids[button_str] = after_id
            
    def check_single_click(self, button_str, x, y, button):
        if button_str in self.last_click_time:
            del self.last_click_time[button_str]
        if button_str in self.click_after_ids:
            del self.click_after_ids[button_str]
        if self.is_visible:
            self.message_queue.put(('mouse_click', x, y, button))
            
    def on_key_press(self, key):
        try:
            if key == keyboard.Key.pause:
                current_time = time.time()
                if current_time - self.last_pause_time < 0.5:
                    self.pause_click_count += 1
                    if self.pause_click_count >= 2:
                        self.message_queue.put(('toggle',))
                        self.pause_click_count = 0
                else:
                    self.pause_click_count = 1
                self.last_pause_time = current_time
            elif self.is_visible:
                self.message_queue.put(('key_press', key))
        except:
            if self.is_visible:
                self.message_queue.put(('key_press', key))
                
    def process_queue(self):
        try:
            while True:
                msg = self.message_queue.get_nowait()
                if msg[0] == 'mouse_move':
                    self.handle_mouse_move(msg[1], msg[2])
                elif msg[0] == 'mouse_click':
                    self.handle_mouse_click(msg[1], msg[2], msg[3], False)
                elif msg[0] == 'mouse_double_click':
                    self.handle_mouse_click(msg[1], msg[2], msg[3], True)
                elif msg[0] == 'key_press':
                    self.handle_key_press(msg[1])
                elif msg[0] == 'toggle':
                    self.toggle_visibility()
        except queue.Empty:
            pass
        self.root.after(10, self.process_queue)
        
    def handle_mouse_move(self, x, y):
        if self.mouse_window and self.mouse_window.winfo_exists():
            self.mouse_label.config(text=f"X: {x} Y: {y}")
            win_width = self.mouse_window.winfo_width()
            win_height = self.mouse_window.winfo_height()
            taskbar_height = 40
            pos_x = screen_width - win_width - 20
            pos_y = screen_height - win_height - taskbar_height - 10
            self.mouse_window.geometry(f"+{pos_x}+{pos_y}")
            self.mouse_window.deiconify()
            
    def handle_mouse_click(self, x, y, button, is_double):
        if self.mouse_window and self.mouse_window.winfo_exists():
            button_name = '左键' if button == mouse.Button.left else '右键' if button == mouse.Button.right else '中键'
            click_type = '双击' if is_double else '点击'
            self.click_label.config(text=f"{button_name} {click_type}!")
            self.root.after(500, lambda: self.click_label.config(text=""))
            
            key_name = f"{button_name}{click_type}"
            self.show_key_popup(key_name, is_mouse=True)
            
    def handle_key_press(self, key):
        key_name = self.get_key_name(key)
        self.show_key_popup(key_name)
        
    def get_key_name(self, key):
        try:
            return key.char.upper() if key.char else str(key)
        except AttributeError:
            key_map = {
                keyboard.Key.space: 'Space',
                keyboard.Key.enter: 'Enter',
                keyboard.Key.backspace: 'Backspace',
                keyboard.Key.tab: 'Tab',
                keyboard.Key.shift: 'Shift',
                keyboard.Key.ctrl_l: 'Ctrl',
                keyboard.Key.ctrl_r: 'Ctrl',
                keyboard.Key.alt_l: 'Alt',
                keyboard.Key.alt_r: 'Alt',
                keyboard.Key.caps_lock: 'CapsLock',
                keyboard.Key.esc: 'Esc',
                keyboard.Key.up: '↑',
                keyboard.Key.down: '↓',
                keyboard.Key.left: '←',
                keyboard.Key.right: '→',
                keyboard.Key.f1: 'F1',
                keyboard.Key.f2: 'F2',
                keyboard.Key.f3: 'F3',
                keyboard.Key.f4: 'F4',
                keyboard.Key.f5: 'F5',
                keyboard.Key.f6: 'F6',
                keyboard.Key.f7: 'F7',
                keyboard.Key.f8: 'F8',
                keyboard.Key.f9: 'F9',
                keyboard.Key.f10: 'F10',
                keyboard.Key.f11: 'F11',
                keyboard.Key.f12: 'F12',
            }
            return key_map.get(key, str(key).replace('Key.', ''))
            
    def show_key_popup(self, key_name, is_mouse=False):
        popup = tk.Toplevel(self.root)
        popup.overrideredirect(True)
        popup.attributes('-topmost', True)
        popup.attributes('-alpha', 0.95)
        
        bg_color = '#2d1b4e' if is_mouse else '#1a1a2e'
        fg_color = '#ffaa00' if is_mouse else '#00ff88'
        popup.configure(bg=bg_color)
        
        label = tk.Label(
            popup,
            text=key_name,
            font=('Arial', 20, 'bold'),
            fg=fg_color,
            bg=bg_color,
            padx=15,
            pady=8,
            relief='raised',
            bd=3
        )
        label.pack()
        
        popup.update_idletasks()
        popup_width = popup.winfo_width()
        popup_height = popup.winfo_height()
        
        pos_x = screen_width - popup_width - 20
        
        start_time = time.time()
        window_data = {
            'window': popup,
            'start_time': start_time,
            'popup_height': popup_height,
            'opacity': 0.95,
            'pos_x': pos_x
        }
        
        self.active_windows.append(window_data)
        self.rearrange_windows()
        self.animate_window(window_data)
        
    def rearrange_windows(self):
        valid_windows = []
        for win_data in self.active_windows:
            if win_data['window'].winfo_exists():
                valid_windows.append(win_data)
        
        self.active_windows = valid_windows
        
        base_y = screen_height - BASE_Y_OFFSET
        for i, win_data in enumerate(reversed(self.active_windows)):
            target_y = base_y - i * (POPUP_HEIGHT + POPUP_SPACING)
            win_data['target_y'] = target_y
            
    def animate_window(self, window_data):
        window = window_data['window']
        window.geometry(f"+{window_data['pos_x']}+{screen_height}")
        
        def update():
            elapsed = time.time() - window_data['start_time']
            
            if not window.winfo_exists():
                if window_data in self.active_windows:
                    self.active_windows.remove(window_data)
                    self.rearrange_windows()
                return
                
            if elapsed >= 2:
                window.destroy()
                if window_data in self.active_windows:
                    self.active_windows.remove(window_data)
                    self.rearrange_windows()
                return
                
            if 'target_y' in window_data:
                try:
                    current_geo = window.geometry()
                    current_y = int(current_geo.split('+')[2])
                    new_y = current_y + (window_data['target_y'] - current_y) * 0.2
                except:
                    new_y = window_data['target_y']
                
                if new_y < -100:
                    window.destroy()
                    if window_data in self.active_windows:
                        self.active_windows.remove(window_data)
                        self.rearrange_windows()
                    return
                    
                new_opacity = max(0.3, 0.95 - (elapsed * 0.325))
                
                window.geometry(f"+{window_data['pos_x']}+{int(new_y)}")
                window.attributes('-alpha', new_opacity)
                window_data['opacity'] = new_opacity
            
            window.after(30, update)
            
        update()
        
    def quit_app(self):
        self.icon.stop()
        self.root.quit()
        self.root.destroy()
        
    def run(self):
        self.root.mainloop()

if __name__ == "__main__":
    app = KeyMouseVisualizer()
    app.run()
