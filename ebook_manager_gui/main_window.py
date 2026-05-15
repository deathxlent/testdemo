import os
import sys
from PyQt6.QtWidgets import (QMainWindow, QWidget, QVBoxLayout, QHBoxLayout, 
                             QTableWidget, QTableWidgetItem, QLineEdit, QLabel,
                             QPushButton, QMenuBar, QMenu, QHeaderView, QMessageBox,
                             QAbstractItemView, QCheckBox)
from PyQt6.QtGui import QPixmap, QDesktopServices
from PyQt6.QtCore import Qt, QUrl

from database import Database
from ebook_parser import EbookParser
from import_window import ImportWindow
from detail_window import DetailWindow


def safe_str(value):
    if value is None:
        return ''
    s = str(value).strip()
    if s.lower() in ['none', 'null', 'nan', '']:
        return ''
    return s


class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.db = Database()
        self.parser = EbookParser()
        self.sort_column = 2
        self.sort_order = "ASC"
        self.current_search = ""
        self.books_data = []
        self.init_ui()
        self.refresh_books()
    
    def init_ui(self):
        self.setWindowTitle("电子书管理器")
        self.setMinimumSize(1450, 850)
        
        central_widget = QWidget()
        self.setCentralWidget(central_widget)
        main_layout = QVBoxLayout(central_widget)
        
        self.create_menu_bar()
        
        top_layout = QHBoxLayout()
        top_layout.addWidget(QLabel("搜索:"))
        self.search_input = QLineEdit()
        self.search_input.setPlaceholderText("标题、作者、分类、ISBN...")
        self.search_input.textChanged.connect(self.on_search)
        top_layout.addWidget(self.search_input, 1)
        
        self.select_all_btn = QPushButton("☑️ 全选")
        self.select_all_btn.setMinimumHeight(35)
        self.select_all_btn.clicked.connect(self.toggle_select_all)
        top_layout.addWidget(self.select_all_btn)
        
        self.batch_delete_btn = QPushButton("🗑️ 批量删除选中")
        self.batch_delete_btn.setMinimumHeight(35)
        self.batch_delete_btn.setStyleSheet("""
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
            QPushButton:disabled {
                background-color: #cccccc;
            }
        """)
        self.batch_delete_btn.clicked.connect(self.batch_delete)
        self.batch_delete_btn.setEnabled(False)
        top_layout.addWidget(self.batch_delete_btn)
        
        main_layout.addLayout(top_layout)
        
        self.table = QTableWidget()
        self.table.setColumnCount(13)
        self.table.setHorizontalHeaderLabels([
            "", "封面", "标题", "副标题", "作者", "分类", 
            "文件大小", "物理位置", "扩展名", "ISBN", "评分", "豆瓣地址", "操作"
        ])
        
        self.table.setSelectionBehavior(QAbstractItemView.SelectionBehavior.SelectRows)
        self.table.setSelectionMode(QAbstractItemView.SelectionMode.SingleSelection)
        self.table.setEditTriggers(QAbstractItemView.EditTrigger.NoEditTriggers)
        
        header = self.table.horizontalHeader()
        header.setSectionResizeMode(0, QHeaderView.ResizeMode.Fixed)
        self.table.setColumnWidth(0, 45)
        header.setSectionResizeMode(1, QHeaderView.ResizeMode.Fixed)
        self.table.setColumnWidth(1, 80)
        header.setSectionResizeMode(2, QHeaderView.ResizeMode.Stretch)
        header.setSectionResizeMode(3, QHeaderView.ResizeMode.Stretch)
        header.setSectionResizeMode(12, QHeaderView.ResizeMode.Fixed)
        self.table.setColumnWidth(12, 150)
        
        self.table.verticalHeader().setDefaultSectionSize(100)
        
        self.table.horizontalHeader().sectionClicked.connect(self.on_header_clicked)
        self.table.cellClicked.connect(self.on_cell_clicked)
        
        main_layout.addWidget(self.table)
        
        self.status_label = QLabel("就绪")
        main_layout.addWidget(self.status_label)
    
    def create_menu_bar(self):
        menubar = self.menuBar()
        
        file_menu = menubar.addMenu("文件")
        
        import_action = file_menu.addAction("导入电子书")
        import_action.triggered.connect(self.open_import_window)
        
        file_menu.addSeparator()
        
        exit_action = file_menu.addAction("退出")
        exit_action.triggered.connect(self.close)
        
        help_menu = menubar.addMenu("帮助")
        about_action = help_menu.addAction("关于")
        about_action.triggered.connect(self.show_about)
    
    def refresh_books(self):
        self.books_data = self.db.get_all_books(
            sort_by=self.get_sort_column_name(self.sort_column),
            order=self.sort_order,
            search=self.current_search
        )
        
        self.table.setRowCount(len(self.books_data))
        
        for row, book in enumerate(self.books_data):
            self.set_book_row(row, book)
        
        self.status_label.setText(f"共 {len(self.books_data)} 本书")
        self.update_delete_button_state()
    
    def set_book_row(self, row, book):
        checkbox_widget = QWidget()
        checkbox_layout = QHBoxLayout(checkbox_widget)
        checkbox_layout.setContentsMargins(15, 0, 0, 0)
        checkbox_layout.setAlignment(Qt.AlignmentFlag.AlignCenter)
        
        checkbox = QCheckBox()
        checkbox.setChecked(False)
        checkbox.stateChanged.connect(lambda state, r=row: self.on_checkbox_changed(r, state))
        checkbox_layout.addWidget(checkbox)
        
        self.table.setCellWidget(row, 0, checkbox_widget)
        
        cover_label = QLabel()
        cover_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        cover_path = book.get('cover_path')
        if cover_path and os.path.exists(cover_path):
            pixmap = QPixmap(cover_path)
            cover_label.setPixmap(pixmap.scaled(
                60, 80, 
                Qt.AspectRatioMode.KeepAspectRatio,
                Qt.TransformationMode.SmoothTransformation
            ))
        else:
            cover_label.setText("")
        self.table.setCellWidget(row, 1, cover_label)
        
        self.table.setItem(row, 2, QTableWidgetItem(safe_str(book.get('title'))))
        self.table.setItem(row, 3, QTableWidgetItem(safe_str(book.get('subtitle'))))
        self.table.setItem(row, 4, QTableWidgetItem(safe_str(book.get('author'))))
        self.table.setItem(row, 5, QTableWidgetItem(safe_str(book.get('category'))))
        
        file_size = book.get('file_size', 0)
        size_str = self.parser.format_file_size(file_size) if file_size else ''
        self.table.setItem(row, 6, QTableWidgetItem(size_str))
        
        self.table.setItem(row, 7, QTableWidgetItem(safe_str(book.get('physical_path'))))
        self.table.setItem(row, 8, QTableWidgetItem(safe_str(book.get('extension'))))
        self.table.setItem(row, 9, QTableWidgetItem(safe_str(book.get('isbn'))))
        
        rating = book.get('rating', 0) or 0
        self.table.setItem(row, 10, QTableWidgetItem(str(rating) if rating > 0 else ''))
        
        self.table.setItem(row, 11, QTableWidgetItem(safe_str(book.get('douban_url'))))
        
        btn_widget = QWidget()
        btn_layout = QHBoxLayout(btn_widget)
        btn_layout.setContentsMargins(5, 0, 5, 0)
        btn_layout.setSpacing(8)
        
        open_btn = QPushButton("📖 打开")
        open_btn.setMinimumWidth(70)
        open_btn.setStyleSheet("""
            QPushButton {
                background-color: #4CAF50;
                color: white;
                border: none;
                padding: 6px 12px;
                border-radius: 4px;
                font-weight: bold;
            }
            QPushButton:hover {
                background-color: #45a049;
            }
            QPushButton:pressed {
                background-color: #3d8b40;
            }
        """)
        open_btn.clicked.connect(lambda checked, b=book: self.open_book(b))
        btn_layout.addWidget(open_btn)
        
        detail_btn = QPushButton("✏️")
        detail_btn.setToolTip("查看/编辑详情")
        detail_btn.setMinimumWidth(40)
        detail_btn.setStyleSheet("""
            QPushButton {
                background-color: #2196F3;
                color: white;
                border: none;
                padding: 6px 10px;
                border-radius: 4px;
            }
            QPushButton:hover {
                background-color: #1976D2;
            }
        """)
        detail_btn.clicked.connect(lambda checked, b=book: self.open_detail_window(b))
        btn_layout.addWidget(detail_btn)
        
        self.table.setCellWidget(row, 12, btn_widget)
        
        if self.table.item(row, 6):
            self.table.item(row, 6).setTextAlignment(Qt.AlignmentFlag.AlignRight | Qt.AlignmentFlag.AlignVCenter)
        if self.table.item(row, 10):
            self.table.item(row, 10).setTextAlignment(Qt.AlignmentFlag.AlignCenter)
        
        self.table.item(row, 2).setData(Qt.ItemDataRole.UserRole, book)
    
    def get_sort_column_name(self, col):
        column_map = {
            2: 'title',
            3: 'subtitle',
            4: 'author',
            5: 'category',
            6: 'file_size',
            7: 'physical_path',
            8: 'extension',
            9: 'isbn',
            10: 'rating'
        }
        return column_map.get(col, 'title')
    
    def on_header_clicked(self, col):
        if col in [0, 1, 12]:
            return
        
        if self.sort_column == col:
            self.sort_order = "DESC" if self.sort_order == "ASC" else "ASC"
        else:
            self.sort_column = col
            self.sort_order = "ASC"
        
        self.refresh_books()
    
    def on_search(self):
        self.current_search = self.search_input.text()
        self.refresh_books()
    
    def on_cell_clicked(self, row, col):
        if col == 0:
            return
        item = self.table.item(row, 2)
        if item:
            book = item.data(Qt.ItemDataRole.UserRole)
            if book:
                self.open_detail_window(book)
    
    def on_checkbox_changed(self, row, state):
        self.update_delete_button_state()
    
    def get_checked_rows(self):
        checked_rows = []
        for row in range(self.table.rowCount()):
            widget = self.table.cellWidget(row, 0)
            if widget:
                checkbox = widget.findChild(QCheckBox)
                if checkbox and checkbox.isChecked():
                    checked_rows.append(row)
        return checked_rows
    
    def update_delete_button_state(self):
        checked_count = len(self.get_checked_rows())
        self.batch_delete_btn.setEnabled(checked_count > 0)
        if checked_count > 0:
            self.status_label.setText(f"共 {len(self.books_data)} 本书，已选中 {checked_count} 本")
        else:
            self.status_label.setText(f"共 {len(self.books_data)} 本书")
    
    def toggle_select_all(self):
        checked_rows = self.get_checked_rows()
        all_checked = len(checked_rows) == self.table.rowCount()
        
        for row in range(self.table.rowCount()):
            widget = self.table.cellWidget(row, 0)
            if widget:
                checkbox = widget.findChild(QCheckBox)
                if checkbox:
                    checkbox.setChecked(not all_checked)
        
        self.update_delete_button_state()
    
    def batch_delete(self):
        checked_rows = self.get_checked_rows()
        if not checked_rows:
            return
        
        count = len(checked_rows)
        reply = QMessageBox.question(
            self, "确认批量删除", 
            f"确定要删除选中的 {count} 本书吗？\n（只会删除记录，不会删除文件）",
            QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No
        )
        
        if reply == QMessageBox.StandardButton.Yes:
            deleted_count = 0
            for row in sorted(checked_rows, reverse=True):
                item = self.table.item(row, 2)
                if item:
                    book = item.data(Qt.ItemDataRole.UserRole)
                    if book and self.db.delete_book(book['id']):
                        deleted_count += 1
            
            QMessageBox.information(self, "成功", f"已成功删除 {deleted_count} 本书！")
            self.refresh_books()
    
    def open_book(self, book):
        filepath = book.get('physical_path')
        if filepath and os.path.exists(filepath):
            QDesktopServices.openUrl(QUrl.fromLocalFile(filepath))
        else:
            QMessageBox.warning(self, "错误", "文件不存在！")
    
    def open_import_window(self):
        dialog = ImportWindow(self.db, self.parser, self)
        dialog.exec()
    
    def open_detail_window(self, book):
        dialog = DetailWindow(self.db, book, self)
        dialog.exec()
    
    def show_about(self):
        QMessageBox.about(
            self, "关于电子书管理器",
            "电子书管理器 v1.0\n\n"
            "支持 EPUB、MOBI、AZW3 格式\n"
            "跨平台支持 Windows、Linux、Mac"
        )


def main():
    from PyQt6.QtWidgets import QApplication
    app = QApplication(sys.argv)
    window = MainWindow()
    window.show()
    sys.exit(app.exec())


if __name__ == "__main__":
    main()
