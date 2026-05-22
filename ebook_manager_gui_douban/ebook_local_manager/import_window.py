import os
from PyQt6.QtWidgets import (QDialog, QVBoxLayout, QHBoxLayout, QLabel, QPushButton,
                             QFileDialog, QProgressBar, QTextEdit, QMessageBox)
from PyQt6.QtCore import Qt, QThread, pyqtSignal
from PyQt6.QtGui import QDragEnterEvent, QDropEvent


class ImportThread(QThread):
    progress_signal = pyqtSignal(int, int, str)
    finished_signal = pyqtSignal(int, list)
    error_signal = pyqtSignal(str)

    def __init__(self, db, parser, files):
        super().__init__()
        self.db = db
        self.parser = parser
        self.files = files

    def run(self):
        total = len(self.files)
        imported = []
        skipped = []

        for i, filepath in enumerate(self.files):
            try:
                if not os.path.exists(filepath):
                    skipped.append(filepath)
                    self.progress_signal.emit(i + 1, total, f"跳过不存在的文件: {filepath}")
                    continue

                if not self.parser.is_supported_file(filepath):
                    skipped.append(filepath)
                    self.progress_signal.emit(i + 1, total, f"跳过不支持的格式: {filepath}")
                    continue

                if self.db.book_exists(filepath):
                    skipped.append(filepath)
                    self.progress_signal.emit(i + 1, total, f"跳过已存在的书籍: {filepath}")
                    continue

                book_data = self.parser.parse_book(filepath)
                if book_data:
                    book_id = self.db.add_book(book_data)
                    if book_id > 0:
                        imported.append(book_data)
                        self.progress_signal.emit(i + 1, total, f"已导入: {book_data.get('title', filepath)}")
                    else:
                        skipped.append(filepath)
                        self.progress_signal.emit(i + 1, total, f"添加失败: {filepath}")
            except Exception as e:
                skipped.append(filepath)
                self.progress_signal.emit(i + 1, total, f"错误: {filepath} - {str(e)}")

        self.finished_signal.emit(len(imported), imported)


