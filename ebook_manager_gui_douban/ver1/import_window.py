import os
from PyQt6.QtWidgets import (QDialog, QVBoxLayout, QHBoxLayout, QLabel, 
                             QPushButton, QFileDialog, QProgressBar, QMessageBox,
                             QListWidget, QListWidgetItem)
from PyQt6.QtCore import Qt, QMimeData, QThread, pyqtSignal
from PyQt6.QtGui import QDragEnterEvent, QDropEvent


class ImportWorker(QThread):
    progress_updated = pyqtSignal(int, str)
    import_finished = pyqtSignal(int, int)
    
    def __init__(self, db, parser, paths):
        super().__init__()
        self.db = db
        self.parser = parser
        self.paths = paths
    
    def run(self):
        imported = 0
        skipped = 0
        total_files = []
        
        for path in self.paths:
            if os.path.isdir(path):
                books = self.parser.scan_directory(path)
                total_files.extend(books)
            elif os.path.isfile(path) and self.parser.is_supported_file(path):
                total_files.append(path)
        
        total = len(total_files)
        
        for i, filepath in enumerate(total_files):
            self.progress_updated.emit(int((i + 1) / total * 100), f"正在导入: {os.path.basename(filepath)}")
            
            if self.db.book_exists(filepath):
                skipped += 1
                continue
            
            book_data = self.parser.parse_book(filepath)
            if book_data:
                book_id = self.db.add_book(book_data)
                if book_id > 0:
                    imported += 1
                else:
                    skipped += 1
        
        self.import_finished.emit(imported, skipped)


class ImportWindow(QDialog):
    def __init__(self, db, parser, parent=None):
        super().__init__(parent)
        self.db = db
        self.parser = parser
        self.paths_to_import = []
        self.init_ui()
    
    def init_ui(self):
        self.setWindowTitle("导入电子书")
        self.setMinimumSize(600, 500)
        self.setAcceptDrops(True)
        
        layout = QVBoxLayout(self)
        
        drop_label = QLabel("拖拽文件或文件夹到这里\n或点击下方按钮选择")
        drop_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        drop_label.setStyleSheet("""
            QLabel {
                border: 2px dashed #999;
                border-radius: 10px;
                padding: 40px;
                font-size: 16px;
                color: #666;
                background-color: #fafafa;
            }
        """)
        drop_label.setMinimumHeight(150)
        layout.addWidget(drop_label)
        
        add_btn_layout = QHBoxLayout()
        
        self.add_file_btn = QPushButton("+ 选择文件")
        self.add_file_btn.setMinimumHeight(40)
        self.add_file_btn.clicked.connect(self.select_files)
        add_btn_layout.addWidget(self.add_file_btn)
        
        self.add_dir_btn = QPushButton("+ 选择文件夹")
        self.add_dir_btn.setMinimumHeight(40)
        self.add_dir_btn.clicked.connect(self.select_directory)
        add_btn_layout.addWidget(self.add_dir_btn)
        
        layout.addLayout(add_btn_layout)
        
        layout.addWidget(QLabel("待导入列表:"))
        
        self.path_list = QListWidget()
        layout.addWidget(self.path_list)
        
        self.progress_bar = QProgressBar()
        self.progress_bar.hide()
        layout.addWidget(self.progress_bar)
        
        self.status_label = QLabel("")
        layout.addWidget(self.status_label)
        
        btn_layout = QHBoxLayout()
        
        self.clear_btn = QPushButton("清空列表")
        self.clear_btn.clicked.connect(self.clear_list)
        btn_layout.addWidget(self.clear_btn)
        
        btn_layout.addStretch()
        
        self.import_btn = QPushButton("开始导入")
        self.import_btn.clicked.connect(self.start_import)
        btn_layout.addWidget(self.import_btn)
        
        cancel_btn = QPushButton("关闭")
        cancel_btn.clicked.connect(self.accept)
        btn_layout.addWidget(cancel_btn)
        
        layout.addLayout(btn_layout)
    
    def dragEnterEvent(self, event: QDragEnterEvent):
        if event.mimeData().hasUrls():
            event.acceptProposedAction()
    
    def dropEvent(self, event: QDropEvent):
        for url in event.mimeData().urls():
            path = url.toLocalFile()
            if path and path not in self.paths_to_import:
                self.paths_to_import.append(path)
                self.update_path_list()
    
    def select_files(self):
        files, _ = QFileDialog.getOpenFileNames(
            self, "选择电子书文件", "", 
            "电子书 (*.epub *.mobi *.azw3 *.azw);;所有文件 (*.*)"
        )
        for file in files:
            if file not in self.paths_to_import:
                self.paths_to_import.append(file)
        self.update_path_list()
    
    def select_directory(self):
        dir_path = QFileDialog.getExistingDirectory(self, "选择文件夹")
        if dir_path and dir_path not in self.paths_to_import:
            self.paths_to_import.append(dir_path)
            self.update_path_list()
    
    def update_path_list(self):
        self.path_list.clear()
        for path in self.paths_to_import:
            item = QListWidgetItem(path)
            if os.path.isdir(path):
                item.setIcon(self.style().standardIcon(self.style().StandardPixmap.SP_DirIcon))
            else:
                item.setIcon(self.style().standardIcon(self.style().StandardPixmap.SP_FileIcon))
            self.path_list.addItem(item)
    
    def clear_list(self):
        self.paths_to_import.clear()
        self.path_list.clear()
    
    def start_import(self):
        if not self.paths_to_import:
            QMessageBox.warning(self, "提示", "请先选择要导入的文件或文件夹！")
            return
        
        self.progress_bar.show()
        self.progress_bar.setValue(0)
        self.import_btn.setEnabled(False)
        self.add_file_btn.setEnabled(False)
        self.add_dir_btn.setEnabled(False)
        self.clear_btn.setEnabled(False)
        
        self.worker = ImportWorker(self.db, self.parser, self.paths_to_import)
        self.worker.progress_updated.connect(self.update_progress)
        self.worker.import_finished.connect(self.import_completed)
        self.worker.start()
    
    def update_progress(self, value, message):
        self.progress_bar.setValue(value)
        self.status_label.setText(message)
    
    def import_completed(self, imported, skipped):
        self.progress_bar.hide()
        self.import_btn.setEnabled(True)
        self.add_file_btn.setEnabled(True)
        self.add_dir_btn.setEnabled(True)
        self.clear_btn.setEnabled(True)
        self.status_label.setText("")
        
        QMessageBox.information(
            self, "导入完成", 
            f"导入成功: {imported} 本\n已存在跳过: {skipped} 本"
        )
        
        self.clear_list()
        self.parent().refresh_books()
