import json
import os

APP_NAME = "WhereIsMyMouse"
CONFIG_DIR = os.path.join(os.environ.get("APPDATA", ""), APP_NAME)
CONFIG_FILE = os.path.join(CONFIG_DIR, "config.json")

DEFAULT_CONFIG = {
    "shake_threshold": 500,
    "shake_time": 1.0,
    "cursor_scale": 3.0,
    "magnify_duration": 1.5,
    "hotkey": "ctrl+shift+m",
    "pulse_duration": 2.0,
    "pulse_min_scale": 1.0,
    "pulse_max_scale": 3.0,
    "autostart": False,
    "check_fullscreen": True,
    "shake_distance": 30
}

def ensure_config_dir():
    if not os.path.exists(CONFIG_DIR):
        os.makedirs(CONFIG_DIR)

def load_config():
    ensure_config_dir()
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, "r", encoding="utf-8") as f:
                config = json.load(f)
                for key, value in DEFAULT_CONFIG.items():
                    if key not in config:
                        config[key] = value
                return config
        except Exception:
            pass
    return DEFAULT_CONFIG.copy()

def save_config(config):
    ensure_config_dir()
    with open(CONFIG_FILE, "w", encoding="utf-8") as f:
        json.dump(config, f, indent=2, ensure_ascii=False)
