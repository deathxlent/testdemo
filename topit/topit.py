import sys
import ctypes
import ctypes.wintypes
import threading
import win32gui
import win32con
import win32api
import win32process
import pystray
from PIL import Image, ImageDraw, ImageFont
from dataclasses import dataclass
from typing import Optional, List

user32 = ctypes.windll.user32
kernel32 = ctypes.windll.kernel32

HWND_TOPMOST = -1
HWND_NOTOPMOST = -2
SWP_NOMOVE = 0x0002
SWP_NOSIZE = 0x0001
SWP_NOACTIVATE = 0x0010
SWP_SHOWWINDOW = 0x0040
GA_ROOTOWNER = 3


@dataclass
class WindowInfo:
    handle: int
    title: str
    process_name: str
    pid: int


class TopItApp:
    def __init__(self):
        self._current_topmost: int = 0
        self._lock = threading.Lock()
        self._icon: Optional[pystray.Icon] = None
        self._menu: Optional[pystray.Menu] = None

    def _enum_windows_callback(self, hwnd, windows):
        if not win32gui.IsWindowVisible(hwnd):
            return True

        if win32gui.IsIconic(hwnd):
            return True

        root_owner = user32.GetAncestor(hwnd, GA_ROOTOWNER)
        if root_owner != hwnd:
            return True

        if user32.GetLastActivePopup(root_owner) != hwnd:
            return True

        title = win32gui.GetWindowText(hwnd)
        if not title or not title.strip():
            return True

        class_name = win32gui.GetClassName(hwnd)
        if class_name in ("Shell_TrayWnd", "Progman", "WorkerW"):
            return True

        _, pid = win32process.GetWindowThreadProcessId(hwnd)
        process_name = self._get_process_name(pid)

        windows.append(WindowInfo(
            handle=hwnd,
            title=title.strip(),
            process_name=process_name,
            pid=pid
        ))
        return True

    def _get_process_name(self, pid: int) -> str:
        try:
            h_process = kernel32.OpenProcess(0x0400 | 0x0010, False, pid)
            if not h_process:
                return "Unknown"

            name_buf = ctypes.create_unicode_buffer(1024)
            size = ctypes.wintypes.DWORD(1024)
            if ctypes.windll.psapi.GetProcessImageFileNameW(h_process, name_buf, ctypes.byref(size)):
                name = name_buf.value
                kernel32.CloseHandle(h_process)
                return name.split("\\")[-1].replace(".exe", "")
            kernel32.CloseHandle(h_process)
        except Exception:
            pass
        return "Unknown"

    def get_visible_windows(self) -> List[WindowInfo]:
        windows: List[WindowInfo] = []
        win32gui.EnumWindows(self._enum_windows_callback, windows)
        return sorted(windows, key=lambda w: w.title.lower())

    def set_topmost(self, hwnd: int, topmost: bool) -> bool:
        h_after = HWND_TOPMOST if topmost else HWND_NOTOPMOST
        flags = SWP_NOMOVE | SWP_NOSIZE | SWP_NOACTIVATE
        return bool(user32.SetWindowPos(hwnd, h_after, 0, 0, 0, 0, flags))

    def toggle_window(self, window: WindowInfo):
        with self._lock:
            if window.handle == self._current_topmost:
                self.set_topmost(window.handle, False)
                self._current_topmost = 0
                self._notify(f"已取消置顶: {self._short_title(window.title)}")
            else:
                if self._current_topmost:
                    self.set_topmost(self._current_topmost, False)

                success = self.set_topmost(window.handle, True)
                if success:
                    self._current_topmost = window.handle
                    win32gui.SetForegroundWindow(window.handle)
                    self._notify(f"已置顶: {self._short_title(window.title)}")
                else:
                    self._current_topmost = 0
                    self._notify("置顶失败，请重试")

    def cancel_topmost(self):
        with self._lock:
            if self._current_topmost:
                self.set_topmost(self._current_topmost, False)
                self._current_topmost = 0
                self._notify("已取消置顶")

    def _short_title(self, title: str) -> str:
        return title[:30] + "..." if len(title) > 30 else title

    def _notify(self, message: str):
        if self._icon:
            try:
                self._icon.notify(message, "TopIt")
            except Exception:
                pass

    def _create_icon(self) -> Image.Image:
        img = Image.new('RGBA', (64, 64), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)

        draw.rounded_rectangle([4, 4, 60, 60], radius=8, fill=(52, 152, 219, 255))

        draw.line([16, 32, 32, 16], fill=(255, 255, 255), width=4)
        draw.line([24, 16, 48, 16], fill=(255, 255, 255), width=4)
        draw.line([48, 16, 48, 40], fill=(255, 255, 255), width=4)
        draw.line([16, 48, 48, 48], fill=(255, 255, 255), width=4)

        return img

    def _build_menu(self) -> pystray.Menu:
        def on_clicked(icon, window):
            threading.Thread(target=self.toggle_window, args=(window,), daemon=True).start()

        def on_cancel(icon):
            threading.Thread(target=self.cancel_topmost, daemon=True).start()

        def on_exit(icon):
            self._cleanup()
            icon.stop()
            sys.exit(0)

        windows = self.get_visible_windows()
        items = []

        items.append(pystray.MenuItem("选择窗口置顶", None, enabled=False))
        items.append(pystray.Menu.SEPARATOR)

        for w in windows:
            display_title = w.title[:50] + "..." if len(w.title) > 50 else w.title
            is_current = w.handle == self._current_topmost

            items.append(pystray.MenuItem(
                display_title,
                lambda icon, item, win=w: on_clicked(icon, win),
                checked=lambda item, win=w: win.handle == self._current_topmost
            ))

        if self._current_topmost:
            items.append(pystray.Menu.SEPARATOR)
            items.append(pystray.MenuItem("取消当前置顶", on_cancel))

        items.append(pystray.Menu.SEPARATOR)
        items.append(pystray.MenuItem("退出", on_exit))

        return pystray.Menu(*items)

    def _on_left_click(self, icon, event):
        icon.menu = self._build_menu()
        icon.update_menu()

    def _cleanup(self):
        with self._lock:
            if self._current_topmost:
                self.set_topmost(self._current_topmost, False)
                self._current_topmost = 0

    def run(self):
        self._icon = pystray.Icon(
            "TopIt",
            self._create_icon(),
            "TopIt - 窗口置顶工具",
            menu=self._build_menu()
        )

        self._icon.default_action = self._on_left_click

        try:
            self._icon.run()
        finally:
            self._cleanup()


if __name__ == "__main__":
    app = TopItApp()
    app.run()
