import sys
from typing import Optional, Tuple
from PyQt6.QtWidgets import QWidget, QLabel, QVBoxLayout, QApplication
from PyQt6.QtCore import Qt, QTimer, pyqtSignal
from PyQt6.QtGui import QPixmap, QImage, QPainter, QColor, QMouseEvent, QCursor


class SecondScreenWindow(QWidget):
    touch_event = pyqtSignal(dict)

    def __init__(self, screen_index: int = 1):
        super().__init__()
        self.screen_index = screen_index
        self._frame_data: Optional[QPixmap] = None
        self._frame_size: Tuple[int, int] = (0, 0)
        self._is_touching = False
        self._last_pos = None

        self.setWindowTitle("第二屏幕")
        self.setWindowFlags(
            Qt.WindowType.FramelessWindowHint
            | Qt.WindowType.WindowStaysOnTopHint
            | Qt.WindowType.Tool
        )
        self.setAttribute(Qt.WidgetAttribute.WA_TranslucentBackground, False)
        self.setStyleSheet("background-color: black;")
        self.setMouseTracking(True)

        self._image_label = QLabel(self)
        self._image_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self._image_label.setStyleSheet("background-color: black;")

        layout = QVBoxLayout(self)
        layout.setContentsMargins(0, 0, 0, 0)
        layout.addWidget(self._image_label)

        self._touch_cursor = QCursor(Qt.CursorShape.BlankCursor)
        self.setCursor(self._touch_cursor)

        screens = QApplication.screens()
        if screen_index < len(screens):
            screen = screens[screen_index]
            self.setGeometry(screen.geometry())
            self.showFullScreen()
        else:
            self.resize(800, 600)
            self.center_on_screen()

    def center_on_screen(self):
        screen = QApplication.primaryScreen().geometry()
        x = (screen.width() - self.width()) // 2
        y = (screen.height() - self.height()) // 2
        self.move(x, y)

    def update_frame(self, frame_bytes: bytes):
        try:
            qimage = QImage.fromData(frame_bytes, "JPEG")
            if not qimage.isNull():
                self._frame_size = (qimage.width(), qimage.height())
                self._frame_data = QPixmap.fromImage(qimage)
                self._update_display()
        except Exception as e:
            print(f"Frame update error: {e}")

    def _update_display(self):
        if self._frame_data:
            scaled = self._frame_data.scaled(
                self._image_label.size(),
                Qt.AspectRatioMode.KeepAspectRatio,
                Qt.TransformationMode.SmoothTransformation,
            )
            self._image_label.setPixmap(scaled)

    def resizeEvent(self, event):
        super().resizeEvent(event)
        self._update_display()

    def mousePressEvent(self, event: QMouseEvent):
        if event.button() == Qt.MouseButton.LeftButton:
            self._is_touching = True
            self._last_pos = event.position()
            self._send_touch_event("down", event.position())
            self.setCursor(QCursor(Qt.CursorShape.BlankCursor))

    def mouseMoveEvent(self, event: QMouseEvent):
        if self._is_touching and self._last_pos:
            self._send_touch_event("move", event.position())
            self._last_pos = event.position()

    def mouseReleaseEvent(self, event: QMouseEvent):
        if event.button() == Qt.MouseButton.LeftButton and self._is_touching:
            self._is_touching = False
            self._send_touch_event("up", event.position())
            self._last_pos = None

    def _send_touch_event(self, action: str, pos):
        if self._frame_size[0] == 0 or self._frame_size[1] == 0:
            return

        label_rect = self._image_label.rect()
        if self._frame_data:
            scaled_size = self._frame_data.size()
            scaled_size.scale(label_rect.size(), Qt.AspectRatioMode.KeepAspectRatio)
            offset_x = (label_rect.width() - scaled_size.width()) / 2
            offset_y = (label_rect.height() - scaled_size.height()) / 2

            x = pos.x() - offset_x
            y = pos.y() - offset_y

            if 0 <= x <= scaled_size.width() and 0 <= y <= scaled_size.height():
                rel_x = x / scaled_size.width()
                rel_y = y / scaled_size.height()

                touch_data = {
                    "action": action,
                    "x": rel_x,
                    "y": rel_y,
                    "screen_width": self._frame_size[0],
                    "screen_height": self._frame_size[1],
                }
                self.touch_event.emit(touch_data)

    def keyPressEvent(self, event):
        if event.key() == Qt.Key.Key_Escape:
            self.close()


class SecondScreenManager:
    def __init__(self):
        self._window: Optional[SecondScreenWindow] = None
        self._is_active = False

    def is_available(self) -> bool:
        screens = QApplication.screens()
        return len(screens) > 1

    def start(self, screen_index: int = 1) -> bool:
        if self._is_active:
            return True

        try:
            self._window = SecondScreenWindow(screen_index)
            self._window.show()
            self._is_active = True
            return True
        except Exception as e:
            print(f"Failed to start second screen: {e}")
            return False

    def stop(self):
        if self._window:
            self._window.close()
            self._window = None
        self._is_active = False

    def is_active(self) -> bool:
        return self._is_active and self._window is not None

    def update_frame(self, frame_bytes: bytes):
        if self._window:
            self._window.update_frame(frame_bytes)

    def set_touch_callback(self, callback):
        if self._window:
            self._window.touch_event.connect(callback)

    def get_available_screens(self) -> list:
        screens = QApplication.screens()
        result = []
        for i, screen in enumerate(screens):
            geo = screen.geometry()
            result.append(
                {
                    "index": i,
                    "name": screen.name(),
                    "width": geo.width(),
                    "height": geo.height(),
                    "geometry": (geo.left(), geo.top(), geo.width(), geo.height()),
                }
            )
        return result
