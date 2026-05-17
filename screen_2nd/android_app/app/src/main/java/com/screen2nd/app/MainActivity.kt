package com.screen2nd.app

import android.content.Intent
import android.media.projection.MediaProjectionManager
import android.os.Build
import android.os.Bundle
import android.view.View
import android.view.WindowInsets
import android.view.WindowInsetsController
import android.widget.*
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.screen2nd.app.network.*
import com.screen2nd.app.screen.FrameDisplayView
import com.screen2nd.app.screen.ScreenCapturer
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch
import org.json.JSONObject
import kotlin.text.Charsets

class MainActivity : AppCompatActivity() {

    private lateinit var discovery: NetworkDiscovery
    private var server: TCPServer? = null
    private var client: TCPClient? = null
    private var screenCapturer: ScreenCapturer? = null

    private lateinit var btnServer: Button
    private lateinit var btnClient: Button
    private lateinit var btnDisconnect: Button
    private lateinit var deviceList: ListView
    private lateinit var statusText: TextView
    private lateinit var frameDisplay: FrameDisplayView
    private lateinit var modeContainer: FrameLayout
    private lateinit var listContainer: LinearLayout

    private var isServerMode = false
    private var serverPassword = ""
    private var selectedDevice: DeviceInfo? = null
    private val deviceListAdapter = mutableListOf<DeviceInfo>()

