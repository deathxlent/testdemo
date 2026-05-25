from PySide6.QtWidgets import QWidget
from PySide6.QtGui import QPainter, QPen, QColor, QBrush, QPainterPath, QFont, QLinearGradient
from PySide6.QtCore import Qt, QRectF, QPointF


class GamepadWidget(QWidget):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setAttribute(Qt.WA_TranslucentBackground)
        self.gamepad_state = None
        self.width = 260
        self.height = 250
        self.setFixedSize(self.width, self.height)
        
        self.line_color = QColor(0, 0, 0, 180)
        self.pressed_fill = QColor(80, 80, 80, 120)
        self.highlight_color = QColor(0, 0, 0, 220)
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
        pen.setWidthF(1.2)
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
        pen.setWidthF(1.5)
        painter.setPen(pen)
        
        body = QPainterPath()
        
        body.moveTo(130, 225)
        body.cubicTo(55, 225, 15, 185, 15, 135)
        body.cubicTo(15, 90, 35, 60, 65, 50)
        body.cubicTo(70, 40, 80, 32, 95, 28)
        body.cubicTo(100, 18, 110, 12, 125, 10)
        body.lineTo(135, 10)
        body.cubicTo(150, 12, 160, 18, 165, 28)
        body.cubicTo(180, 32, 190, 40, 195, 50)
        body.cubicTo(225, 60, 245, 90, 245, 135)
        body.cubicTo(245, 185, 205, 225, 130, 225)
        body.closeSubpath()
        
        painter.drawPath(body)

    def draw_lt_rt(self, painter):
        pen = QPen(self.line_color)
        pen.setWidthF(1.2)
        painter.setPen(pen)
        
        lt_rect = QRectF(70, 18, 40, 16)
        rt_rect = QRectF(150, 18, 40, 16)
        
        painter.drawRoundedRect(lt_rect, 4, 4)
        painter.drawRoundedRect(rt_rect, 4, 4)
        
        if self.gamepad_state and self.gamepad_state['connected']:
            lt_value = self.gamepad_state['triggers'].get('LT', 0)
            rt_value = self.gamepad_state['triggers'].get('RT', 0)
            
            if lt_value > 0.01:
                painter.setBrush(self.pressed_fill)
                painter.setPen(Qt.NoPen)
                fill_height = lt_rect.height() * lt_value
                fill_rect = QRectF(lt_rect.x(), lt_rect.y() + lt_rect.height() - fill_height, 
                                   lt_rect.width(), fill_height)
                painter.drawRoundedRect(fill_rect, 4, 4)
            
            if rt_value > 0.01:
                painter.setBrush(self.pressed_fill)
                painter.setPen(Qt.NoPen)
                fill_height = rt_rect.height() * rt_value
                fill_rect = QRectF(rt_rect.x(), rt_rect.y() + rt_rect.height() - fill_height, 
                                   rt_rect.width(), fill_height)
                painter.drawRoundedRect(fill_rect, 4, 4)
            
            painter.setPen(pen)
            painter.setBrush(Qt.NoBrush)

    def draw_lb_rb(self, painter):
        pen = QPen(self.line_color)
        pen.setWidthF(1.2)
        painter.setPen(pen)
        
        lb = QPainterPath()
        lb.moveTo(50, 48)
        lb.cubicTo(40, 48, 35, 52, 35, 58)
        lb.cubicTo(35, 65, 40, 70, 50, 70)
        lb.lineTo(100, 70)
        lb.cubicTo(108, 70, 115, 65, 115, 58)
        lb.cubicTo(115, 52, 110, 48, 100, 48)
        lb.closeSubpath()
        painter.drawPath(lb)
        
        rb = QPainterPath()
        rb.moveTo(160, 48)
        rb.cubicTo(150, 48, 145, 52, 145, 58)
        rb.cubicTo(145, 65, 150, 70, 160, 70)
        rb.lineTo(210, 70)
        rb.cubicTo(218, 70, 225, 65, 225, 58)
        rb.cubicTo(225, 52, 220, 48, 210, 48)
        rb.closeSubpath()
        painter.drawPath(rb)
        
        if self.gamepad_state and self.gamepad_state['connected']:
            if self.gamepad_state['buttons'].get('LB', False):
                painter.setBrush(self.pressed_fill)
                painter.setPen(Qt.NoPen)
                painter.drawPath(lb)
            
            if self.gamepad_state['buttons'].get('RB', False):
                painter.setBrush(self.pressed_fill)
                painter.setPen(Qt.NoPen)
                painter.drawPath(rb)
            
            painter.setPen(pen)
            painter.setBrush(Qt.NoBrush)

    def draw_left_stick(self, painter):
        center_x = 75
        center_y = 120
        outer_radius = 28
        inner_radius = 18
        
        painter.drawEllipse(QPointF(center_x, center_y), outer_radius, outer_radius)
        painter.drawEllipse(QPointF(center_x, center_y), inner_radius, inner_radius)
        
        stick_offset_x = 0
        stick_offset_y = 0
        
        if self.gamepad_state and self.gamepad_state['connected']:
            left = self.gamepad_state['thumbsticks']['left']
            stick_offset_x = left['x'] * 8
            stick_offset_y = -left['y'] * 8
        
        stick_center = QPointF(center_x + stick_offset_x, center_y + stick_offset_y)
        
        if self.gamepad_state and self.gamepad_state['connected']:
            if self.gamepad_state['buttons'].get('L3', False):
                painter.setBrush(self.pressed_fill)
                painter.setPen(Qt.NoPen)
                painter.drawEllipse(stick_center, inner_radius, inner_radius)
                pen = QPen(self.line_color)
                pen.setWidthF(1.2)
                painter.setPen(pen)
                painter.setBrush(Qt.NoBrush)
        
        painter.drawEllipse(stick_center, 6, 6)

    def draw_dpad(self, painter):
        center_x = 75
        center_y = 175
        outer_radius = 22
        
        painter.drawEllipse(QPointF(center_x, center_y), outer_radius, outer_radius)
        
        cross_width = 10
        cross_length = 14
        inner_radius = 14
        
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
            pen.setWidthF(1.2)
            painter.setPen(pen)
            painter.setBrush(Qt.NoBrush)

    def draw_abxy_buttons(self, painter):
        center_x = 185
        center_y = 120
        outer_radius = 28
        
        painter.drawEllipse(QPointF(center_x, center_y), outer_radius, outer_radius)
        
        btn_radius = 7
        offset = 18
        
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
        
        painter.drawText(QRectF(y_center.x() - 8, y_center.y() - 8, 16, 16), Qt.AlignCenter, "Y")
        painter.drawText(QRectF(b_center.x() - 8, b_center.y() - 8, 16, 16), Qt.AlignCenter, "B")
        painter.drawText(QRectF(a_center.x() - 8, a_center.y() - 8, 16, 16), Qt.AlignCenter, "A")
        painter.drawText(QRectF(x_center.x() - 8, x_center.y() - 8, 16, 16), Qt.AlignCenter, "X")
        
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
            pen.setWidthF(1.2)
            painter.setPen(pen)
            painter.setBrush(Qt.NoBrush)

    def draw_right_stick(self, painter):
        center_x = 185
        center_y = 175
        outer_radius = 28
        inner_radius = 18
        
        painter.drawEllipse(QPointF(center_x, center_y), outer_radius, outer_radius)
        painter.drawEllipse(QPointF(center_x, center_y), inner_radius, inner_radius)
        
        stick_offset_x = 0
        stick_offset_y = 0
        
        if self.gamepad_state and self.gamepad_state['connected']:
            right = self.gamepad_state['thumbsticks']['right']
            stick_offset_x = right['x'] * 8
            stick_offset_y = -right['y'] * 8
        
        stick_center = QPointF(center_x + stick_offset_x, center_y + stick_offset_y)
        
        if self.gamepad_state and self.gamepad_state['connected']:
            if self.gamepad_state['buttons'].get('R3', False):
                painter.setBrush(self.pressed_fill)
                painter.setPen(Qt.NoPen)
                painter.drawEllipse(stick_center, inner_radius, inner_radius)
                pen = QPen(self.line_color)
                pen.setWidthF(1.2)
                painter.setPen(pen)
                painter.setBrush(Qt.NoBrush)
        
        painter.drawEllipse(stick_center, 6, 6)

    def draw_menu_buttons(self, painter):
        back_center = QPointF(110, 115)
        start_center = QPointF(150, 115)
        btn_radius = 8
        
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
            pen.setWidthF(1.2)
            painter.setPen(pen)
            painter.setBrush(Qt.NoBrush)
