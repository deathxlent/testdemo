import threading
import time
from pathlib import Path
from typing import Callable, Dict, Optional

try:
    from watchdog.events import FileSystemEventHandler, FileModifiedEvent, FileCreatedEvent, FileMovedEvent
    from watchdog.observers import Observer
    _HAS_WATCHDOG = True
except ImportError:  # pragma: no cover
    _HAS_WATCHDOG = False


class PollingWatcher:
    """简易轮询监控，作为 watchdog 不可用时的兜底方案。"""

    def __init__(self, path: str, callback: Callable[[str], None]):
        self.path = path
        self.callback = callback
        self._stop = threading.Event()
        self._thread: Optional[threading.Thread] = None
        self._last_mtime: Dict[str, float] = {}

    def start(self):
        self._stop.clear()
        self._thread = threading.Thread(target=self._run, daemon=True)
        self._thread.start()

    def stop(self):
        self._stop.set()
        if self._thread:
            self._thread.join(timeout=2)

    def _run(self):
        p = Path(self.path)
        while not self._stop.is_set():
            try:
                if p.exists():
                    if p.is_file():
                        m = p.stat().st_mtime
                        if self._last_mtime.get(p.name) and m != self._last_mtime[p.name]:
                            self.callback(str(p))
                        self._last_mtime[p.name] = m
                    elif p.is_dir():
                        for f in p.iterdir():
                            if f.is_file():
                                m = f.stat().st_mtime
                                if self._last_mtime.get(f.name) and m != self._last_mtime[f.name]:
                                    self.callback(str(f))
                                self._last_mtime[f.name] = m
            except OSError:
                pass
            time.sleep(1.0)


if _HAS_WATCHDOG:
    class _Handler(FileSystemEventHandler):
        def __init__(self, callback: Callable[[str], None]):
            super().__init__()
            self.callback = callback
            self._last: Dict[str, float] = {}

        def _emit(self, path: str):
            now = time.time()
            if now - self._last.get(path, 0) < 0.5:
                return
            self._last[path] = now
            self.callback(path)

        def on_modified(self, event):
            if isinstance(event, FileModifiedEvent) and not event.is_directory:
                self._emit(event.src_path)

        def on_created(self, event):
            if isinstance(event, FileCreatedEvent) and not event.is_directory:
                self._emit(event.src_path)

        def on_moved(self, event):
            if isinstance(event, FileMovedEvent) and not event.is_directory:
                self._emit(event.dest_path)

    class FileWatcher:
        def __init__(self, path: str, callback: Callable[[str], None]):
            self.path = path
            self.callback = callback
            self._observer: Optional[Observer] = None

        def start(self):
            if self._observer:
                return
            p = Path(self.path)
            watch_dir = str(p) if p.is_dir() else str(p.parent)
            self._observer = Observer()
            self._observer.schedule(
                _Handler(self.callback), watch_dir, recursive=p.is_dir()
            )
            self._observer.start()

        def stop(self):
            if self._observer:
                self._observer.stop()
                self._observer.join(timeout=2)
                self._observer = None
else:  # pragma: no cover
    FileWatcher = PollingWatcher  # type: ignore
