import json
import os
from pathlib import Path

BASE_DIR = Path(os.path.dirname(os.path.abspath(__file__)))
SETTINGS_FILE = BASE_DIR / "settings.json"
CONFIGS_DIR = BASE_DIR / "configs"
TEMPLATES_DIR = BASE_DIR / "templates"

DEFAULT_SETTINGS = {
    "frp_bin_path": "",
    "configs_dir": str(CONFIGS_DIR),
    "auto_restart_on_change": True,
    "alert_on_error": True,
    "active_config": "",
}


class Settings:
    def __init__(self):
        self._data = dict(DEFAULT_SETTINGS)
        self.load()

    def load(self):
        if SETTINGS_FILE.exists():
            try:
                with open(SETTINGS_FILE, "r", encoding="utf-8") as f:
                    data = json.load(f)
                self._data.update(data)
            except (json.JSONDecodeError, OSError):
                pass
        self._ensure_dirs()

    def save(self):
        with open(SETTINGS_FILE, "w", encoding="utf-8") as f:
            json.dump(self._data, f, indent=2, ensure_ascii=False)

    def get(self, key, default=None):
        return self._data.get(key, default)

    def set(self, key, value):
        self._data[key] = value

    def _ensure_dirs(self):
        Path(self._data["configs_dir"]).mkdir(parents=True, exist_ok=True)
        TEMPLATES_DIR.mkdir(parents=True, exist_ok=True)

    def to_dict(self):
        return dict(self._data)
