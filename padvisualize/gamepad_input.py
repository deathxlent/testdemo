import ctypes
import time
from typing import Dict, Tuple

# XInput 常量定义
XINPUT_GAMEPAD_DPAD_UP = 0x0001
XINPUT_GAMEPAD_DPAD_DOWN = 0x0002
XINPUT_GAMEPAD_DPAD_LEFT = 0x0004
XINPUT_GAMEPAD_DPAD_RIGHT = 0x0008
XINPUT_GAMEPAD_START = 0x0010
XINPUT_GAMEPAD_BACK = 0x0020
XINPUT_GAMEPAD_LEFT_THUMB = 0x0040
XINPUT_GAMEPAD_RIGHT_THUMB = 0x0080
XINPUT_GAMEPAD_LEFT_SHOULDER = 0x0100
XINPUT_GAMEPAD_RIGHT_SHOULDER = 0x0200
XINPUT_GAMEPAD_GUIDE = 0x0400
XINPUT_GAMEPAD_A = 0x1000
XINPUT_GAMEPAD_B = 0x2000
XINPUT_GAMEPAD_X = 0x4000
XINPUT_GAMEPAD_Y = 0x8000

# XInput 结构定义
class XINPUT_GAMEPAD(ctypes.Structure):
    _fields_ = [
        ("wButtons", ctypes.c_ushort),
        ("bLeftTrigger", ctypes.c_ubyte),
        ("bRightTrigger", ctypes.c_ubyte),
        ("sThumbLX", ctypes.c_short),
        ("sThumbLY", ctypes.c_short),
        ("sThumbRX", ctypes.c_short),
        ("sThumbRY", ctypes.c_short),
    ]

class XINPUT_STATE(ctypes.Structure):
    _fields_ = [
        ("dwPacketNumber", ctypes.c_ulong),
        ("Gamepad", XINPUT_GAMEPAD),
    ]

# 加载XInput库
try:
    xinput = ctypes.windll.xinput1_4
except:
    try:
        xinput = ctypes.windll.xinput1_3
    except:
        xinput = None

def get_gamepad_state(user_index: int = 0) -> Dict:
    """
    获取指定手柄的状态
    :param user_index: 手柄索引 (0-3)
    :return: 包含所有手柄状态的字典
    """
    state = {
        'connected': False,
        'buttons': {},
        'triggers': {'LT': 0.0, 'RT': 0.0},
        'thumbsticks': {
            'left': {'x': 0.0, 'y': 0.0},
            'right': {'x': 0.0, 'y': 0.0}
        }
    }

    if xinput is None:
        return state

    xinput_state = XINPUT_STATE()
    result = xinput.XInputGetState(user_index, ctypes.byref(xinput_state))

    if result != 0:
        return state

    state['connected'] = True
    gamepad = xinput_state.Gamepad
    buttons = gamepad.wButtons

    # 按钮状态
    state['buttons'] = {
        'A': bool(buttons & XINPUT_GAMEPAD_A),
        'B': bool(buttons & XINPUT_GAMEPAD_B),
        'X': bool(buttons & XINPUT_GAMEPAD_X),
        'Y': bool(buttons & XINPUT_GAMEPAD_Y),
        'LB': bool(buttons & XINPUT_GAMEPAD_LEFT_SHOULDER),
        'RB': bool(buttons & XINPUT_GAMEPAD_RIGHT_SHOULDER),
        'Back': bool(buttons & XINPUT_GAMEPAD_BACK),
        'Start': bool(buttons & XINPUT_GAMEPAD_START),
        'Guide': bool(buttons & XINPUT_GAMEPAD_GUIDE),
        'L3': bool(buttons & XINPUT_GAMEPAD_LEFT_THUMB),
        'R3': bool(buttons & XINPUT_GAMEPAD_RIGHT_THUMB),
        'DPad_Up': bool(buttons & XINPUT_GAMEPAD_DPAD_UP),
        'DPad_Down': bool(buttons & XINPUT_GAMEPAD_DPAD_DOWN),
        'DPad_Left': bool(buttons & XINPUT_GAMEPAD_DPAD_LEFT),
        'DPad_Right': bool(buttons & XINPUT_GAMEPAD_DPAD_RIGHT),
    }

    # 扳机键 (0-255 -> 0.0-1.0)
    state['triggers']['LT'] = gamepad.bLeftTrigger / 255.0
    state['triggers']['RT'] = gamepad.bRightTrigger / 255.0

    # 摇杆 (短整型范围 -32768 到 32767 -> -1.0 到 1.0)
    deadzone = 7849  # XInput默认死区值

    def normalize(value, dz):
        if abs(value) < dz:
            return 0.0
        sign = 1 if value > 0 else -1
        normalized = (abs(value) - dz) / (32767 - dz)
        return sign * min(max(normalized, -1.0), 1.0)

    state['thumbsticks']['left']['x'] = normalize(gamepad.sThumbLX, deadzone)
    state['thumbsticks']['left']['y'] = normalize(gamepad.sThumbLY, deadzone)
    state['thumbsticks']['right']['x'] = normalize(gamepad.sThumbRX, deadzone)
    state['thumbsticks']['right']['y'] = normalize(gamepad.sThumbRY, deadzone)

    return state

def get_any_connected_gamepad() -> Tuple[int, Dict]:
    """
    查找任何已连接的手柄
    :return: (手柄索引, 状态字典) 如果没有连接返回 (-1, None)
    """
    for i in range(4):
        state = get_gamepad_state(i)
        if state['connected']:
            return i, state
    return -1, None
