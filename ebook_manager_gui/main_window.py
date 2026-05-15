import os
import sys
from PyQt6.QtWidgets import (QMainWindow, QWidget, QVBoxLayout, QHBoxLayout, 
                             QTableWidget, QTableWidgetItem, QLineEdit, QLabel,
                             QPushButton, QMenuBar, QMenu, QHeaderView, QMessageBox,
                             QAbstractItemView)
from PyQt6.QtGui import QPixmap, QDesktopServices
from PyQt6.QtCore import Qt, QUrl

from database import Database
from ebook_parser import EbookParser
from import_window import ImportWindow
from detail_window import DetailWindow


class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.db = Database()
        self.parser = EbookParser()
        self.sort_column = 1
        self.sort_order = "ASC"
        self.current_search = ""
        self.init_ui()
        self.refresh_books()
    
    def init_ui(self):
        self.setWindowTitle("电子书管理器")
        self.setMinimumSize(1200, 800)
        
        central_widget = QWidget()
        self.setCentralWidget(central_widget)
        main_layout = QVBoxLayout(central_widget)
        
        self.create_menu_bar()
        
        search_layout = QHBoxLayout()
        search_layout.addWidget(QLabel("搜索:"))
        self.search_input = QLineEdit()
        self.search_input.setPlaceholderText("标题、作者、分类、ISBN...")
        self.search_input.textChanged.connect(self.on_search)
        search_layout.addWidget(self.search_input)
        main_layout.addLayout(search_layout)
        
        self.table = QTableWidget()
        self.table.setColumnCount(11)
        self.table.setHorizontalHeaderLabels([
            "封面", "标题", "副标题", "作者", "分类", 
            "文件大小", "物理位置", "扩展名", "ISBN", "评分", "豆瓣地址"
        ])
        
        self.table.setSelectionBehavior(QAbstractItemView.SelectionBehavior.SelectRows)
        self.table.setSelectionMode(QAbstractItemView.SelectionMode.SingleSelection)
        self.table.setEditTriggers(QAbstractItemView.EditTrigger.NoEditTriggers)
        
        header = self.table.horizontalHeader()
        header.setSectionResizeMode(0, QHeaderView.ResizeMode.Fixed)
        self.table.setColumnWidth(0, 80)
        header.setSectionResizeMode(1, QHeaderView.ResizeMode.Stretch)
        header.setSectionResizeMode(2, QHeaderView.ResizeMode.Stretch)
        
        self.table.verticalHeader().setDefaultSectionSize(100)
        
        self.table.horizontalHeader().sectionClicked.connect(self.on_header_clicked)
        self.table.cellClicked.connect(self.on_cell_clicked)
        self.table.cellDoubleClicked.connect(self.on_cell_double_clicked)
        
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
        books = self.db.get_all_books(
            sort_by=self.get_sort_column_name(self.sort_column),
            order=self.sort_order,
            search=self.current_search
        )
        
        self.table.setRowCount(len(books))
        
        for row, book in enumerate(books):
            self.set_book_row(row, book)
        
        self.status_label.setText(f"共 {len(books)} 本书")
    
    def set_book_row(self, row, book):
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
            cover_label.setText("无")
        self.table.setCellWidget(row, 0, cover_label)
        
        self.table.setItem(row, 1, QTableWidgetItem(str(book.get('title', ''))))
        self.table.setItem(row, 2, QTableWidgetItem(str(book.get('subtitle', ''))))
        self.table.setItem(row, 3, QTableWidgetItem(str(book.get('author', ''))))
        self.table.setItem(row, 4, QTableWidgetItem(str(book.get('category', ''))))
        
        file_size = book.get('file_size', 0)
        size_str = self.parser.format_file_size(file_size) if file_size else ''
        self.table.setItem(row, 5, QTableWidgetItem(size_str))
        
        self.table.setItem(row, 6, QTableWidgetItem(str(book.get('physical_path', ''))))
        self.table.setItem(row, 7, QTableWidgetItem(str(book.get('extension', ''))))
        self.table.setItem(row, 8, QTableWidgetItem(str(book.get('isbn', ''))))
        
        rating = book.get('rating', 0) or 0
        self.table.setItem(row, 9, QTableWidgetItem(str(rating) if rating > 0 else ''))
        
        self.table.setItem(row, 10, QTableWidgetItem(str(book.get('douban_url', ''))))
        
        self.table.item(row, 5).setTextAlignment(Qt.AlignmentFlag.AlignRight | Qt.AlignmentFlag.AlignVCenter)
        self.table.item(row, 9).setTextAlignment(Qt.AlignmentFlag.AlignCenter)
        
        self.table.item(row, 1).setData(Qt.ItemDataRole.UserRole, book)
    
    def get_sort_column_name(self, col):
        column_map = {
            1: 'title',
            2: 'subtitle',
            3: 'author',
            4: 'category',
            5: 'file_size',
            6: 'physical_path',
            7: 'extension',
            8: 'isbn',
            9: 'rating'
        }
        return column_map.get(col, 'title')
    
    def on_header_clicked(self, col):
        if col == 0:
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
        item = self.table.item(row, 1)
        if item:
            book = item.data(Qt.ItemDataRole.UserRole)
            if book:
                self.open_detail_window(book)
    
    def on_cell_double_clicked(self, row, col):
        item = self.table.item(row, 1)
        if item:
            book = item.data(Qt.ItemDataRole.UserRole)
            if book:
                self.open_book(book)
    
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
