package com.screen2nd.app.network

import kotlinx.coroutines.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import org.json.JSONObject
import java.io.ByteArrayOutputStream
import java.net.*
import java.nio.ByteBuffer

class TCPConnection(
    private val socket: Socket,
    val addr: InetSocketAddress
) {
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private val inputStream = socket.getInputStream()
    private val outputStream = socket.getOutputStream()

    var authenticated = false
    var deviceInfo: DeviceInfo? = null

    private var recvBuffer = ByteArray(0)
    private var recvJob: Job? = null

    val _isConnected = MutableStateFlow(true)
    val isConnected: StateFlow<Boolean> = _isConnected

    var onMessage: ((String, ByteArray) -> Unit)? = null
    var onDisconnect: (() -> Unit)? = null

    fun start() {
        recvJob = scope.launch { recvLoop() }
    }

    fun stop() {
        _isConnected.value = false
        recvJob?.cancel()
        recvJob = null
        try {
            socket.close()
        } catch (e: Exception) {
            e.printStackTrace()
        }
        scope.cancel()
    }

    suspend fun send(msgType: String, payload: ByteArray = byteArrayOf()): Boolean {
        if (!_isConnected.value) return false
        return try {
            val data = MessagePacker.pack(msgType, payload)
            withContext(Dispatchers.IO) {
                outputStream.write(data)
                outputStream.flush()
            }
            true
        } catch (e: Exception) {
            e.printStackTrace()
            _isConnected.value = false
            onDisconnect?.invoke()
            false
        }
    }

    suspend fun sendFrame(frameData: ByteArray): Boolean {
        val compressed = FrameCompressor.compress(frameData)
        return send(Protocol.MSG_TYPE_FRAME, compressed)
    }

    suspend fun sendTouchEvent(touchData: Map<String, Any>): Boolean {
        val json = JSONObject(touchData).toString()
        return send(Protocol.MSG_TYPE_TOUCH, json.toByteArray(Charsets.UTF_8))
    }

    private suspend fun recvLoop() {
        val buffer = ByteArray(65536)
        while (_isConnected.value && isActive) {
            try {
                val bytesRead = withContext(Dispatchers.IO) { inputStream.read(buffer) }
                if (bytesRead == -1) break

                recvBuffer += buffer.copyOf(bytesRead)

                while (true) {
                    val (msgType, payload, consumed) = MessagePacker.unpack(recvBuffer)
                    if (msgType == null) break

                    recvBuffer = recvBuffer.copyOfRange(consumed, recvBuffer.size)

                    if (msgType == Protocol.MSG_TYPE_DISCONNECT) {
                        _isConnected.value = false
                        onDisconnect?.invoke()
                        return
                    }

                    onMessage?.invoke(msgType, payload ?: byteArrayOf())
                }
            } catch (e: Exception) {
                if (e.message?.contains("Socket closed") != true) {
                    e.printStackTrace()
                }
                break
            }
        }

        _isConnected.value = false
        try {
            socket.close()
        } catch (e: Exception) {
            e.printStackTrace()
        }
        onDisconnect?.invoke()
    }
}

class TCPServer(
    private val host: String = "0.0.0.0",
    private val port: Int = Protocol.TCP_DATA_PORT
) {
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private var serverSocket: ServerSocket? = null
    private var acceptJob: Job? = null

    val connections = MutableStateFlow<List<TCPConnection>>(emptyList())
    var onNewConnection: ((TCPConnection) -> Unit)? = null
    var onConnectionClosed: ((TCPConnection) -> Unit)? = null

    fun start(): Boolean {
        return try {
            serverSocket = ServerSocket(port, 5, InetAddress.getByName(host))
            serverSocket?.soTimeout = 1000
            acceptJob = scope.launch { acceptLoop() }
            true
        } catch (e: Exception) {
            e.printStackTrace()
            false
        }
    }

    fun stop() {
        acceptJob?.cancel()
        acceptJob = null

        try {
            serverSocket?.close()
        } catch (e: Exception) {
            e.printStackTrace()
        }
        serverSocket = null

        connections.value.forEach { it.stop() }
        connections.value = emptyList()
        scope.cancel()
    }

    private suspend fun acceptLoop() {
        while (isActive) {
            try {
                val clientSocket = withContext(Dispatchers.IO) { serverSocket?.accept() } ?: continue
                val conn = TCPConnection(
                    clientSocket,
                    InetSocketAddress(clientSocket.inetAddress, clientSocket.port)
                )

                conn.onDisconnect = {
                    val current = connections.value.toMutableList()
                    current.remove(conn)
                    connections.value = current
                    onConnectionClosed?.invoke(conn)
                }

                conn.start()

                val current = connections.value.toMutableList()
                current.add(conn)
                connections.value = current

                onNewConnection?.invoke(conn)
            } catch (e: SocketTimeoutException) {
                continue
            } catch (e: Exception) {
                if (e.message?.contains("Socket closed") != true) {
                    e.printStackTrace()
                }
                break
            }
        }
    }

    suspend fun broadcastFrame(frameData: ByteArray) {
        connections.value.forEach { conn ->
            if (conn.authenticated) {
                conn.sendFrame(frameData)
            }
        }
    }
}

class TCPClient {
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    var connection: TCPConnection? = null

    var onConnected: (() -> Unit)? = null
    var onConnectionFailed: ((String) -> Unit)? = null
    var onMessage: ((String, ByteArray) -> Unit)? = null
    var onDisconnected: (() -> Unit)? = null

    fun connect(host: String, port: Int, password: String = "", deviceInfo: DeviceInfo? = null) {
        scope.launch {
            try {
                val socket = withContext(Dispatchers.IO) {
                    Socket().apply {
                        connect(InetSocketAddress(host, port), 5000)
                    }
                }

                val conn = TCPConnection(socket, InetSocketAddress(host, port))
                conn.deviceInfo = deviceInfo

                conn.onMessage = { msgType, payload ->
                    this@TCPClient.onMessage?.invoke(msgType, payload)
                }

                conn.onDisconnect = {
                    this@TCPClient.connection = null
                    this@TCPClient.onDisconnected?.invoke()
                }

                conn.start()
                connection = conn

                val helloJson = JSONObject().apply {
                    put("password", password)
                    deviceInfo?.let { put("device", it.toJson()) }
                }
                conn.send(Protocol.MSG_TYPE_HELLO, helloJson.toString().toByteArray(Charsets.UTF_8))

                withContext(Dispatchers.Main) { onConnected?.invoke() }

            } catch (e: Exception) {
                e.printStackTrace()
                withContext(Dispatchers.Main) { onConnectionFailed?.invoke(e.message ?: "Unknown error") }
            }
        }
    }

    fun disconnect() {
        scope.launch {
            connection?.send(Protocol.MSG_TYPE_DISCONNECT)
            delay(100)
            connection?.stop()
            connection = null
        }
    }

    suspend fun send(msgType: String, payload: ByteArray = byteArrayOf()): Boolean {
        return connection?.send(msgType, payload) ?: false
    }

    suspend fun sendFrame(frameData: ByteArray): Boolean {
        return connection?.sendFrame(frameData) ?: false
    }

    suspend fun sendTouchEvent(touchData: Map<String, Any>): Boolean {
        return connection?.sendTouchEvent(touchData) ?: false
    }

    fun destroy() {
        disconnect()
        scope.cancel()
    }
}
