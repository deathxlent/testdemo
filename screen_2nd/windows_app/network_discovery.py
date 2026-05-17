import socket
import threading
import time
import uuid
from typing import Callable, Dict, List, Optional
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from common.protocol import (
    UDP_DISCOVERY_PORT,
    TCP_DATA_PORT,
    DeviceInfo,
    DiscoveryMessage,
)


class NetworkDiscovery:
    def __init__(self, device_name: str = "WindowsPC", platform: str = "windows"):
        self.device_id = str(uuid.uuid4())
        self.device_name = device_name
        self.platform = platform
        self.has_password = False
        self.mode = "idle"

        self._discovery_running = False
        self._discovery_thread: Optional[threading.Thread] = None
        self._broadcast_thread: Optional[threading.Thread] = None

        self._udp_socket: Optional[socket.socket] = None
        self._discovered_devices: Dict[str, DeviceInfo] = {}
        self._device_callbacks: List[Callable[[DeviceInfo, str], None]] = []
        self._device_timeout = 10.0
        self._last_seen: Dict[str, float] = {}

    def get_device_info(self) -> DeviceInfo:
        ip = self._get_local_ip()
        return DeviceInfo(
            device_id=self.device_id,
            device_name=self.device_name,
            platform=self.platform,
            ip=ip,
            tcp_port=TCP_DATA_PORT,
            has_password=self.has_password,
            mode=self.mode,
        )

    def _get_local_ip(self) -> str:
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(("8.8.8.8", 80))
            ip = s.getsockname()[0]
            s.close()
            return ip
        except Exception:
            return "127.0.0.1"

    def add_device_callback(self, callback: Callable[[DeviceInfo, str], None]):
        self._device_callbacks.append(callback)

    def remove_device_callback(self, callback: Callable[[DeviceInfo, str], None]):
        if callback in self._device_callbacks:
            self._device_callbacks.remove(callback)

    def _notify_callbacks(self, device: DeviceInfo, action: str):
        for cb in self._device_callbacks:
            try:
                cb(device, action)
            except Exception as e:
                print(f"Callback error: {e}")

    def start(self):
        if self._discovery_running:
            return

        self._discovery_running = True

        self._udp_socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        self._udp_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        self._udp_socket.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)
        self._udp_socket.bind(("", UDP_DISCOVERY_PORT))
        self._udp_socket.settimeout(1.0)

        self._discovery_thread = threading.Thread(target=self._listen_for_discovery, daemon=True)
        self._discovery_thread.start()

        self._broadcast_thread = threading.Thread(target=self._broadcast_loop, daemon=True)
        self._broadcast_thread.start()

    def stop(self):
        self._discovery_running = False
        if self._udp_socket:
            self._udp_socket.close()
            self._udp_socket = None
        if self._discovery_thread:
            self._discovery_thread.join(timeout=2)
        if self._broadcast_thread:
            self._broadcast_thread.join(timeout=2)

    def _broadcast_loop(self):
        while self._discovery_running:
            try:
                msg = DiscoveryMessage(msg_type="announce", device=self.get_device_info())
                data = msg.to_bytes()
                self._udp_socket.sendto(data, ("255.255.255.255", UDP_DISCOVERY_PORT))
            except Exception:
                pass
            time.sleep(2.0)

    def _listen_for_discovery(self):
        while self._discovery_running:
            try:
                data, addr = self._udp_socket.recvfrom(4096)
                msg = DiscoveryMessage.from_bytes(data)
                if not msg:
                    continue

                device = msg.device
                device.ip = addr[0]

                if device.device_id == self.device_id:
                    continue

                device_key = device.device_id
                self._last_seen[device_key] = time.time()

                is_new = device_key not in self._discovered_devices
                self._discovered_devices[device_key] = device

                if is_new:
                    self._notify_callbacks(device, "added")
                else:
                    self._notify_callbacks(device, "updated")

                self._cleanup_old_devices()

            except socket.timeout:
                self._cleanup_old_devices()
            except Exception:
                break

    def _cleanup_old_devices(self):
        now = time.time()
        to_remove = []
        for device_id, last_seen in self._last_seen.items():
            if now - last_seen > self._device_timeout:
                to_remove.append(device_id)

        for device_id in to_remove:
            device = self._discovered_devices.pop(device_id, None)
            self._last_seen.pop(device_id, None)
            if device:
                self._notify_callbacks(device, "removed")

    def get_discovered_devices(self) -> List[DeviceInfo]:
        self._cleanup_old_devices()
        return list(self._discovered_devices.values())
