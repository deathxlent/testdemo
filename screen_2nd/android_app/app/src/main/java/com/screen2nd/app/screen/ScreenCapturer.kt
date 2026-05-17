package com.screen2nd.app.screen

import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.PixelFormat
import android.hardware.display.DisplayManager
import android.hardware.display.VirtualDisplay
import android.media.Image
import android.media.ImageReader
import android.media.projection.MediaProjection
import android.media.projection.MediaProjectionManager
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.util.DisplayMetrics
import android.view.WindowManager
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import java.io.ByteArrayOutputStream

class ScreenCapturer(private val context: Context) {
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())
    private var mediaProjection: MediaProjection? = null
    private var virtualDisplay: VirtualDisplay? = null
    private var imageReader: ImageReader? = null
    private var captureJob: Job? = null

    private val _isCapturing = MutableStateFlow(false)
    val isCapturing: StateFlow<Boolean> = _isCapturing

    var onFrame: ((ByteArray, Pair<Int, Int>) -> Unit)? = null
    var fps: Int = 30
    var quality: Int = 60

    private var screenWidth = 0
    private var screenHeight = 0
    private var screenDensity = 0

    private val mainHandler = Handler(Looper.getMainLooper())

    init {
        val metrics = DisplayMetrics()
        val windowManager = context.getSystemService(Context.WINDOW_SERVICE) as WindowManager
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            windowManager.currentWindowMetrics.getMetrics(metrics)
        } else {
            @Suppress("DEPRECATION")
            windowManager.defaultDisplay.getMetrics(metrics)
        }
        screenWidth = metrics.widthPixels
        screenHeight = metrics.heightPixels
        screenDensity = metrics.densityDpi
    }

    fun getScreenSize(): Pair<Int, Int> = screenWidth to screenHeight

    fun start(resultCode: Int, data: Intent) {
        if (_isCapturing.value) return

        val projectionManager = context.getSystemService(Context.MEDIA_PROJECTION_SERVICE) as MediaProjectionManager
        mediaProjection = projectionManager.getMediaProjection(resultCode, data)

        imageReader = ImageReader.newInstance(
            screenWidth,
            screenHeight,
            PixelFormat.RGBA_8888,
            2
        )

        imageReader?.setOnImageAvailableListener({ reader ->
            try {
                val image = reader.acquireLatestImage() ?: return@setOnImageAvailableListener
                processImage(image)
                image.close()
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }, mainHandler)

        virtualDisplay = mediaProjection?.createVirtualDisplay(
            "ScreenCapture",
            screenWidth,
            screenHeight,
            screenDensity,
            DisplayManager.VIRTUAL_DISPLAY_FLAG_AUTO_MIRROR,
            imageReader?.surface,
            null,
            null
        )

        _isCapturing.value = true
    }

    private fun processImage(image: Image) {
        try {
            val planes = image.planes
            val buffer = planes[0].buffer
            val pixelStride = planes[0].pixelStride
            val rowStride = planes[0].rowStride
            val rowPadding = rowStride - pixelStride * screenWidth

            val bitmap = Bitmap.createBitmap(
                screenWidth + rowPadding / pixelStride,
                screenHeight,
                Bitmap.Config.ARGB_8888
            )
            bitmap.copyPixelsFromBuffer(buffer)

            val croppedBitmap = Bitmap.createBitmap(bitmap, 0, 0, screenWidth, screenHeight)

            val outputStream = ByteArrayOutputStream()
            croppedBitmap.compress(Bitmap.CompressFormat.JPEG, quality, outputStream)
            val frameData = outputStream.toByteArray()

            onFrame?.invoke(frameData, screenWidth to screenHeight)

            bitmap.recycle()
            croppedBitmap.recycle()
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    fun stop() {
        captureJob?.cancel()
        captureJob = null

        virtualDisplay?.release()
        virtualDisplay = null

        imageReader?.close()
        imageReader = null

        mediaProjection?.stop()
        mediaProjection = null

        _isCapturing.value = false
    }

    fun destroy() {
        stop()
        scope.cancel()
    }
}
