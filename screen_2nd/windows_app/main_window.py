import sys
import os
import json
from typing import Optional, Dict
from PyQt6.QtWidgets import (
    QMainWindow,
    QWidget,
    QVBoxLayout,
    QHBoxLayout,
    QPushButton,
    QLabel,
    QLineEdit,
    QListWidget,
    QListWidgetItem,
    QMessageBox,
    QComboBox,
    QSpinBox,
    QGroupBox,
    QCheckBox,
    QTabWidget,
    QStatusBar,
    QDialog,
    QDialogButtonBox,
    QFormLayout,
)
from PyQt6.QtCore import Qt, QTimer, pyqtSignal, QThread, QObject
from PyQt6.QtGui import QPixmap, QImage, QIcon
import socket

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from common.protocol import (
    DeviceInfo,
    MSG_TYPE_HELLO,
    MSG_TYPE_PASSWORD_REQ,
    MSG_TYPE_PASSWORD_ACK,
    MSG_TYPE_DISCONNECT,
    MSG_TYPE_FRAME,
    MSG_TYPE_TOUCH,
    MSG_TYPE_MODE_CHANGE,
    decompress_frame,
    PLATFORM_ANDROID,
    PLATFORM_WINDOWS,
    MODE_DISPLAY,
    MODE_EXTEND,
)
from network_discovery import NetworkDiscovery
from tcp_connection import TCPServer, TCPClient, TCPConnection
from screen_capture import ScreenCapturer
from second_screen import SecondScreenManager


class DeviceListWorker(QObject):
    devices_updated = pyqtSignal()

    def __init__(self, discovery: NetworkDiscovery):
        super().__init__()
        self.discovery = discovery
        self._timer = QTimer(self)
        self._timer.timeout.connect(self._check_devices)
        self._timer.start(1000)

    def _check_devices(self):
        self.devices_updated.emit()


class FrameReceiver(QObject):
    frame_received = pyqtSignal(bytes)

    def __init__(self):
        super().__init__()

    def handle_frame(self, payload: bytes):
        try:
            frame_data = decompress_frame(payload)
            self.frame_received.emit(frame_data)
        except Exception as e:
            print(f"Frame decompress error: {e}")


class ServerWorker(QObject):
    client_connected = pyqtSignal(object)
    client_disconnected = pyqtSignal(object)
    status_changed = pyqtSignal(str)

    def __init__(self, server: TCPServer, password: str = ""):
        super().__init__()
        self.server = server
        self.password = password
        self._authenticated_clients: Dict[str, bool] = {}

        server.on_new_connection = self._on_new_connection
        server.on_connection_closed = self._on_connection_closed

    def _on_new_connection(self, conn: TCPConnection):
        addr_key = f"{conn.addr[0]}:{conn.addr[1]}"
        self._authenticated_clients[addr_key] = False
        conn.on_message = lambda t, p: self._handle_message(conn, t, p)
        self.client_connected.emit(conn)

    def _on_connection_closed(self, conn: TCPConnection):
        addr_key = f"{conn.addr[0]}:{conn.addr[1]}"
        self._authenticated_clients.pop(addr_key, None)
        self.client_disconnected.emit(conn)

    def _handle_message(self, conn: TCPConnection, msg_type: str, payload: bytes):
        addr_key = f"{conn.addr[0]}:{conn.addr[1]}"

        if msg_type == MSG_TYPE_HELLO:
            try:
                data = json.loads(payload.decode("utf-8"))
                client_password = data.get("password", "")

                if self.password and client_password != self.password:
                    conn.send(MSG_TYPE_PASSWORD_ACK, json.dumps({"success": False, "error": "密码错误"}).encode("utf-8"))
                    conn.stop()
                    return

                self._authenticated_clients[addr_key] = True
                conn.authenticated = True

                device_data = data.get("device")
                if device_data:
                    conn.device_info = DeviceInfo.from_dict(device_data)

                conn.send(MSG_TYPE_PASSWORD_ACK, json.dumps({"success": True}).encode("utf-8"))
                self.status_changed.emit(f"客户端已连接: {conn.addr[0]}")

            except Exception as e:
                print(f"Hello handler error: {e}")

        elif msg_type == MSG_TYPE_TOUCH:
            try:
                touch_data = json.loads(payload.decode("utf-8"))
                print(f"收到触摸事件: {touch_data}")
            except Exception as e:
                print(f"Touch handler error: {e}")

    def is_authenticated(self, conn: TCPConnection) -> bool:
        addr_key = f"{conn.addr[0]}:{conn.addr[1]}"
        return self._authenticated_clients.get(addr_key, False)


