import sys
import os
from PyQt6.QtWidgets import QApplication
from PyQt6.QtGui import QIcon

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from windows_app.main_window import MainWindow


def main():
    app = QApplication(sys.argv)
    app.setApplicationName("第二屏幕")
    app.setApplicationVersion("1.0.0")

    window = MainWindow()
    window.show()

    sys.exit(app.exec())


if __name__ == "__main__":
    main()
