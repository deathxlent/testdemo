import ctypes
from ctypes import wintypes

user32 = ctypes.windll.user32
kernel32 = ctypes.windll.kernel32

class RECT(ctypes.Structure):
    _fields_ = [
        ("left", ctypes.c_long),
        ("top", ctypes.c_long),
        ("right", ctypes.c_long),
        ("bottom", ctypes.c_long)
    ]

MONITOR_DEFAULTTONEAREST = 2
MONITOR_DEFAULTTOPRIMARY = 1

class MONITORINFO(ctypes.Structure):
    _fields_ = [
        ("cbSize", ctypes.c_ulong),
        ("rcMonitor", RECT),
        ("rcWork", RECT),
        ("dwFlags", ctypes.c_ulong)
    ]

GetForegroundWindow = user32.GetForegroundWindow
GetWindowRect = user32.GetWindowRect
GetWindowThreadProcessId = user32.GetWindowThreadProcessId
MonitorFromWindow = user32.MonitorFromWindow
GetMonitorInfoW = user32.GetMonitorInfoW
IsWindowVisible = user32.IsWindowVisible
GetWindowTextLengthW = user32.GetWindowTextLengthW
GetWindowTextW = user32.GetWindowTextW

def get_monitor_rect(hwnd):
    hmonitor = MonitorFromWindow(hwnd, MONITOR_DEFAULTTONEAREST)
    info = MONITORINFO()
    info.cbSize = ctypes.sizeof(MONITORINFO)
    if GetMonitorInfoW(hmonitor, ctypes.byref(info)):
        return info.rcMonitor
    return None

def is_fullscreen_window(hwnd):
    if not hwnd or not IsWindowVisible(hwnd):
        return False
    
    title_length = GetWindowTextLengthW(hwnd)
    if title_length == 0:
        return False
    
    window_rect = RECT()
    if not GetWindowRect(hwnd, ctypes.byref(window_rect)):
        return False
    
    monitor_rect = get_monitor_rect(hwnd)
    if not monitor_rect:
        return False
    
    window_width = window_rect.right - window_rect.left
    window_height = window_rect.bottom - window_rect.top
    monitor_width = monitor_rect.right - monitor_rect.left
    monitor_height = monitor_rect.bottom - monitor_rect.top
    
    width_match = abs(window_width - monitor_width) <= 2
    height_match = abs(window_height - monitor_height) <= 2
    
    return width_match and height_match

def is_fullscreen_app_running():
    hwnd = GetForegroundWindow()
    return is_fullscreen_window(hwnd)
