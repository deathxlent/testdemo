package com.screen2nd.app.screen

import android.content.Context
import android.graphics.*
import android.util.AttributeSet
import android.view.MotionEvent
import android.view.View
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class FrameDisplayView @JvmOverloads constructor(
    context: Context,
    attrs: AttributeSet? = null,
    defStyleAttr: Int = 0
) : View(context, attrs, defStyleAttr) {

    private var currentBitmap: Bitmap? = null
    private val paint = Paint(Paint.ANTI_ALIAS_FLAG)
    private val touchPoints = mutableListOf<TouchPoint>()
    private val touchPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.parseColor("#40FF0000")
        style = Paint.Style.FILL
    }
    private val touchPaintBorder = Paint(Paint.ANTI_ALIAS_FLAG).apply {
        color = Color.parseColor("#FFFF0000")
        style = Paint.Style.STROKE
        strokeWidth = 2f
    }

    private var frameWidth = 0
    private var frameHeight = 0
    private var scaledRect = RectF()

    var onTouchEvent: ((Map<String, Any>) -> Unit)? = null
    var showTouchIndicator = true

    data class TouchPoint(
        val x: Float,
        val y: Float,
        val action: String,
        val timestamp: Long = System.currentTimeMillis()
    )

    fun updateFrame(frameData: ByteArray) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                val bitmap = BitmapFactory.decodeByteArray(frameData, 0, frameData.size)
                if (bitmap != null) {
                    frameWidth = bitmap.width
                    frameHeight = bitmap.height
                    withContext(Dispatchers.Main) {
                        currentBitmap?.recycle()
                        currentBitmap = bitmap
                        updateScaledRect()
                        invalidate()
                    }
                }
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    private fun updateScaledRect() {
        if (frameWidth == 0 || frameHeight == 0) return

        val viewWidth = width.toFloat()
        val viewHeight = height.toFloat()

        val scaleX = viewWidth / frameWidth
        val scaleY = viewHeight / frameHeight
        val scale = minOf(scaleX, scaleY)

        val drawWidth = frameWidth * scale
        val drawHeight = frameHeight * scale

        val left = (viewWidth - drawWidth) / 2
        val top = (viewHeight - drawHeight) / 2

        scaledRect = RectF(left, top, left + drawWidth, top + drawHeight)
    }

    override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
        super.onSizeChanged(w, h, oldw, oldh)
        updateScaledRect()
    }

    override fun onDraw(canvas: Canvas) {
        super.onDraw(canvas)

        canvas.drawColor(Color.BLACK)

        currentBitmap?.let { bitmap ->
            if (!scaledRect.isEmpty) {
                canvas.drawBitmap(bitmap, null, scaledRect, paint)
            }
        }

        if (showTouchIndicator) {
            val now = System.currentTimeMillis()
            touchPoints.removeAll { now - it.timestamp > 500 }

            for (point in touchPoints) {
                val radius = 30f
                val alpha = maxOf(0f, 1f - (now - point.timestamp) / 500f)
                touchPaint.alpha = (alpha * 64).toInt()
                touchPaintBorder.alpha = (alpha * 255).toInt()
                canvas.drawCircle(point.x, point.y, radius, touchPaint)
                canvas.drawCircle(point.x, point.y, radius, touchPaintBorder)
            }
        }
    }

    override fun onTouchEvent(event: MotionEvent): Boolean {
        val action = when (event.actionMasked) {
            MotionEvent.ACTION_DOWN -> "down"
            MotionEvent.ACTION_MOVE -> "move"
            MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> "up"
            else -> return super.onTouchEvent(event)
        }

        val x = event.x
        val y = event.y

        if (showTouchIndicator) {
            touchPoints.add(TouchPoint(x, y, action))
            invalidate()
        }

        if (!scaledRect.isEmpty && scaledRect.contains(x, y)) {
            val relX = (x - scaledRect.left) / scaledRect.width()
            val relY = (y - scaledRect.top) / scaledRect.height()

            val touchData = mapOf(
                "action" to action,
                "x" to relX.toDouble(),
                "y" to relY.toDouble(),
                "screen_width" to frameWidth,
                "screen_height" to frameHeight
            )
            onTouchEvent?.invoke(touchData)
        }

        return true
    }

    fun showRemoteTouch(relX: Float, relY: Float, action: String) {
        if (!scaledRect.isEmpty) {
            val x = scaledRect.left + relX * scaledRect.width()
            val y = scaledRect.top + relY * scaledRect.height()
            touchPoints.add(TouchPoint(x, y, action))
            invalidate()
        }
    }

    fun clear() {
        currentBitmap?.recycle()
        currentBitmap = null
        touchPoints.clear()
        invalidate()
    }
}