class ImportWindow(QDialog):
    def __init__(self, db, parser, parent=None):
        super().__init__(parent)
        self.db = db
        self.parser = parser
        self.files_to_import = []
        self.import_thread = None
        self.init_ui()

    def init_ui(self):
        self.setWindowTitle("导入电子书")
        self.setMinimumSize(700, 550)
        self.setModal(True)

        self.setAcceptDrops(True)

        layout = QVBoxLayout(self)

        self.drop_label = QLabel("拖拽文件或文件夹到此处\n\n支持格式: EPUB, PDF")
        self.drop_label.setStyleSheet("""
            QLabel {
                border: 2px dashed #999;
                border-radius: 10px;
                padding: 40px;
                background-color: #f9f9f9;
                font-size: 14px;
                color: #666;
            }
        """)
        self.drop_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.drop_label.setMinimumHeight(150)
        self.drop_label.setAcceptDrops(True)
        layout.addWidget(self.drop_label)

        btn_layout = QHBoxLayout()

        self.select_files_btn = QPushButton("📁 选择文件")
        self.select_files_btn.setMinimumHeight(40)
        self.select_files_btn.setMinimumWidth(150)
        self.select_files_btn.setStyleSheet("""
            QPushButton {
                background-color: #2196F3;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 6px;
                font-weight: bold;
                font-size: 14px;
            }
            QPushButton:hover {
                background-color: #1976D2;
            }
        """)
        self.select_files_btn.clicked.connect(self.select_files)
        btn_layout.addWidget(self.select_files_btn)

        self.select_folder_btn = QPushButton("📂 选择文件夹")
        self.select_folder_btn.setMinimumHeight(40)
        self.select_folder_btn.setMinimumWidth(150)
        self.select_folder_btn.setStyleSheet("""
            QPushButton {
                background-color: #2196F3;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 6px;
                font-weight: bold;
                font-size: 14px;
            }
            QPushButton:hover {
                background-color: #1976D2;
            }
        """)
        self.select_folder_btn.clicked.connect(self.select_folder)
        btn_layout.addWidget(self.select_folder_btn)

        layout.addLayout(btn_layout)

        self.file_list_label = QLabel("尚未选择文件")
        self.file_list_label.setWordWrap(True)
        self.file_list_label.setStyleSheet("color: #666; padding: 10px;")
        layout.addWidget(self.file_list_label)

        self.progress_bar = QProgressBar()
        self.progress_bar.setVisible(False)
        layout.addWidget(self.progress_bar)

        self.log_text = QTextEdit()
        self.log_text.setVisible(False)
        self.log_text.setMaximumHeight(150)
        layout.addWidget(self.log_text)

        action_layout = QHBoxLayout()

        self.import_btn = QPushButton("🚀 开始导入")
        self.import_btn.setMinimumHeight(45)
        self.import_btn.setMinimumWidth(150)
        self.import_btn.setStyleSheet("""
            QPushButton {
                background-color: #4CAF50;
                color: white;
                border: none;
                padding: 12px 30px;
                border-radius: 6px;
                font-weight: bold;
                font-size: 15px;
            }
            QPushButton:hover {
                background-color: #45a049;
            }
            QPushButton:disabled {
                background-color: #cccccc;
            }
        """)
        self.import_btn.clicked.connect(self.start_import)
        self.import_btn.setEnabled(False)
        action_layout.addWidget(self.import_btn)

        self.cancel_btn = QPushButton("取消")
        self.cancel_btn.setMinimumHeight(45)
        self.cancel_btn.setMinimumWidth(150)
        self.cancel_btn.setStyleSheet("""
            QPushButton {
                background-color: #999;
                color: white;
                border: none;
                padding: 12px 30px;
                border-radius: 6px;
                font-weight: bold;
                font-size: 15px;
            }
            QPushButton:hover {
                background-color: #777;
            }
        """)
        self.cancel_btn.clicked.connect(self.close)
        action_layout.addWidget(self.cancel_btn)

        layout.addLayout(action_layout)

    def dragEnterEvent(self, event: QDragEnterEvent):
        if event.mimeData().hasUrls():
            event.acceptProposedAction()
            self.drop_label.setStyleSheet("""
                QLabel {
                    border: 3px solid #4CAF50;
                    border-radius: 10px;
                    padding: 40px;
                    background-color: #e8f5e9;
                    font-size: 14px;
                    color: #2E7D32;
                    font-weight: bold;
                }
            """)

    def dragLeaveEvent(self, event):
        self.drop_label.setStyleSheet("""
            QLabel {
                border: 2px dashed #999;
                border-radius: 10px;
                padding: 40px;
                background-color: #f9f9f9;
                font-size: 14px;
                color: #666;
            }
        """)

    def dropEvent(self, event: QDropEvent):
        event.acceptProposedAction()
        self.drop_label.setStyleSheet("""
            QLabel {
                border: 2px dashed #999;
                border-radius: 10px;
                padding: 40px;
                background-color: #f9f9f9;
                font-size: 14px;
                color: #666;
            }
        """)

        if event.mimeData().hasUrls():
            urls = event.mimeData().urls()
            files = []
            for url in urls:
                path = url.toLocalFile()
                if os.path.isdir(path):
                    books = self.parser.scan_directory(path)
                    files.extend(books)
                elif os.path.isfile(path):
                    if self.parser.is_supported_file(path):
                        files.append(path)

            if files:
                existing_files = set(self.files_to_import)
                for f in files:
                    if f not in existing_files:
                        self.files_to_import.append(f)
                self.update_file_list()
            else:
                QMessageBox.warning(self, "提示", "拖拽的内容中没有找到支持的电子书文件！")

    def select_files(self):
        files, _ = QFileDialog.getOpenFileNames(
            self,
            "选择电子书文件",
            "",
            "电子书文件 (*.epub *.pdf);;EPUB 文件 (*.epub);;PDF 文件 (*.pdf)"
        )
        if files:
            existing_files = set(self.files_to_import)
            for f in files:
                if f not in existing_files:
                    self.files_to_import.append(f)
            self.update_file_list()

    def select_folder(self):
        folder = QFileDialog.getExistingDirectory(self, "选择文件夹")
        if folder:
            books = self.parser.scan_directory(folder)
            if books:
                existing_files = set(self.files_to_import)
                for f in books:
                    if f not in existing_files:
                        self.files_to_import.append(f)
                self.update_file_list()
            else:
                QMessageBox.warning(self, "提示", "该文件夹中没有找到支持的电子书文件！")

    def update_file_list(self):
        count = len(self.files_to_import)
        if count > 0:
            self.file_list_label.setText(f"已选择 {count} 个文件")
            self.import_btn.setEnabled(True)
        else:
            self.file_list_label.setText("尚未选择文件")
            self.import_btn.setEnabled(False)

    def start_import(self):
        if not self.files_to_import:
            return

        self.progress_bar.setVisible(True)
        self.progress_bar.setMaximum(len(self.files_to_import))
        self.progress_bar.setValue(0)

        self.log_text.setVisible(True)
        self.log_text.clear()

        self.import_btn.setEnabled(False)
        self.select_files_btn.setEnabled(False)
        self.select_folder_btn.setEnabled(False)

        self.import_thread = ImportThread(self.db, self.parser, self.files_to_import)
        self.import_thread.progress_signal.connect(self.update_progress)
        self.import_thread.finished_signal.connect(self.import_finished)
        self.import_thread.start()

    def update_progress(self, current, total, message):
        self.progress_bar.setValue(current)
        self.progress_bar.setFormat(f"{current}/{total}")
        self.log_text.append(message)

    def import_finished(self, count, imported):
        self.import_btn.setEnabled(True)
        self.select_files_btn.setEnabled(True)
        self.select_folder_btn.setEnabled(True)

        QMessageBox.information(self, "导入完成", f"成功导入 {count} 本书！")
        self.files_to_import = []
        self.file_list_label.setText("尚未选择文件")
        self.accept()
