# -*- coding: utf-8 -*-
"""
排序算法演示程序 - GUI版本
跨平台支持：Linux、Windows、macOS
使用 tkinter（Python内置GUI库，无需额外安装）
"""

import tkinter as tk
from tkinter import ttk, messagebox
import queue
import time
import sys
import os

# 将当前目录加入路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from utils import (
    generate_random_array,
    generate_nearly_sorted_array,
    generate_reverse_array,
    COMPLEXITY_INFO
)
from sorting_engine import SortingEngine

# 导入所有排序算法
from basic_sorts import (
    bubble_sort, selection_sort, insertion_sort,
    exchange_sort, cocktail_sort
)
from advanced_sorts import (
    quick_sort, merge_sort, heap_sort,
    shell_sort, tim_sort, intro_sort
)
from special_sorts import (
    radix_lsd_sort, radix_msd_sort, counting_sort,
    gnome_sort, cycle_sort, pancake_sort,
    odd_even_sort, comb_sort
)
from bitonic_sort import bitonic_sort
from fun_sorts import stooge_sort, bogo_sort


# ============================================================
# 算法注册表
# ============================================================

ALGORITHMS = [
    # 基础排序
    ("冒泡排序", "Bubble Sort", bubble_sort, "bubble", "基础排序"),
    ("选择排序", "Selection Sort", selection_sort, "selection", "基础排序"),
    ("插入排序", "Insertion Sort", insertion_sort, "insertion", "基础排序"),
    ("交换排序", "Exchange Sort", exchange_sort, "exchange", "基础排序"),
    ("鸡尾酒排序", "Cocktail Sort", cocktail_sort, "cocktail", "基础排序"),
    # 高级排序
    ("快速排序", "Quick Sort", quick_sort, "quick", "高级排序"),
    ("归并排序", "Merge Sort", merge_sort, "merge", "高级排序"),
    ("堆排序", "Heap Sort", heap_sort, "heap", "高级排序"),
    ("希尔排序", "Shell Sort", shell_sort, "shell", "高级排序"),
    ("蒂姆排序", "Tim Sort", tim_sort, "tim", "高级排序"),
    ("综合排序", "Intro Sort", intro_sort, "intro", "高级排序"),
    # 特殊排序
    ("基数排序-LSD", "Radix LSD Sort", radix_lsd_sort, "radix_lsd", "特殊排序"),
    ("基数排序-MSD", "Radix MSD Sort", radix_msd_sort, "radix_msd", "特殊排序"),
    ("计数排序", "Counting Sort", counting_sort, "counting", "特殊排序"),
    ("地精排序", "Gnome Sort", gnome_sort, "gnome", "特殊排序"),
    ("循环排序", "Cycle Sort", cycle_sort, "cycle", "特殊排序"),
    ("煎饼排序", "Pancake Sort", pancake_sort, "pancake", "特殊排序"),
    ("奇偶排序", "Odd-Even Sort", odd_even_sort, "oddeven", "特殊排序"),
    ("梳排序", "Comb Sort", comb_sort, "comb", "特殊排序"),
    ("双调排序", "Bitonic Sort", bitonic_sort, "bitonic", "特殊排序"),
    # 趣味排序
    ("傻瓜排序", "Stooge Sort", stooge_sort, "stooge", "趣味排序"),
    ("博戈排序", "Bogo Sort", bogo_sort, "bogo", "趣味排序"),
]


# ============================================================
# 主GUI类
# ============================================================

