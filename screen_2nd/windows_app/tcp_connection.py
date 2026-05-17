import socket
import threading
import time
from typing import Callable, Optional, Dict
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from common.protocol import (
    TCP_DATA_PORT,
    pack_message,
    unpack_message,
    MSG_TYPE_HELLO,
    MSG_TYPE_PASSWORD_REQ,
    MSG_TYPE_PASSWORD_ACK,
    MSG_TYPE_DISCONNECT,
    MSG_TYPE_FRAME,
    MSG_TYPE_TOUCH,
    MSG_TYPE_MODE_CHANGE,
    compress_frame,
    decompress_frame,
    DeviceInfo,
)


class TCPConnection:
    def __init__(self, sock: socket.socket, addr: tuple):
        self.socket = sock
        self.addr = addr
        self.connected = True
        self.authenticated = False
        self.device_info: Optional[DeviceInfo] = None

        self._recv_buffer = b""
        self._recv_thread: Optional[threading.Thread] = None
        self._lock = threading.Lock()

        self.on_message: Optional[Callable[[str, bytes], None]] = None
        self.on_disconnect: Optional[Callable[[], None]] = None

    def start(self):
        self._recv_thread = threading.Thread(target=self._recv_loop, daemon=True)
        self._recv_thread.start()

    def stop(self):
        self.connected = False
        try:
            self.socket.close()
        except Exception:
            pass
        if self._recv_thread:
            self._recv_thread.join(timeout=1)

    def send(self, msg_type: str, payload: bytes = b"") -> bool:
        if not self.connected:
            return False
        try:
            data = pack_message(msg_type, payload)
            with self._lock:
                self.socket.sendall(data)
            return True
        except Exception:
            self.connected = False
            if self.on_disconnect:
                self.on_disconnect()
            return False

    def send_frame(self, frame_data: bytes) -> bool:
        compressed = compress_frame(frame_data)
        return self.send(MSG_TYPE_FRAME, compressed)

    def send_touch_event(self, touch_data: dict) -> bool:
        import json

        payload = json.dumps(touch_data).encode("utf-8")
        return self.send(MSG_TYPE_TOUCH, payload)

    def _recv_loop(self):
        while self.connected:
            try:
                chunk = self.socket.recv(65536)
                if not chunk:
                    break
                self._recv_buffer += chunk

                while True:
                    msg_type, payload, consumed = unpack_message(self._recv_buffer)
                    if msg_type is None:
                        break

                    self._recv_buffer = self._recv_buffer[consumed:]

                    if msg_type == MSG_TYPE_DISCONNECT:
                        self.connected = False
                        if self.on_disconnect:
                            self.on_disconnect()
                        break

                    if self.on_message:
                        try:
                            self.on_message(msg_type, payload)
                        except Exception as e:
                            print(f"Message handler error: {e}")

            except Exception:
                break

        self.connected = False
        try:
            self.socket.close()
        except Exception:
            pass
        if self.on_disconnect:
            self.on_disconnect()


class TCPServer:
    def __init__(self, host: str = "0.0.0.0", port: int = TCP_DATA_PORT):
        self.host = host
        self.port = port
        self.running = False
        self.server_socket: Optional[socket.socket] = None
        self.accept_thread: Optional[threading.Thread] = None
        self.connections: Dict[str, TCPConnection] = {}
        self._lock = threading.Lock()

        self.on_new_connection: Optional[Callable[[TCPConnection], None]] = None
        self.on_connection_closed: Optional[Callable[[TCPConnection], None]] = None

    def start(self) -> bool:
        try:
            self.server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            self.server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            self.server_socket.bind((self.host, self.port))
            self.server_socket.listen(5)
            self.server_socket.settimeout(1.0)
            self.running = True

            self.accept_thread = threading.Thread(target=self._accept_loop, daemon=True)
            self.accept_thread.start()
            return True
        except Exception as e:
            print(f"Failed to start server: {e}")
            return False

    def stop(self):
        self.running = False
        if self.server_socket:
            try:
                self.server_socket.close()
            except Exception:
                pass
        if self.accept_thread:
            self.accept_thread.join(timeout=2)

        with self._lock:
            for conn in list(self.connections.values()):
                conn.stop()
            self.connections.clear()

    def _accept_loop(self):
        while self.running:
            try:
                client_sock, client_addr = self.server_socket.accept()
                conn = TCPConnection(client_sock, client_addr)

                def on_disconnect(conn=conn):
                    with self._lock:
                        addr_key = f"{conn.addr[0]}:{conn.addr[1]}"
                        if addr_key in self.connections:
                            del self.connections[addr_key]
                    if self.on_connection_closed:
                        self.on_connection_closed(conn)

                conn.on_disconnect = on_disconnect
                conn.start()

                with self._lock:
                    addr_key = f"{client_addr[0]}:{client_addr[1]}"
                    self.connections[addr_key] = conn

                if self.on_new_connection:
                    self.on_new_connection(conn)

            except socket.timeout:
                continue
            except Exception:
                if self.running:
                    print("Accept error")
                break

    def broadcast_frame(self, frame_data: bytes):
        with self._lock:
            for conn in list(self.connections.values()):
                if conn.authenticated:
                    conn.send_frame(frame_data)

    def get_connections(self) -> list:
        with self._lock:
            return list(self.connections.values())


class TCPClient:
    def __init__(self):
        self.connection: Optional[TCPConnection] = None
        self._connect_thread: Optional[threading.Thread] = None

        self.on_connected: Optional[Callable[[], None]] = None
        self.on_connection_failed: Optional[Callable[[str], None]] = None
        self.on_message: Optional[Callable[[str, bytes], None]] = None
        self.on_disconnected: Optional[Callable[[], None]] = None

    def connect(self, host: str, port: int, password: str = "", device_info: Optional[DeviceInfo] = None):
        def do_connect():
            try:
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                sock.settimeout(5.0)
                sock.connect((host, port))
                sock.settimeout(None)

                self.connection = TCPConnection(sock, (host, port))
                self.connection.device_info = device_info

                self.connection.on_message = self._on_message
                self.connection.on_disconnect = self._on_disconnect
                self.connection.start()

                import json

                hello_data = {"password": password}
                if device_info:
                    hello_data["device"] = device_info.to_dict()
                hello_payload = json.dumps(hello_data).encode("utf-8")
                self.connection.send(MSG_TYPE_HELLO, hello_payload)

                if self.on_connected:
                    self.on_connected()

            except Exception as e:
                print(f"Connect error: {e}")
                if self.on_connection_failed:
                    self.on_connection_failed(str(e))

        self._connect_thread = threading.Thread(target=do_connect, daemon=True)
        self._connect_thread.start()

    def disconnect(self):
        if self.connection:
            self.connection.send(MSG_TYPE_DISCONNECT)
            time.sleep(0.1)
            self.connection.stop()
            self.connection = None

    def send(self, msg_type: str, payload: bytes = b"") -> bool:
        if not self.connection or not self.connection.connected:
            return False
        return self.connection.send(msg_type, payload)

    def send_frame(self, frame_data: bytes) -> bool:
        if not self.connection or not self.connection.connected:
            return False
        return self.connection.send_frame(frame_data)

    def send_touch_event(self, touch_data: dict) -> bool:
        if not self.connection or not self.connection.connected:
            return False
        return self.connection.send_touch_event(touch_data)

    def _on_message(self, msg_type: str, payload: bytes):
        if self.on_message:
            self.on_message(msg_type, payload)

    def _on_disconnect(self):
        self.connection = None
        if self.on_disconnected:
            self.on_disconnected()
