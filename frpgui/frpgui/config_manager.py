import os
import shutil
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import List, Optional


@dataclass
class ConfigItem:
    name: str
    path: str
    size: int = 0
    mtime: float = 0.0
    content: str = ""

    @property
    def mtime_str(self):
        return time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(self.mtime))


class ConfigManager:
    SUPPORTED_EXTS = {".toml", ".ini", ".yaml", ".yml", ".json"}

    def __init__(self, configs_dir: str):
        self.dir = Path(configs_dir)
        self.dir.mkdir(parents=True, exist_ok=True)

    def list_configs(self) -> List[ConfigItem]:
        items: List[ConfigItem] = []
        if not self.dir.exists():
            return items
        for p in sorted(self.dir.iterdir()):
            if p.is_file() and p.suffix.lower() in self.SUPPORTED_EXTS:
                st = p.stat()
                items.append(
                    ConfigItem(
                        name=p.name,
                        path=str(p),
                        size=st.st_size,
                        mtime=st.st_mtime,
                    )
                )
        return items

    def read(self, name: str) -> Optional[ConfigItem]:
        p = self.dir / name
        if not p.exists():
            return None
        try:
            with open(p, "r", encoding="utf-8") as f:
                content = f.read()
        except UnicodeDecodeError:
            with open(p, "r", encoding="gbk", errors="replace") as f:
                content = f.read()
        st = p.stat()
        return ConfigItem(
            name=p.name,
            path=str(p),
            size=st.st_size,
            mtime=st.st_mtime,
            content=content,
        )

    def save(self, name: str, content: str) -> ConfigItem:
        p = self.dir / name
        p.parent.mkdir(parents=True, exist_ok=True)
        with open(p, "w", encoding="utf-8") as f:
            f.write(content)
        st = p.stat()
        return ConfigItem(
            name=p.name,
            path=str(p),
            size=st.st_size,
            mtime=st.st_mtime,
            content=content,
        )

    def delete(self, name: str) -> bool:
        p = self.dir / name
        if p.exists():
            p.unlink()
            return True
        return False

    def rename(self, old_name: str, new_name: str) -> bool:
        src = self.dir / old_name
        dst = self.dir / new_name
        if dst.exists() or not src.exists():
            return False
        src.rename(dst)
        return True

    def import_file(self, src_path: str, new_name: Optional[str] = None) -> Optional[ConfigItem]:
        src = Path(src_path)
        if not src.exists() or not src.is_file():
            return None
        if src.suffix.lower() not in self.SUPPORTED_EXTS:
            return None
        target_name = new_name or src.name
        dst = self.dir / target_name
        shutil.copyfile(src, dst)
        st = dst.stat()
        with open(dst, "r", encoding="utf-8", errors="replace") as f:
            content = f.read()
        return ConfigItem(
            name=dst.name,
            path=str(dst),
            size=st.st_size,
            mtime=st.st_mtime,
            content=content,
        )

    def export_file(self, name: str, dst_path: str) -> bool:
        src = self.dir / name
        if not src.exists():
            return False
        dst = Path(dst_path)
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(src, dst)
        return True

    def duplicate(self, name: str, new_name: str) -> Optional[ConfigItem]:
        src = self.dir / name
        dst = self.dir / new_name
        if not src.exists() or dst.exists():
            return None
        shutil.copyfile(src, dst)
        st = dst.stat()
        with open(dst, "r", encoding="utf-8", errors="replace") as f:
            content = f.read()
        return ConfigItem(
            name=dst.name,
            path=str(dst),
            size=st.st_size,
            mtime=st.st_mtime,
            content=content,
        )

    def exists(self, name: str) -> bool:
        return (self.dir / name).exists()
