from PySide6.QtWidgets import QWidget
from PySide6.QtGui import QPainter, QPen, QColor, QBrush, QPainterPath, QFont
from PySide6.QtCore import Qt, QRectF, QPointF


class GamepadWidget(QWidget):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setAttribute(Qt.WA_TranslucentBackground)
        self.gamepad_state = None
        self.width = 260
        self.height = int(260 * 383.0 / 441.0)
        self.setFixedSize(self.width, self.height)
        
        self.line_color = QColor(0, 0, 0, 200)
        self.pressed_fill = QColor(60, 60, 60, 150)
        self.show_stats = False
        self.stats_data = {}
        
        self.scale = self.width / 441.0

    def set_gamepad_state(self, state):
        self.gamepad_state = state
        self.update()

    def show_statistics(self, stats):
        self.stats_data = stats
        self.show_stats = True
        self.update()

    def hide_statistics(self):
        self.show_stats = False
        self.stats_data = {}
        self.update()

    def s(self, val):
        return val * self.scale

    def paintEvent(self, event):
        if self.show_stats:
            self.paint_statistics(event)
        else:
            self.paint_gamepad(event)

    def paint_statistics(self, event):
        painter = QPainter(self)
        painter.setRenderHint(QPainter.Antialiasing)
        
        bg_color = QColor(255, 255, 255, 240)
        painter.setBrush(bg_color)
        painter.setPen(Qt.NoPen)
        painter.drawRoundedRect(0, 0, self.width, self.height, 10, 10)
        
        painter.setPen(QColor(0, 0, 0, 200))
        font = QFont()
        font.setPixelSize(12)
        font.setBold(True)
        painter.setFont(font)
        painter.drawText(QRectF(0, 10, self.width, 20), Qt.AlignCenter, "按键统计")
        
        font.setPixelSize(10)
        font.setBold(False)
        painter.setFont(font)
        
        y_pos = 35
        line_height = 16
        
        for key, count in self.stats_data.items():
            text = f"{key}: {count}"
            painter.drawText(QRectF(20, y_pos, self.width - 40, line_height), Qt.AlignLeft, text)
            y_pos += line_height

    def paint_gamepad(self, event):
        painter = QPainter(self)
        painter.setRenderHint(QPainter.Antialiasing)
        painter.setRenderHint(QPainter.SmoothPixmapTransform)

        pen = QPen(self.line_color)
        pen.setWidthF(1.5)
        pen.setCapStyle(Qt.RoundCap)
        pen.setJoinStyle(Qt.RoundJoin)
        painter.setPen(pen)
        painter.setBrush(Qt.NoBrush)

        self.draw_controller_body(painter)
        self.draw_lt_rt(painter)
        self.draw_lb_rb(painter)
        self.draw_left_stick(painter)
        self.draw_dpad(painter)
        self.draw_abxy_buttons(painter)
        self.draw_right_stick(painter)
        self.draw_menu_buttons(painter)

    def draw_controller_body(self, painter):
        pen = QPen(self.line_color)
        pen.setWidthF(2.0)
        painter.setPen(pen)
        
        path_left = QPainterPath()
        path_left.moveTo(self.s(220.5), self.s(294.5))
        path_left.cubicTo(self.s(195), self.s(294.5), self.s(150), self.s(294.5), self.s(150), self.s(294.5))
        path_left.cubicTo(self.s(105), self.s(294.5), self.s(81.5), self.s(378.5), self.s(49.5), self.s(378.5))
        path_left.cubicTo(self.s(17.5), self.s(378.5), self.s(4), self.s(363.9), self.s(4), self.s(317.5))
        path_left.cubicTo(self.s(4), self.s(271.1), self.s(43.5), self.s(165.5), self.s(55), self.s(137.5))
        path_left.cubicTo(self.s(66.5), self.s(109.5), self.s(95.5), self.s(92.0001), self.s(128), self.s(92.0001))
        path_left.cubicTo(self.s(154), self.s(92.0001), self.s(200.5), self.s(92.0001), self.s(220.5), self.s(92.0001))
        painter.drawPath(path_left)

        path_right = QPainterPath()
        path_right.moveTo(self.s(220), self.s(294.5))
        path_right.cubicTo(self.s(245.5), self.s(294.5), self.s(290.5), self.s(294.5), self.s(290.5), self.s(294.5))
        path_right.cubicTo(self.s(335.5), self.s(294.5), self.s(359), self.s(378.5), self.s(391), self.s(378.5))
        path_right.cubicTo(self.s(423), self.s(378.5), self.s(436.5), self.s(363.9), self.s(436.5), self.s(317.5))
        path_right.cubicTo(self.s(436.5), self.s(271.1), self.s(397), self.s(165.5), self.s(385.5), self.s(137.5))
        path_right.cubicTo(self.s(374), self.s(109.5), self.s(345), self.s(92.0001), self.s(312.5), self.s(92.0001))
        path_right.cubicTo(self.s(286.5), self.s(92.0001), self.s(240), self.s(92.0001), self.s(220), self.s(92.0001))
        painter.drawPath(path_right)

    def draw_lt_rt(self, painter):
        pen = QPen(self.line_color)
        pen.setWidthF(1.5)
        painter.setPen(pen)
        
        path_lt = QPainterPath()
        path_lt.moveTo(self.s(152.5), self.s(52.97))
        path_lt.cubicTo(self.s(152.5), self.s(57.59), self.s(149.14), self.s(61.33), self.s(145), self.s(61.33))
        path_lt.lineTo(self.s(132), self.s(61.33))
        path_lt.cubicTo(self.s(127.86), self.s(61.33), self.s(124.5), self.s(57.59), self.s(124.5), self.s(52.97))
        path_lt.lineTo(self.s(124.5), self.s(30.11))
        path_lt.cubicTo(self.s(124.5), self.s(21.49), self.s(130.77), self.s(14.5), self.s(138.5), self.s(14.5))
        path_lt.cubicTo(self.s(146.23), self.s(14.5), self.s(152.5), self.s(21.49), self.s(152.5), self.s(30.11))
        path_lt.closeSubpath()
        
        path_rt = QPainterPath()
        path_rt.moveTo(self.s(316.83), self.s(53.44))
        path_rt.cubicTo(self.s(316.83), self.s(58.07), self.s(313.39), self.s(61.83), self.s(309.15), self.s(61.83))
        path_rt.lineTo(self.s(295.84), self.s(61.83))
        path_rt.cubicTo(self.s(291.6), self.s(61.83), self.s(288.16), self.s(58.07), self.s(288.16), self.s(53.44))
        path_rt.lineTo(self.s(288.16), self.s(30.5))
        path_rt.cubicTo(self.s(288.16), self.s(21.85), self.s(294.58), self.s(14.83), self.s(302.5), self.s(14.83))
        path_rt.cubicTo(self.s(310.41), self.s(14.83), self.s(316.83), self.s(21.85), self.s(316.83), self.s(30.5))
        path_rt.closeSubpath()
        
        painter.drawPath(path_lt)
        painter.drawPath(path_rt)
        
        if self.gamepad_state and self.gamepad_state['connected']:
            lt_value = self.gamepad_state['triggers'].get('LT', 0)
            rt_value = self.gamepad_state['triggers'].get('RT', 0)
            
            if lt_value > 0.01:
                painter.setBrush(self.pressed_fill)
                painter.setPen(Qt.NoPen)
                painter.drawPath(path_lt)
            
            if rt_value > 0.01:
                painter.setBrush(self.pressed_fill)
                painter.setPen(Qt.NoPen)
                painter.drawPath(path_rt)
            
            painter.setPen(pen)
            painter.setBrush(Qt.NoBrush)

    def draw_lb_rb(self, painter):
        pen = QPen(self.line_color)
        pen.setWidthF(1.5)
        painter.setPen(pen)
        
        lb_rect = QRectF(self.s(116.8), self.s(66.8), self.s(43.3), self.s(17))
        rb_rect = QRectF(self.s(281.3), self.s(67), self.s(42.6), self.s(17))
        
        painter.drawRoundedRect(lb_rect, self.s(6.5), self.s(6.5))
        painter.drawRoundedRect(rb_rect, self.s(6.5), self.s(6.5))
        
        if self.gamepad_state and self.gamepad_state['connected']:
            if self.gamepad_state['buttons'].get('LB', False):
                painter.setBrush(self.pressed_fill)
                painter.setPen(Qt.NoPen)
                painter.drawRoundedRect(lb_rect, self.s(6.5), self.s(6.5))
            
            if self.gamepad_state['buttons'].get('RB', False):
                painter.setBrush(self.pressed_fill)
                painter.setPen(Qt.NoPen)
                painter.drawRoundedRect(rb_rect, self.s(6.5), self.s(6.5))
            
            painter.setPen(pen)
            painter.setBrush(Qt.NoBrush)

    def draw_left_stick(self, painter):
        cx, cy = self.s(113), self.s(160)
        outer_r = self.s(37.5)
        inner_r = self.s(28)
        
        painter.drawEllipse(QPointF(cx, cy), outer_r, outer_r)
        painter.drawEllipse(QPointF(cx, cy), inner_r, inner_r)
        
        stick_offset_x = 0
        stick_offset_y = 0
        
        if self.gamepad_state and self.gamepad_state['connected']:
            left = self.gamepad_state['thumbsticks']['left']
            stick_offset_x = left['x'] * self.s(10)
            stick_offset_y = -left['y'] * self.s(10)
        
        stick_center = QPointF(cx + stick_offset_x, cy + stick_offset_y)
        
        if self.gamepad_state and self.gamepad_state['connected']:
            if self.gamepad_state['buttons'].get('L3', False):
                painter.setBrush(self.pressed_fill)
                painter.setPen(Qt.NoPen)
                painter.drawEllipse(stick_center, inner_r, inner_r)
                pen = QPen(self.line_color)
                pen.setWidthF(1.5)
                painter.setPen(pen)
                painter.setBrush(Qt.NoBrush)
        
        painter.drawEllipse(stick_center, self.s(8), self.s(8))

    def draw_dpad(self, painter):
        cx, cy = self.s(166), self.s(238)
        outer_r = self.s(37.5)
        
        painter.drawEllipse(QPointF(cx, cy), outer_r, outer_r)
        
        cross_width = self.s(14)
        cross_length = self.s(20)
        inner_r = self.s(28)
        
        up_rect = QRectF(cx - cross_width/2, cy - inner_r - cross_length/2, cross_width, cross_length)
        down_rect = QRectF(cx - cross_width/2, cy + inner_r - cross_length/2, cross_width, cross_length)
        left_rect = QRectF(cx - inner_r - cross_length/2, cy - cross_width/2, cross_length, cross_width)
        right_rect = QRectF(cx + inner_r - cross_length/2, cy - cross_width/2, cross_length, cross_width)
        
        painter.drawRect(up_rect)
        painter.drawRect(down_rect)
        painter.drawRect(left_rect)
        painter.drawRect(right_rect)
        
        center_rect = QRectF(cx - cross_width/2, cy - cross_width/2, cross_width, cross_width)
        painter.drawRect(center_rect)
        
        if self.gamepad_state and self.gamepad_state['connected']:
            buttons = self.gamepad_state['buttons']
            painter.setBrush(self.pressed_fill)
            painter.setPen(Qt.NoPen)
            
            if buttons.get('DPad_Up', False):
                painter.drawRect(up_rect)
            if buttons.get('DPad_Down', False):
                painter.drawRect(down_rect)
            if buttons.get('DPad_Left', False):
                painter.drawRect(left_rect)
            if buttons.get('DPad_Right', False):
                painter.drawRect(right_rect)
            
            pen = QPen(self.line_color)
            pen.setWidthF(1.5)
            painter.setPen(pen)
            painter.setBrush(Qt.NoBrush)

    def draw_abxy_buttons(self, painter):
        cx, cy = self.s(329), self.s(160)
        outer_r = self.s(37.5)
        
        painter.drawEllipse(QPointF(cx, cy), outer_r, outer_r)
        
        btn_r = self.s(13)
        offset = self.s(26)
        
        y_center = QPointF(cx, cy - offset)
        b_center = QPointF(cx + offset, cy)
        a_center = QPointF(cx, cy + offset)
        x_center = QPointF(cx - offset, cy)
        
        painter.drawEllipse(y_center, btn_r, btn_r)
        painter.drawEllipse(b_center, btn_r, btn_r)
        painter.drawEllipse(a_center, btn_r, btn_r)
        painter.drawEllipse(x_center, btn_r, btn_r)
        
        font = QFont()
        font.setPixelSize(int(self.s(12)))
        font.setBold(True)
        painter.setFont(font)
        
        pen = QPen(self.line_color)
        pen.setWidthF(1)
        painter.setPen(pen)
        
        painter.drawText(QRectF(y_center.x() - self.s(13), y_center.y() - self.s(13), self.s(26), self.s(26)), Qt.AlignCenter, "Y")
        painter.drawText(QRectF(b_center.x() - self.s(13), b_center.y() - self.s(13), self.s(26), self.s(26)), Qt.AlignCenter, "B")
        painter.drawText(QRectF(a_center.x() - self.s(13), a_center.y() - self.s(13), self.s(26), self.s(26)), Qt.AlignCenter, "A")
        painter.drawText(QRectF(x_center.x() - self.s(13), x_center.y() - self.s(13), self.s(26), self.s(26)), Qt.AlignCenter, "X")
        
        if self.gamepad_state and self.gamepad_state['connected']:
            buttons = self.gamepad_state['buttons']
            painter.setBrush(self.pressed_fill)
            painter.setPen(Qt.NoPen)
            
            if buttons.get('Y', False):
                painter.drawEllipse(y_center, btn_r, btn_r)
            if buttons.get('B', False):
                painter.drawEllipse(b_center, btn_r, btn_r)
            if buttons.get('A', False):
                painter.drawEllipse(a_center, btn_r, btn_r)
            if buttons.get('X', False):
                painter.drawEllipse(x_center, btn_r, btn_r)
            
            pen = QPen(self.line_color)
            pen.setWidthF(1.5)
            painter.setPen(pen)
            painter.setBrush(Qt.NoBrush)

    def draw_right_stick(self, painter):
        cx, cy = self.s(278), self.s(238)
        outer_r = self.s(37.5)
        inner_r = self.s(28)
        
        painter.drawEllipse(QPointF(cx, cy), outer_r, outer_r)
        painter.drawEllipse(QPointF(cx, cy), inner_r, inner_r)
        
        stick_offset_x = 0
        stick_offset_y = 0
        
        if self.gamepad_state and self.gamepad_state['connected']:
            right = self.gamepad_state['thumbsticks']['right']
            stick_offset_x = right['x'] * self.s(10)
            stick_offset_y = -right['y'] * self.s(10)
        
        stick_center = QPointF(cx + stick_offset_x, cy + stick_offset_y)
        
        if self.gamepad_state and self.gamepad_state['connected']:
            if self.gamepad_state['buttons'].get('R3', False):
                painter.setBrush(self.pressed_fill)
                painter.setPen(Qt.NoPen)
                painter.drawEllipse(stick_center, inner_r, inner_r)
                pen = QPen(self.line_color)
                pen.setWidthF(1.5)
                painter.setPen(pen)
                painter.setBrush(Qt.NoBrush)
        
        painter.drawEllipse(stick_center, self.s(8), self.s(8))

    def draw_menu_buttons(self, painter):
        back_center = QPointF(self.s(188), self.s(162))
        start_center = QPointF(self.s(253), self.s(162))
        btn_r = self.s(10)
        
        painter.drawEllipse(back_center, btn_r, btn_r)
        painter.drawEllipse(start_center, btn_r, btn_r)
        
        if self.gamepad_state and self.gamepad_state['connected']:
            buttons = self.gamepad_state['buttons']
            painter.setBrush(self.pressed_fill)
            painter.setPen(Qt.NoPen)
            
            if buttons.get('Back', False):
                painter.drawEllipse(back_center, btn_r, btn_r)
            if buttons.get('Start', False):
                painter.drawEllipse(start_center, btn_r, btn_r)
            
            pen = QPen(self.line_color)
            pen.setWidthF(1.5)
            painter.setPen(pen)
            painter.setBrush(Qt.NoBrush)
