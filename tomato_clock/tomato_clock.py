import sys
import math
from PyQt5.QtWidgets import (QApplication, QSystemTrayIcon, QMenu, QAction, 
                             QDialog, QVBoxLayout, QLabel, QSpinBox, 
                             QPushButton, QHBoxLayout, QMessageBox, QWidget)
from PyQt5.QtCore import Qt, QTimer, QPoint, QRect, QSize
from PyQt5.QtGui import QIcon, QPixmap, QPainter, QColor, QFont, QPen, QBrush


class TomatoIcon:
    @staticmethod
    def create_pixmap(rotation=0, size=64):
        pixmap = QPixmap(size, size)
        pixmap.fill(Qt.transparent)
        
        painter = QPainter(pixmap)
        painter.setRenderHint(QPainter.Antialiasing)
        
        center_x = size // 2
        center_y = size // 2
        radius = size // 2 - 4
        
        painter.save()
        painter.translate(center_x, center_y)
        painter.rotate(rotation)
        painter.translate(-center_x, -center_y)
        
        body_radius = int(radius * 0.7)
        painter.setBrush(QBrush(QColor(255, 80, 80)))
        painter.setPen(Qt.NoPen)
        painter.drawEllipse(center_x - body_radius, center_y - body_radius + 2,
                           body_radius * 2, body_radius * 2)
        
        leaf_width = int(radius * 0.35)
        leaf_height = int(radius * 0.25)
        painter.setBrush(QBrush(QColor(76, 175, 80)))
        painter.drawEllipse(center_x - leaf_width // 2, 
                           center_y - body_radius - leaf_height // 2,
                           leaf_width, leaf_height)
        
        stem_width = int(radius * 0.08)
        stem_height = int(radius * 0.2)
        painter.setBrush(QBrush(QColor(121, 85, 72)))
        painter.drawRect(center_x - stem_width // 2, 
                        center_y - body_radius - stem_height,
                        stem_width, stem_height)
        
        painter.setPen(QPen(QColor(200, 50, 50), 2))
        painter.drawLine(center_x - int(body_radius * 0.5), center_y, 
                        center_x - int(body_radius * 0.2), center_y)
        painter.drawLine(center_x + int(body_radius * 0.2), center_y, 
                        center_x + int(body_radius * 0.5), center_y)
        
        painter.restore()
        painter.end()
        
        return pixmap


