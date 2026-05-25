from PySide6.QtWidgets import QWidget
from PySide6.QtGui import QPainter, QPen, QColor, QBrush, QPainterPath, QFont
from PySide6.QtCore import Qt, QRectF, QPointF


class GamepadWidget(QWidget):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setAttribute(Qt.WA_TranslucentBackground)
        self.gamepad_state = None
        self.width = 260
        self.height = 240
        self.setFixedSize(self.width, self.height)
        
        self.line_color = QColor(0, 0, 0, 200)
        self.pressed_fill = QColor(50, 50, 50, 180)
        self.show_stats = False
        self.stats_data = {}

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
        pen.setWidthF(2)
        pen.setCapStyle(Qt.RoundCap)
        pen.setJoinStyle(Qt.RoundJoin)
        painter.setPen(pen)
        painter.setBrush(Qt.NoBrush)

        scale = 1.0

        self.draw_controller_body(painter, scale)
        self.draw_lt_rt(painter, scale)
        self.draw_lb_rb(painter, scale)
        self.draw_dpad(painter, scale)
        self.draw_abxy_buttons(painter, scale)
        self.draw_thumbsticks(painter, scale)
        self.draw_menu_buttons(painter, scale)

    def draw_controller_body(self, painter, scale):
        path = QPainterPath()
        
        center_x = 130
        center_y = 120
        
        path.moveTo(50 * scale, 65 * scale)
        path.cubicTo(35 * scale, 55 * scale, 40 * scale, 35 * scale, 55 * scale, 30 * scale)
        path.lineTo(205 * scale, 30 * scale)
        path.cubicTo(220 * scale, 35 * scale, 225 * scale, 55 * scale, 210 * scale, 65 * scale)
        
        path.cubicTo(235 * scale, 80 * scale, 245 * scale, 100 * scale, 240 * scale, 130 * scale)
        path.cubicTo(250 * scale, 160 * scale, 240 * scale, 195 * scale, 210 * scale, 215 * scale)
        path.cubicTo(195 * scale, 225 * scale, 180 * scale, 215 * scale, 175 * scale, 200 * scale)
        path.lineTo(165 * scale, 175 * scale)
        
        path.cubicTo(155 * scale, 160 * scale, 142 * scale, 155 * scale, 130 * scale, 155 * scale)
        path.cubicTo(118 * scale, 155 * scale, 105 * scale, 160 * scale, 95 * scale, 175 * scale)
        path.lineTo(85 * scale, 200 * scale)
        path.cubicTo(80 * scale, 215 * scale, 65 * scale, 225 * scale, 50 * scale, 215 * scale)
        path.cubicTo(20 * scale, 195 * scale, 10 * scale, 160 * scale, 20 * scale, 130 * scale)
        path.cubicTo(15 * scale, 100 * scale, 25 * scale, 80 * scale, 50 * scale, 65 * scale)
        
        path.closeSubpath()
        
        painter.drawPath(path)

    def draw_lb_rb(self, painter, scale):
        pen = QPen(self.line_color)
        pen.setWidthF(2)
        painter.setPen(pen)
        
        lb_rect = QRectF(55 * scale, 25 * scale, 35 * scale, 15 * scale)
        rb_rect = QRectF(170 * scale, 25 * scale, 35 * scale, 15 * scale)
        
        painter.drawRoundedRect(lb_rect, 4 * scale, 4 * scale)
        painter.drawRoundedRect(rb_rect, 4 * scale, 4 * scale)
        
        if self.gamepad_state and self.gamepad_state['connected']:
            if self.gamepad_state['buttons'].get('LB', False):
                painter.setBrush(self.pressed_fill)
                painter.setPen(Qt.NoPen)
                painter.drawRoundedRect(lb_rect, 4 * scale, 4 * scale)
            
            if self.gamepad_state['buttons'].get('RB', False):
                painter.setBrush(self.pressed_fill)
                painter.setPen(Qt.NoPen)
                painter.drawRoundedRect(rb_rect, 4 * scale, 4 * scale)
            
            painter.setPen(pen)
            painter.setBrush(Qt.NoBrush)

    def draw_lt_rt(self, painter, scale):
        pen = QPen(self.line_color)
        pen.setWidthF(2)
        painter.setPen(pen)
        
        lt_rect = QRectF(62 * scale, 8 * scale, 22 * scale, 12 * scale)
        rt_rect = QRectF(176 * scale, 8 * scale, 22 * scale, 12 * scale)
        
        painter.drawRoundedRect(lt_rect, 3 * scale, 3 * scale)
        painter.drawRoundedRect(rt_rect, 3 * scale, 3 * scale)
        
        if self.gamepad_state and self.gamepad_state['connected']:
            lt_value = self.gamepad_state['triggers'].get('LT', 0)
            rt_value = self.gamepad_state['triggers'].get('RT', 0)
            
            if lt_value > 0.01:
                painter.setBrush(self.pressed_fill)
                painter.setPen(Qt.NoPen)
                fill_height = lt_rect.height() * lt_value
                fill_rect = QRectF(lt_rect.x(), lt_rect.y() + lt_rect.height() - fill_height, 
                                   lt_rect.width(), fill_height)
                painter.drawRoundedRect(fill_rect, 3 * scale, 3 * scale)
            
            if rt_value > 0.01:
                painter.setBrush(self.pressed_fill)
                painter.setPen(Qt.NoPen)
                fill_height = rt_rect.height() * rt_value
                fill_rect = QRectF(rt_rect.x(), rt_rect.y() + rt_rect.height() - fill_height, 
                                   rt_rect.width(), fill_height)
                painter.drawRoundedRect(fill_rect, 3 * scale, 3 * scale)
            
            painter.setPen(pen)
            painter.setBrush(Qt.NoBrush)

    def draw_dpad(self, painter, scale):
        center_x = 75 * scale
        center_y = 155 * scale
        outer_radius = 22 * scale
        
        painter.drawEllipse(QPointF(center_x, center_y), outer_radius, outer_radius)
        
        inner_radius = 14 * scale
        cross_width = 6 * scale
        cross_length = 8 * scale
        
        up_rect = QRectF(center_x - cross_width/2, center_y - inner_radius - cross_length/2, 
                        cross_width, cross_length)
        down_rect = QRectF(center_x - cross_width/2, center_y + inner_radius - cross_length/2, 
                          cross_width, cross_length)
        left_rect = QRectF(center_x - inner_radius - cross_length/2, center_y - cross_width/2, 
                          cross_length, cross_width)
        right_rect = QRectF(center_x + inner_radius - cross_length/2, center_y - cross_width/2, 
                           cross_length, cross_width)
        
        painter.drawRect(up_rect)
        painter.drawRect(down_rect)
        painter.drawRect(left_rect)
        painter.drawRect(right_rect)
        
        center_rect = QRectF(center_x - cross_width/2, center_y - cross_width/2, cross_width, cross_width)
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
            pen.setWidthF(2)
            painter.setPen(pen)
            painter.setBrush(Qt.NoBrush)

    def draw_abxy_buttons(self, painter, scale):
        center_x = 185 * scale
        center_y = 85 * scale
        outer_radius = 22 * scale
        
        painter.drawEllipse(QPointF(center_x, center_y), outer_radius, outer_radius)
        
        btn_radius = 6 * scale
        offset = 13 * scale
        
        y_center = QPointF(center_x, center_y - offset)
        b_center = QPointF(center_x + offset, center_y)
        a_center = QPointF(center_x, center_y + offset)
        x_center = QPointF(center_x - offset, center_y)
        
        painter.drawEllipse(y_center, btn_radius, btn_radius)
        painter.drawEllipse(b_center, btn_radius, btn_radius)
        painter.drawEllipse(a_center, btn_radius, btn_radius)
        painter.drawEllipse(x_center, btn_radius, btn_radius)
        
        font = QFont()
        font.setPixelSize(8)
        font.setBold(True)
        painter.setFont(font)
        
        pen = QPen(self.line_color)
        pen.setWidthF(1)
        painter.setPen(pen)
        
        painter.drawText(QRectF(y_center.x() - 12, y_center.y() - 12, 24, 24), Qt.AlignCenter, "Y")
        painter.drawText(QRectF(b_center.x() - 12, b_center.y() - 12, 24, 24), Qt.AlignCenter, "B")
        painter.drawText(QRectF(a_center.x() - 12, a_center.y() - 12, 24, 24), Qt.AlignCenter, "A")
        painter.drawText(QRectF(x_center.x() - 12, x_center.y() - 12, 24, 24), Qt.AlignCenter, "X")
        
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
            pen.setWidthF(2)
            painter.setPen(pen)
            painter.setBrush(Qt.NoBrush)

    def draw_thumbsticks(self, painter, scale):
        left_center = QPointF(75 * scale, 75 * scale)
        right_center = QPointF(185 * scale, 155 * scale)
        stick_radius = 20 * scale
        stick_inner_radius = 13 * scale
        
        painter.drawEllipse(left_center, stick_radius, stick_radius)
        painter.drawEllipse(right_center, stick_radius, stick_radius)
        
        pen = QPen(self.line_color)
        pen.setWidthF(2)
        painter.setPen(pen)
        
        left_stick_offset_x = 0
        left_stick_offset_y = 0
        right_stick_offset_x = 0
        right_stick_offset_y = 0
        
        if self.gamepad_state and self.gamepad_state['connected']:
            left = self.gamepad_state['thumbsticks']['left']
            right = self.gamepad_state['thumbsticks']['right']
            left_stick_offset_x = left['x'] * 6 * scale
            left_stick_offset_y = -left['y'] * 6 * scale
            right_stick_offset_x = right['x'] * 6 * scale
            right_stick_offset_y = -right['y'] * 6 * scale
        
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
        
        painter.drawEllipse(left_stick_center, 4 * scale, 4 * scale)
        painter.drawEllipse(right_stick_center, 4 * scale, 4 * scale)

    def draw_menu_buttons(self, painter, scale):
        center_x = 130 * scale
        center_y = 100 * scale
        btn_radius = 5 * scale
        spacing = 30 * scale
        
        back_center = QPointF(center_x - spacing, center_y)
        start_center = QPointF(center_x + spacing, center_y)
        
        painter.drawEllipse(back_center, btn_radius, btn_radius)
        painter.drawEllipse(start_center, btn_radius, btn_radius)
        
        if self.gamepad_state and self.gamepad_state['connected']:
            buttons = self.gamepad_state['buttons']
            painter.setBrush(self.pressed_fill)
            painter.setPen(Qt.NoPen)
            
            if buttons.get('Back', False):
                painter.drawEllipse(back_center, btn_radius, btn_radius)
            if buttons.get('Start', False):
                painter.drawEllipse(start_center, btn_radius, btn_radius)
            
            pen = QPen(self.line_color)
            pen.setWidthF(2)
            painter.setPen(pen)
            painter.setBrush(Qt.NoBrush)
