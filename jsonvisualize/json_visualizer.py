import sys
import json
from PyQt5.QtWidgets import (QApplication, QMainWindow, QTreeWidget, QTreeWidgetItem,
                             QVBoxLayout, QHBoxLayout, QWidget, QPushButton, QFileDialog,
                             QLineEdit, QMenu, QAction, QMessageBox, QSplitter, QTextEdit,
                             QLabel, QComboBox)
from PyQt5.QtCore import Qt, QMimeData, QPoint
from PyQt5.QtGui import QDrag, QDropEvent, QBrush, QColor, QFont


class DraggableTreeWidget(QTreeWidget):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setDragEnabled(True)
        self.setAcceptDrops(True)
        self.setDragDropMode(QTreeWidget.InternalMove)
        self.setSelectionMode(QTreeWidget.ExtendedSelection)
        self.setColumnCount(2)
        self.setHeaderLabels(["键", "值"])
        self.setColumnWidth(0, 250)

    def get_item_path(self, item):
        path = []
        while item is not None:
            path.insert(0, item.text(0))
            item = item.parent()
        return path

    def dropEvent(self, event: QDropEvent):
        super().dropEvent(event)
        self.parent().parent().update_json_from_tree()


class JsonVisualizer(QMainWindow):
    def __init__(self):
        super().__init__()
        self.current_file = None
        self.json_data = None
        self.init_ui()

    def init_ui(self):
        self.setWindowTitle("JSON 可视化工具")
        self.setGeometry(100, 100, 1200, 800)

        central_widget = QWidget()
        self.setCentralWidget(central_widget)
        main_layout = QVBoxLayout(central_widget)

        toolbar_layout = QHBoxLayout()

        self.open_btn = QPushButton("打开 JSON")
        self.open_btn.clicked.connect(self.open_file)
        toolbar_layout.addWidget(self.open_btn)

        self.save_btn = QPushButton("保存 JSON")
        self.save_btn.clicked.connect(self.save_file)
        toolbar_layout.addWidget(self.save_btn)

        self.save_as_btn = QPushButton("另存为")
        self.save_as_btn.clicked.connect(self.save_file_as)
        toolbar_layout.addWidget(self.save_as_btn)

        self.expand_all_btn = QPushButton("展开全部")
        self.expand_all_btn.clicked.connect(self.expand_all)
        toolbar_layout.addWidget(self.expand_all_btn)

        self.collapse_all_btn = QPushButton("折叠全部")
        self.collapse_all_btn.clicked.connect(self.collapse_all)
        toolbar_layout.addWidget(self.collapse_all_btn)

        toolbar_layout.addWidget(QLabel("搜索:"))
        self.search_input = QLineEdit()
        self.search_input.setPlaceholderText("输入关键词搜索...")
        self.search_input.textChanged.connect(self.search_nodes)
        toolbar_layout.addWidget(self.search_input)

        self.format_btn = QPushButton("格式化 JSON")
        self.format_btn.clicked.connect(self.format_json)
        toolbar_layout.addWidget(self.format_btn)

        main_layout.addLayout(toolbar_layout)

        splitter = QSplitter(Qt.Horizontal)

        self.tree_widget = DraggableTreeWidget(self)
        self.tree_widget.setContextMenuPolicy(Qt.CustomContextMenu)
        self.tree_widget.customContextMenuRequested.connect(self.show_context_menu)
        self.tree_widget.itemDoubleClicked.connect(self.edit_item)
        splitter.addWidget(self.tree_widget)

        self.text_edit = QTextEdit()
        self.text_edit.setPlaceholderText("在此输入或粘贴 JSON 数据...")
        self.text_edit.setFont(QFont("Consolas", 10))
        splitter.addWidget(self.text_edit)

        splitter.setSizes([600, 600])
        main_layout.addWidget(splitter)

        self.statusBar().showMessage("就绪")

    def open_file(self):
        file_path, _ = QFileDialog.getOpenFileName(
            self, "打开 JSON 文件", "", "JSON Files (*.json);;All Files (*)"
        )
        if file_path:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    self.text_edit.setText(content)
                    self.parse_json()
                    self.current_file = file_path
                    self.statusBar().showMessage(f"已打开: {file_path}")
            except Exception as e:
                QMessageBox.critical(self, "错误", f"无法打开文件: {str(e)}")

    def save_file(self):
        if self.current_file:
            self._save_to_file(self.current_file)
        else:
            self.save_file_as()

    def save_file_as(self):
        file_path, _ = QFileDialog.getSaveFileName(
            self, "保存 JSON 文件", "", "JSON Files (*.json);;All Files (*)"
        )
        if file_path:
            self._save_to_file(file_path)
            self.current_file = file_path

    def _save_to_file(self, file_path):
        try:
            self.update_json_from_tree()
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(self.json_data, f, ensure_ascii=False, indent=2)
            self.statusBar().showMessage(f"已保存: {file_path}")
        except Exception as e:
            QMessageBox.critical(self, "错误", f"无法保存文件: {str(e)}")

    def parse_json(self):
        try:
            content = self.text_edit.toPlainText()
            self.json_data = json.loads(content)
            self.populate_tree()
            self.statusBar().showMessage("JSON 解析成功")
        except json.JSONDecodeError as e:
            QMessageBox.warning(self, "解析错误", f"JSON 格式错误: {str(e)}")
        except Exception as e:
            QMessageBox.critical(self, "错误", f"解析失败: {str(e)}")

    def populate_tree(self):
        self.tree_widget.clear()
        if self.json_data is not None:
            self._add_json_item(self.json_data, self.tree_widget.invisibleRootItem())

    def _add_json_item(self, data, parent, key_name="root"):
        item = QTreeWidgetItem(parent)

        if isinstance(data, dict):
            item.setText(0, str(key_name))
            item.setText(1, f"{{{len(data)} 个键}}")
            item.setForeground(1, QBrush(QColor(100, 100, 255)))
            for key, value in data.items():
                self._add_json_item(value, item, key)
        elif isinstance(data, list):
            item.setText(0, str(key_name))
            item.setText(1, f"[{len(data)} 个元素]")
            item.setForeground(1, QBrush(QColor(255, 100, 100)))
            for i, value in enumerate(data):
                self._add_json_item(value, item, f"[{i}]")
        else:
            item.setText(0, str(key_name))
            item.setText(1, str(data))
            if isinstance(data, str):
                item.setForeground(1, QBrush(QColor(0, 150, 0)))
            elif isinstance(data, (int, float)):
                item.setForeground(1, QBrush(QColor(150, 0, 150)))
            elif isinstance(data, bool):
                item.setForeground(1, QBrush(QColor(0, 0, 200)))

        item.setFlags(item.flags() | Qt.ItemIsEditable)

    def update_json_from_tree(self):
        try:
            root_item = self.tree_widget.invisibleRootItem()
            if root_item.childCount() > 0:
                self.json_data = self._tree_to_json(root_item.child(0))
                self.text_edit.setText(json.dumps(self.json_data, ensure_ascii=False, indent=2))
        except Exception as e:
            QMessageBox.warning(self, "警告", f"更新 JSON 时出错: {str(e)}")

    def _tree_to_json(self, item):
        child_count = item.childCount()

        if child_count == 0:
            value_text = item.text(1)
            try:
                if value_text.lower() == 'true':
                    return True
                elif value_text.lower() == 'false':
                    return False
                elif value_text.lower() == 'null' or value_text.lower() == 'none':
                    return None
                elif value_text.startswith('"') and value_text.endswith('"'):
                    return value_text[1:-1]
                else:
                    try:
                        return int(value_text)
                    except ValueError:
                        try:
                            return float(value_text)
                        except ValueError:
                            return value_text
            except:
                return value_text

        text1 = item.text(1)
        if text1.startswith('{'):
            result = {}
            for i in range(child_count):
                child = item.child(i)
                result[child.text(0)] = self._tree_to_json(child)
            return result
        elif text1.startswith('['):
            result = []
            for i in range(child_count):
                child = item.child(i)
                result.append(self._tree_to_json(child))
            return result
        else:
            return item.text(1)

    def show_context_menu(self, position: QPoint):
        item = self.tree_widget.itemAt(position)
        menu = QMenu()

        add_key_action = QAction("添加键", self)
        add_key_action.triggered.connect(lambda: self.add_key(item))
        menu.addAction(add_key_action)

        add_item_action = QAction("添加数组元素", self)
        add_item_action.triggered.connect(lambda: self.add_array_item(item))
        menu.addAction(add_item_action)

        delete_action = QAction("删除", self)
        delete_action.triggered.connect(lambda: self.delete_item(item))
        menu.addAction(delete_action)

        menu.exec_(self.tree_widget.viewport().mapToGlobal(position))

    def add_key(self, item):
        if item is None:
            return
        new_item = QTreeWidgetItem(item)
        new_item.setText(0, "new_key")
        new_item.setText(1, "new_value")
        new_item.setFlags(new_item.flags() | Qt.ItemIsEditable)
        self.update_json_from_tree()

    def add_array_item(self, item):
        if item is None:
            return
        new_item = QTreeWidgetItem(item)
        new_item.setText(0, f"[{item.childCount()}]")
        new_item.setText(1, "new_value")
        new_item.setFlags(new_item.flags() | Qt.ItemIsEditable)
        self.update_json_from_tree()

    def delete_item(self, item):
        if item is None or item.parent() is None:
            return
        parent = item.parent()
        parent.removeChild(item)
        self.update_json_from_tree()

    def edit_item(self, item, column):
        self.tree_widget.editItem(item, column)

    def search_nodes(self, text):
        if not text:
            self._clear_highlight()
            return

        self._clear_highlight()
        self._search_and_highlight(self.tree_widget.invisibleRootItem(), text.lower())

    def _search_and_highlight(self, item, text):
        found = False
        if text in item.text(0).lower() or text in item.text(1).lower():
            item.setBackground(0, QBrush(QColor(255, 255, 100)))
            item.setBackground(1, QBrush(QColor(255, 255, 100)))
            found = True
            item.setExpanded(True)
            parent = item.parent()
            while parent:
                parent.setExpanded(True)
                parent = parent.parent()

        for i in range(item.childCount()):
            child_found = self._search_and_highlight(item.child(i), text)
            if child_found:
                found = True

        return found

    def _clear_highlight(self):
        self._clear_item_highlight(self.tree_widget.invisibleRootItem())

    def _clear_item_highlight(self, item):
        item.setBackground(0, QBrush())
        item.setBackground(1, QBrush())
        for i in range(item.childCount()):
            self._clear_item_highlight(item.child(i))

    def expand_all(self):
        self.tree_widget.expandAll()

    def collapse_all(self):
        self.tree_widget.collapseAll()

    def format_json(self):
        try:
            content = self.text_edit.toPlainText()
            data = json.loads(content)
            self.text_edit.setText(json.dumps(data, ensure_ascii=False, indent=2))
            self.parse_json()
            self.statusBar().showMessage("JSON 已格式化")
        except json.JSONDecodeError as e:
            QMessageBox.warning(self, "格式化错误", f"JSON 格式错误: {str(e)}")


def main():
    app = QApplication(sys.argv)
    app.setStyle('Fusion')
    window = JsonVisualizer()
    window.show()
    sys.exit(app.exec_())


if __name__ == "__main__":
    main()