class PasswordDialog(QDialog):
    def __init__(self, parent=None, is_server: bool = True):
        super().__init__(parent)
        self.setWindowTitle("连接设置")
        self.setModal(True)

        layout = QFormLayout(self)

        if is_server:
            self.setWindowTitle("设置服务器密码")
            self.password_edit = QLineEdit()
            self.password_edit.setEchoMode(QLineEdit.EchoMode.Password)
            layout.addRow("连接密码:", self.password_edit)

            self.confirm_edit = QLineEdit()
            self.confirm_edit.setEchoMode(QLineEdit.EchoMode.Password)
            layout.addRow("确认密码:", self.confirm_edit)
        else:
            self.setWindowTitle("连接服务器")
            self.password_edit = QLineEdit()
            self.password_edit.setEchoMode(QLineEdit.EchoMode.Password)
            layout.addRow("服务器密码:", self.password_edit)

        buttons = QDialogButtonBox(
            QDialogButtonBox.StandardButton.Ok | QDialogButtonBox.StandardButton.Cancel
        )
        buttons.accepted.connect(self.accept)
        buttons.rejected.connect(self.reject)
        layout.addRow(buttons)

    def get_password(self) -> str:
        return self.password_edit.text()

    def accept(self):
        if hasattr(self, "confirm_edit"):
            if self.password_edit.text() != self.confirm_edit.text():
                QMessageBox.warning(self, "错误", "两次输入的密码不一致")
                return
            if not self.password_edit.text():
                QMessageBox.warning(self, "错误", "密码不能为空")
                return
        super().accept()


