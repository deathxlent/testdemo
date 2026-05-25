from PySide6.QtWidgets import QWidget
from PySide6.QtGui import QPainter, QPen, QColor, QBrush, QPainterPath, QFont, QLinearGradient
from PySide6.QtCore import Qt, QRectF, QPointF
import math


class GamepadWidget(QWidget):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setAttribute(Qt.WA_TranslucentBackground)
        self.gamepad_state = None
        self.width = 260
        self.height = 220
        self.setFixedSize(self.width, self.height)
        
        self.line_color = QColor(173, 216, 230, 220)
        self.active_color = QColor(135, 206, 250, 255)
        self.pressed_fill = QColor(135, 206, 250, 180)
        self.axis_color = QColor(100, 149, 237, 255)

    def set_gamepad_state(self, state):
        self.gamepad_state = state
        self.update()

    def paintEvent(self, event):
        painter = QPainter(self)
        painter.setRenderHint(QPainter.Antialiasing)
        painter.setRenderHint(QPainter.SmoothPixmapTransform)

        pen = QPen(self.line_color)
        pen.setWidthF(1.5)
        pen.setCapStyle(Qt.RoundCap)
        pen.setJoinStyle(Qt.RoundJoin)
        painter.setPen(pen)
        painter.setBrush(Qt.NoBrush)

        w = self.width
        h = self.height
        scale = w / 260.0

        self.draw_controller_body(painter, scale)
        self.draw_lb_rb(painter, scale)
        self.draw_lt_rt(painter, scale)
        self.draw_dpad(painter, scale)
        self.draw_abxy_buttons(painter, scale)
        self.draw_thumbsticks(painter, scale)
        self.draw_menu_buttons(painter, scale)

    def draw_controller_body(self, painter, scale):
        path = QPainterPath()
        
        center_x = 130 * scale
        center_y = 110 * scale
        
        path.moveTo(40 * scale, 70 * scale)
        path.cubicTo(30 * scale, 60 * scale, 35 * scale, 45 * scale, 50 * scale, 40 * scale)
        path.lineTo(210 * scale, 40 * scale)
        path.cubicTo(225 * scale, 45 * scale, 230 * scale, 60 * scale, 220 * scale, 70 * scale)
        
        path.lineTo(240 * scale, 110 * scale)
        path.cubicTo(250 * scale, 140 * scale, 245 * scale, 180 * scale, 215 * scale, 200 * scale)
        path.cubicTo(205 * scale, 207 * scale, 190 * scale, 200 * scale, 185 * scale, 185 * scale)
        path.lineTo(175 * scale, 160 * scale)
        
        path.cubicTo(165 * scale, 145 * scale, 150 * scale, 140 * scale, 130 * scale, 140 * scale)
        path.cubicTo(110 * scale, 140 * scale, 95 * scale, 145 * scale, 85 * scale, 160 * scale)
        path.lineTo(75 * scale, 185 * scale)
        path.cubicTo(70 * scale, 200 * scale, 55 * scale, 207 * scale, 45 * scale, 200 * scale)
        path.cubicTo(15 * scale, 180 * scale, 10 * scale, 140 * scale, 20 * scale, 110 * scale)
        path.lineTo(40 * scale, 70 * scale)
        
        path.closeSubpath()
        
        painter.drawPath(path)

        line_path = QPainterPath()
        line_path.moveTo(30 * scale, 95 * scale)
        line_path.lineTo(70 * scale, 140 * scale)
        painter.drawPath(line_path)
        
        line_path2 = QPainterPath()
        line_path2.moveTo(230 * scale, 95 * scale)
        line_path2.lineTo(190 * scale, 140 * scale)
        painter.drawPath(line_path2)

    def draw_lb_rb(self, painter, scale):
        pen = QPen(self.line_color)
        pen.setWidthF(1.5)
        painter.setPen(pen)
        
        lb_rect = QRectF(55 * scale, 30 * scale, 35 * scale, 18 * scale)
        rb_rect = QRectF(170 * scale, 30 * scale, 35 * scale, 18 * scale)
        
        painter.drawRoundedRect(lb_rect, 6 * scale, 6 * scale)
        painter.drawRoundedRect(rb_rect, 6 * scale, 6 * scale)
        
        if self.gamepad_state and self.gamepad_state['connected']:
            if self.gamepad_state['buttons'].get('LB', False):
                painter.setBrush(self.pressed_fill)
                painter.setPen(Qt.NoPen)
                painter.drawRoundedRect(lb_rect, 6 * scale, 6 * scale)
            
            if self.gamepad_state['buttons'].get('RB', False):
                painter.setBrush(self.pressed_fill)
                painter.setPen(Qt.NoPen)
                painter.drawRoundedRect(rb_rect, 6 * scale, 6 * scale)
            
            painter.setPen(pen)
            painter.setBrush(Qt.NoBrush)

    def draw_lt_rt(self, painter, scale):
        pen = QPen(self.line_color)
        pen.setWidthF(1.5)
        painter.setPen(pen)
        
        lt_rect = QRectF(60 * scale, 10 * scale, 25 * scale, 15 * scale)
        rt_rect = QRectF(175 * scale, 10 * scale, 25 * scale, 15 * scale)
        
        painter.drawRoundedRect(lt_rect, 5 * scale, 5 * scale)
        painter.drawRoundedRect(rt_rect, 5 * scale, 5 * scale)
        
        if self.gamepad_state and self.gamepad_state['connected']:
            lt_value = self.gamepad_state['triggers'].get('LT', 0)
            rt_value = self.gamepad_state['triggers'].get('RT', 0)
            
            if lt_value > 0.01:
                gradient = QLinearGradient(lt_rect.topLeft(), lt_rect.bottomLeft())
                fill_color = QColor(135, 206, 250, int(100 + lt_value * 155))
                gradient.setColorAt(0, fill_color)
                gradient.setColorAt(1, fill_color)
                painter.setBrush(gradient)
                painter.setPen(Qt.NoPen)
                fill_height = lt_rect.height() * lt_value
                fill_rect = QRectF(lt_rect.x(), lt_rect.y() + lt_rect.height() - fill_height, 
                                   lt_rect.width(), fill_height)
                painter.drawRoundedRect(fill_rect, 5 * scale, 5 * scale)
            
            if rt_value > 0.01:
                gradient = QLinearGradient(rt_rect.topLeft(), rt_rect.bottomLeft())
                fill_color = QColor(135, 206, 250, int(100 + rt_value * 155))
                gradient.setColorAt(0, fill_color)
                gradient.setColorAt(1, fill_color)
                painter.setBrush(gradient)
                painter.setPen(Qt.NoPen)
                fill_height = rt_rect.height() * rt_value
                fill_rect = QRectF(rt_rect.x(), rt_rect.y() + rt_rect.height() - fill_height, 
                                   rt_rect.width(), fill_height)
                painter.drawRoundedRect(fill_rect, 5 * scale, 5 * scale)
            
            painter.setPen(pen)
            painter.setBrush(Qt.NoBrush)

    def draw_dpad(self, painter, scale):
        center_x = 85 * scale
        center_y = 115 * scale
        button_radius = 18 * scale
        
        painter.drawEllipse(QPointF(center_x, center_y), button_radius, button_radius)
        
        inner_radius = 10 * scale
        cross_size = 4 * scale
        
        up_rect = QRectF(center_x - cross_size, center_y - inner_radius - cross_size * 0.5, 
                        cross_size * 2, cross_size)
        down_rect = QRectF(center_x - cross_size, center_y + inner_radius - cross_size * 0.5, 
                          cross_size * 2, cross_size)
        left_rect = QRectF(center_x - inner_radius - cross_size * 0.5, center_y - cross_size, 
                          cross_size, cross_size * 2)
        right_rect = QRectF(center_x + inner_radius - cross_size * 0.5, center_y - cross_size, 
                           cross_size, cross_size * 2)
        
        painter.drawRect(up_rect)
        painter.drawRect(down_rect)
        painter.drawRect(left_rect)
        painter.drawRect(right_rect)
        
        painter.drawEllipse(QPointF(center_x, center_y), 3 * scale, 3 * scale)
        
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

    def draw_abxy_buttons(self, painter, scale):
        center_x = 175 * scale
        center_y = 85 * scale
        button_radius = 18 * scale
        
        painter.drawEllipse(QPointF(center_x, center_y), button_radius, button_radius)
        
        btn_radius = 5 * scale
        offset = 11 * scale
        
        y_center = QPointF(center_x, center_y - offset)
        b_center = QPointF(center_x + offset, center_y)
        a_center = QPointF(center_x, center_y + offset)
        x_center = QPointF(center_x - offset, center_y)
        
        painter.drawEllipse(y_center, btn_radius, btn_radius)
        painter.drawEllipse(b_center, btn_radius, btn_radius)
        painter.drawEllipse(a_center, btn_radius, btn_radius)
        painter.drawEllipse(x_center, btn_radius, btn_radius)
        
        font = QFont()
        font.setPixelSize(7)
        font.setBold(True)
        painter.setFont(font)
        
        pen = QPen(self.line_color)
        pen.setWidthF(1)
        painter.setPen(pen)
        
        painter.drawText(QRectF(y_center.x() - 10, y_center.y() - 10, 20, 20), Qt.AlignCenter, "Y")
        painter.drawText(QRectF(b_center.x() - 10, b_center.y() - 10, 20, 20), Qt.AlignCenter, "B")
        painter.drawText(QRectF(a_center.x() - 10, a_center.y() - 10, 20, 20), Qt.AlignCenter, "A")
        painter.drawText(QRectF(x_center.x() - 10, x_center.y() - 10, 20, 20), Qt.AlignCenter, "X")
        
        if self.gamepad_state and self.gamepad_state['connected']:
            buttons = self.gamepad_state['buttons']
            painter.setBrush(self.pressed_fill)
            painter.setPen(Qt.NoPen)
            
            if buttons.get('Y', False):
                painter.drawEllipse(y_center, btn_radius, btn_radius)
            if buttons.get('B', False):
                painter.drawEllipse(b_center, btn_radius, btn_radius)
            if buttons.get('A', False):
                painter.drawEllipse(a_center, btn_radius, btn_radius)
            if buttons.get('X', False):
                painter.drawEllipse(x_center, btn_radius, btn_radius)
            
            pen = QPen(self.line_color)
            pen.setWidthF(1.5)
            painter.setPen(pen)
            painter.setBrush(Qt.NoBrush)

    def draw_thumbsticks(self, painter, scale):
        left_center = QPointF(85 * scale, 75 * scale)
        right_center = QPointF(175 * scale, 125 * scale)
        stick_radius = 16 * scale
        stick_inner_radius = 10 * scale
        
        painter.drawEllipse(left_center, stick_radius, stick_radius)
        painter.drawEllipse(right_center, stick_radius, stick_radius)
        
        pen = QPen(self.line_color)
        pen.setWidthF(1.5)
        painter.setPen(pen)
        
        left_stick_offset_x = 0
        left_stick_offset_y = 0
        right_stick_offset_x = 0
        right_stick_offset_y = 0
        
        if self.gamepad_state and self.gamepad_state['connected']:
            left = self.gamepad_state['thumbsticks']['left']
            right = self.gamepad_state['thumbsticks']['right']
            left_stick_offset_x = left['x'] * 5 * scale
            left_stick_offset_y = -left['y'] * 5 * scale
            right_stick_offset_x = right['x'] * 5 * scale
            right_stick_offset_y = -right['y'] * 5 * scale
        
        left_stick_center = QPointF(left_center.x() + left_stick_offset_x, 
                                   left_center.y() + left_stick_offset_y)
        right_stick_center = QPointF(right_center.x() + right_stick_offset_x, 
                                    right_center.y() + right_stick_offset_y)
        
        if self.gamepad_state and self.gamepad_state['connected']:
            if self.gamepad_state['buttons'].get('L3', False):
                painter.setBrush(self.pressed_fill)
                painter.setPen(Qt.NoPen)
                painter.drawEllipse(left_stick_center, stick_inner_radius, stick_inner_radius)
                painter.setPen(pen)
                painter.setBrush(Qt.NoBrush)
            else:
                painter.drawEllipse(left_stick_center, stick_inner_radius, stick_inner_radius)
            
            if self.gamepad_state['buttons'].get('R3', False):
                painter.setBrush(self.pressed_fill)
                painter.setPen(Qt.NoPen)
                painter.drawEllipse(right_stick_center, stick_inner_radius, stick_inner_radius)
                painter.setPen(pen)
                painter.setBrush(Qt.NoBrush)
            else:
                painter.drawEllipse(right_stick_center, stick_inner_radius, stick_inner_radius)
        else:
            painter.drawEllipse(left_stick_center, stick_inner_radius, stick_inner_radius)
            painter.drawEllipse(right_stick_center, stick_inner_radius, stick_inner_radius)
        
        painter.drawEllipse(left_stick_center, 3 * scale, 3 * scale)
        painter.drawEllipse(right_stick_center, 3 * scale, 3 * scale)
        
        font = QFont()
        font.setPixelSize(6)
        painter.setFont(font)
        pen = QPen(self.line_color)
        pen.setWidthF(1)
        painter.setPen(pen)
        painter.drawText(QRectF(left_center.x() - 15, left_center.y() + stick_radius, 30, 12), Qt.AlignCenter, "L3")
        painter.drawText(QRectF(right_center.x() - 15, right_center.y() + stick_radius, 30, 12), Qt.AlignCenter, "R3")

    def draw_menu_buttons(self, painter, scale):
        center_x = 130 * scale
        center_y = 75 * scale
        btn_size = 5 * scale
        spacing = 25 * scale
        
        back_rect = QRectF(center_x - spacing - btn_size, center_y - btn_size/2, btn_size * 2, btn_size)
        start_rect = QRectF(center_x + spacing - btn_size, center_y - btn_size/2, btn_size * 2, btn_size)
        
        painter.drawEllipse(back_rect)
        painter.drawEllipse(start_rect)
        
        font = QFont()
        font.setPixelSize(5)
        painter.setFont(font)
        pen = QPen(self.line_color)
        pen.setWidthF(0.5)
        painter.setPen(pen)
        
        painter.drawText(QRectF(back_rect.x() - 8, back_rect.y() + btn_size + 2, btn_size * 2 + 16, 10), Qt.AlignCenter, "BACK")
        painter.drawText(QRectF(start_rect.x() - 8, start_rect.y() + btn_size + 2, btn_size * 2 + 16, 10), Qt.AlignCenter, "START")
        
        if self.gamepad_state and self.gamepad_state['connected']:
            buttons = self.gamepad_state['buttons']
            painter.setBrush(self.pressed_fill)
            painter.setPen(Qt.NoPen)
            
            if buttons.get('Back', False):
                painter.drawEllipse(back_rect)
            if buttons.get('Start', False):
                painter.drawEllipse(start_rect)
            
            pen = QPen(self.line_color)
            pen.setWidthF(1.5)
            painter.setPen(pen)
            painter.setBrush(Qt.NoBrush)
