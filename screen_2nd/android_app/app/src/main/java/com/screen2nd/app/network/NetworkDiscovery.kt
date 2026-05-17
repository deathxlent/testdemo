package com.screen2nd.app.network

import android.content.Context
import android.net.wifi.WifiManager
import android.os.Build
import android.provider.Settings
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import java.net.*
import java.util.*
import java.util.concurrent.ConcurrentHashMap

class NetworkDiscovery(
    private val context: Context,
    private val deviceName: String = "AndroidDevice"
) {
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private var udpSocket: DatagramSocket? = null
    private var discoveryJob: Job? = null
    private var broadcastJob: Job? = null

    val deviceId: String = UUID.randomUUID().toString()

    private val _discoveredDevices = MutableStateFlow<List<DeviceInfo>>(emptyList())
    val discoveredDevices: StateFlow<List<DeviceInfo>> = _discoveredDevices

    private val devicesMap = ConcurrentHashMap<String, DeviceInfo>()
    private val lastSeen = ConcurrentHashMap<String, Long>()
    private val deviceTimeout = 10000L

    var hasPassword = false
    var mode = Protocol.MODE_IDLE

    fun getDeviceInfo(): DeviceInfo {
        return DeviceInfo(
            deviceId = deviceId,
            deviceName = deviceName,
            platform = Protocol.PLATFORM_ANDROID,
            ip = getLocalIp(),
            tcpPort = Protocol.TCP_DATA_PORT,
            hasPassword = hasPassword,
            mode = mode
        )
    }

    private fun getDeviceName(): String {
        return try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                Settings.Global.getString(context.contentResolver, "device_name")
                    ?: Build.MODEL
            } else {
                Build.MODEL
            }
        } catch (e: Exception) {
            Build.MODEL
        }
    }

    fun getLocalIp(): String {
        return try {
            val wifiManager = context.applicationContext.getSystemService(Context.WIFI_SERVICE) as WifiManager
            val ipAddress = wifiManager.connectionInfo.ipAddress
            if (ipAddress == 0) {
                getLocalIpByNetworkInterface()
            } else {
                String.format(
                    "%d.%d.%d.%d",
                    ipAddress and 0xff,
                    ipAddress shr 8 and 0xff,
                    ipAddress shr 16 and 0xff,
                    ipAddress shr 24 and 0xff
                )
            }
        } catch (e: Exception) {
            "127.0.0.1"
        }
    }

    private fun getLocalIpByNetworkInterface(): String {
        try {
            val interfaces = Collections.list(NetworkInterface.getNetworkInterfaces())
            for (iface in interfaces) {
                val addresses = Collections.list(iface.inetAddresses)
                for (addr in addresses) {
                    if (!addr.isLoopbackAddress && addr is Inet4Address) {
                        return addr.hostAddress ?: "127.0.0.1"
                    }
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
        return "127.0.0.1"
    }

    fun start() {
        stop()
        try {
            udpSocket = DatagramSocket(null).apply {
                reuseAddress = true
                broadcast = true
                bind(InetSocketAddress(Protocol.UDP_DISCOVERY_PORT))
                soTimeout = 1000
            }

            discoveryJob = scope.launch { listenForDiscovery() }
            broadcastJob = scope.launch { broadcastLoop() }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    fun stop() {
        discoveryJob?.cancel()
        broadcastJob?.cancel()
        discoveryJob = null
        broadcastJob = null

        try {
            udpSocket?.close()
        } catch (e: Exception) {
            e.printStackTrace()
        }
        udpSocket = null

        devicesMap.clear()
        lastSeen.clear()
        _discoveredDevices.value = emptyList()
    }

    private suspend fun broadcastLoop() {
        while (scope.isActive) {
            try {
                val msg = DiscoveryMessage(msgType = "announce", device = getDeviceInfo())
                val data = msg.toBytes()
                val packet = DatagramPacket(
                    data,
                    data.size,
                    InetAddress.getByName("255.255.255.255"),
                    Protocol.UDP_DISCOVERY_PORT
                )
                udpSocket?.send(packet)
            } catch (e: Exception) {
                e.printStackTrace()
            }
            delay(Protocol.DISCOVERY_INTERVAL)
        }
    }

    private suspend fun listenForDiscovery() {
        val buffer = ByteArray(4096)
        while (scope.isActive) {
            try {
                val packet = DatagramPacket(buffer, buffer.size)
                udpSocket?.receive(packet)

                val data = packet.data.copyOf(packet.length)
                val msg = DiscoveryMessage.fromBytes(data) ?: continue

                if (msg.device.deviceId == deviceId) continue

                msg.device.ip = packet.address.hostAddress ?: ""

                val deviceKey = msg.device.deviceId
                lastSeen[deviceKey] = System.currentTimeMillis()

                val isNew = !devicesMap.containsKey(deviceKey)
                devicesMap[deviceKey] = msg.device

                cleanupOldDevices()

                if (isNew) {
                    _discoveredDevices.value = devicesMap.values.toList()
                } else {
                    _discoveredDevices.value = devicesMap.values.toList()
                }
            } catch (e: SocketTimeoutException) {
                cleanupOldDevices()
            } catch (e: Exception) {
                if (e.message?.contains("Socket closed") != true) {
                    e.printStackTrace()
                }
                break
            }
        }
    }

    private fun cleanupOldDevices() {
        val now = System.currentTimeMillis()
        val toRemove = mutableListOf<String>()

        for ((id, time) in lastSeen) {
            if (now - time > deviceTimeout) {
                toRemove.add(id)
            }
        }

        var changed = false
        for (id in toRemove) {
            devicesMap.remove(id)
            lastSeen.remove(id)
            changed = true
        }

        if (changed) {
            _discoveredDevices.value = devicesMap.values.toList()
        }
    }

    fun destroy() {
        stop()
        scope.cancel()
    }
}
