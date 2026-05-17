import threading
import time
from typing import Callable, Optional, Tuple
from PIL import ImageGrab, Image
import io
import numpy as np

try:
    import mss

    MSS_AVAILABLE = True
except ImportError:
    MSS_AVAILABLE = False


class ScreenCapturer:
    def __init__(self, fps: int = 30, quality: int = 60):
        self.fps = fps
        self.quality = quality
        self.running = False
        self._capture_thread: Optional[threading.Thread] = None
        self._monitor_index = 0
        self._region: Optional[Tuple[int, int, int, int]] = None

        self.on_frame: Optional[Callable[[bytes, Tuple[int, int]], None]] = None
        self._last_frame_time = 0
        self._sct = None

    def set_monitor(self, monitor_index: int):
        self._monitor_index = monitor_index

    def set_region(self, region: Optional[Tuple[int, int, int, int]]):
        self._region = region

    def set_fps(self, fps: int):
        self.fps = max(1, min(60, fps))

    def set_quality(self, quality: int):
        self.quality = max(10, min(100, quality))

    def start(self):
        if self.running:
            return
        self.running = True

        if MSS_AVAILABLE:
            self._sct = mss.mss()

        self._capture_thread = threading.Thread(target=self._capture_loop, daemon=True)
        self._capture_thread.start()

    def stop(self):
        self.running = False
        if self._capture_thread:
            self._capture_thread.join(timeout=1)
        if self._sct:
            try:
                self._sct.close()
            except Exception:
                pass
            self._sct = None

    def _capture_loop(self):
        frame_interval = 1.0 / self.fps

        while self.running:
            start_time = time.time()

            try:
                frame_data, size = self._capture_frame()
                if frame_data and self.on_frame:
                    self.on_frame(frame_data, size)
            except Exception as e:
                print(f"Capture error: {e}")

            elapsed = time.time() - start_time
            sleep_time = max(0, frame_interval - elapsed)
            if sleep_time > 0:
                time.sleep(sleep_time)

    def _capture_frame(self) -> Tuple[Optional[bytes], Tuple[int, int]]:
        if MSS_AVAILABLE and self._sct:
            return self._capture_with_mss()
        return self._capture_with_pil()

    def _capture_with_mss(self) -> Tuple[Optional[bytes], Tuple[int, int]]:
        try:
            monitors = self._sct.monitors

            if self._region:
                monitor = {
                    "left": self._region[0],
                    "top": self._region[1],
                    "width": self._region[2] - self._region[0],
                    "height": self._region[3] - self._region[1],
                }
            else:
                monitor_idx = min(self._monitor_index, len(monitors) - 1)
                monitor = monitors[monitor_idx]

            sct_img = self._sct.grab(monitor)
            img = Image.frombytes("RGB", sct_img.size, sct_img.rgb)

            buffer = io.BytesIO()
            img.save(buffer, format="JPEG", quality=self.quality, optimize=True)
            return buffer.getvalue(), (sct_img.width, sct_img.height)

        except Exception as e:
            print(f"MSS capture error: {e}")
            return None, (0, 0)

    def _capture_with_pil(self) -> Tuple[Optional[bytes], Tuple[int, int]]:
        try:
            if self._region:
                bbox = self._region
            else:
                bbox = None

            img = ImageGrab.grab(bbox=bbox, all_screens=True)

            buffer = io.BytesIO()
            img.save(buffer, format="JPEG", quality=self.quality, optimize=True)
            return buffer.getvalue(), img.size

        except Exception as e:
            print(f"PIL capture error: {e}")
            return None, (0, 0)

    def capture_single_frame(self) -> Tuple[Optional[bytes], Tuple[int, int]]:
        if MSS_AVAILABLE:
            with mss.mss() as sct:
                monitors = sct.monitors
                monitor_idx = min(self._monitor_index, len(monitors) - 1)
                monitor = monitors[monitor_idx]
                sct_img = sct.grab(monitor)
                img = Image.frombytes("RGB", sct_img.size, sct_img.rgb)
                buffer = io.BytesIO()
                img.save(buffer, format="JPEG", quality=self.quality)
                return buffer.getvalue(), (sct_img.width, sct_img.height)
        else:
            img = ImageGrab.grab(all_screens=True)
            buffer = io.BytesIO()
            img.save(buffer, format="JPEG", quality=self.quality)
            return buffer.getvalue(), img.size

    @staticmethod
    def get_monitor_count() -> int:
        if MSS_AVAILABLE:
            try:
                with mss.mss() as sct:
                    return len(sct.monitors) - 1
            except Exception:
                pass
        return 1

    @staticmethod
    def get_monitors() -> list:
        monitors = []
        if MSS_AVAILABLE:
            try:
                with mss.mss() as sct:
                    for i, m in enumerate(sct.monitors[1:], 1):
                        monitors.append(
                            {
                                "index": i,
                                "left": m["left"],
                                "top": m["top"],
                                "width": m["width"],
                                "height": m["height"],
                            }
                        )
            except Exception:
                pass
        return monitors
