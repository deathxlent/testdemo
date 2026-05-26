import os
import sys
import time
import traceback
from pathlib import Path
from typing import Optional

from PySide6.QtCore import Qt, QTimer, Signal
from PySide6.QtGui import QAction, QColor, QFont, QIcon, QTextCharFormat
from PySide6.QtWidgets import (
    QApplication,
    QCheckBox,
    QComboBox,
    QDialog,
    QDialogButtonBox,
    QFileDialog,
    QFormLayout,
    QHBoxLayout,
    QInputDialog,
    QLabel,
    QLineEdit,
    QListWidget,
    QListWidgetItem,
    QMainWindow,
    QMenu,
    QMessageBox,
    QPlainTextEdit,
    QPushButton,
    QStatusBar,
    QToolBar,
    QVBoxLayout,
    QWidget,
)

from .config_manager import ConfigItem, ConfigManager
from .file_watcher import FileWatcher
from .frp_process import FrpProcess, FrpState
from .settings import SETTINGS_FILE, TEMPLATES_DIR, Settings


STATE_STYLE = {
    FrpState.IDLE: "background:#555;color:#fff;",
    FrpState.STARTING: "background:#2d8cf0;color:#fff;",
    FrpState.RUNNING: "background:#19be6b;color:#fff;",
    FrpState.STOPPING: "background:#ff9900;color:#fff;",
    FrpState.ERROR: "background:#ed4014;color:#fff;",
    FrpState.EXITED: "background:#808695;color:#fff;",
}


def _excepthook(exc_type, exc_value, tb):
    sys.__excepthook__(exc_type, exc_value, tb)


class ConfigListWidget(QWidget):
    config_activated = Signal(str)

    def __init__(self):
        super().__init__()
        layout = QVBoxLayout(self)
        layout.setContentsMargins(0, 0, 0, 0)

        header = QLabel("配置文件")
        header.setStyleSheet("font-weight:bold;padding:4px;")
        layout.addWidget(header)

        self.list = QListWidget()
        self.list.itemDoubleClicked.connect(
            lambda it: self.config_activated.emit(it.data(Qt.UserRole))
        )
        layout.addWidget(self.list)

    def refresh(self, items):
        current = self.list.currentItem()
        current_name = current.data(Qt.UserRole) if current else None
        self.list.clear()
        for it in items:
            li = QListWidgetItem(f"{it.name}   ({it.mtime_str})")
            li.setData(Qt.UserRole, it.name)
            li.setToolTip(f"{it.path}\n大小: {it.size} 字节")
            self.list.addItem(li)
            if current_name == it.name:
                self.list.setCurrentItem(li)

    def current_name(self) -> Optional[str]:
        it = self.list.currentItem()
        return it.data(Qt.UserRole) if it else None


class SettingsDialog(QDialog):
    def __init__(self, settings: Settings, parent=None):
        super().__init__(parent)
        self.setWindowTitle("设置")
        self.settings = settings

        form = QFormLayout(self)

        self.bin_edit = QLineEdit(settings.get("frp_bin_path", ""))
        self.bin_edit.setPlaceholderText("frpc.exe 或 frps.exe 的完整路径")
        browse = QPushButton("浏览...")
        browse.clicked.connect(self._browse_bin)
        bin_row = QHBoxLayout()
        bin_row.addWidget(self.bin_edit)
        bin_row.addWidget(browse)
        bin_widget = QWidget()
        bin_widget.setLayout(bin_row)
        form.addRow("FRP 可执行文件:", bin_widget)

        self.dir_edit = QLineEdit(settings.get("configs_dir", ""))
        browse_dir = QPushButton("浏览...")
        browse_dir.clicked.connect(self._browse_dir)
        dir_row = QHBoxLayout()
        dir_row.addWidget(self.dir_edit)
        dir_row.addWidget(browse_dir)
        dir_widget = QWidget()
        dir_widget.setLayout(dir_row)
        form.addRow("配置目录:", dir_widget)

        self.extra_args = QLineEdit(settings.get("extra_args", ""))
        self.extra_args.setPlaceholderText("例如: -L 127.0.0.1:7400")
        form.addRow("额外启动参数:", self.extra_args)

        self.auto_restart = QCheckBox("文件变更时自动重启(热重载)")
        self.auto_restart.setChecked(bool(settings.get("auto_restart_on_change", True)))
        form.addRow(self.auto_restart)

        self.alert_on_error = QCheckBox("错误日志触发报警")
        self.alert_on_error.setChecked(bool(settings.get("alert_on_error", True)))
        form.addRow(self.alert_on_error)

        btns = QDialogButtonBox(QDialogButtonBox.Ok | QDialogButtonBox.Cancel)
        btns.accepted.connect(self.accept)
        btns.rejected.connect(self.reject)
        form.addRow(btns)

    def _browse_bin(self):
        fn, _ = QFileDialog.getOpenFileName(self, "选择 FRP 可执行文件")
        if fn:
            self.bin_edit.setText(fn)

    def _browse_dir(self):
        d = QFileDialog.getExistingDirectory(self, "选择配置目录", self.dir_edit.text())
        if d:
            self.dir_edit.setText(d)

    def accept(self):
        self.settings.set("frp_bin_path", self.bin_edit.text().strip())
        self.settings.set("configs_dir", self.dir_edit.text().strip() or str(Path(SETTINGS_FILE).parent / "configs"))
        self.settings.set("extra_args", self.extra_args.text().strip())
        self.settings.set("auto_restart_on_change", self.auto_restart.isChecked())
        self.settings.set("alert_on_error", self.alert_on_error.isChecked())
        self.settings.save()
        super().accept()


