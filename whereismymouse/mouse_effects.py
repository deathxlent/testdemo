import ctypes
import time
import threading
import math
from ctypes import wintypes, WINFUNCTYPE

user32 = ctypes.windll.user32
gdi32 = ctypes.windll.gdi32
kernel32 = ctypes.windll.kernel32

WS_EX_LAYERED = 0x00080000
WS_EX_TRANSPARENT = 0x00000020
WS_EX_TOOLWINDOW = 0x00000080
WS_EX_TOPMOST = 0x00000008
WS_POPUP = 0x80000000
SW_SHOWNA = 8
WM_PAINT = 0x000F
WM_ERASEBKGND = 0x0014

class POINT(ctypes.Structure):
    _fields_ = [("x", ctypes.c_long), ("y", ctypes.c_long)]

class RECT(ctypes.Structure):
    _fields_ = [
        ("left", ctypes.c_long),
        ("top", ctypes.c_long),
        ("right", ctypes.c_long),
        ("bottom", ctypes.c_long)
    ]

class PAINTSTRUCT(ctypes.Structure):
    _fields_ = [
        ("hdc", wintypes.HDC),
        ("fErase", wintypes.BOOL),
        ("rcPaint", RECT),
        ("fRestore", wintypes.BOOL),
        ("fIncUpdate", wintypes.BOOL),
        ("rgbReserved", wintypes.BYTE * 32)
    ]

def get_cursor_pos():
    pt = POINT()
    user32.GetCursorPos(ctypes.byref(pt))
    return (pt.x, pt.y)

