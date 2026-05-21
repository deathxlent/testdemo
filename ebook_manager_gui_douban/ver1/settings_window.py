import os
from PyQt6.QtWidgets import (QDialog, QVBoxLayout, QHBoxLayout, QLabel, 
                             QLineEdit, QPushButton, QMessageBox, QTextEdit)
from PyQt6.QtCore import Qt


class SettingsWindow(QDialog):
    def __init__(self, parent=None, current_cookie=''):
        super().__init__(parent)
        self.cookie = current_cookie
        self.init_ui()
    
    def init_ui(self):
        self.setWindowTitle("设置")
        self.setMinimumWidth(600)
        self.setMinimumHeight(400)
        
        layout = QVBoxLayout(self)
        
        cookie_label = QLabel("豆瓣 Cookie:")
        cookie_label.setStyleSheet("font-weight: bold; font-size: 14px;")
        layout.addWidget(cookie_label)
        
        help_label = QLabel("请从浏览器登录豆瓣后，复制完整的Cookie粘贴到下方。\nCookie是解析豆瓣书籍信息的必要条件。")
        help_label.setStyleSheet("color: #666; margin-bottom: 10px;")
        layout.addWidget(help_label)
        
        self.cookie_edit = QTextEdit()
        self.cookie_edit.setPlaceholderText("请输入豆瓣 Cookie...")
        self.cookie_edit.setPlainText(self.cookie)
        self.cookie_edit.setMaximumHeight(150)
        layout.addWidget(self.cookie_edit)
        
        layout.addSpacing(20)
        
        btn_layout = QHBoxLayout()
        
        test_btn = QPushButton("测试连接")
        test_btn.clicked.connect(self.test_connection)
        test_btn.setStyleSheet("""
            QPushButton {
                background-color: #2196F3;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 4px;
                font-weight: bold;
            }
            QPushButton:hover {
                background-color: #1976D2;
            }
        """)
        btn_layout.addWidget(test_btn)
        
        btn_layout.addStretch()
        
        cancel_btn = QPushButton("取消")
        cancel_btn.clicked.connect(self.reject)
        cancel_btn.setStyleSheet("""
            QPushButton {
                background-color: #757575;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 4px;
            }
            QPushButton:hover {
                background-color: #616161;
            }
        """)
        btn_layout.addWidget(cancel_btn)
        
        save_btn = QPushButton("保存")
        save_btn.clicked.connect(self.save_settings)
        save_btn.setStyleSheet("""
            QPushButton {
                background-color: #4CAF50;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 4px;
                font-weight: bold;
            }
            QPushButton:hover {
                background-color: #45a049;
            }
        """)
        btn_layout.addWidget(save_btn)
        
        layout.addLayout(btn_layout)
    
    def test_connection(self):
        cookie = self.cookie_edit.toPlainText().strip()
        if not cookie:
            QMessageBox.warning(self, "提示", "请先输入 Cookie！")
            return
        
        QMessageBox.information(self, "提示", 
            "测试功能：Cookie 已输入。\n\n实际测试需要豆瓣解析模块，\n可以在解析时验证有效性。")
    
    def save_settings(self):
        cookie = self.cookie_edit.toPlainText().strip()
        self.cookie = cookie
        self.accept()
    
    def get_cookie(self):
        return self.cookie
