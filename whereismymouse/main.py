import pystray
from PIL import Image, ImageDraw
import threading
import time
import sys
import os

import config
import autostart
import fullscreen_detector
from mouse_effects import MouseMagnifier

try:
    import keyboard
    KEYBOARD_AVAILABLE = True
except ImportError:
    KEYBOARD_AVAILABLE = False

class WhereIsMyMouseApp:
    def __init__(self):
        self.config = config.load_config()
        self.mouse_magnifier = MouseMagnifier(self.config)
        self.running = True
        self.icon = None
        self.shake_detect_thread = None
        
    def create_icon_image(self):
        img = Image.new('RGBA', (64, 64), color=(255, 255, 255, 0))
        draw = ImageDraw.Draw(img)
        
        draw.ellipse([22, 24, 42, 48], fill='black', outline='black')
        draw.polygon([(32, 8), (18, 32), (46, 32)], fill='black')
        
        return img
    
    def setup_tray(self):
        menu_items = [
            pystray.MenuItem(
                '开机自启动',
                self.toggle_autostart,
                checked=lambda item: autostart.is_autostart_enabled()
            ),
            pystray.MenuItem(
                '全屏检测',
                self.toggle_fullscreen_check,
                checked=lambda item: self.config.get("check_fullscreen", True)
            ),
            pystray.Menu.SEPARATOR,
        ]
        
        if KEYBOARD_AVAILABLE:
            menu_items.append(
                pystray.MenuItem(
                    f'快捷键: {self.config["hotkey"]}',
                    None,
                    enabled=False
                )
            )
        
        menu_items.extend([
            pystray.MenuItem(
                '测试晃动放大',
                lambda: self.mouse_magnifier.temporary_magnify()
            ),
            pystray.MenuItem(
                '测试脉冲效果',
                lambda: self.mouse_magnifier.start_pulse_animation()
            ),
            pystray.Menu.SEPARATOR,
            pystray.MenuItem(
                '退出',
                self.quit_app
            )
        ])
        
        menu = pystray.Menu(*menu_items)
        
        self.icon = pystray.Icon(
            "whereismymouse",
            self.create_icon_image(),
            "WhereIsMyMouse - 鼠标定位工具",
            menu
        )
    
    def toggle_autostart(self, icon, item):
        if autostart.is_autostart_enabled():
            autostart.disable_autostart()
            self.config["autostart"] = False
        else:
            autostart.enable_autostart()
            self.config["autostart"] = True
        config.save_config(self.config)
    
    def toggle_fullscreen_check(self, icon, item):
        self.config["check_fullscreen"] = not self.config.get("check_fullscreen", True)
        config.save_config(self.config)
    
    def quit_app(self, icon, item):
        self.running = False
        self.mouse_magnifier.cleanup()
        if KEYBOARD_AVAILABLE:
            try:
                keyboard.unhook_all()
            except:
                pass
        self.icon.stop()
    
    def shake_detection_loop(self):
        last_check = 0
        check_interval = 0.05
        
        while self.running:
            try:
                current_time = time.time()
                if current_time - last_check < check_interval:
                    time.sleep(0.01)
                    continue
                
                last_check = current_time
                
                if self.config.get("check_fullscreen", True):
                    if fullscreen_detector.is_fullscreen_app_running():
                        time.sleep(0.1)
                        continue
                
                if self.mouse_magnifier.check_shake():
                    self.mouse_magnifier.temporary_magnify()
                
            except Exception:
                time.sleep(0.1)
    
    def setup_hotkey(self):
        if not KEYBOARD_AVAILABLE:
            return
        
        try:
            hotkey = self.config.get("hotkey", "ctrl+shift+m")
            keyboard.add_hotkey(hotkey, self.mouse_magnifier.start_pulse_animation)
        except Exception:
            pass
    
    def run(self):
        self.setup_tray()
        self.setup_hotkey()
        
        self.shake_detect_thread = threading.Thread(
            target=self.shake_detection_loop,
            daemon=True
        )
        self.shake_detect_thread.start()
        
        if self.config.get("autostart", False):
            if not autostart.is_autostart_enabled():
                autostart.enable_autostart()
        
        self.icon.run()

def main():
    app = WhereIsMyMouseApp()
    app.run()

if __name__ == "__main__":
    main()