class SortingDemoGUI:
    """排序算法演示GUI主类"""
    
    # 颜色定义
    COLORS = {
        'bg': '#1e1e2e',
        'panel_bg': '#2a2a3d',
        'text': '#cdd6f4',
        'text_dim': '#a6adc8',
        'accent': '#89b4fa',
        'accent2': '#74c7ec',
        'bar_normal': '#89b4fa',
        'bar_highlight_red': '#f38ba8',
        'bar_highlight_green': '#a6e3a1',
        'bar_highlight_yellow': '#f9e2af',
        'bar_highlight_blue': '#74c7ec',
        'bar_sorted': '#a6e3a1',
        'button_bg': '#45475a',
        'button_fg': '#cdd6f4',
        'button_active': '#585b70',
        'border': '#45475a',
    }
    
    def __init__(self, root):
        self.root = root
        self.root.title("排序算法演示程序 - Sorting Algorithms Demo")
        self.root.geometry("1200x750")
        self.root.minsize(1000, 650)
        
        # 排序引擎
        self.engine = SortingEngine()
        
        # 状态变量
        self.current_array = []
        self.current_step = 0
        self.is_sorting = False
        self.speed = 50  # 毫秒/步
        
        # 初始化UI
        self._setup_styles()
        self._build_ui()
        
        # 启动消息轮询
        self._poll_queue()
    
    def _setup_styles(self):
        """设置ttk样式"""
        style = ttk.Style()
        style.theme_use('clam')
        
        # 尝试检测系统主题
        try:
            from tkinter import font as tkfont
        except:
            pass
        
        # 配置通用样式
        style.configure('TFrame', background=self.COLORS['bg'])
        style.configure('Panel.TFrame', background=self.COLORS['panel_bg'])
        style.configure('TLabel', background=self.COLORS['bg'], foreground=self.COLORS['text'], font=('Segoe UI', 10))
        style.configure('Dim.TLabel', background=self.COLORS['bg'], foreground=self.COLORS['text_dim'], font=('Segoe UI', 9))
        style.configure('Title.TLabel', background=self.COLORS['bg'], foreground=self.COLORS['accent'], font=('Segoe UI', 16, 'bold'))
        style.configure('Step.TLabel', background=self.COLORS['bg'], foreground=self.COLORS['accent2'], font=('Consolas', 12, 'bold'))
        
        style.configure('TButton', 
                       background=self.COLORS['button_bg'], 
                       foreground=self.COLORS['button_fg'],
                       font=('Segoe UI', 10),
                       padding=(12, 6),
                       borderwidth=0)
        style.map('TButton',
                 background=[('active', self.COLORS['button_active']), ('disabled', '#313244')],
                 foreground=[('disabled', '#6c7086')])
        
        style.configure('Accent.TButton',
                       background=self.COLORS['accent'],
                       foreground='#1e1e2e',
                       font=('Segoe UI', 10, 'bold'),
                       padding=(16, 6),
                       borderwidth=0)
        style.map('Accent.TButton',
                 background=[('active', '#b4befe'), ('disabled', '#313244')],
                 foreground=[('disabled', '#6c7086')])
        
        style.configure('TCombobox',
                       fieldbackground=self.COLORS['panel_bg'],
                       background=self.COLORS['panel_bg'],
                       foreground=self.COLORS['text'],
                       arrowcolor=self.COLORS['accent'])
        
        style.configure('Horizontal.TScale',
                       background=self.COLORS['bg'],
                       troughcolor=self.COLORS['panel_bg'])
        
        style.configure('TNotebook', background=self.COLORS['bg'], borderwidth=0)
        style.configure('TNotebook.Tab',
                       background=self.COLORS['panel_bg'],
                       foreground=self.COLORS['text'],
                       padding=(12, 6),
                       font=('Segoe UI', 10))
        style.map('TNotebook.Tab',
                 background=[('selected', self.COLORS['accent'])],
                 foreground=[('selected', '#1e1e2e')])
    
    def _build_ui(self):
        """构建UI界面"""
        # 主容器
        main_frame = ttk.Frame(self.root, style='TFrame')
        main_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # 顶部标题栏
        title_bar = ttk.Frame(main_frame, style='TFrame')
        title_bar.pack(fill=tk.X, pady=(0, 10))
        
        ttk.Label(title_bar, text="🔬 排序算法演示程序", style='Title.TLabel').pack(side=tk.LEFT)
        ttk.Label(title_bar, text="Sorting Algorithms Visualizer", style='Dim.TLabel').pack(side=tk.LEFT, padx=(10, 0))
        
        # 内容区域 - 分为左控制面板和右可视化区域
        content = ttk.Frame(main_frame, style='TFrame')
        content.pack(fill=tk.BOTH, expand=True)
        
        # 左侧控制面板
        self._build_control_panel(content)
        
        # 右侧可视化区域
        self._build_visualization(content)
    
    def _build_control_panel(self, parent):
        """构建左侧控制面板"""
        control_frame = ttk.Frame(parent, style='Panel.TFrame', width=320)
        control_frame.pack(side=tk.LEFT, fill=tk.Y, padx=(0, 10))
        control_frame.pack_propagate(False)
        
        # ===== 算法选择 =====
        algo_frame = ttk.LabelFrame(control_frame, text=" 算法选择 ", style='Panel.TFrame',
                                    labelanchor='nw')
        algo_frame.pack(fill=tk.X, padx=10, pady=(10, 5))
        
        # 按分类分组
        categories = {}
        for i, (cn_name, en_name, func, key, cat) in enumerate(ALGORITHMS):
            if cat not in categories:
                categories[cat] = []
            categories[cat].append((i, cn_name, en_name, func, key, cat))
        
        # 算法选择列表
        list_frame = ttk.Frame(algo_frame, style='Panel.TFrame')
        list_frame.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)
        
        # 创建带滚动条的列表
        self.algo_listbox = tk.Listbox(
            list_frame,
            bg=self.COLORS['panel_bg'],
            fg=self.COLORS['text'],
            selectbackground=self.COLORS['accent'],
            selectforeground='#1e1e2e',
            font=('Segoe UI', 9),
            borderwidth=0,
            highlightthickness=1,
            highlightcolor=self.COLORS['accent'],
            highlightbackground=self.COLORS['border'],
            height=12,
            exportselection=False
        )
        
        scrollbar = ttk.Scrollbar(list_frame, orient=tk.VERTICAL, command=self.algo_listbox.yview)
        self.algo_listbox.configure(yscrollcommand=scrollbar.set)
        
        self.algo_listbox.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        
        # 填充算法列表
        self._algo_map = []  # 存储 (index, cn_name, en_name, func, key)
        for i, (cn_name, en_name, func, key, cat) in enumerate(ALGORITHMS):
            display = f"  {cn_name}  ({en_name})"
            self.algo_listbox.insert(tk.END, display)
            self._algo_map.append((i, cn_name, en_name, func, key))
        
        self.algo_listbox.bind('<<ListboxSelect>>', self._on_algo_select)
        self.algo_listbox.select_set(0)
        
        # ===== 数据设置 =====
        data_frame = ttk.LabelFrame(control_frame, text=" 数据设置 ", style='Panel.TFrame',
                                    labelanchor='nw')
        data_frame.pack(fill=tk.X, padx=10, pady=10)
        
        # 数据类型
        ttk.Label(data_frame, text="数据类型:", style='TLabel').pack(anchor=tk.W, padx=10, pady=(5, 0))
        
        self.data_type_var = tk.StringVar(value="random")
        data_types = [
            ("🎲 随机数据", "random"),
            ("📈 近乎有序", "nearly_sorted"),
            ("📉 完全逆序", "reverse"),
        ]
        
        for text, value in data_types:
            ttk.Radiobutton(
                data_frame, text=text, value=value, variable=self.data_type_var,
                style='Panel.TFrame'
            ).pack(anchor=tk.W, padx=15, pady=1)
        
        # 数组大小
        size_frame = ttk.Frame(data_frame, style='Panel.TFrame')
        size_frame.pack(fill=tk.X, padx=10, pady=(5, 10))
        
        ttk.Label(size_frame, text="数组大小:", style='TLabel').pack(side=tk.LEFT)
        
        self.size_var = tk.IntVar(value=12)
        self.size_spinbox = tk.Spinbox(
            size_frame, from_=3, to=50, textvariable=self.size_var, width=6,
            bg=self.COLORS['panel_bg'], fg=self.COLORS['text'],
            font=('Segoe UI', 10),
            buttonbackground=self.COLORS['button_bg'],
            borderwidth=0,
            highlightthickness=1,
            highlightcolor=self.COLORS['accent'],
            highlightbackground=self.COLORS['border']
        )
        self.size_spinbox.pack(side=tk.LEFT, padx=(5, 0))
        
        ttk.Label(size_frame, text="(3-50)", style='Dim.TLabel').pack(side=tk.LEFT, padx=(5, 0))
        
        # 生成按钮
        ttk.Button(data_frame, text="🎯 生成数据", style='TButton',
                  command=self._generate_data).pack(fill=tk.X, padx=10, pady=(0, 10))
        
        # ===== 速度控制 =====
        speed_frame = ttk.LabelFrame(control_frame, text=" 动画速度 ", style='Panel.TFrame',
                                    labelanchor='nw')
        speed_frame.pack(fill=tk.X, padx=10, pady=(0, 10))
        
        self.speed_var = tk.IntVar(value=50)
        speed_scale = ttk.Scale(
            speed_frame, from_=10, to=200, orient=tk.HORIZONTAL,
            variable=self.speed_var, command=self._on_speed_change
        )
        speed_scale.pack(fill=tk.X, padx=10, pady=(5, 5))
        
        speed_label_frame = ttk.Frame(speed_frame, style='Panel.TFrame')
        speed_label_frame.pack(fill=tk.X, padx=10)
        
        ttk.Label(speed_label_frame, text="快", style='Dim.TLabel').pack(side=tk.LEFT)
        self.speed_value_label = ttk.Label(speed_label_frame, text="50 ms/步", style='TLabel')
        self.speed_value_label.pack(side=tk.LEFT, expand=True)
        ttk.Label(speed_label_frame, text="慢", style='Dim.TLabel').pack(side=tk.RIGHT)
        
        # ===== 控制按钮 =====
        btn_frame = ttk.LabelFrame(control_frame, text=" 运行控制 ", style='Panel.TFrame',
                                  labelanchor='nw')
        btn_frame.pack(fill=tk.X, padx=10, pady=(0, 10))
        
        self.start_btn = ttk.Button(btn_frame, text="▶ 开始排序", style='Accent.TButton',
                                   command=self._start_sort)
        self.start_btn.pack(fill=tk.X, padx=10, pady=(10, 5))
        
        self.pause_btn = ttk.Button(btn_frame, text="⏸ 暂停", style='TButton',
                                   command=self._toggle_pause, state=tk.DISABLED)
        self.pause_btn.pack(fill=tk.X, padx=10, pady=5)
        
        self.stop_btn = ttk.Button(btn_frame, text="⏹ 停止", style='TButton',
                                  command=self._stop_sort, state=tk.DISABLED)
        self.stop_btn.pack(fill=tk.X, padx=10, pady=(5, 10))
        
        # ===== 信息面板 =====
        info_frame = ttk.LabelFrame(control_frame, text=" 算法信息 ", style='Panel.TFrame',
                                   labelanchor='nw')
        info_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=(0, 10))
        
        self.info_text = tk.Text(
            info_frame,
            bg=self.COLORS['panel_bg'],
            fg=self.COLORS['text'],
            font=('Consolas', 9),
            borderwidth=0,
            wrap=tk.WORD,
            height=6,
            padx=8,
            pady=8
        )
        self.info_text.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)
        self.info_text.insert('1.0', "选择一个算法查看详细信息...")
        self.info_text.configure(state=tk.DISABLED)
    
    def _build_visualization(self, parent):
        """构建右侧可视化区域"""
        viz_frame = ttk.Frame(parent, style='TFrame')
        viz_frame.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        
        # 状态栏
        status_frame = ttk.Frame(viz_frame, style='Panel.TFrame')
        status_frame.pack(fill=tk.X, pady=(0, 10))
        
        self.status_label = ttk.Label(status_frame, text="就绪", style='Step.TLabel')
        self.status_label.pack(side=tk.LEFT, padx=10, pady=8)
        
        self.step_label = ttk.Label(status_frame, text="步数: 0", style='TLabel')
        self.step_label.pack(side=tk.RIGHT, padx=10, pady=8)
        
        # 可视化画布
        canvas_frame = ttk.Frame(viz_frame, style='Panel.TFrame')
        canvas_frame.pack(fill=tk.BOTH, expand=True)
        
        self.canvas = tk.Canvas(
            canvas_frame,
            bg='#11111b',
            highlightthickness=0,
            borderwidth=0
        )
        self.canvas.pack(fill=tk.BOTH, expand=True, padx=5, pady=5)
        
        # 绑定窗口大小变化事件
        self.canvas.bind('<Configure>', self._on_canvas_resize)
        
        # 初始化条形图
        self._draw_bars()
    
    # ============================================================
    # 事件处理
    # ============================================================
    
    def _on_algo_select(self, event=None):
        """算法选择变化时更新信息面板"""
        selection = self.algo_listbox.curselection()
        if not selection:
            return
        
        idx = selection[0]
        algo_info = self._algo_map[idx]
        key = algo_info[4]
        info = COMPLEXITY_INFO.get(key, {})
        
        self.info_text.configure(state=tk.NORMAL)
        self.info_text.delete('1.0', tk.END)
        
        cn_name = algo_info[1]
        en_name = algo_info[2]
        
        text = f"【{cn_name}】\n({en_name})\n\n"
        text += f"描述:\n{info.get('desc', 'N/A')}\n\n"
        text += f"时间复杂度:\n"
        text += f"  最优: {info.get('best', 'N/A')}\n"
        text += f"  平均: {info.get('avg', 'N/A')}\n"
        text += f"  最差: {info.get('worst', 'N/A')}\n"
        text += f"空间复杂度: {info.get('space', 'N/A')}\n"
        text += f"稳定性: {info.get('stable', 'N/A')}\n"
        
        self.info_text.insert('1.0', text)
        self.info_text.configure(state=tk.DISABLED)
    
    def _on_speed_change(self, value):
        """速度滑块变化"""
        val = int(float(value))
        self.speed = val
        self.speed_value_label.configure(text=f"{val} ms/步")
    
    def _on_canvas_resize(self, event):
        """画布大小变化时重绘"""
        self._draw_bars()
    
    def _generate_data(self):
        """生成新数据"""
        size = self.size_var.get()
        data_type = self.data_type_var.get()
        
        if data_type == "random":
            self.current_array = generate_random_array(size)
        elif data_type == "nearly_sorted":
            self.current_array = generate_nearly_sorted_array(size)
        else:
            self.current_array = generate_reverse_array(size)
        
        self.current_step = 0
        self.step_label.configure(text="步数: 0")
        self.status_label.configure(text=f"已生成 {size} 个数据")
        self._draw_bars()
    
    def _start_sort(self):
        """开始排序"""
        if self.engine.is_running():
            return
        
        selection = self.algo_listbox.curselection()
        if not selection:
            messagebox.showwarning("提示", "请先选择一个排序算法！")
            return
        
        if not self.current_array:
            self._generate_data()
        
        idx = selection[0]
        algo_info = self._algo_map[idx]
        cn_name = algo_info[1]
        func = algo_info[3]
        key = algo_info[4]
        
        self.is_sorting = True
        self.current_step = 0
        self.step_label.configure(text="步数: 0")
        self.status_label.configure(text=f"正在运行: {cn_name}")
        
        # 更新按钮状态
        self.start_btn.configure(state=tk.DISABLED)
        self.pause_btn.configure(state=tk.NORMAL, text="⏸ 暂停")
        self.stop_btn.configure(state=tk.NORMAL)
        self.algo_listbox.configure(state=tk.DISABLED)
        
        # 启动排序引擎
        self.engine.start_sort(key, cn_name, func, self.current_array)
    
    def _toggle_pause(self):
        """暂停/继续"""
        if not self.engine.is_running():
            return
        
        if self.engine.is_paused():
            self.engine.resume()
            self.pause_btn.configure(text="⏸ 暂停")
            self.status_label.configure(text="继续运行...")
        else:
            self.engine.pause()
            self.pause_btn.configure(text="▶ 继续")
            self.status_label.configure(text="已暂停")
    
    def _stop_sort(self):
        """停止排序"""
        self.engine.stop()
        self.status_label.configure(text="已停止")
    
    # ============================================================
    # 消息轮询
    # ============================================================
    
    def _poll_queue(self):
        """轮询消息队列，处理排序引擎发送的消息"""
        try:
            while True:
                msg = self.engine.get_queue().get_nowait()
                self._process_message(msg)
        except queue.Empty:
            pass
        
        # 继续轮询
        self.root.after(10, self._poll_queue)
    
    def _process_message(self, msg):
        """处理来自排序引擎的消息"""
        msg_type = msg.get('type', '')
        
        if msg_type == 'step':
            self.current_array = msg.get('array', [])
            self.current_step = msg.get('step', 0)
            self._draw_bars(
                highlight=msg.get('highlight', []),
                color=msg.get('color', 'yellow')
            )
            self.step_label.configure(text=f"步数: {self.current_step}")
            desc = msg.get('description', '')
            if len(desc) > 60:
                desc = desc[:57] + "..."
            self.status_label.configure(text=desc)
            
        elif msg_type == 'complete':
            self.current_array = msg.get('array', [])
            self.current_step = msg.get('step', 0)
            self._draw_bars(color='green')
            self.step_label.configure(text=f"步数: {self.current_step}")
            
            elapsed = msg.get('elapsed', 0)
            algo_name = msg.get('algorithm', '')
            self.status_label.configure(
                text=f"✅ {algo_name} 完成! 耗时 {elapsed:.1f}ms, 共 {self.current_step} 步"
            )
            
            self._reset_controls()
            
        elif msg_type == 'stopped':
            self.status_label.configure(text="⏹ 排序已停止")
            self._reset_controls()
            
        elif msg_type == 'error':
            self.status_label.configure(text=f"❌ 错误: {msg.get('description', '')}")
            self._reset_controls()
    
    def _reset_controls(self):
        """重置控制按钮状态"""
        self.start_btn.configure(state=tk.NORMAL)
        self.pause_btn.configure(state=tk.DISABLED, text="⏸ 暂停")
        self.stop_btn.configure(state=tk.DISABLED)
        self.algo_listbox.configure(state=tk.NORMAL)
        self.is_sorting = False
    
    # ============================================================
    # 绘制条形图
    # ============================================================
    
    def _draw_bars(self, highlight=None, color='blue'):
        """在画布上绘制条形图"""
        if not self.current_array:
            return
        
        self.canvas.delete('all')
        
        # 获取画布尺寸
        width = self.canvas.winfo_width()
        height = self.canvas.winfo_height()
        
        if width < 10 or height < 10:
            return
        
        arr = self.current_array
        n = len(arr)
        max_val = max(arr) if arr else 1
        
        # 计算条形尺寸
        padding_x = 40
        padding_top = 30
        padding_bottom = 50
        
        chart_width = width - 2 * padding_x
        chart_height = height - padding_top - padding_bottom
        
        bar_width = max(4, (chart_width / n) * 0.7)
        bar_gap = (chart_width / n) * 0.3
        
        # 颜色映射
        color_map = {
            'red': self.COLORS['bar_highlight_red'],
            'green': self.COLORS['bar_highlight_green'],
            'yellow': self.COLORS['bar_highlight_yellow'],
            'blue': self.COLORS['bar_highlight_blue'],
        }
        
        highlight_set = set(highlight) if highlight else set()
        highlight_color = color_map.get(color, self.COLORS['bar_highlight_blue'])
        
        # 绘制每个条形
        for i, val in enumerate(arr):
            x1 = padding_x + i * (bar_width + bar_gap)
            bar_height = (val / max_val) * chart_height if max_val > 0 else 0
            y1 = height - padding_bottom - bar_height
            x2 = x1 + bar_width
            y2 = height - padding_bottom
            
            # 选择颜色
            if i in highlight_set:
                fill = highlight_color
                outline = self.COLORS['accent']
            else:
                fill = self.COLORS['bar_normal']
                outline = ''
            
            # 绘制条形
            self.canvas.create_rectangle(
                x1, y1, x2, y2,
                fill=fill,
                outline=outline,
                width=2 if i in highlight_set else 0
            )
            
            # 绘制数值
            if bar_width > 20:
                self.canvas.create_text(
                    (x1 + x2) / 2, y1 - 8,
                    text=str(val),
                    fill=self.COLORS['text'],
                    font=('Consolas', 9, 'bold')
                )
            
            # 绘制索引
            if bar_width > 15:
                self.canvas.create_text(
                    (x1 + x2) / 2, y2 + 15,
                    text=str(i),
                    fill=self.COLORS['text_dim'],
                    font=('Consolas', 8)
                )
        
        # 绘制坐标轴底线
        self.canvas.create_line(
            padding_x - 10, height - padding_bottom,
            width - padding_x + 10, height - padding_bottom,
            fill=self.COLORS['border'],
            width=2
        )


# ============================================================
# 主入口
# ============================================================

def main():
    """主函数"""
    root = tk.Tk()
    
    # 尝试设置DPI缩放（Windows）
    try:
        from ctypes import windll
        windll.shcore.SetProcessDpiAwareness(1)
    except:
        pass
    
    app = SortingDemoGUI(root)
    
    # 初始化生成一组数据
    app.current_array = generate_random_array(12)
    app._draw_bars()
    app.algo_listbox.select_set(0)
    app._on_algo_select()
    
    root.mainloop()


if __name__ == "__main__":
    main()
