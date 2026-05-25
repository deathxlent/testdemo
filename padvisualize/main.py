import sys
import os
import time
from PySide6.QtWidgets import QApplication, QWidget, QVBoxLayout, QMenu, QSystemTrayIcon, QMessageBox
from PySide6.QtGui import QIcon, QPainter, QColor, QPixmap, QAction, QPainterPath, QPen
from PySide6.QtCore import Qt, QTimer, QRect
import ctypes
from ctypes import wintypes

from gamepad_widget import GamepadWidget
from gamepad_input import get_any_connected_gamepad, get_gamepad_state

user32 = ctypes.windll.user32
kernel32 = ctypes.windll.kernel32

WM_HOTKEY = 0x0312
VK_PAUSE = 0x13
MOD_NOREPEAT = 0x4000

HOTKEY_ID = 1

BUTTON_NAMES = {
    'A': 'A',
    'B': 'B',
    'X': 'X',
    'Y': 'Y',
    'LB': 'LB',
    'RB': 'RB',
    'LT': 'LT',
    'RT': 'RT',
    'Back': 'Back',
    'Start': 'Start',
    'Guide': 'Guide',
    'L3': 'L3',
    'R3': 'R3',
    'DPad_Up': 'D-Pad Up',
    'DPad_Down': 'D-Pad Down',
    'DPad_Left': 'D-Pad Left',
    'DPad_Right': 'D-Pad Right',
}


class GlobalHotkeyListener:
    def __init__(self):
        self.last_pause_time = 0
        self.double_click_callback = None
        self.is_running = False
        self._timer = None
    
    def start(self, callback):
        self.double_click_callback = callback
        self.is_running = True
        
        self._timer = QTimer()
        self._timer.timeout.connect(self.check_hotkey)
        self._timer.start(50)
        
        print("Global hotkey listener started")
    
    def stop(self):
        self.is_running = False
        if self._timer:
            self._timer.stop()
    
    def check_hotkey(self):
        if not self.is_running:
            return
        
        VK_PAUSE_KEY = 0x13
        
        if user32.GetAsyncKeyState(VK_PAUSE_KEY) & 0x8000:
            current_time = time.time()
            
            if hasattr(self, '_pause_pressed') and self._pause_pressed:
                return
            
            self._pause_pressed = True
            
            if current_time - self.last_pause_time < 0.5:
                if self.double_click_callback:
                    self.double_click_callback()
                self.last_pause_time = 0
            else:
                self.last_pause_time = current_time
        else:
            self._pause_pressed = False


class GamepadOverlay(QWidget):
    def __init__(self):
        super().__init__()
        
        self.setWindowFlags(
            Qt.FramelessWindowHint
            | Qt.WindowStaysOnTopHint
            | Qt.Tool
            | Qt.NoDropShadowWindowHint
        )
        
        self.setAttribute(Qt.WA_TranslucentBackground)
        self.setAttribute(Qt.WA_ShowWithoutActivating)
        self.setAttribute(Qt.WA_MouseNoMask)
        
        self.setFixedSize(260, 240)
        
        self.gamepad_widget = GamepadWidget(self)
        layout = QVBoxLayout()
        layout.setContentsMargins(0, 0, 0, 0)
        layout.addWidget(self.gamepad_widget)
        self.setLayout(layout)
        
        self.position_window()
        
        self.gamepad_index = -1
        self.poll_timer = QTimer(self)
        self.poll_timer.timeout.connect(self.update_gamepad)
        self.poll_timer.start(16)
        
        self.button_counts = {}
        self.prev_buttons = {}
        self.prev_triggers = {'LT': 0, 'RT': 0}
        self.is_tracking = False
        
        self.stats_timer = QTimer(self)
        self.stats_timer.setSingleShot(True)
        self.stats_timer.timeout.connect(self.hide_stats_and_close)
        
        self.make_click_through()
    
    def make_click_through(self):
        try:
            user32 = ctypes.windll.user32
            WS_EX_TRANSPARENT = 0x00000020
            WS_EX_TOOLWINDOW = 0x00000080
            
            hwnd = int(self.winId())
            style = user32.GetWindowLongW(hwnd, -20)
            style = style | WS_EX_TRANSPARENT | WS_EX_TOOLWINDOW
            user32.SetWindowLongW(hwnd, -20, style)
        except Exception as e:
            print(f"Warning: Could not set click-through: {e}")
    
    def position_window(self):
        try:
            user32 = ctypes.windll.user32
            user32.SetProcessDPIAware()
            
            SM_CXSCREEN = 0
            SM_CYSCREEN = 1
            
            screen_width = user32.GetSystemMetrics(SM_CXSCREEN)
            screen_height = user32.GetSystemMetrics(SM_CYSCREEN)
            
            x = screen_width - self.width() - 20
            y = (screen_height - self.height()) // 2
            
            self.move(x, y)
        except Exception as e:
            print(f"Warning: Could not position window: {e}")
            screen = QApplication.primaryScreen().geometry()
            x = screen.width() - self.width() - 20
            y = (screen.height() - self.height()) // 2
            self.move(x, y)
    
    def reset_button_counts(self):
        self.button_counts = {}
        for key in BUTTON_NAMES:
            self.button_counts[key] = 0
    
    def update_button_counts(self, state):
        if not state or not state['connected']:
            self.prev_buttons = {}
            self.prev_triggers = {'LT': 0, 'RT': 0}
            return
        
        buttons = state['buttons']
        
        for key, value in buttons.items():
            if key not in self.prev_buttons:
                self.prev_buttons[key] = False
            
            if value and not self.prev_buttons[key]:
                if key in self.button_counts:
                    self.button_counts[key] += 1
            
            self.prev_buttons[key] = value
        
        triggers = state['triggers']
        
        if triggers['LT'] > 0.5 and self.prev_triggers['LT'] <= 0.5:
            self.button_counts['LT'] = self.button_counts.get('LT', 0) + 1
        
        if triggers['RT'] > 0.5 and self.prev_triggers['RT'] <= 0.5:
            self.button_counts['RT'] = self.button_counts.get('RT', 0) + 1
        
        self.prev_triggers['LT'] = triggers['LT']
        self.prev_triggers['RT'] = triggers['RT']
    
    def update_gamepad(self):
        try:
            if self.gamepad_index < 0:
                self.gamepad_index, state = get_any_connected_gamepad()
                if self.gamepad_index >= 0:
                    print(f"Gamepad connected: index {self.gamepad_index}")
            else:
                state = get_gamepad_state(self.gamepad_index)
                if not state['connected']:
                    self.gamepad_index = -1
                    print("Gamepad disconnected")
            
            if self.is_tracking and state and state['connected']:
                self.update_button_counts(state)
            
            self.gamepad_widget.set_gamepad_state(state if self.gamepad_index >= 0 else None)
        except Exception as e:
            print(f"Error updating gamepad: {e}")
    
    def show_statistics_and_close(self):
        stats_text = {}
        for key, count in self.button_counts.items():
            if count > 0:
                display_name = BUTTON_NAMES.get(key, key)
                stats_text[display_name] = count
        
        if not stats_text:
            stats_text = {"没有按键按下": 0}
        
        self.gamepad_widget.show_statistics(stats_text)
        self.stats_timer.start(3000)
    
    def hide_stats_and_close(self):
        self.gamepad_widget.hide_statistics()
        self.hide()
    
    def showEvent(self, event):
        super().showEvent(event)
        self.position_window()
        self.make_click_through()
        self.raise_()
        self.activateWindow()