class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("屏幕共享 - 第二屏幕")
        self.resize(900, 700)

        self.discovery: Optional[NetworkDiscovery] = None
        self.server: Optional[TCPServer] = None
        self.server_worker: Optional[ServerWorker] = None
        self.client: Optional[TCPClient] = None
        self.capturer: Optional[ScreenCapturer] = None
        self.second_screen: Optional[SecondScreenManager] = None
        self.frame_receiver = FrameReceiver()
        self.is_server_mode = False
        self.server_password = ""
        self.current_remote_frame: Optional[QPixmap] = None

        self._init_ui()
        self._init_discovery()

    def _init_ui(self):
        central_widget = QWidget()
        self.setCentralWidget(central_widget)

        main_layout = QHBoxLayout(central_widget)
        main_layout.setContentsMargins(10, 10, 10, 10)
        main_layout.setSpacing(10)

        left_panel = QWidget()
        left_layout = QVBoxLayout(left_panel)
        left_layout.setContentsMargins(0, 0, 0, 0)
        left_panel.setFixedWidth(280)

        mode_group = QGroupBox("运行模式")
        mode_layout = QVBoxLayout(mode_group)

        self.btn_server = QPushButton("作为服务器")
        self.btn_server.setCheckable(True)
        self.btn_server.clicked.connect(self._toggle_server_mode)

        self.btn_client = QPushButton("作为客户端")
        self.btn_client.setCheckable(True)
        self.btn_client.clicked.connect(self._toggle_client_mode)

        btn_layout = QHBoxLayout()
        btn_layout.addWidget(self.btn_server)
        btn_layout.addWidget(self.btn_client)
        mode_layout.addLayout(btn_layout)

        self.mode_label = QLabel("当前: 空闲模式")
        self.mode_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        mode_layout.addWidget(self.mode_label)

        left_layout.addWidget(mode_group)

        server_settings = QGroupBox("服务器设置")
        server_settings_layout = QVBoxLayout(server_settings)

        fps_layout = QHBoxLayout()
        fps_layout.addWidget(QLabel("帧率:"))
        self.fps_spin = QSpinBox()
        self.fps_spin.setRange(10, 60)
        self.fps_spin.setValue(30)
        fps_layout.addWidget(self.fps_spin)
        server_settings_layout.addLayout(fps_layout)

        quality_layout = QHBoxLayout()
        quality_layout.addWidget(QLabel("画质:"))
        self.quality_spin = QSpinBox()
        self.quality_spin.setRange(10, 100)
        self.quality_spin.setValue(60)
        quality_layout.addWidget(self.quality_spin)
        server_settings_layout.addLayout(quality_layout)

        monitor_layout = QHBoxLayout()
        monitor_layout.addWidget(QLabel("显示器:"))
        self.monitor_combo = QComboBox()
        self._refresh_monitors()
        monitor_layout.addWidget(self.monitor_combo)
        server_settings_layout.addLayout(monitor_layout)

        self.btn_refresh_monitors = QPushButton("刷新显示器")
        self.btn_refresh_monitors.clicked.connect(self._refresh_monitors)
        server_settings_layout.addWidget(self.btn_refresh_monitors)

        self.extend_mode_check = QCheckBox("启用第二屏幕模式")
        self.extend_mode_check.setToolTip("将连接的设备作为第二显示器")
        server_settings_layout.addWidget(self.extend_mode_check)

        left_layout.addWidget(server_settings)

        device_group = QGroupBox("发现的设备")
        device_layout = QVBoxLayout(device_group)

        self.device_list = QListWidget()
        self.device_list.itemDoubleClicked.connect(self._on_device_double_clicked)
        device_layout.addWidget(self.device_list)

        btn_refresh = QPushButton("刷新设备列表")
        btn_refresh.clicked.connect(self._refresh_device_list)
        device_layout.addWidget(btn_refresh)

        left_layout.addWidget(device_group)

        self.btn_disconnect = QPushButton("断开连接")
        self.btn_disconnect.clicked.connect(self._disconnect)
        self.btn_disconnect.setEnabled(False)
        left_layout.addWidget(self.btn_disconnect)

        right_panel = QWidget()
        right_layout = QVBoxLayout(right_panel)
        right_layout.setContentsMargins(0, 0, 0, 0)

        display_group = QGroupBox("显示区域")
        display_layout = QVBoxLayout(display_group)

        self.display_label = QLabel("等待连接...")
        self.display_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.display_label.setMinimumSize(600, 450)
        self.display_label.setStyleSheet("background-color: #1a1a1a; color: #666; font-size: 16px;")
        display_layout.addWidget(self.display_label)

        right_layout.addWidget(display_group)

        info_group = QGroupBox("连接信息")
        info_layout = QVBoxLayout(info_group)
        self.info_label = QLabel("IP: 未检测到\n状态: 未连接")
        info_layout.addWidget(self.info_label)
        right_layout.addWidget(info_group)

        main_layout.addWidget(left_panel)
        main_layout.addWidget(right_panel)

        self.status_bar = QStatusBar()
        self.setStatusBar(self.status_bar)
        self.status_bar.showMessage("就绪")

        self.frame_receiver.frame_received.connect(self._on_remote_frame)

    def _init_discovery(self):
        hostname = socket.gethostname()
        self.discovery = NetworkDiscovery(device_name=hostname, platform=PLATFORM_WINDOWS)
        self.discovery.add_device_callback(self._on_device_update)
        self.discovery.start()

        self.device_list_worker = DeviceListWorker(self.discovery)
        self.device_list_worker.devices_updated.connect(self._refresh_device_list)

        self._update_ip_info()

    def _update_ip_info(self):
        if self.discovery:
            ip = self.discovery._get_local_ip()
            self.info_label.setText(f"IP: {ip}\n状态: 未连接")

    def _refresh_monitors(self):
        self.monitor_combo.clear()
        monitors = ScreenCapturer.get_monitors()
        if not monitors:
            self.monitor_combo.addItem("主显示器", 0)
        else:
            for m in monitors:
                self.monitor_combo.addItem(
                    f"显示器 {m['index']} ({m['width']}x{m['height']})", m["index"] - 1
                )

    def _refresh_device_list(self):
        if not self.discovery:
            return

        current_items = set()
        for i in range(self.device_list.count()):
            current_items.add(self.device_list.item(i).data(Qt.ItemDataRole.UserRole))

        devices = self.discovery.get_discovered_devices()
        new_ids = set(d.device_id for d in devices)

        for i in range(self.device_list.count() - 1, -1, -1):
            item = self.device_list.item(i)
            if item.data(Qt.ItemDataRole.UserRole) not in new_ids:
                self.device_list.takeItem(i)

        for device in devices:
            if device.device_id not in current_items:
                item = QListWidgetItem()
                icon_text = "🖥️" if device.platform == PLATFORM_WINDOWS else "📱"
                lock_text = "🔒" if device.has_password else ""
                item.setText(f"{icon_text} {device.device_name} {lock_text}")
                item.setData(Qt.ItemDataRole.UserRole, device.device_id)
                item.setData(Qt.ItemDataRole.UserRole + 1, device)
                self.device_list.addItem(item)
            else:
                for i in range(self.device_list.count()):
                    item = self.device_list.item(i)
                    if item.data(Qt.ItemDataRole.UserRole) == device.device_id:
                        icon_text = "🖥️" if device.platform == PLATFORM_WINDOWS else "📱"
                        lock_text = "🔒" if device.has_password else ""
                        item.setText(f"{icon_text} {device.device_name} {lock_text}")
                        item.setData(Qt.ItemDataRole.UserRole + 1, device)
                        break

    def _on_device_update(self, device: DeviceInfo, action: str):
        pass

    def _toggle_server_mode(self):
        if self.is_server_mode:
            self._stop_server()
            self.btn_server.setChecked(False)
            self.btn_client.setEnabled(True)
            self.is_server_mode = False
            self.mode_label.setText("当前: 空闲模式")
            self.status_bar.showMessage("服务器已停止")
        else:
            dialog = PasswordDialog(self, is_server=True)
            if dialog.exec() == QDialog.DialogCode.Accepted:
                self.server_password = dialog.get_password()
                if self._start_server():
                    self.btn_server.setChecked(True)
                    self.btn_client.setEnabled(False)
                    self.is_server_mode = True
                    self.mode_label.setText("当前: 服务器模式")
                    self.status_bar.showMessage("服务器已启动")

    def _start_server(self) -> bool:
        try:
            self.server = TCPServer()
            if not self.server.start():
                QMessageBox.critical(self, "错误", "无法启动服务器")
                return False

            self.server_worker = ServerWorker(self.server, self.server_password)
            self.server_worker.client_connected.connect(self._on_client_connected)
            self.server_worker.client_disconnected.connect(self._on_client_disconnected)
            self.server_worker.status_changed.connect(self.status_bar.showMessage)

            self.capturer = ScreenCapturer(
                fps=self.fps_spin.value(), quality=self.quality_spin.value()
            )
            self.capturer.set_monitor(self.monitor_combo.currentData())
            self.capturer.on_frame = self._on_captured_frame
            self.capturer.start()

            if self.discovery:
                self.discovery.has_password = True
                self.discovery.mode = MODE_DISPLAY

            return True
        except Exception as e:
            QMessageBox.critical(self, "错误", f"启动服务器失败: {e}")
            return False

    def _stop_server(self):
        if self.capturer:
            self.capturer.stop()
            self.capturer = None

        if self.server:
            self.server.stop()
            self.server = None

        if self.server_worker:
            self.server_worker = None

        if self.second_screen:
            self.second_screen.stop()
            self.second_screen = None

        if self.discovery:
            self.discovery.has_password = False
            self.discovery.mode = "idle"

        self.display_label.setText("等待连接...")
        self.btn_disconnect.setEnabled(False)

    def _on_captured_frame(self, frame_data: bytes, size: tuple):
        if self.server:
            self.server.broadcast_frame(frame_data)

        if not self.client:
            qimage = QImage.fromData(frame_data, "JPEG")
            if not qimage.isNull():
                pixmap = QPixmap.fromImage(qimage)
                scaled = pixmap.scaled(
                    self.display_label.size(),
                    Qt.AspectRatioMode.KeepAspectRatio,
                    Qt.TransformationMode.SmoothTransformation,
                )
                self.display_label.setPixmap(scaled)

    def _on_client_connected(self, conn: TCPConnection):
        self.status_bar.showMessage(f"客户端连接: {conn.addr[0]}")
        self.btn_disconnect.setEnabled(True)

        if self.extend_mode_check.isChecked() and self.discovery:
            if not self.second_screen:
                self.second_screen = SecondScreenManager()
                if self.second_screen.is_available():
                    self.second_screen.start(1)
                    self.discovery.mode = MODE_EXTEND

    def _on_client_disconnected(self, conn: TCPConnection):
        self.status_bar.showMessage(f"客户端断开: {conn.addr[0]}")
        if self.server and not self.server.get_connections():
            self.btn_disconnect.setEnabled(False)
            if self.second_screen:
                self.second_screen.stop()
                self.second_screen = None
                if self.discovery:
                    self.discovery.mode = MODE_DISPLAY

    def _toggle_client_mode(self):
        if self.client and self.client.connection:
            self._disconnect()
            self.btn_client.setChecked(False)
            self.btn_server.setEnabled(True)
            self.mode_label.setText("当前: 空闲模式")
        else:
            selected_items = self.device_list.selectedItems()
            if not selected_items:
                QMessageBox.information(self, "提示", "请先选择一个设备")
                return

            device = selected_items[0].data(Qt.ItemDataRole.UserRole + 1)
            if not device:
                return

            dialog = PasswordDialog(self, is_server=False)
            if dialog.exec() == QDialog.DialogCode.Accepted:
                password = dialog.get_password()
                self._connect_to_server(device, password)

    def _connect_to_server(self, device: DeviceInfo, password: str):
        try:
            self.client = TCPClient()
            self.client.on_connected = lambda: self._on_connected_to_server(device)
            self.client.on_connection_failed = self._on_connection_failed
            self.client.on_disconnected = self._on_disconnected_from_server
            self.client.on_message = self._on_client_message

            my_device_info = self.discovery.get_device_info() if self.discovery else None
            self.client.connect(device.ip, device.tcp_port, password, my_device_info)

            self.status_bar.showMessage(f"正在连接到 {device.device_name}...")
        except Exception as e:
            QMessageBox.critical(self, "错误", f"连接失败: {e}")

    def _on_connected_to_server(self, device: DeviceInfo):
        self.btn_client.setChecked(True)
        self.btn_server.setEnabled(False)
        self.mode_label.setText(f"当前: 客户端模式 (连接到 {device.device_name})")
        self.status_bar.showMessage(f"已连接到 {device.device_name}")
        self.btn_disconnect.setEnabled(True)

    def _on_connection_failed(self, error: str):
        QMessageBox.critical(self, "连接失败", f"无法连接: {error}")
        self.btn_client.setChecked(False)
        self.btn_server.setEnabled(True)
        self.client = None

    def _on_disconnected_from_server(self):
        self.btn_client.setChecked(False)
        self.btn_server.setEnabled(True)
        self.mode_label.setText("当前: 空闲模式")
        self.status_bar.showMessage("已断开连接")
        self.btn_disconnect.setEnabled(False)
        self.display_label.setText("等待连接...")
        self.client = None

    def _on_client_message(self, msg_type: str, payload: bytes):
        if msg_type == MSG_TYPE_FRAME:
            self.frame_receiver.handle_frame(payload)
        elif msg_type == MSG_TYPE_PASSWORD_ACK:
            try:
                data = json.loads(payload.decode("utf-8"))
                if not data.get("success", False):
                    error = data.get("error", "认证失败")
                    QMessageBox.critical(self, "认证失败", error)
                    if self.client:
                        self.client.disconnect()
            except Exception:
                pass

    def _on_remote_frame(self, frame_data: bytes):
        qimage = QImage.fromData(frame_data, "JPEG")
        if not qimage.isNull():
            pixmap = QPixmap.fromImage(qimage)
            scaled = pixmap.scaled(
                self.display_label.size(),
                Qt.AspectRatioMode.KeepAspectRatio,
                Qt.TransformationMode.SmoothTransformation,
            )
            self.display_label.setPixmap(scaled)

            if self.second_screen and self.second_screen.is_active():
                self.second_screen.update_frame(frame_data)

    def _on_device_double_clicked(self, item: QListWidgetItem):
        if not self.is_server_mode and not (self.client and self.client.connection):
            self._toggle_client_mode()

    def _disconnect(self):
        if self.is_server_mode:
            self._stop_server()
            self.btn_server.setChecked(False)
            self.btn_client.setEnabled(True)
            self.is_server_mode = False
            self.mode_label.setText("当前: 空闲模式")
        elif self.client:
            self.client.disconnect()

    def closeEvent(self, event):
        self._disconnect()
        if self.discovery:
            self.discovery.stop()
        event.accept()