class HighlightCircle:
    def __init__(self):
        self.hwnd = None
        self._wnd_proc_ref = None
        self._class_name = None
        
    def create(self, window_name):
        WNDPROC = WINFUNCTYPE(
            ctypes.c_long,
            wintypes.HWND,
            ctypes.c_uint,
            wintypes.WPARAM,
            wintypes.LPARAM
        )
        
        def wnd_proc(hwnd, msg, wparam, lparam):
            if msg == WM_PAINT:
                ps = PAINTSTRUCT()
                hdc = user32.BeginPaint(hwnd, ctypes.byref(ps))
                
                rect = RECT()
                user32.GetClientRect(hwnd, ctypes.byref(rect))
                
                pen = gdi32.CreatePen(0, 3, 0x0000FF)
                old_pen = gdi32.SelectObject(hdc, pen)
                
                brush = gdi32.GetStockObject(5)
                old_brush = gdi32.SelectObject(hdc, brush)
                
                gdi32.Ellipse(hdc, 2, 2, rect.right - 2, rect.bottom - 2)
                
                gdi32.SelectObject(hdc, old_pen)
                gdi32.SelectObject(hdc, old_brush)
                gdi32.DeleteObject(pen)
                
                user32.EndPaint(hwnd, ctypes.byref(ps))
                return 0
            elif msg == WM_ERASEBKGND:
                return 1
            return user32.DefWindowProcW(hwnd, msg, wparam, lparam)
        
        self._wnd_proc_ref = WNDPROC(wnd_proc)
        
        class WNDCLASSW(ctypes.Structure):
            _fields_ = [
                ("style", ctypes.c_uint),
                ("lpfnWndProc", WNDPROC),
                ("cbClsExtra", ctypes.c_int),
                ("cbWndExtra", ctypes.c_int),
                ("hInstance", wintypes.HINSTANCE),
                ("hIcon", wintypes.HICON),
                ("hCursor", wintypes.HCURSOR),
                ("hbrBackground", wintypes.HBRUSH),
                ("lpszMenuName", wintypes.LPCWSTR),
                ("lpszClassName", wintypes.LPCWSTR)
            ]
        
        self._class_name = f"Highlight_{window_name}_{int(time.time()*1000)}"
        hInstance = kernel32.GetModuleHandleW(None)
        
        wc = WNDCLASSW()
        wc.style = 0
        wc.lpfnWndProc = self._wnd_proc_ref
        wc.cbClsExtra = 0
        wc.cbWndExtra = 0
        wc.hInstance = hInstance
        wc.hIcon = None
        wc.hCursor = None
        wc.hbrBackground = None
        wc.lpszMenuName = None
        wc.lpszClassName = self._class_name
        
        user32.RegisterClassW(ctypes.byref(wc))
        
        self.hwnd = user32.CreateWindowExW(
            WS_EX_LAYERED | WS_EX_TRANSPARENT | WS_EX_TOOLWINDOW | WS_EX_TOPMOST,
            self._class_name,
            "MouseHighlight",
            WS_POPUP,
            0, 0, 100, 100,
            None, None, hInstance, None
        )
        
        user32.SetLayeredWindowAttributes(self.hwnd, 0xFFFFFF, 200, 0x00000001)
        user32.ShowWindow(self.hwnd, SW_SHOWNA)
        
    def update(self, cx, cy, scale):
        if not self.hwnd:
            return
        
        size = int(32 * scale)
        
        user32.SetWindowPos(
            self.hwnd,
            None,
            cx - size, cy - size,
            size * 2, size * 2,
            0x0040
        )
        user32.InvalidateRect(self.hwnd, None, True)
        
        msg = wintypes.MSG()
        while user32.PeekMessageW(ctypes.byref(msg), self.hwnd, 0, 0, 1):
            user32.TranslateMessage(ctypes.byref(msg))
            user32.DispatchMessageW(ctypes.byref(msg))
    
    def destroy(self):
        if self.hwnd:
            user32.DestroyWindow(self.hwnd)
            self.hwnd = None

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
        
        cutoff_time = current_time - self.config["shake_time"]
        self.shake_positions = [(t, pos) for t, pos in self.shake_positions if t >= cutoff_time]
        
        if len(self.shake_positions) < 5:
            return False
        
        total_distance = 0
        for i in range(1, len(self.shake_positions)):
            dx = self.shake_positions[i][1][0] - self.shake_positions[i-1][1][0]
            dy = self.shake_positions[i][1][1] - self.shake_positions[i-1][1][1]
            total_distance += math.sqrt(dx*dx + dy*dy)
        
        return total_distance > self.config["shake_threshold"]
    
    def temporary_magnify(self):
        if self.magnify_thread and self.magnify_thread.is_alive():
            return
        
        self.magnify_stop_event.clear()
        stop_event = self.magnify_stop_event
        
        def magnify_task():
            highlight = HighlightCircle()
            try:
                highlight.create("magnify")
                start_time = time.time()
                while time.time() - start_time < self.config["magnify_duration"]:
                    if stop_event.is_set():
                        break
                    
                    cx, cy = get_cursor_pos()
                    highlight.update(cx, cy, self.config["cursor_scale"])
                    time.sleep(0.03)
            finally:
                highlight.destroy()
        
        self.magnify_thread = threading.Thread(target=magnify_task, daemon=True)
        self.magnify_thread.start()
    
    def stop_temporary_magnify(self):
        self.magnify_stop_event.set()
    
    def start_pulse_animation(self):
        if self.pulse_thread and self.pulse_thread.is_alive():
            self.stop_pulse_animation()
            time.sleep(0.1)
        
        self.pulse_stop_event.clear()
        stop_event = self.pulse_stop_event
        
        def pulse_task():
            highlight = HighlightCircle()
            try:
                highlight.create("pulse")
                start_time = time.time()
                duration = self.config["pulse_duration"]
                min_scale = self.config["pulse_min_scale"]
                max_scale = self.config["pulse_max_scale"]
                
                while time.time() - start_time < duration and not stop_event.is_set():
                    elapsed = time.time() - start_time
                    phase = (elapsed * 3) % 2
                    if phase > 1:
                        phase = 2 - phase
                    
                    scale = min_scale + (max_scale - min_scale) * phase
                    
                    cx, cy = get_cursor_pos()
                    highlight.update(cx, cy, scale)
                    time.sleep(0.03)
            finally:
                highlight.destroy()
        
        self.pulse_thread = threading.Thread(target=pulse_task, daemon=True)
        self.pulse_thread.start()
    
    def stop_pulse_animation(self):
        self.pulse_stop_event.set()
    
    def cleanup(self):
        self.stop_temporary_magnify()
        self.stop_pulse_animation()
