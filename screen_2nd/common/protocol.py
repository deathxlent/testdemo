import json
import struct
import zlib
from dataclasses import dataclass, asdict
from typing import Optional, Tuple

UDP_DISCOVERY_PORT = 45678
TCP_DATA_PORT = 45679

MSG_TYPE_HELLO = "hello"
MSG_TYPE_PASSWORD_REQ = "password_req"
MSG_TYPE_PASSWORD_ACK = "password_ack"
MSG_TYPE_DISCONNECT = "disconnect"
MSG_TYPE_FRAME = "frame"
MSG_TYPE_FRAME_ACK = "frame_ack"
MSG_TYPE_TOUCH = "touch"
MSG_TYPE_MODE_CHANGE = "mode_change"

MODE_DISPLAY = "display"
MODE_EXTEND = "extend"
MODE_IDLE = "idle"

PLATFORM_WINDOWS = "windows"
PLATFORM_ANDROID = "android"

DISCOVERY_INTERVAL = 2.0
HEARTBEAT_INTERVAL = 5.0
TIMEOUT = 15.0

COMPRESSION_THRESHOLD = 10240


@dataclass
class DeviceInfo:
    device_id: str
    device_name: str
    platform: str
    ip: str = ""
    tcp_port: int = TCP_DATA_PORT
    has_password: bool = False
    mode: str = MODE_IDLE

    def to_dict(self) -> dict:
        return asdict(self)

    @classmethod
    def from_dict(cls, data: dict) -> "DeviceInfo":
        return cls(
            device_id=data.get("device_id", ""),
            device_name=data.get("device_name", ""),
            platform=data.get("platform", ""),
            ip=data.get("ip", ""),
            tcp_port=data.get("tcp_port", TCP_DATA_PORT),
            has_password=data.get("has_password", False),
            mode=data.get("mode", MODE_IDLE),
        )


@dataclass
class DiscoveryMessage:
    msg_type: str
    device: DeviceInfo

    def to_bytes(self) -> bytes:
        data = {"type": self.msg_type, "device": self.device.to_dict()}
        return json.dumps(data, ensure_ascii=False).encode("utf-8")

    @classmethod
    def from_bytes(cls, data: bytes) -> Optional["DiscoveryMessage"]:
        try:
            obj = json.loads(data.decode("utf-8"))
            device = DeviceInfo.from_dict(obj.get("device", {}))
            return cls(msg_type=obj.get("type", ""), device=device)
        except Exception:
            return None


def pack_message(msg_type: str, payload: bytes = b"") -> bytes:
    header = struct.pack("!II", len(payload), zlib.crc32(payload) & 0xFFFFFFFF)
    type_bytes = msg_type.encode("utf-8")
    type_len = struct.pack("!H", len(type_bytes))
    return header + type_len + type_bytes + payload


def unpack_message(data: bytes) -> Tuple[Optional[str], Optional[bytes], int]:
    if len(data) < 10:
        return None, None, 0
    payload_len, crc = struct.unpack("!II", data[:8])
    type_len = struct.unpack("!H", data[8:10])[0]
    total_len = 10 + type_len + payload_len
    if len(data) < total_len:
        return None, None, 0
    msg_type = data[10 : 10 + type_len].decode("utf-8")
    payload = data[10 + type_len : total_len]
    if zlib.crc32(payload) & 0xFFFFFFFF != crc:
        return None, None, total_len
    return msg_type, payload, total_len


def compress_frame(frame_data: bytes) -> bytes:
    if len(frame_data) > COMPRESSION_THRESHOLD:
        compressed = zlib.compress(frame_data, level=1)
        if len(compressed) < len(frame_data):
            return b"\x01" + compressed
    return b"\x00" + frame_data


def decompress_frame(data: bytes) -> bytes:
    if data[0] == 1:
        return zlib.decompress(data[1:])
    return data[1:]