class SleepOverlay(QWidget):
    def __init__(self):
        super().__init__()
        self.init_ui()
        
    def init_ui(self):
        self.setWindowFlags(Qt.FramelessWindowHint | Qt.WindowStaysOnTopHint | Qt.Tool)
        self.setAttribute(Qt.WA_TranslucentBackground)
        self.setAttribute(Qt.WA_ShowWithoutActivating)
        
        screen = QApplication.primaryScreen().geometry()
        self.setGeometry(screen)
        
        self.text_height = screen.height() // 5
        
        layout = QVBoxLayout(self)
        layout.setContentsMargins(0, 0, 0, 0)
        
        self.label = QLabel("Zzz...", self)
        self.label.setAlignment(Qt.AlignCenter)
        self.label.setStyleSheet("color: rgba(128, 128, 128, 200);")
        
        font = QFont("Arial", self.text_height // 2, QFont.Bold)
        self.label.setFont(font)
        
        layout.addWidget(self.label)
        
    def mousePressEvent(self, event):
        self.close()
        
    def keyPressEvent(self, event):
        self.close()


class TimeSettingsDialog(QDialog):
    def __init__(self, current_minutes, parent=None):
        super().__init__(parent)
        self.setWindowTitle("设置番茄钟时间")
        self.setWindowFlags(self.windowFlags() & ~Qt.WindowContextHelpButtonHint)
        
        layout = QVBoxLayout(self)
        
        time_layout = QHBoxLayout()
        time_layout.addWidget(QLabel("时间（分钟）:"))
        
        self.spin_box = QSpinBox()
        self.spin_box.setRange(1, 180)
        self.spin_box.setValue(current_minutes)
        time_layout.addWidget(self.spin_box)
        
        layout.addLayout(time_layout)
        
        button_layout = QHBoxLayout()
        ok_button = QPushButton("确定")
        ok_button.clicked.connect(self.accept)
        cancel_button = QPushButton("取消")
        cancel_button.clicked.connect(self.reject)
        
        button_layout.addWidget(ok_button)
        button_layout.addWidget(cancel_button)
        layout.addLayout(button_layout)
        
    def get_minutes(self):
        return self.spin_box.value()


class TomatoClock:
    def __init__(self):
        self.app = QApplication(sys.argv)
        self.app.setQuitOnLastWindowClosed(False)
        
        if not QSystemTrayIcon.isSystemTrayAvailable():
            QMessageBox.critical(None, "错误", "系统托盘不可用！")
            sys.exit(1)
        
        self.default_minutes = 25
        self.total_seconds = self.default_minutes * 60
        self.remaining_seconds = self.total_seconds
        self.is_running = False
        self.rotation_angle = 0
        
        self.setup_tray()
        self.setup_timers()
        
    def setup_tray(self):
        self.tray_icon = QSystemTrayIcon()
        self.update_icon()
        
        menu = QMenu()
        
        self.start_action = QAction("开始计时", self.app)
        self.start_action.triggered.connect(self.toggle_timer)
        menu.addAction(self.start_action)
        
        settings_action = QAction("设置时间", self.app)
        settings_action.triggered.connect(self.show_settings)
        menu.addAction(settings_action)
        
        reset_action = QAction("重置", self.app)
        reset_action.triggered.connect(self.reset_timer)
        menu.addAction(reset_action)
        
        menu.addSeparator()
        
        quit_action = QAction("退出", self.app)
        quit_action.triggered.connect(self.quit)
        menu.addAction(quit_action)
        
        self.tray_icon.setContextMenu(menu)
        self.tray_icon.activated.connect(self.on_tray_activated)
        self.update_tooltip()
        self.tray_icon.show()
        
    def setup_timers(self):
        self.countdown_timer = QTimer()
        self.countdown_timer.setInterval(1000)
        self.countdown_timer.timeout.connect(self.update_countdown)
        
        self.animation_timer = QTimer()
        self.animation_timer.setInterval(50)
        self.animation_timer.timeout.connect(self.update_animation)
        
    def update_icon(self):
        pixmap = TomatoIcon.create_pixmap(self.rotation_angle if self.is_running else 0)
        self.tray_icon.setIcon(QIcon(pixmap))
        
    def update_tooltip(self):
        if self.is_running:
            mins = self.remaining_seconds // 60
            secs = self.remaining_seconds % 60
            self.tray_icon.setToolTip(f"番茄钟 - 剩余 {mins:02d}:{secs:02d}")
        else:
            self.tray_icon.setToolTip(f"番茄钟 - {self.default_minutes} 分钟 (点击开始)")
        
    def update_countdown(self):
        self.remaining_seconds -= 1
        self.update_tooltip()
        
        if self.remaining_seconds <= 0:
            self.timer_finished()
            
    def update_animation(self):
        self.rotation_angle = (self.rotation_angle + 5) % 360
        self.update_icon()
        
    def toggle_timer(self):
        if not self.is_running:
            self.start_timer()
        else:
            self.confirm_stop()
            
    def start_timer(self):
        self.is_running = True
        self.start_action.setText("暂停/停止")
        self.countdown_timer.start()
        self.animation_timer.start()
        self.update_tooltip()
        self.update_icon()
        
    def confirm_stop(self):
        mins = self.remaining_seconds // 60
        secs = self.remaining_seconds % 60
        reply = QMessageBox.question(
            None, 
            "确认停止", 
            f"还剩 {mins:02d}:{secs:02d}，确定要提前结束吗？",
            QMessageBox.Yes | QMessageBox.No,
            QMessageBox.No
        )
        
        if reply == QMessageBox.Yes:
            self.stop_timer()
            
    def stop_timer(self):
        self.is_running = False
        self.start_action.setText("开始计时")
        self.countdown_timer.stop()
        self.animation_timer.stop()
        self.rotation_angle = 0
        self.remaining_seconds = self.total_seconds
        self.update_tooltip()
        self.update_icon()
        
    def reset_timer(self):
        self.remaining_seconds = self.total_seconds
        if self.is_running:
            self.stop_timer()
        else:
            self.update_tooltip()
        
    def timer_finished(self):
        self.stop_timer()
        self.show_sleep_overlay()
        
    def show_sleep_overlay(self):
        self.overlay = SleepOverlay()
        self.overlay.show()
        
    def show_settings(self):
        dialog = TimeSettingsDialog(self.default_minutes)
        if dialog.exec_() == QDialog.Accepted:
            self.default_minutes = dialog.get_minutes()
            self.total_seconds = self.default_minutes * 60
            self.remaining_seconds = self.total_seconds
            self.update_tooltip()
            
    def on_tray_activated(self, reason):
        if reason == QSystemTrayIcon.Trigger:
            self.toggle_timer()
            
    def quit(self):
        self.tray_icon.hide()
        QApplication.quit()
        
    def run(self):
        sys.exit(self.app.exec_())


if __name__ == "__main__":
    clock = TomatoClock()
    clock.run()
