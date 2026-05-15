import os
from PyQt6.QtWidgets import (QDialog, QVBoxLayout, QHBoxLayout, QFormLayout, 
                             QLabel, QLineEdit, QTextEdit, QSpinBox, QPushButton,
                             QMessageBox, QScrollArea, QWidget, QDoubleSpinBox)
from PyQt6.QtGui import QPixmap, QDesktopServices
from PyQt6.QtCore import Qt, QUrl


def safe_str(value):
    if value is None:
        return ''
    s = str(value).strip()
    if s.lower() in ['none', 'null', 'nan', '']:
        return ''
    return s


class DetailWindow(QDialog):
    def __init__(self, db, book_data, douban_parser=None, parent=None):
        super().__init__(parent)
        self.db = db
        self.book_data = book_data
        self.douban_parser = douban_parser
        self.is_editing = False
        self.init_ui()
    
    def init_ui(self):
        self.setWindowTitle("书籍详情")
        self.setMinimumSize(750, 750)
        
        main_layout = QVBoxLayout(self)
        
        scroll = QScrollArea()
        scroll.setWidgetResizable(True)
        scroll_content = QWidget()
        scroll_layout = QVBoxLayout(scroll_content)
        
        content_layout = QHBoxLayout()
        
        left_layout = QVBoxLayout()
        self.cover_label = QLabel()
        self.cover_label.setFixedSize(200, 300)
        self.cover_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.cover_label.setStyleSheet("border: 1px solid #ccc; background-color: #f5f5f5;")
        self.load_cover()
        left_layout.addWidget(self.cover_label)
        
        self.parse_btn = QPushButton("🔍 从豆瓣解析")
        self.parse_btn.setMinimumHeight(40)
        self.parse_btn.setStyleSheet("""
            QPushButton {
                background-color: #FF9800;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 6px;
                font-size: 13px;
                font-weight: bold;
            }
            QPushButton:hover {
                background-color: #F57C00;
            }
            QPushButton:pressed {
                background-color: #E65100;
            }
            QPushButton:disabled {
                background-color: #cccccc;
            }
        """)
        self.parse_btn.clicked.connect(self.parse_from_douban)
        left_layout.addWidget(self.parse_btn)
        
        self.open_btn = QPushButton("📖 打开书籍")
        self.open_btn.setMinimumHeight(40)
        self.open_btn.setStyleSheet("""
            QPushButton {
                background-color: #4CAF50;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 6px;
                font-size: 14px;
                font-weight: bold;
            }
            QPushButton:hover {
                background-color: #45a049;
            }
            QPushButton:pressed {
                background-color: #3d8b40;
            }
        """)
        self.open_btn.clicked.connect(self.open_book)
        left_layout.addWidget(self.open_btn)
        
        self.parse_status_label = QLabel()
        self.parse_status_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        left_layout.addWidget(self.parse_status_label)
        
        left_layout.addStretch()
        content_layout.addLayout(left_layout)
        
        right_layout = QVBoxLayout()
        form_layout = QFormLayout()
        
        self.title_edit = QLineEdit()
        self.subtitle_edit = QLineEdit()
        self.author_edit = QLineEdit()
        self.publisher_edit = QLineEdit()
        self.pubdate_edit = QLineEdit()
        self.category_edit = QLineEdit()
        self.file_size_edit = QLineEdit()
        self.physical_path_edit = QLineEdit()
        self.extension_edit = QLineEdit()
        self.isbn_edit = QLineEdit()
        self.rating_edit = QDoubleSpinBox()
        self.rating_edit.setRange(0, 10)
        self.rating_edit.setSingleStep(0.1)
        self.douban_url_edit = QLineEdit()
        self.douban_id_edit = QLineEdit()
        self.summary_edit = QTextEdit()
        self.summary_edit.setMaximumHeight(120)
        self.notes_edit = QTextEdit()
        self.notes_edit.setMaximumHeight(100)
        
        form_layout.addRow("标题:", self.title_edit)
        form_layout.addRow("副标题:", self.subtitle_edit)
        form_layout.addRow("作者:", self.author_edit)
        form_layout.addRow("出版社:", self.publisher_edit)
        form_layout.addRow("出版日期:", self.pubdate_edit)
        form_layout.addRow("分类:", self.category_edit)
        form_layout.addRow("文件大小:", self.file_size_edit)
        form_layout.addRow("物理位置:", self.physical_path_edit)
        form_layout.addRow("扩展名:", self.extension_edit)
        form_layout.addRow("ISBN:", self.isbn_edit)
        form_layout.addRow("评分:", self.rating_edit)
        form_layout.addRow("豆瓣ID:", self.douban_id_edit)
        form_layout.addRow("豆瓣地址:", self.douban_url_edit)
        form_layout.addRow("简介:", self.summary_edit)
        form_layout.addRow("备注:", self.notes_edit)
        
        right_layout.addLayout(form_layout)
        content_layout.addLayout(right_layout, 1)
        
        scroll_layout.addLayout(content_layout)
        scroll.setWidget(scroll_content)
        main_layout.addWidget(scroll)
        
        button_layout = QHBoxLayout()
        
        self.edit_btn = QPushButton("✏️ 修改")
        self.edit_btn.setMinimumHeight(35)
        self.edit_btn.setStyleSheet("""
            QPushButton {
                background-color: #2196F3;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                font-weight: bold;
            }
            QPushButton:hover {
                background-color: #1976D2;
            }
        """)
        self.edit_btn.clicked.connect(self.toggle_edit)
        button_layout.addWidget(self.edit_btn)
        
        self.delete_btn = QPushButton("🗑️ 删除")
        self.delete_btn.setMinimumHeight(35)
        self.delete_btn.setStyleSheet("""
            QPushButton {
                background-color: #f44336;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                font-weight: bold;
            }
            QPushButton:hover {
                background-color: #d32f2f;
            }
        """)
        self.delete_btn.clicked.connect(self.delete_book)
        button_layout.addWidget(self.delete_btn)
        
        self.save_btn = QPushButton("💾 保存")
        self.save_btn.setMinimumHeight(35)
        self.save_btn.setStyleSheet("""
            QPushButton {
                background-color: #4CAF50;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                font-weight: bold;
            }
            QPushButton:hover {
                background-color: #45a049;
            }
        """)
        self.save_btn.clicked.connect(self.save_changes)
        self.save_btn.hide()
        button_layout.addWidget(self.save_btn)
        
        self.cancel_btn = QPushButton("❌ 取消")
        self.cancel_btn.setMinimumHeight(35)
        self.cancel_btn.setStyleSheet("""
            QPushButton {
                background-color: #9E9E9E;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                font-weight: bold;
            }
            QPushButton:hover {
                background-color: #757575;
            }
        """)
        self.cancel_btn.clicked.connect(self.cancel_edit)
        self.cancel_btn.hide()
        button_layout.addWidget(self.cancel_btn)
        
        button_layout.addStretch()
        
        close_btn = QPushButton("关闭")
        close_btn.setMinimumHeight(35)
        close_btn.clicked.connect(self.accept)
        button_layout.addWidget(close_btn)
        
        main_layout.addLayout(button_layout)
        
        self.load_data()
        self.set_read_only(True)
        self.update_parse_status()
    
    def load_cover(self):
        cover_path = self.book_data.get('cover_path')
        if cover_path and os.path.exists(cover_path):
            pixmap = QPixmap(cover_path)
            self.cover_label.setPixmap(pixmap.scaled(
                self.cover_label.size(), 
                Qt.AspectRatioMode.KeepAspectRatio,
                Qt.TransformationMode.SmoothTransformation
            ))
        else:
            self.cover_label.setText("无封面")
    
    def load_data(self):
        self.title_edit.setText(safe_str(self.book_data.get('title')))
        self.subtitle_edit.setText(safe_str(self.book_data.get('subtitle')))
        self.author_edit.setText(safe_str(self.book_data.get('author')))
        self.publisher_edit.setText(safe_str(self.book_data.get('publisher')))
        self.pubdate_edit.setText(safe_str(self.book_data.get('pubdate')))
        self.category_edit.setText(safe_str(self.book_data.get('category')))
        
        file_size = self.book_data.get('file_size', 0)
        if file_size:
            from ebook_parser import EbookParser
            parser = EbookParser()
            self.file_size_edit.setText(parser.format_file_size(file_size))
        else:
            self.file_size_edit.setText('')
        
        self.physical_path_edit.setText(safe_str(self.book_data.get('physical_path')))
        self.extension_edit.setText(safe_str(self.book_data.get('extension')))
        self.isbn_edit.setText(safe_str(self.book_data.get('isbn')))
        rating = self.book_data.get('rating', 0) or 0
        self.rating_edit.setValue(float(rating))
        self.douban_id_edit.setText(safe_str(self.book_data.get('douban_id')))
        self.douban_url_edit.setText(safe_str(self.book_data.get('douban_url')))
        self.summary_edit.setText(safe_str(self.book_data.get('summary')))
        self.notes_edit.setText(safe_str(self.book_data.get('notes')))
    
    def update_parse_status(self):
        parse_status = self.book_data.get('parse_status', '')
        if parse_status == 'success':
            self.parse_status_label.setText("✅ 已从豆瓣解析")
            self.parse_status_label.setStyleSheet("color: #4CAF50; font-weight: bold;")
            self.parse_btn.setText("🔄 重新从豆瓣解析")
        elif parse_status == 'parsing':
            self.parse_status_label.setText("⏳ 正在解析中...")
            self.parse_status_label.setStyleSheet("color: #FF9800; font-weight: bold;")
            self.parse_btn.setEnabled(False)
        elif parse_status == 'failed':
            self.parse_status_label.setText("❌ 解析失败")
            self.parse_status_label.setStyleSheet("color: #f44336; font-weight: bold;")
            self.parse_btn.setText("🔄 重新从豆瓣解析")
        else:
            self.parse_status_label.setText("")
    
    def set_read_only(self, read_only: bool):
        self.title_edit.setReadOnly(read_only)
        self.subtitle_edit.setReadOnly(read_only)
        self.author_edit.setReadOnly(read_only)
        self.publisher_edit.setReadOnly(read_only)
        self.pubdate_edit.setReadOnly(read_only)
        self.category_edit.setReadOnly(read_only)
        self.file_size_edit.setReadOnly(read_only)
        self.physical_path_edit.setReadOnly(read_only)
        self.extension_edit.setReadOnly(read_only)
        self.isbn_edit.setReadOnly(read_only)
        self.rating_edit.setReadOnly(read_only)
        self.douban_id_edit.setReadOnly(read_only)
        self.douban_url_edit.setReadOnly(read_only)
        self.summary_edit.setReadOnly(read_only)
        self.notes_edit.setReadOnly(read_only)
    
    def toggle_edit(self):
        self.is_editing = not self.is_editing
        self.set_read_only(not self.is_editing)
        
        if self.is_editing:
            self.edit_btn.hide()
            self.delete_btn.hide()
            self.parse_btn.hide()
            self.save_btn.show()
            self.cancel_btn.show()
        else:
            self.edit_btn.show()
            self.delete_btn.show()
            self.parse_btn.show()
            self.save_btn.hide()
            self.cancel_btn.hide()
    
    def cancel_edit(self):
        self.load_data()
        self.toggle_edit()
    
    def save_changes(self):
        new_data = {
            'title': self.title_edit.text(),
            'subtitle': self.subtitle_edit.text(),
            'author': self.author_edit.text(),
            'publisher': self.publisher_edit.text(),
            'pubdate': self.pubdate_edit.text(),
            'category': self.category_edit.text(),
            'extension': self.extension_edit.text(),
            'isbn': self.isbn_edit.text(),
            'rating': self.rating_edit.value(),
            'douban_id': self.douban_id_edit.text(),
            'douban_url': self.douban_url_edit.text(),
            'summary': self.summary_edit.toPlainText(),
            'notes': self.notes_edit.toPlainText()
        }
        
        if self.db.update_book(self.book_data['id'], new_data):
            QMessageBox.information(self, "成功", "保存成功！")
            self.book_data.update(new_data)
            self.toggle_edit()
            if self.parent():
                self.parent().refresh_books()
        else:
            QMessageBox.warning(self, "失败", "保存失败！")
    
    def parse_from_douban(self):
        if not self.douban_parser:
            QMessageBox.warning(self, "提示", "解析器未初始化！")
            return
        
        if not self.douban_parser.has_cookie():
            QMessageBox.warning(self, "提示", "请先在设置中配置豆瓣 Cookie！")
            return
        
        reply = QMessageBox.question(
            self, "确认解析",
            f"确定要从豆瓣解析《{self.book_data.get('title', '未知')}》的信息吗？\n（可能需要几秒钟时间）",
            QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No
        )
        
        if reply == QMessageBox.StandardButton.Yes:
            self.parse_btn.setEnabled(False)
            self.parse_status_label.setText("⏳ 正在解析中...")
            self.parse_status_label.setStyleSheet("color: #FF9800; font-weight: bold;")
            
            self.db.update_book(self.book_data['id'], {'parse_status': 'parsing'})
            
            self.douban_parser.add_to_queue(
                self.book_data['id'],
                self.book_data,
                self.on_parse_complete
            )
    
    def on_parse_complete(self, result, error):
        self.parse_btn.setEnabled(True)
        
        if result and 'book_id' in result:
            update_data = {
                'parse_status': 'success',
                'last_parsed_at': 'CURRENT_TIMESTAMP'
            }
            
            if 'title' in result:
                update_data['title'] = result['title']
            if 'subtitle' in result:
                update_data['subtitle'] = result['subtitle']
            if 'author' in result:
                update_data['author'] = result['author']
            if 'isbn' in result:
                update_data['isbn'] = result['isbn']
            if 'rating' in result:
                update_data['rating'] = result['rating']
            if 'douban_url' in result:
                update_data['douban_url'] = result['douban_url']
            if 'douban_id' in result:
                update_data['douban_id'] = result['douban_id']
            if 'publisher' in result:
                update_data['publisher'] = result['publisher']
            if 'pubdate' in result:
                update_data['pubdate'] = result['pubdate']
            if 'summary' in result:
                update_data['summary'] = result['summary']
            if 'cover_path' in result:
                update_data['cover_path'] = result['cover_path']
            
            self.db.update_book(self.book_data['id'], update_data)
            self.book_data.update(update_data)
            
            self.load_data()
            self.load_cover()
            self.update_parse_status()
            
            QMessageBox.information(self, "成功", "豆瓣解析完成！")
            
            if self.parent():
                self.parent().refresh_books()
        else:
            self.db.update_book(self.book_data['id'], {'parse_status': 'failed'})
            self.book_data['parse_status'] = 'failed'
            self.update_parse_status()
            QMessageBox.warning(self, "失败", f"解析失败：{error or '未知错误'}")
    
    def delete_book(self):
        reply = QMessageBox.question(
            self, "确认删除", 
            "确定要删除这本书吗？\n（只会删除记录，不会删除文件）",
            QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No
        )
        
        if reply == QMessageBox.StandardButton.Yes:
            if self.db.delete_book(self.book_data['id']):
                QMessageBox.information(self, "成功", "删除成功！")
                if self.parent():
                    self.parent().refresh_books()
                self.accept()
            else:
                QMessageBox.warning(self, "失败", "删除失败！")
    
    def open_book(self):
        filepath = self.book_data.get('physical_path')
        if filepath and os.path.exists(filepath):
            QDesktopServices.openUrl(QUrl.fromLocalFile(filepath))
        else:
            QMessageBox.warning(self, "错误", "文件不存在！")