class TrayApp:
    def __init__(self):
        self.app = QApplication(sys.argv)
        self.app.setQuitOnLastWindowClosed(False)
        
        self.overlay = GamepadOverlay()
        self.overlay_visible = False
        
        self.hotkey_listener = GlobalHotkeyListener()
        self.hotkey_listener.start(self.on_double_pause)
        
        self.create_tray_icon()
    
    def create_tray_icon(self):
        icon = self.create_icon()
        
        self.tray = QSystemTrayIcon()
        self.tray.setIcon(icon)
        self.tray.setToolTip("手柄可视化工具 - 双击Pause显示/隐藏")
        
        menu = QMenu()
        
        toggle_action = QAction("显示/隐藏手柄", self.app)
        toggle_action.triggered.connect(self.toggle_overlay)
        menu.addAction(toggle_action)
        
        menu.addSeparator()
        
        quit_action = QAction("退出", self.app)
        quit_action.triggered.connect(self.quit_app)
        menu.addAction(quit_action)
        
        self.tray.setContextMenu(menu)
        self.tray.activated.connect(self.on_tray_activated)
        self.tray.show()
    
    def create_icon(self):
        icon_path = os.path.join(os.path.dirname(__file__), 'gamepad.ico')
        if os.path.exists(icon_path):
            return QIcon(icon_path)
        
        pixmap = QPixmap(32, 32)
        pixmap.fill(Qt.transparent)
        
        painter = QPainter(pixmap)
        painter.setRenderHint(QPainter.Antialiasing)
        
        pen = QPen(QColor(0, 0, 0))
        pen.setWidthF(2)
        painter.setPen(pen)
        painter.setBrush(Qt.NoBrush)
        
        path = QPainterPath()
        path.addRoundedRect(QRect(4, 8, 24, 18), 6, 6)
        painter.drawPath(path)
        
        painter.setBrush(QColor(50, 50, 50))
        painter.setPen(Qt.NoPen)
        painter.drawEllipse(9, 13, 5, 5)
        painter.drawEllipse(19, 13, 5, 5)
        painter.drawEllipse(14, 17, 4, 4)
        
        painter.end()
        
        return QIcon(pixmap)
    
    def on_tray_activated(self, reason):
        if reason == QSystemTrayIcon.Trigger:
            self.toggle_overlay()
    
    def on_double_pause(self):
        print("Double Pause detected")
        self.toggle_overlay()
    
    def toggle_overlay(self):
        if self.overlay_visible:
            self.overlay.is_tracking = False
            self.overlay.show_statistics_and_close()
            self.overlay_visible = False
        else:
            self.overlay.reset_button_counts()
            self.overlay.gamepad_widget.hide_statistics()
            self.overlay.is_tracking = True
            self.overlay.show()
            self.overlay.raise_()
            self.overlay_visible = True
            print("Overlay shown, tracking started")
    
    def quit_app(self):
        self.hotkey_listener.stop()
        self.tray.hide()
        self.app.quit()
    
    def run(self):
        if not QSystemTrayIcon.isSystemTrayAvailable():
            QMessageBox.critical(None, "错误", "系统托盘不可用！")
            sys.exit(1)
        
        return self.app.exec()


if __name__ == "__main__":
    tray_app = TrayApp()
    sys.exit(tray_app.run())
