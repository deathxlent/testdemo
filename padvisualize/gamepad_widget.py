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
        
        self.svg_scale = self.width / 832.0

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

    def sx(self, x):
        return x * self.svg_scale

    def sy(self, y):
        return y * self.svg_scale

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
        path = QPainterPath()
        
        path.moveTo(self.sx(270), self.sy(30))
        path.cubicTo(self.sx(235), self.sy(35), self.sx(220), self.sy(45), self.sx(210), self.sy(60))
        path.cubicTo(self.sx(200), self.sy(75), self.sx(195), self.sy(90), self.sx(200), self.sy(110))
        path.lineTo(self.sx(195), self.sy(130))
        
        path.cubicTo(self.sx(160), self.sy(140), self.sx(130), self.sy(160), self.sx(100), self.sy(200))
        path.cubicTo(self.sx(70), self.sy(250), self.sx(50), self.sy(310), self.sx(55), self.sy(380))
        path.cubicTo(self.sx(58), self.sy(420), self.sx(80), self.sy(460), self.sx(120), self.sy(480))
        path.cubicTo(self.sx(150), self.sy(495), self.sx(180), self.sy(485), self.sx(200), self.sy(460))
        path.cubicTo(self.sx(220), self.sy(430), self.sx(240), self.sy(400), self.sx(260), self.sy(380))
        
        path.cubicTo(self.sx(300), self.sy(370), self.sx(350), self.sy(365), self.sx(416), self.sy(365))
        path.cubicTo(self.sx(482), self.sy(365), self.sx(532), self.sy(370), self.sx(572), self.sy(380))
        
        path.cubicTo(self.sx(592), self.sy(400), self.sx(612), self.sy(430), self.sx(632), self.sy(460))
        path.cubicTo(self.sx(652), self.sy(485), self.sx(682), self.sy(495), self.sx(712), self.sy(480))
        path.cubicTo(self.sx(752), self.sy(460), self.sx(774), self.sy(420), self.sx(777), self.sy(380))
        path.cubicTo(self.sx(782), self.sy(310), self.sx(762), self.sy(250), self.sx(732), self.sy(200))
        path.cubicTo(self.sx(702), self.sy(160), self.sx(672), self.sy(140), self.sx(637), self.sy(130))
        
        path.lineTo(self.sx(632), self.sy(110))
        path.cubicTo(self.sx(637), self.sy(90), self.sx(632), self.sy(75), self.sx(622), self.sy(60))
        path.cubicTo(self.sx(612), self.sy(45), self.sx(597), self.sy(35), self.sx(562), self.sy(30))
        
        path.lineTo(self.sx(514), self.sy(15))
        path.lineTo(self.sx(317), self.sy(15))
        path.lineTo(self.sx(270), self.sy(30))
        
        path.closeSubpath()
        
        painter.drawPath(path)

    def draw_lt_rt(self, painter):
        pen = QPen(self.line_color)
        pen.setWidthF(1.5)
        painter.setPen(pen)
        
        lt_rect = QRectF(self.sx(268), self.sy(8), self.sx(50), self.sy(15))
        rt_rect = QRectF(self.sx(514), self.sy(8), self.sx(50), self.sy(15))
        
        painter.drawRoundedRect(lt_rect, 3, 3)
        painter.drawRoundedRect(rt_rect, 3, 3)
        
        if self.gamepad_state and self.gamepad_state['connected']:
            lt_value = self.gamepad_state['triggers'].get('LT', 0)
            rt_value = self.gamepad_state['triggers'].get('RT', 0)
            
            if lt_value > 0.01:
                painter.setBrush(self.pressed_fill)
                painter.setPen(Qt.NoPen)
                fill_height = lt_rect.height() * lt_value
                fill_rect = QRectF(lt_rect.x(), lt_rect.y() + lt_rect.height() - fill_height, 
                                   lt_rect.width(), fill_height)
                painter.drawRoundedRect(fill_rect, 3, 3)
            
            if rt_value > 0.01:
                painter.setBrush(self.pressed_fill)
                painter.setPen(Qt.NoPen)
                fill_height = rt_rect.height() * rt_value
                fill_rect = QRectF(rt_rect.x(), rt_rect.y() + rt_rect.height() - fill_height, 
                                   rt_rect.width(), fill_height)
                painter.drawRoundedRect(fill_rect, 3, 3)
            
            painter.setPen(pen)
            painter.setBrush(Qt.NoBrush)

    def draw_lb_rb(self, painter):
        pen = QPen(self.line_color)
        pen.setWidthF(1.5)
        painter.setPen(pen)
        
        lb_path = QPainterPath()
        lb_path.moveTo(self.sx(195), self.sy(30))
        lb_path.cubicTo(self.sx(180), self.sy(35), self.sx(175), self.sy(45), self.sx(185), self.sy(55))
        lb_path.lineTo(self.sx(240), self.sy(55))
        lb_path.cubicTo(self.sx(250), self.sy(45), self.sx(245), self.sy(35), self.sx(230), self.sy(30))
        lb_path.closeSubpath()
        painter.drawPath(lb_path)
        
        rb_path = QPainterPath()
        rb_path.moveTo(self.sx(602), self.sy(30))
        rb_path.cubicTo(self.sx(587), self.sy(35), self.sx(582), self.sy(45), self.sx(592), self.sy(55))
        rb_path.lineTo(self.sx(647), self.sy(55))
        rb_path.cubicTo(self.sx(657), self.sy(45), self.sx(652), self.sy(35), self.sx(637), self.sy(30))
        rb_path.closeSubpath()
        painter.drawPath(rb_path)
        
        if self.gamepad_state and self.gamepad_state['connected']:
            if self.gamepad_state['buttons'].get('LB', False):
                painter.setBrush(self.pressed_fill)
                painter.setPen(Qt.NoPen)
                painter.drawPath(lb_path)
            
            if self.gamepad_state['buttons'].get('RB', False):
                painter.setBrush(self.pressed_fill)
                painter.setPen(Qt.NoPen)
                painter.drawPath(rb_path)
            
            painter.setPen(pen)
            painter.setBrush(Qt.NoBrush)

    def draw_left_stick(self, painter):
        center_x = self.sx(240)
        center_y = self.sy(155)
        outer_radius = self.sx(55)
        inner_radius = self.sx(35)
        
        painter.drawEllipse(QPointF(center_x, center_y), outer_radius, outer_radius)
        
        stick_offset_x = 0
        stick_offset_y = 0
        
        if self.gamepad_state and self.gamepad_state['connected']:
            left = self.gamepad_state['thumbsticks']['left']
            stick_offset_x = left['x'] * self.sx(15)
            stick_offset_y = -left['y'] * self.sx(15)
        
        stick_center = QPointF(center_x + stick_offset_x, center_y + stick_offset_y)
        
        if self.gamepad_state and self.gamepad_state['connected']:
            if self.gamepad_state['buttons'].get('L3', False):
                painter.setBrush(self.pressed_fill)
                painter.setPen(Qt.NoPen)
                painter.drawEllipse(stick_center, inner_radius, inner_radius)
                pen = QPen(self.line_color)
                pen.setWidthF(1.5)
                painter.setPen(pen)
                painter.setBrush(Qt.NoBrush)
            else:
                painter.drawEllipse(stick_center, inner_radius, inner_radius)
        else:
            painter.drawEllipse(stick_center, inner_radius, inner_radius)
        
        painter.drawEllipse(stick_center, self.sx(8), self.sx(8))

    def draw_dpad(self, painter):
        center_x = self.sx(240)
        center_y = self.sy(285)
        outer_radius = self.sx(50)
        
        painter.drawEllipse(QPointF(center_x, center_y), outer_radius, outer_radius)
        
        inner_radius = self.sx(30)
        cross_width = self.sx(12)
        cross_length = self.sx(18)
        
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
            pen.setWidthF(1.5)
            painter.setPen(pen)
            painter.setBrush(Qt.NoBrush)

    def draw_abxy_buttons(self, painter):
        center_x = self.sx(592)
        center_y = self.sy(155)
        outer_radius = self.sx(55)
        
        painter.drawEllipse(QPointF(center_x, center_y), outer_radius, outer_radius)
        
        btn_radius = self.sx(14)
        offset = self.sx(32)
        
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
        
        painter.drawText(QRectF(y_center.x() - 15, y_center.y() - 15, 30, 30), Qt.AlignCenter, "Y")
        painter.drawText(QRectF(b_center.x() - 15, b_center.y() - 15, 30, 30), Qt.AlignCenter, "B")
        painter.drawText(QRectF(a_center.x() - 15, a_center.y() - 15, 30, 30), Qt.AlignCenter, "A")
        painter.drawText(QRectF(x_center.x() - 15, x_center.y() - 15, 30, 30), Qt.AlignCenter, "X")
        
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

    def draw_right_stick(self, painter):
        center_x = self.sx(592)
        center_y = self.sy(285)
        outer_radius = self.sx(55)
        inner_radius = self.sx(35)
        
        painter.drawEllipse(QPointF(center_x, center_y), outer_radius, outer_radius)
        
        stick_offset_x = 0
        stick_offset_y = 0
        
        if self.gamepad_state and self.gamepad_state['connected']:
            right = self.gamepad_state['thumbsticks']['right']
            stick_offset_x = right['x'] * self.sx(15)
            stick_offset_y = -right['y'] * self.sx(15)
        
        stick_center = QPointF(center_x + stick_offset_x, center_y + stick_offset_y)
        
        if self.gamepad_state and self.gamepad_state['connected']:
            if self.gamepad_state['buttons'].get('R3', False):
                painter.setBrush(self.pressed_fill)
                painter.setPen(Qt.NoPen)
                painter.drawEllipse(stick_center, inner_radius, inner_radius)
                pen = QPen(self.line_color)
                pen.setWidthF(1.5)
                painter.setPen(pen)
                painter.setBrush(Qt.NoBrush)
            else:
                painter.drawEllipse(stick_center, inner_radius, inner_radius)
        else:
            painter.drawEllipse(stick_center, inner_radius, inner_radius)
        
        painter.drawEllipse(stick_center, self.sx(8), self.sx(8))

    def draw_menu_buttons(self, painter):
        back_center = QPointF(self.sx(365), self.sy(150))
        start_center = QPointF(self.sx(467), self.sy(150))
        btn_radius = self.sx(15)
        
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
            pen.setWidthF(1.5)
            painter.setPen(pen)
            painter.setBrush(Qt.NoBrush)
