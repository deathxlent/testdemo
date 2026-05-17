package com.screen2nd.app.network

import org.json.JSONObject
import java.io.ByteArrayOutputStream
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.util.zip.CRC32
import java.util.zip.Deflater
import java.util.zip.Inflater

object Protocol {
    const val UDP_DISCOVERY_PORT = 45678
    const val TCP_DATA_PORT = 45679

    const val MSG_TYPE_HELLO = "hello"
    const val MSG_TYPE_PASSWORD_REQ = "password_req"
    const val MSG_TYPE_PASSWORD_ACK = "password_ack"
    const val MSG_TYPE_DISCONNECT = "disconnect"
    const val MSG_TYPE_FRAME = "frame"
    const val MSG_TYPE_FRAME_ACK = "frame_ack"
    const val MSG_TYPE_TOUCH = "touch"
    const val MSG_TYPE_MODE_CHANGE = "mode_change"

    const val MODE_DISPLAY = "display"
    const val MODE_EXTEND = "extend"
    const val MODE_IDLE = "idle"

    const val PLATFORM_WINDOWS = "windows"
    const val PLATFORM_ANDROID = "android"

    const val DISCOVERY_INTERVAL = 2000L
    const val HEARTBEAT_INTERVAL = 5000L
    const val TIMEOUT = 15000L

    const val COMPRESSION_THRESHOLD = 10240
}

data class DeviceInfo(
    var deviceId: String = "",
    var deviceName: String = "",
    var platform: String = "",
    var ip: String = "",
    var tcpPort: Int = Protocol.TCP_DATA_PORT,
    var hasPassword: Boolean = false,
    var mode: String = Protocol.MODE_IDLE
) {
    fun toJson(): JSONObject {
        return JSONObject().apply {
            put("device_id", deviceId)
            put("device_name", deviceName)
            put("platform", platform)
            put("ip", ip)
            put("tcp_port", tcpPort)
            put("has_password", hasPassword)
            put("mode", mode)
        }
    }

    companion object {
        fun fromJson(json: JSONObject): DeviceInfo {
            return DeviceInfo(
                deviceId = json.optString("device_id", ""),
                deviceName = json.optString("device_name", ""),
                platform = json.optString("platform", ""),
                ip = json.optString("ip", ""),
                tcpPort = json.optInt("tcp_port", Protocol.TCP_DATA_PORT),
                hasPassword = json.optBoolean("has_password", false),
                mode = json.optString("mode", Protocol.MODE_IDLE)
            )
        }
    }
}

data class DiscoveryMessage(
    var msgType: String = "",
    var device: DeviceInfo = DeviceInfo()
) {
    fun toBytes(): ByteArray {
        val json = JSONObject().apply {
            put("type", msgType)
            put("device", device.toJson())
        }
        return json.toString().toByteArray(Charsets.UTF_8)
    }

    companion object {
        fun fromBytes(data: ByteArray): DiscoveryMessage? {
            return try {
                val json = JSONObject(String(data, Charsets.UTF_8))
                DiscoveryMessage(
                    msgType = json.optString("type", ""),
                    device = DeviceInfo.fromJson(json.optJSONObject("device") ?: JSONObject())
                )
            } catch (e: Exception) {
                null
            }
        }
    }
}

object MessagePacker {
    fun pack(msgType: String, payload: ByteArray = byteArrayOf()): ByteArray {
        val typeBytes = msgType.toByteArray(Charsets.UTF_8)
        val crc = CRC32().apply { update(payload) }.value.toInt()

        val buffer = ByteBuffer.allocate(10 + typeBytes.size + payload.size)
        buffer.order(ByteOrder.BIG_ENDIAN)
        buffer.putInt(payload.size)
        buffer.putInt(crc)
        buffer.putShort(typeBytes.size.toShort())
        buffer.put(typeBytes)
        buffer.put(payload)

        return buffer.array()
    }

    fun unpack(data: ByteArray): Triple<String?, ByteArray?, Int> {
        if (data.size < 10) return Triple(null, null, 0)

        val buffer = ByteBuffer.wrap(data)
        buffer.order(ByteOrder.BIG_ENDIAN)

        val payloadLen = buffer.int
        val crc = buffer.int
        val typeLen = buffer.short.toInt()

        val totalLen = 10 + typeLen + payloadLen
        if (data.size < totalLen) return Triple(null, null, 0)

        val typeBytes = ByteArray(typeLen)
        buffer.get(typeBytes)
        val msgType = String(typeBytes, Charsets.UTF_8)

        val payload = ByteArray(payloadLen)
        buffer.get(payload)

        val calcCrc = CRC32().apply { update(payload) }.value.toInt()
        if (calcCrc != crc) {
            return Triple(null, null, totalLen)
        }

        return Triple(msgType, payload, totalLen)
    }
}

object FrameCompressor {
    fun compress(frameData: ByteArray): ByteArray {
        if (frameData.size > Protocol.COMPRESSION_THRESHOLD) {
            val deflater = Deflater(Deflater.BEST_SPEED)
            deflater.setInput(frameData)
            deflater.finish()

            val outputStream = ByteArrayOutputStream(frameData.size)
            val buffer = ByteArray(1024 * 32)

            while (!deflater.finished()) {
                val count = deflater.deflate(buffer)
                outputStream.write(buffer, 0, count)
            }

            deflater.end()
            val compressed = outputStream.toByteArray()

            if (compressed.size < frameData.size) {
                return byteArrayOf(1) + compressed
            }
        }
        return byteArrayOf(0) + frameData
    }

    fun decompress(data: ByteArray): ByteArray {
        if (data[0] == 1.toByte()) {
            val inflater = Inflater()
            inflater.setInput(data, 1, data.size - 1)

            val outputStream = ByteArrayOutputStream()
            val buffer = ByteArray(1024 * 32)

            while (!inflater.finished()) {
                val count = inflater.inflate(buffer)
                outputStream.write(buffer, 0, count)
            }

            inflater.end()
            return outputStream.toByteArray()
        }
        return data.copyOfRange(1, data.size)
    }
}
