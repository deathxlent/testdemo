import os
import re
import shlex
import subprocess
import time
from enum import Enum
from pathlib import Path
from typing import Optional

from PySide6.QtCore import QObject, QThread, Signal


class FrpState(str, Enum):
    IDLE = "idle"
    STARTING = "starting"
    RUNNING = "running"
    STOPPING = "stopping"
    ERROR = "error"
    EXITED = "exited"


LOG_LEVEL_RE = re.compile(
    r"\b(ERR(?:OR)?|WARN(?:ING)?|FATAL|PANIC)\b", re.IGNORECASE
)


class FrpWorker(QObject):
    log = Signal(str)
    state_changed = Signal(str)
    error_alert = Signal(str)

    def __init__(self, bin_path: str, config_path: str, extra_args: str = ""):
        super().__init__()
        self.bin_path = bin_path
        self.config_path = config_path
        self.extra_args = extra_args
        self._proc: Optional[subprocess.Popen] = None
        self._running = False
        self._state: str = FrpState.IDLE

    @property
    def state(self) -> str:
        return self._state

    def _set_state(self, s: str):
        self._state = s
        self.state_changed.emit(s)

    def start(self):
        if self._running:
            return
        self._running = True
        self._set_state(FrpState.STARTING)

        if not self.bin_path or not Path(self.bin_path).exists():
            self.log.emit(f"[错误] FRP 可执行文件不存在: {self.bin_path}")
            self.error_alert.emit(f"FRP 可执行文件不存在: {self.bin_path}")
            self._set_state(FrpState.ERROR)
            self._running = False
            return

        if not Path(self.config_path).exists():
            self.log.emit(f"[错误] 配置文件不存在: {self.config_path}")
            self.error_alert.emit(f"配置文件不存在: {self.config_path}")
            self._set_state(FrpState.ERROR)
            self._running = False
            return

        try:
            args = [self.bin_path, "-c", self.config_path]
            if self.extra_args:
                try:
                    extra = shlex.split(self.extra_args, posix=os.name != "nt")
                except ValueError:
                    extra = self.extra_args.split()
                args.extend(extra)

            creationflags = 0
            if os.name == "nt":
                creationflags = subprocess.CREATE_NO_WINDOW
                startupinfo = subprocess.STARTUPINFO()
                startupinfo.dwFlags |= subprocess.STARTF_USESHOWWINDOW
            else:
                startupinfo = None

            self._proc = subprocess.Popen(
                args,
                stdout=subprocess.PIPE,
                stderr=subprocess.STDOUT,
                stdin=subprocess.DEVNULL,
                text=True,
                encoding="utf-8",
                errors="replace",
                bufsize=1,
                creationflags=creationflags,
                startupinfo=startupinfo,
            )
        except Exception as e:
            self.log.emit(f"[错误] 启动失败: {e}")
            self.error_alert.emit(f"启动失败: {e}")
            self._set_state(FrpState.ERROR)
            self._running = False
            return

        self._set_state(FrpState.RUNNING)
        self.log.emit(f"[信息] 已启动 FRP: {' '.join(args)}")

        try:
            assert self._proc.stdout is not None
            for line in self._proc.stdout:
                line = line.rstrip()
                if not line:
                    continue
                self.log.emit(line)
                if LOG_LEVEL_RE.search(line):
                    self.error_alert.emit(line)
            ret = self._proc.wait()
            self.log.emit(f"[信息] FRP 已退出，返回码: {ret}")
            if ret != 0:
                self.error_alert.emit(f"FRP 异常退出，返回码: {ret}")
                self._set_state(FrpState.ERROR)
            else:
                self._set_state(FrpState.EXITED)
        except Exception as e:
            self.log.emit(f"[错误] 读取日志失败: {e}")
            self._set_state(FrpState.ERROR)
        finally:
            self._running = False
            self._proc = None

    def stop(self, force: bool = False):
        if not self._proc:
            return
        self._set_state(FrpState.STOPPING)
        try:
            if force:
                self._proc.kill()
            else:
                self._proc.terminate()
            try:
                self._proc.wait(timeout=3)
            except subprocess.TimeoutExpired:
                self._proc.kill()
                self._proc.wait(timeout=3)
        except Exception as e:
            self.log.emit(f"[错误] 停止失败: {e}")
        self._set_state(FrpState.IDLE)

    def is_running(self) -> bool:
        return self._proc is not None and self._proc.poll() is None


class FrpProcess(QObject):
    log = Signal(str)
    state_changed = Signal(str)
    error_alert = Signal(str)
    finished = Signal()

    def __init__(self):
        super().__init__()
        self._thread: Optional[QThread] = None
        self._worker: Optional[FrpWorker] = None

    @property
    def state(self) -> str:
        return self._worker.state if self._worker else FrpState.IDLE

    def is_running(self) -> bool:
        return self._worker is not None and self._worker.is_running()

    def start(self, bin_path: str, config_path: str, extra_args: str = ""):
        if self._thread and self._thread.isRunning():
            self.stop(wait=False)
            time.sleep(0.2)

        self._thread = QThread()
        self._worker = FrpWorker(bin_path, config_path, extra_args)
        self._worker.moveToThread(self._thread)

        self._worker.log.connect(self.log)
        self._worker.state_changed.connect(self.state_changed)
        self._worker.error_alert.connect(self.error_alert)

        self._thread.started.connect(self._worker.start)
        self._worker.state_changed.connect(
            lambda s: self._on_worker_state(s)
        )

        self._thread.start()

    def _on_worker_state(self, s: str):
        if s in (FrpState.ERROR, FrpState.EXITED, FrpState.IDLE):
            if self._thread and self._thread.isRunning():
                self._thread.quit()
                self._thread.wait(2000)
            self.finished.emit()

    def stop(self, wait: bool = True, force: bool = False):
        if self._worker:
            self._worker.stop(force=force)
        if self._thread and self._thread.isRunning():
            self._thread.quit()
            if wait:
                self._thread.wait(5000)