    private val REQUEST_SCREEN_CAPTURE = 1001

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        initViews()
        initDiscovery()
        setupListeners()
    }

    private fun initViews() {
        btnServer = findViewById(R.id.btnServer)
        btnClient = findViewById(R.id.btnClient)
        btnDisconnect = findViewById(R.id.btnDisconnect)
        deviceList = findViewById(R.id.deviceList)
        statusText = findViewById(R.id.statusText)
        frameDisplay = findViewById(R.id.frameDisplay)
        modeContainer = findViewById(R.id.modeContainer)
        listContainer = findViewById(R.id.listContainer)

        deviceList.adapter = object : ArrayAdapter<DeviceInfo>(
            this,
            android.R.layout.simple_list_item_2,
            android.R.id.text1,
            deviceListAdapter
        ) {
            override fun getView(position: Int, convertView: View?, parent: android.view.ViewGroup): View {
                val view = super.getView(position, convertView, parent)
                val device = deviceListAdapter[position]
                val text1 = view.findViewById<TextView>(android.R.id.text1)
                val text2 = view.findViewById<TextView>(android.R.id.text2)

                val icon = if (device.platform == Protocol.PLATFORM_ANDROID) "📱" else "🖥️"
                val lock = if (device.hasPassword) " 🔒" else ""
                text1.text = "$icon ${device.deviceName}$lock"
                text2.text = device.ip
                return view
            }
        }
    }

    private fun initDiscovery() {
        discovery = NetworkDiscovery(this)
        discovery.start()

        lifecycleScope.launch {
            discovery.discoveredDevices.collectLatest { devices ->
                deviceListAdapter.clear()
                deviceListAdapter.addAll(devices)
                (deviceList.adapter as ArrayAdapter<*>).notifyDataSetChanged()
            }
        }
    }

    private fun setupListeners() {
        btnServer.setOnClickListener {
            toggleServerMode()
        }

        btnClient.setOnClickListener {
            toggleClientMode()
        }

        btnDisconnect.setOnClickListener {
            disconnect()
        }

        deviceList.onItemClickListener = AdapterView.OnItemClickListener { _, _, position, _ ->
            selectedDevice = deviceListAdapter[position]
            if (!isServerMode) {
                showPasswordDialog(false)
            }
        }

        frameDisplay.onTouchEvent = { touchData ->
            lifecycleScope.launch {
                client?.sendTouchEvent(touchData)
            }
        }
    }

    private fun toggleServerMode() {
        if (isServerMode) {
            stopServer()
            isServerMode = false
            btnServer.isSelected = false
            btnClient.isEnabled = true
            statusText.text = "当前: 空闲模式"
        } else {
            showPasswordDialog(true)
        }
    }

    private fun showPasswordDialog(isServer: Boolean) {
        val dialogView = layoutInflater.inflate(R.layout.dialog_password, null)
        val passwordEdit = dialogView.findViewById<EditText>(R.id.passwordEdit)
        val confirmEdit = dialogView.findViewById<EditText>(R.id.confirmEdit)

        if (!isServer) {
            confirmEdit.visibility = View.GONE
        }

        AlertDialog.Builder(this)
            .setTitle(if (isServer) "设置服务器密码" else "连接服务器")
            .setView(dialogView)
            .setPositiveButton("确定") { _, _ ->
                val password = passwordEdit.text.toString()
                if (isServer) {
                    val confirm = confirmEdit.text.toString()
                    if (password.isEmpty()) {
                        Toast.makeText(this, "密码不能为空", Toast.LENGTH_SHORT).show()
                        return@setPositiveButton
                    }
                    if (password != confirm) {
                        Toast.makeText(this, "两次输入的密码不一致", Toast.LENGTH_SHORT).show()
                        return@setPositiveButton
                    }
                    serverPassword = password
                    startServer()
                } else {
                    selectedDevice?.let { connectToServer(it, password) }
                }
            }
            .setNegativeButton("取消", null)
            .show()
    }

    private fun startServer() {
        server = TCPServer()
        if (server?.start() == true) {
            isServerMode = true
            btnServer.isSelected = true
            btnClient.isEnabled = false
            btnDisconnect.isEnabled = true
            statusText.text = "当前: 服务器模式"
            discovery.hasPassword = true
            discovery.mode = Protocol.MODE_DISPLAY

            server?.onNewConnection = { conn ->
                conn.onMessage = { msgType, payload ->
                    handleServerMessage(conn, msgType, payload)
                }
                runOnUiThread {
                    statusText.text = "客户端连接: ${conn.addr.hostString}"
                }
            }

            server?.onConnectionClosed = {
                runOnUiThread {
                    statusText.text = "当前: 服务器模式 (等待连接)"
                }
            }

            requestScreenCapture()
        } else {
            Toast.makeText(this, "无法启动服务器", Toast.LENGTH_SHORT).show()
            server = null
        }
    }

    private fun requestScreenCapture() {
        val projectionManager = getSystemService(MEDIA_PROJECTION_SERVICE) as MediaProjectionManager
        startActivityForResult(projectionManager.createScreenCaptureIntent(), REQUEST_SCREEN_CAPTURE)
    }

    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        if (requestCode == REQUEST_SCREEN_CAPTURE && resultCode == RESULT_OK && data != null) {
            startScreenCapture(resultCode, data)
        }
    }

    private fun startScreenCapture(resultCode: Int, data: Intent) {
        screenCapturer = ScreenCapturer(this)
        screenCapturer?.onFrame = { frameData, size ->
            lifecycleScope.launch {
                server?.broadcastFrame(frameData)
            }
            runOnUiThread {
                frameDisplay.updateFrame(frameData)
            }
        }
        screenCapturer?.start(resultCode, data)

        listContainer.visibility = View.GONE
        frameDisplay.visibility = View.VISIBLE
    }

    private fun stopServer() {
        screenCapturer?.destroy()
        screenCapturer = null
        server?.stop()
        server = null
        discovery.hasPassword = false
        discovery.mode = Protocol.MODE_IDLE
        btnDisconnect.isEnabled = false

        frameDisplay.clear()
        frameDisplay.visibility = View.GONE
        listContainer.visibility = View.VISIBLE
    }

    private fun handleServerMessage(conn: TCPConnection, msgType: String, payload: ByteArray) {
        when (msgType) {
            Protocol.MSG_TYPE_HELLO -> {
                try {
                    val json = JSONObject(String(payload, Charsets.UTF_8))
                    val clientPassword = json.optString("password", "")

                    if (serverPassword.isNotEmpty() && clientPassword != serverPassword) {
                        val response = JSONObject().apply {
                            put("success", false)
                            put("error", "密码错误")
                        }
                        lifecycleScope.launch {
                            conn.send(Protocol.MSG_TYPE_PASSWORD_ACK, response.toString().toByteArray())
                            conn.stop()
                        }
                        return
                    }

                    conn.authenticated = true
                    val deviceJson = json.optJSONObject("device")
                    if (deviceJson != null) {
                        conn.deviceInfo = DeviceInfo.fromJson(deviceJson)
                    }

                    val response = JSONObject().apply { put("success", true) }
                    lifecycleScope.launch {
                        conn.send(Protocol.MSG_TYPE_PASSWORD_ACK, response.toString().toByteArray())
                    }
                } catch (e: Exception) {
                    e.printStackTrace()
                }
            }
            Protocol.MSG_TYPE_TOUCH -> {
                try {
                    val json = JSONObject(String(payload, Charsets.UTF_8))
                    val relX = json.optDouble("x", 0.0).toFloat()
                    val relY = json.optDouble("y", 0.0).toFloat()
                    val action = json.optString("action", "")
                    runOnUiThread {
                        frameDisplay.showRemoteTouch(relX, relY, action)
                    }
                } catch (e: Exception) {
                    e.printStackTrace()
                }
            }
        }
    }

    private fun toggleClientMode() {
        if (client != null) {
            disconnect()
        } else {
            if (selectedDevice == null) {
                Toast.makeText(this, "请先选择一个设备", Toast.LENGTH_SHORT).show()
            }
        }
    }

    private fun connectToServer(device: DeviceInfo, password: String) {
        client = TCPClient()
        client?.onConnected = {
            runOnUiThread {
                btnClient.isSelected = true
                btnServer.isEnabled = false
                btnDisconnect.isEnabled = true
                statusText.text = "已连接到: ${device.deviceName}"
                listContainer.visibility = View.GONE
                frameDisplay.visibility = View.VISIBLE
                enterFullScreen()
            }
        }
        client?.onConnectionFailed = { error ->
            runOnUiThread {
                Toast.makeText(this, "连接失败: $error", Toast.LENGTH_SHORT).show()
                client = null
            }
        }
        client?.onDisconnected = {
            runOnUiThread {
                btnClient.isSelected = false
                btnServer.isEnabled = true
                btnDisconnect.isEnabled = false
                statusText.text = "已断开连接"
                frameDisplay.clear()
                frameDisplay.visibility = View.GONE
                listContainer.visibility = View.VISIBLE
                exitFullScreen()
                client = null
            }
        }
        client?.onMessage = { msgType, payload ->
            handleClientMessage(msgType, payload)
        }

        client?.connect(device.ip, device.tcpPort, password, discovery.getDeviceInfo())
    }

    private fun handleClientMessage(msgType: String, payload: ByteArray) {
        when (msgType) {
            Protocol.MSG_TYPE_FRAME -> {
                try {
                    val frameData = FrameCompressor.decompress(payload)
                    runOnUiThread {
                        frameDisplay.updateFrame(frameData)
                    }
                } catch (e: Exception) {
                    e.printStackTrace()
                }
            }
            Protocol.MSG_TYPE_PASSWORD_ACK -> {
                try {
                    val json = JSONObject(String(payload, Charsets.UTF_8))
                    if (!json.optBoolean("success", false)) {
                        val error = json.optString("error", "认证失败")
                        runOnUiThread {
                            Toast.makeText(this, error, Toast.LENGTH_SHORT).show()
                            disconnect()
                        }
                    }
                } catch (e: Exception) {
                    e.printStackTrace()
                }
            }
        }
    }

    private fun disconnect() {
        if (isServerMode) {
            stopServer()
            isServerMode = false
            btnServer.isSelected = false
            btnClient.isEnabled = true
            statusText.text = "当前: 空闲模式"
        } else {
            client?.disconnect()
            client?.destroy()
            client = null
        }
    }

    private fun enterFullScreen() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            window.insetsController?.let { controller ->
                controller.hide(WindowInsets.Type.systemBars())
                controller.systemBarsBehavior = WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
            }
        } else {
            @Suppress("DEPRECATION")
            window.decorView.systemUiVisibility = (
                View.SYSTEM_UI_FLAG_FULLSCREEN
                or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                or View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
            )
        }
    }

    private fun exitFullScreen() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            window.insetsController?.show(WindowInsets.Type.systemBars())
        } else {
            @Suppress("DEPRECATION")
            window.decorView.systemUiVisibility = View.SYSTEM_UI_FLAG_VISIBLE
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        disconnect()
        discovery.destroy()
    }
}
