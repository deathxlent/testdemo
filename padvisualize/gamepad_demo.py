import sys
from PySide6.QtWidgets import QApplication, QWidget
from PySide6.QtGui import QPainter, QPen, QBrush, QFont, QColor, QPainterPath
from PySide6.QtCore import Qt, QRectF

class ControllerWidget(QWidget):
    def __init__(self):
        super().__init__()
        # 设置窗口大小，保持 SVG 的宽高比 (441:383)
        self.resize(882, 766)
        self.setWindowTitle("PySide6 Controller SVG Render")
        
        # 定义颜色 (默认使用浅色模式颜色)
        self.colors = {
            "body_fill": QColor("#f5f5f4"),      # stone-100
            "body_stroke": QColor("#d6d3d1"),     # stone-300
            "btn_fill": QColor("#e7e5e4"),        # stone-200
            "btn_stroke": QColor("#d6d3d1"),      # stone-300
            "stick_base": QColor("#fafaf9"),      # stone-50
            "stick_head": QColor("#d6d3d1"),      # stone-300
            "text": QColor("#a8a29e"),            # stone-400
            "white_text": QColor("#ffffff"),
            "line": QColor("#e7e5e4")             # stone-200
        }

    def paintEvent(self, event):
        painter = QPainter(self)
        painter.setRenderHint(QPainter.Antialiasing)
        
        # 缩放以适应窗口大小
        scale_x = self.width() / 441.0
        scale_y = self.height() / 383.0
        painter.scale(scale_x, scale_y)

        # 设置通用画笔和画刷
        pen = QPen()
        pen.setCapStyle(Qt.RoundCap)
        pen.setJoinStyle(Qt.RoundJoin)

        # --- 1. 绘制手柄主体 (左右两部分) ---
        # 左手柄
        path_left = QPainterPath()
        path_left.moveTo(220.5, 294.5)
        path_left.cubicTo(195, 294.5, 150, 294.5, 150, 294.5)
        path_left.cubicTo(105, 294.5, 81.5, 378.5, 49.5, 378.5)
        path_left.cubicTo(17.5, 378.5, 4, 363.9, 4, 317.5)
        path_left.cubicTo(4, 271.1, 43.5, 165.5, 55, 137.5)
        path_left.cubicTo(66.5, 109.5, 95.5, 92.0001, 128, 92.0001)
        path_left.cubicTo(154, 92.0001, 200.5, 92.0001, 220.5, 92.0001)
        
        pen.setColor(self.colors["body_stroke"])
        pen.setWidth(3)
        painter.setPen(pen)
        painter.setBrush(self.colors["body_fill"])
        painter.drawPath(path_left)

        # 右手柄
        path_right = QPainterPath()
        path_right.moveTo(220, 294.5)
        path_right.cubicTo(245.5, 294.5, 290.5, 294.5, 290.5, 294.5)
        path_right.cubicTo(335.5, 294.5, 359, 378.5, 391, 378.5)
        path_right.cubicTo(423, 378.5, 436.5, 363.9, 436.5, 317.5)
        path_right.cubicTo(436.5, 271.1, 397, 165.5, 385.5, 137.5)
        path_right.cubicTo(374, 109.5, 345, 92.0001, 312.5, 92.0001)
        path_right.cubicTo(286.5, 92.0001, 240, 92.0001, 220, 92.0001)
        
        painter.drawPath(path_right)

        # --- 2. 顶部肩键 (L1/R1) ---
        self.draw_rounded_rect(painter, 116.8, 66.8, 43.3, 17, 6.5, self.colors["btn_fill"], self.colors["btn_stroke"])
        self.draw_text(painter, 138.5, 79, "LB", self.colors["text"], 10, True)
        
        self.draw_rounded_rect(painter, 281.3, 67, 42.6, 17, 6.5, self.colors["btn_fill"], self.colors["btn_stroke"])
        self.draw_text(painter, 302.5, 79, "RB", self.colors["text"], 10, True)

        # --- 3. 顶部扳机键 (L2/R2) ---
        # 左扳机
        path_l2 = QPainterPath()
        # 注意：SVG中的 c 是相对坐标，这里转换为绝对坐标逻辑绘制
        path_l2.moveTo(152.5, 52.97)
        path_l2.cubicTo(152.5, 57.59, 149.14, 61.33, 145, 61.33)
        path_l2.lineTo(132, 61.33)
        path_l2.cubicTo(127.86, 61.33, 124.5, 57.59, 124.5, 52.97)
        path_l2.lineTo(124.5, 30.11)
        path_l2.cubicTo(124.5, 21.49, 130.77, 14.5, 138.5, 14.5)
        path_l2.cubicTo(146.23, 14.5, 152.5, 21.49, 152.5, 30.11)
        path_l2.closeSubpath()
        painter.drawPath(path_l2)

        # 右扳机
        path_r2 = QPainterPath()
        path_r2.moveTo(316.83, 53.44)
        path_r2.cubicTo(316.83, 58.07, 313.39, 61.83, 309.15, 61.83)
        path_r2.lineTo(295.84, 61.83)
        path_r2.cubicTo(291.6, 61.83, 288.16, 58.07, 288.16, 53.44)
        path_r2.lineTo(288.16, 30.5)
        path_r2.cubicTo(288.16, 21.85, 294.58, 14.83, 302.5, 14.83)
        path_r2.cubicTo(310.41, 14.83, 316.83, 21.85, 316.83, 30.5)
        path_r2.closeSubpath()
        painter.drawPath(path_r2)

        # --- 4. 摇杆 (Joysticks) ---
        # 左摇杆 (上方)
        self.draw_joystick(painter, 113, 160)
        # 右摇杆 (下方)
        self.draw_joystick(painter, 278, 238)

        # --- 5. 方向键 (D-Pad) ---
        dpad_x, dpad_y = 166, 238
        # 底座
        painter.setBrush(self.colors["stick_base"])
        painter.setPen(QPen(self.colors["btn_stroke"], 2))
        painter.drawEllipse(QRectF(dpad_x - 37.5, dpad_y - 37.5, 75, 75))
        
        # 十字形状
        painter.setBrush(self.colors["btn_fill"])
        painter.setPen(Qt.NoPen)
        # 上
        painter.drawRect(QRectF(159, 211, 14, 20))
        # 下
        painter.drawRect(QRectF(159, 244, 14, 20))
        # 左 (旋转矩形)
        painter.save()
        painter.translate(149, 238)
        painter.rotate(-90)
        painter.drawRect(QRectF(-7, -10, 14, 20)) # 调整坐标以适应旋转中心
        painter.restore()
        # 右
        painter.save()
        painter.translate(183, 238)
        painter.rotate(-90)
        painter.drawRect(QRectF(-7, -10, 14, 20))
        painter.restore()
        # 中心
        painter.drawRect(QRectF(159, 228, 14, 19))

        # --- 6. 功能键 (ABXY) ---
        abxy_x, abxy_y = 329, 160
        # 底座
        painter.setBrush(self.colors["stick_base"])
        painter.setPen(QPen(self.colors["btn_stroke"], 2))
        painter.drawEllipse(QRectF(abxy_x - 37.5, abxy_y - 37.5, 75, 75))

        # 按钮 Y (上)
        painter.setBrush(self.colors["btn_fill"])
        painter.drawEllipse(QRectF(abxy_x - 13, 140 - 13, 26, 26))
        self.draw_text(painter, abxy_x, 144, "Y", self.colors["white_text"], 12, True)

        # 按钮 X (左)
        painter.drawEllipse(QRectF(310 - 13, 162 - 13, 26, 26))
        self.draw_text(painter, 310, 166, "X", self.colors["white_text"], 12, True)

        # 按钮 B (右)
        painter.drawEllipse(QRectF(348 - 13, 161 - 13, 26, 26))
        self.draw_text(painter, 348, 165, "B", self.colors["white_text"], 12, True)

        # 按钮 A (下)
        painter.drawEllipse(QRectF(330 - 13, 181 - 13, 26, 26))
        self.draw_text(painter, 330, 185, "A", self.colors["white_text"], 12, True)

        # --- 7. 中间小按钮 (Select/Start/Menu) ---
        # Select (左侧条纹)
        painter.setBrush(self.colors["btn_fill"])
        painter.drawEllipse(QRectF(188 - 10, 162 - 10, 20, 20))
        pen.setColor(QColor("#9ca3af")) # stone-400
        pen.setWidth(1.5)
        painter.setPen(pen)
        painter.drawRect(QRectF(184, 159, 8, 6))

        # Start (右侧条纹)
        painter.setBrush(self.colors["btn_fill"])
        pen.setJoinStyle(Qt.MiterJoin)
        painter.setPen(Qt.NoPen)
        painter.drawEllipse(QRectF(253 - 10, 162 - 10, 20, 20))
        pen.setColor(QColor("#9ca3af"))
        pen.setWidth(1.5)
        painter.setPen(pen)
        painter.drawLine(248, 158, 258, 158)
        painter.drawLine(248, 162, 258, 162)
        painter.drawLine(248, 166, 258, 166)

        # Menu (中间汉堡图标)
        painter.setBrush(self.colors["btn_fill"])
        painter.setPen(Qt.NoPen)
        painter.drawRoundedRect(QRectF(211.5, 153, 18, 18), 9, 9)
        
        pen.setColor(QColor("#9ca3af"))
        pen.setWidth(1.5)
        pen.setCapStyle(Qt.RoundCap)
        painter.setPen(pen)
        # 绘制汉堡图标路径
        path_menu = QPainterPath()
        path_menu.moveTo(220.5, 158)
        path_menu.lineTo(220.5, 164)
        path_menu.moveTo(218, 160.5)
        path_menu.lineTo(220.5, 158)
        path_menu.lineTo(223, 160.5)
        path_menu.moveTo(218, 166)
        path_menu.lineTo(223, 166)
        painter.drawPath(path_menu)

        # Home (顶部盾牌图标)
        painter.setBrush(self.colors["body_fill"])
        pen.setColor(self.colors["body_stroke"])
        pen.setWidth(2)
        painter.setPen(pen)
        painter.drawEllipse(QRectF(220.5 - 14, 125 - 14, 28, 28))
        
        pen.setColor(QColor("#d6d3d1"))
        pen.setWidth(1.5)
        painter.setPen(pen)
        path_home = QPainterPath()
        path_home.moveTo(215.5, 125)
        path_home.lineTo(220.5, 120)
        path_home.lineTo(225.5, 125)
        path_home.lineTo(225.5, 130)
        path_home.lineTo(215.5, 130)
        path_home.closeSubpath()
        painter.drawPath(path_home)

    def draw_joystick(self, painter, cx, cy):
        # 底座
        painter.setBrush(self.colors["stick_base"])
        painter.setPen(QPen(self.colors["btn_stroke"], 2))
        painter.drawEllipse(QRectF(cx - 37.5, cy - 37.5, 75, 75))
        
        # 摇杆头
        painter.setBrush(self.colors["stick_head"])
        painter.setPen(QPen(Qt.white, 2))
        painter.drawEllipse(QRectF(cx - 28, cy - 28, 56, 56))
        
        # 装饰圈
        painter.setBrush(Qt.NoBrush)
        pen = QPen(QColor(0, 0, 0, 12), 2) # black/5
        painter.setPen(pen)
        painter.drawEllipse(QRectF(cx - 22, cy - 22, 44, 44))

    def draw_rounded_rect(self, painter, x, y, w, h, r, brush_color, pen_color):
        painter.setBrush(brush_color)
        painter.setPen(QPen(pen_color, 2))
        painter.drawRoundedRect(QRectF(x, y, w, h), r, r)

    def draw_text(self, painter, x, y, text, color, size, bold):
        font = QFont()
        font.setPixelSize(size)
        font.setBold(bold)
        painter.setFont(font)
        painter.setPen(color)
        # 简单的居中对齐修正
        fm = painter.fontMetrics()
        text_width = fm.horizontalAdvance(text)
        painter.drawText(int(x - text_width / 2), int(y), text)

if __name__ == "__main__":
    app = QApplication(sys.argv)
    widget = ControllerWidget()
    widget.show()
    sys.exit(app.exec())