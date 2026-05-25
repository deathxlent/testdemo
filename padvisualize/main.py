import sys
import os
from PySide6.QtWidgets import QApplication, QWidget, QVBoxLayout, QMenu, QSystemTrayIcon, QMessageBox
from PySide6.QtGui import QIcon, QPainter, QColor, QPixmap, QAction, QPainterPath, QPen
from PySide6.QtCore import Qt, QTimer, QRect
import ctypes
from ctypes import wintypes

from gamepad_widget import GamepadWidget
from gamepad_input import get_any_connected_gamepad, get_gamepad_state


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
        
        self.setFixedSize(260, 220)
        
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
            
            self.gamepad_widget.set_gamepad_state(state if self.gamepad_index >= 0 else None)
        except Exception as e:
            print(f"Error updating gamepad: {e}")
    
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
        
        self.create_tray_icon()
        self.overlay.show()
        self.overlay_visible = True
    
    def create_tray_icon(self):
        icon = self.create_icon()
        
        self.tray = QSystemTrayIcon()
        self.tray.setIcon(icon)
        self.tray.setToolTip("手柄可视化工具")
        
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
        
        pen = QPen(QColor(100, 149, 237))
        pen.setWidthF(1.5)
        painter.setPen(pen)
        painter.setBrush(Qt.NoBrush)
        
        path = QPainterPath()
        path.addRoundedRect(QRect(4, 8, 24, 18), 6, 6)
        painter.drawPath(path)
        
        painter.setBrush(QColor(135, 206, 250))
        painter.setPen(Qt.NoPen)
        painter.drawEllipse(9, 13, 5, 5)
        painter.drawEllipse(19, 13, 5, 5)
        painter.drawEllipse(14, 17, 4, 4)
        
        painter.end()
        
        return QIcon(pixmap)
    
    def on_tray_activated(self, reason):
        if reason == QSystemTrayIcon.Trigger:
            self.toggle_overlay()
    
    def toggle_overlay(self):
        if self.overlay_visible:
            self.overlay.hide()
            self.overlay_visible = False
        else:
            self.overlay.show()
            self.overlay.raise_()
            self.overlay_visible = True
    
    def quit_app(self):
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