class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("FRP GUI Manager")
        self.resize(1100, 700)

        self.settings = Settings()
        self.config_mgr = ConfigManager(self.settings.get("configs_dir"))

        self.frp = FrpProcess()
        self.frp.log.connect(self._append_log)
        self.frp.state_changed.connect(self._on_state_changed)
        self.frp.error_alert.connect(self._on_error_alert)
        self.frp.finished.connect(self._on_finished)

        self._watcher: Optional[FileWatcher] = None
        self._last_restart_ts = 0.0

        self._build_ui()
        self._load_active_config()
        self._refresh_list()

    # -------------------- UI --------------------
    def _build_ui(self):
        central = QWidget()
        self.setCentralWidget(central)
        root = QHBoxLayout(central)

        left = QWidget()
        left_lay = QVBoxLayout(left)
        left_lay.setContentsMargins(0, 0, 0, 0)
        left.setFixedWidth(280)

        self.config_list = ConfigListWidget()
        self.config_list.list.currentItemChanged.connect(self._on_switch_config)
        self.config_list.config_activated.connect(self._on_activate_config)
        left_lay.addWidget(self.config_list)

        btn_row = QHBoxLayout()
        self.btn_new = QPushButton("新建")
        self.btn_new.clicked.connect(self._on_new)
        btn_row.addWidget(self.btn_new)

        self.btn_import = QPushButton("导入")
        self.btn_import.clicked.connect(self._on_import)
        btn_row.addWidget(self.btn_import)

        self.btn_export = QPushButton("导出")
        self.btn_export.clicked.connect(self._on_export)
        btn_row.addWidget(self.btn_export)

        left_lay.addLayout(btn_row)

        btn_row2 = QHBoxLayout()
        self.btn_dup = QPushButton("复制")
        self.btn_dup.clicked.connect(self._on_duplicate)
        btn_row2.addWidget(self.btn_dup)

        self.btn_rename = QPushButton("重命名")
        self.btn_rename.clicked.connect(self._on_rename)
        btn_row2.addWidget(self.btn_rename)

        self.btn_delete = QPushButton("删除")
        self.btn_delete.clicked.connect(self._on_delete)
        btn_row2.addWidget(self.btn_delete)

        left_lay.addLayout(btn_row2)

        root.addWidget(left)

        right = QWidget()
        right_lay = QVBoxLayout(right)

        top = QHBoxLayout()
        self.lbl_config = QLabel("未选择配置")
        self.lbl_config.setStyleSheet("font-weight:bold;")
        top.addWidget(self.lbl_config, 1)

        self.cbx_active = QComboBox()
        self.cbx_active.setMinimumWidth(180)
        self.cbx_active.currentTextChanged.connect(self._on_choose_active)
        top.addWidget(QLabel("运行配置:"))
        top.addWidget(self.cbx_active)

        self.btn_run = QPushButton("启动")
        self.btn_run.clicked.connect(self._on_run_clicked)
        top.addWidget(self.btn_run)

        self.btn_stop = QPushButton("停止")
        self.btn_stop.clicked.connect(lambda: self.frp.stop())
        top.addWidget(self.btn_stop)

        self.btn_save_cfg = QPushButton("保存配置")
        self.btn_save_cfg.clicked.connect(self._on_save_cfg)
        top.addWidget(self.btn_save_cfg)

        right_lay.addLayout(top)

        self.editor = QPlainTextEdit()
        font = QFont("Consolas", 10)
        self.editor.setFont(font)
        self.editor.textChanged.connect(self._on_editor_changed)
        right_lay.addWidget(self.editor, 1)

        log_header = QHBoxLayout()
        log_header.addWidget(QLabel("运行日志"))
        self.btn_clear_log = QPushButton("清空")
        self.btn_clear_log.clicked.connect(lambda: self.log_view.clear())
        log_header.addStretch(1)
        log_header.addWidget(self.btn_clear_log)
        right_lay.addLayout(log_header)

        self.log_view = QPlainTextEdit()
        self.log_view.setReadOnly(True)
        self.log_view.setFont(font)
        self.log_view.setMaximumBlockCount(2000)
        right_lay.addWidget(self.log_view, 1)

        root.addWidget(right, 1)

        toolbar = QToolBar()
        self.addToolBar(toolbar)

        act_settings = QAction("设置", self)
        act_settings.triggered.connect(self._on_settings)
        toolbar.addAction(act_settings)

        act_refresh = QAction("刷新列表", self)
        act_refresh.triggered.connect(self._refresh_list)
        toolbar.addAction(act_refresh)

        self.status = QStatusBar()
        self.setStatusBar(self.status)
        self.state_label = QLabel()
        self.state_label.setStyleSheet("padding:2px 10px;border-radius:4px;")
        self.status.addPermanentWidget(self.state_label)
        self._set_state(FrpState.IDLE)

        self._dirty = False

    # -------------------- Config List --------------------
    def _refresh_list(self):
        items = self.config_mgr.list_configs()
        self.config_list.refresh(items)
        self.cbx_active.blockSignals(True)
        self.cbx_active.clear()
        self.cbx_active.addItem("")
        for it in items:
            self.cbx_active.addItem(it.name)
        active = self.settings.get("active_config", "")
        if active:
            idx = self.cbx_active.findText(active)
            if idx >= 0:
                self.cbx_active.setCurrentIndex(idx)
        self.cbx_active.blockSignals(False)

    def _load_active_config(self):
        active = self.settings.get("active_config", "")
        if active and self.config_mgr.exists(active):
            self._load_into_editor(active)
            for i in range(self.config_list.list.count()):
                it = self.config_list.list.item(i)
                if it.data(Qt.UserRole) == active:
                    self.config_list.list.setCurrentItem(it)
                    break

    def _load_into_editor(self, name: str):
        item = self.config_mgr.read(name)
        if item is None:
            return
        self.editor.setPlainText(item.content)
        self.lbl_config.setText(f"编辑: {item.name}")
        self._dirty = False
        self.setWindowTitle(f"FRP GUI Manager - {item.name}")

    def _on_switch_config(self, current, previous):
        if not current:
            return
        if self._dirty:
            ret = QMessageBox.question(
                self, "未保存的更改", "当前配置有未保存的更改，是否保存？",
                QMessageBox.Save | QMessageBox.Discard | QMessageBox.Cancel,
            )
            if ret == QMessageBox.Cancel:
                self.config_list.list.blockSignals(True)
                self.config_list.list.setCurrentItem(previous)
                self.config_list.list.blockSignals(False)
                return
            if ret == QMessageBox.Save:
                self._on_save_cfg()
        name = current.data(Qt.UserRole)
        if name:
            self._load_into_editor(name)

    def _on_activate_config(self, name: str):
        self._on_choose_active(name)

    def _on_choose_active(self, name: str):
        if not name:
            return
        self.settings.set("active_config", name)
        self.settings.save()

    # -------------------- Config CRUD --------------------
    def _on_new(self):
        name, ok = QInputDialog.getText(self, "新建配置", "配置文件名 (例如: my-frpc.toml):")
        if not ok or not name.strip():
            return
        name = name.strip()
        if self.config_mgr.exists(name):
            QMessageBox.warning(self, "提示", f"配置 {name} 已存在")
            return
        template = ""
        tpl_file = TEMPLATES_DIR / "frpc.toml"
        if tpl_file.exists():
            template = tpl_file.read_text(encoding="utf-8")
        self.config_mgr.save(name, template)
        self._refresh_list()
        self._load_into_editor(name)
        for i in range(self.config_list.list.count()):
            it = self.config_list.list.item(i)
            if it.data(Qt.UserRole) == name:
                self.config_list.list.setCurrentItem(it)
                break

    def _on_import(self):
        fn, _ = QFileDialog.getOpenFileName(
            self, "导入配置", "", "配置文件 (*.toml *.ini *.yaml *.yml *.json);;所有文件 (*.*)"
        )
        if not fn:
            return
        item = self.config_mgr.import_file(fn)
        if item is None:
            QMessageBox.warning(self, "失败", "导入失败，文件类型不支持或读取失败")
            return
        self._refresh_list()
        self._load_into_editor(item.name)

    def _on_export(self):
        name = self.config_list.current_name()
        if not name:
            QMessageBox.information(self, "提示", "请先选择要导出的配置")
            return
        fn, _ = QFileDialog.getSaveFileName(
            self, "导出配置", name, "配置文件 (*.toml *.ini *.yaml *.yml *.json);;所有文件 (*.*)"
        )
        if not fn:
            return
        if self.config_mgr.export_file(name, fn):
            QMessageBox.information(self, "成功", f"已导出到: {fn}")
        else:
            QMessageBox.warning(self, "失败", "导出失败")

    def _on_duplicate(self):
        name = self.config_list.current_name()
        if not name:
            return
        p = Path(name)
        new_name, ok = QInputDialog.getText(
            self, "复制配置", "新配置名:", text=f"{p.stem}-copy{p.suffix}"
        )
        if not ok or not new_name.strip():
            return
        new_name = new_name.strip()
        if self.config_mgr.exists(new_name):
            QMessageBox.warning(self, "提示", f"配置 {new_name} 已存在")
            return
        item = self.config_mgr.duplicate(name, new_name)
        if item is None:
            QMessageBox.warning(self, "失败", "复制失败")
            return
        self._refresh_list()

    def _on_rename(self):
        name = self.config_list.current_name()
        if not name:
            return
        new_name, ok = QInputDialog.getText(self, "重命名", "新文件名:", text=name)
        if not ok or not new_name.strip():
            return
        new_name = new_name.strip()
        if new_name == name:
            return
        if self.config_mgr.exists(new_name):
            QMessageBox.warning(self, "提示", f"配置 {new_name} 已存在")
            return
        if self.config_mgr.rename(name, new_name):
            if self.settings.get("active_config") == name:
                self.settings.set("active_config", new_name)
                self.settings.save()
            self._refresh_list()
        else:
            QMessageBox.warning(self, "失败", "重命名失败")

    def _on_delete(self):
        name = self.config_list.current_name()
        if not name:
            return
        ret = QMessageBox.question(
            self, "删除确认", f"确定要删除 {name} 吗？", QMessageBox.Yes | QMessageBox.No
        )
        if ret != QMessageBox.Yes:
            return
        if self.config_mgr.delete(name):
            if self.settings.get("active_config") == name:
                self.settings.set("active_config", "")
                self.settings.save()
            if self.config_list.current_name() == name:
                self.editor.clear()
                self.lbl_config.setText("未选择配置")
                self.setWindowTitle("FRP GUI Manager")
            self._refresh_list()

    def _on_editor_changed(self):
        self._dirty = True

    def _on_save_cfg(self):
        name = self.config_list.current_name()
        if not name:
            QMessageBox.information(self, "提示", "请先从左侧选择或新建一个配置")
            return
        self.config_mgr.save(name, self.editor.toPlainText())
        self._dirty = False
        self._refresh_list()
        self.status.showMessage(f"已保存 {name}", 3000)

    # -------------------- Run --------------------
    def _on_run_clicked(self):
        if self.frp.is_running():
            QMessageBox.information(self, "提示", "FRP 已在运行中")
            return
        if self._dirty:
            ret = QMessageBox.question(
                self, "未保存", "有未保存的修改，是否先保存？",
                QMessageBox.Save | QMessageBox.Discard | QMessageBox.Cancel,
            )
            if ret == QMessageBox.Cancel:
                return
            if ret == QMessageBox.Save:
                self._on_save_cfg()

        name = self.settings.get("active_config") or self.config_list.current_name()
        if not name:
            QMessageBox.warning(self, "提示", "请选择要运行的配置")
            return
        bin_path = self.settings.get("frp_bin_path", "").strip()
        if not bin_path or not Path(bin_path).exists():
            QMessageBox.warning(
                self, "提示",
                "请先在 设置 中配置 FRP 可执行文件路径 (frpc.exe / frps.exe)"
            )
            self._on_settings()
            return
        extra = self.settings.get("extra_args", "")
        cfg_path = str(Path(self.config_mgr.dir) / name)
        self.frp.start(bin_path, cfg_path, extra)
        self._start_watcher(cfg_path)

    def _on_stop(self):
        self.frp.stop()

    def _start_watcher(self, path: str):
        self._stop_watcher()
        self._watcher = FileWatcher(path, self._on_file_changed)
        self._watcher.start()

    def _stop_watcher(self):
        if self._watcher:
            self._watcher.stop()
            self._watcher = None

    def _on_file_changed(self, path: str):
        now = time.time()
        if now - self._last_restart_ts < 2.0:
            return
        active = self.settings.get("active_config") or self.config_list.current_name()
        if not active:
            return
        expected = str(Path(self.config_mgr.dir) / active)
        if Path(path).resolve() != Path(expected).resolve():
            return
        if not self.settings.get("auto_restart_on_change", True):
            self._append_log(f"[热重载] 检测到配置变更: {path} (已禁用自动重启)")
            return
        self._last_restart_ts = now
        self._append_log(f"[热重载] 检测到配置变更，准备重启: {path}")
        QTimer.singleShot(800, self._do_hot_restart)

    def _do_hot_restart(self):
        if not self.frp.is_running():
            return
        name = self.settings.get("active_config") or self.config_list.current_name()
        if not name:
            return
        bin_path = self.settings.get("frp_bin_path", "").strip()
        if not bin_path:
            return
        cfg_path = str(Path(self.config_mgr.dir) / name)
        self.frp.stop(wait=True)
        QTimer.singleShot(300, lambda: self.frp.start(
            bin_path, cfg_path, self.settings.get("extra_args", "")
        ))

    # -------------------- Log / State --------------------
    def _append_log(self, text: str):
        ts = time.strftime("%H:%M:%S")
        text_l = text.lower()
        if any(k in text_l for k in ("error", "err ", "fatal", "panic")):
            color = "#ff4d4f"
        elif any(k in text_l for k in ("warn", "warning")):
            color = "#faad14"
        else:
            color = "#d9d9d9"
        self.log_view.appendHtml(
            f'<span style="color:#888">[{ts}]</span> '
            f'<span style="color:{color}">{self._escape_html(text)}</span>'
        )

    @staticmethod
    def _escape_html(s: str) -> str:
        return (
            s.replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
        )

    def _on_state_changed(self, s: str):
        self._set_state(s)

    def _set_state(self, s: str):
        label = {
            FrpState.IDLE: "未启动",
            FrpState.STARTING: "启动中",
            FrpState.RUNNING: "运行中",
            FrpState.STOPPING: "停止中",
            FrpState.ERROR: "错误",
            FrpState.EXITED: "已退出",
        }.get(s, s)
        self.state_label.setText(label)
        self.state_label.setStyleSheet(
            f"padding:2px 10px;border-radius:4px;"
            f"{STATE_STYLE.get(s, 'background:#555;color:#fff;')}"
        )

    def _on_error_alert(self, msg: str):
        if not self.settings.get("alert_on_error", True):
            return
        from PySide6.QtWidgets import QSystemTrayIcon
        app = QApplication.instance()
        if app is None:
            return
        tray = getattr(app, "_frp_tray", None)
        if tray is None:
            tray = QSystemTrayIcon(self.windowIcon(), self)
            tray.show()
            app._frp_tray = tray
        tray.showMessage("FRP 报警", msg, QSystemTrayIcon.MessageIcon.Warning, 4000)

    def _on_finished(self):
        self._stop_watcher()

    # -------------------- Settings --------------------
    def _on_settings(self):
        dlg = SettingsDialog(self.settings, self)
        if dlg.exec() == QDialog.Accepted:
            self.config_mgr = ConfigManager(self.settings.get("configs_dir"))
            self._refresh_list()
            self.status.showMessage("设置已保存", 3000)

    # -------------------- Close --------------------
    def closeEvent(self, event):
        try:
            self._stop_watcher()
            self.frp.stop(wait=False)
        except Exception:
            pass
        super().closeEvent(event)


def main():
    sys.excepthook = _excepthook
    app = QApplication(sys.argv)
    app.setApplicationName("FRP GUI")
    w = MainWindow()
    w.show()
    sys.exit(app.exec())


if __name__ == "__main__":
    main()
