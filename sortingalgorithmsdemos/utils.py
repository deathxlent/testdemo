# -*- coding: utf-8 -*-
"""
通用工具模块
提供数据生成、可视化显示、复杂度信息等公共功能
"""

import random
import time


# ============================================================
# 数据生成相关函数
# ============================================================

def generate_random_array(size=15, min_val=1, max_val=100):
    """
    生成随机数组
    :param size: 数组大小
    :param min_val: 最小值
    :param max_val: 最大值
    :return: 随机数组
    """
    return [random.randint(min_val, max_val) for _ in range(size)]


def generate_nearly_sorted_array(size=15, min_val=1, max_val=100, swap_count=2):
    """
    生成近乎有序的数组（少量元素被交换）
    :param size: 数组大小
    :param min_val: 最小值
    :param max_val: 最大值
    :param swap_count: 交换次数
    :return: 近乎有序的数组
    """
    arr = sorted([random.randint(min_val, max_val) for _ in range(size)])
    for _ in range(swap_count):
        i, j = random.sample(range(size), 2)
        arr[i], arr[j] = arr[j], arr[i]
    return arr


def generate_reverse_array(size=15, min_val=1, max_val=100):
    """
    生成逆序数组
    :param size: 数组大小
    :param min_val: 最小值
    :param max_val: 最大值
    :return: 逆序数组
    """
    return sorted([random.randint(min_val, max_val) for _ in range(size)], reverse=True)


# ============================================================
# 可视化显示相关函数
# ============================================================

def print_array(arr, highlight_indices=None, title="", color=None):
    """
    以条形图形式打印数组
    :param arr: 数组
    :param highlight_indices: 需要高亮的索引列表（如正在比较或交换的元素）
    :param title: 标题
    :param color: 高亮颜色（'red', 'green', 'yellow', 'blue'）
    """
    if title:
        print(f"\n{'='*60}")
        print(f"  {title}")
        print(f"{'='*60}")
    
    # 颜色代码
    colors = {
        'red': '\033[91m',
        'green': '\033[92m',
        'yellow': '\033[93m',
        'blue': '\033[94m',
        'reset': '\033[0m'
    }
    
    max_val = max(arr) if arr else 1
    bar_height = max_val  # 条形图的高度
    
    # 从高到低逐行打印
    for level in range(bar_height, 0, -1):
        line = "  "
        for i, val in enumerate(arr):
            if val >= level:
                if highlight_indices and i in highlight_indices:
                    c = colors.get(color, colors['red'])
                    line += f"{c}█{colors['reset']} "
                else:
                    line += "█ "
            else:
                line += "  "
        print(line)
    
    # 打印数值
    line = "  "
    for i, val in enumerate(arr):
        if highlight_indices and i in highlight_indices:
            c = colors.get(color, colors['red'])
            line += f"{c}{val:2d}{colors['reset']} "
        else:
            line += f"{val:2d} "
    print(line)
    
    # 打印索引
    line = "  "
    for i in range(len(arr)):
        if highlight_indices and i in highlight_indices:
            c = colors.get(color, colors['red'])
            line += f"{c}{i:2d}{colors['reset']} "
        else:
            line += f"{i:2d} "
    print(line)


def print_step(step_count, arr, highlight_indices=None, description="", color='yellow'):
    """
    打印单步排序过程
    :param step_count: 当前步数
    :param arr: 当前数组状态
    :param highlight_indices: 需要高亮的索引
    :param description: 操作描述
    :param color: 高亮颜色
    """
    print(f"\n  ┌─ 第 {step_count} 步: {description}")
    print_array(arr, highlight_indices, color=color)
    print(f"  └────────────────────────────────────────")
    time.sleep(0.1)


def print_exchange_step(step_count, arr, i, j):
    """
    打印交换操作
    """
    print_step(step_count, arr, [i, j], f"交换 arr[{i}]={arr[i]} 和 arr[{j}]={arr[j]}", 'red')


def print_compare_step(step_count, arr, i, j):
    """
    打印比较操作
    """
    print_step(step_count, arr, [i, j], f"比较 arr[{i}]={arr[i]} 和 arr[{j}]={arr[j]}", 'yellow')


# ============================================================
# 复杂度信息
# ============================================================

# 各种排序算法的复杂度信息
COMPLEXITY_INFO = {
    "bubble": {
        "name": "冒泡排序 (Bubble Sort)",
        "best": "O(n)",
        "avg": "O(n²)",
        "worst": "O(n²)",
        "space": "O(1)",
        "stable": "稳定",
        "desc": "通过反复比较相邻元素并交换顺序错误的元素，使较大的元素像气泡一样逐渐浮到数组末端"
    },
    "selection": {
        "name": "选择排序 (Selection Sort)",
        "best": "O(n²)",
        "avg": "O(n²)",
        "worst": "O(n²)",
        "space": "O(1)",
        "stable": "不稳定",
        "desc": "每轮从未排序部分选择最小（或最大）的元素，放到已排序部分的末尾"
    },
    "insertion": {
        "name": "插入排序 (Insertion Sort)",
        "best": "O(n)",
        "avg": "O(n²)",
        "worst": "O(n²)",
        "space": "O(1)",
        "stable": "稳定",
        "desc": "将未排序元素逐个插入到已排序序列中的正确位置，类似整理扑克牌"
    },
    "exchange": {
        "name": "交换排序 (Exchange Sort)",
        "best": "O(n)",
        "avg": "O(n²)",
        "worst": "O(n²)",
        "space": "O(1)",
        "stable": "稳定",
        "desc": "类似冒泡排序，通过相邻元素比较和交换实现排序"
    },
    "cocktail": {
        "name": "鸡尾酒排序 (Cocktail Sort)",
        "best": "O(n)",
        "avg": "O(n²)",
        "worst": "O(n²)",
        "space": "O(1)",
        "stable": "稳定",
        "desc": "冒泡排序的改进，双向遍历数组，先从左到右再从右到左"
    },
    "quick": {
        "name": "快速排序 (Quick Sort)",
        "best": "O(n log n)",
        "avg": "O(n log n)",
        "worst": "O(n²)",
        "space": "O(log n)",
        "stable": "不稳定",
        "desc": "采用分治策略，选择一个基准元素，将数组分为两部分递归排序"
    },
    "merge": {
        "name": "归并排序 (Merge Sort)",
        "best": "O(n log n)",
        "avg": "O(n log n)",
        "worst": "O(n log n)",
        "space": "O(n)",
        "stable": "稳定",
        "desc": "采用分治策略，将数组不断二分，排序后再合并"
    },
    "heap": {
        "name": "堆排序 (Heap Sort)",
        "best": "O(n log n)",
        "avg": "O(n log n)",
        "worst": "O(n log n)",
        "space": "O(1)",
        "stable": "不稳定",
        "desc": "利用二叉堆数据结构，每次取出堆顶元素并调整堆"
    },
    "shell": {
        "name": "希尔排序 (Shell Sort)",
        "best": "O(n log² n)",
        "avg": "O(n^1.3)",
        "worst": "O(n²)",
        "space": "O(1)",
        "stable": "不稳定",
        "desc": "插入排序的改进，按不同增量分组进行插入排序，逐步缩小增量"
    },
    "tim": {
        "name": "蒂姆排序 (Tim Sort)",
        "best": "O(n)",
        "avg": "O(n log n)",
        "worst": "O(n log n)",
        "space": "O(n)",
        "stable": "稳定",
        "desc": "Python和Java的默认排序算法，结合归并排序和插入排序的混合算法"
    },
    "intro": {
        "name": "综合排序 (Intro Sort)",
        "best": "O(n log n)",
        "avg": "O(n log n)",
        "worst": "O(n log n)",
        "space": "O(log n)",
        "stable": "不稳定",
        "desc": "C++标准库的排序算法，结合快速排序、堆排序和插入排序"
    },
    "radix_lsd": {
        "name": "基数排序 - LSD (Radix LSD Sort)",
        "best": "O(nk)",
        "avg": "O(nk)",
        "worst": "O(nk)",
        "space": "O(n+k)",
        "stable": "稳定",
        "desc": "从最低位（Least Significant Digit）开始，按位进行排序"
    },
    "radix_msd": {
        "name": "基数排序 - MSD (Radix MSD Sort)",
        "best": "O(nk)",
        "avg": "O(nk)",
        "worst": "O(nk)",
        "space": "O(n+k)",
        "stable": "稳定",
        "desc": "从最高位（Most Significant Digit）开始，按位进行排序"
    },
    "counting": {
        "name": "计数排序 (Counting Sort)",
        "best": "O(n+k)",
        "avg": "O(n+k)",
        "worst": "O(n+k)",
        "space": "O(k)",
        "stable": "稳定",
        "desc": "适用于小范围整数，统计每个值的出现次数来确定位置"
    },
    "gnome": {
        "name": "地精排序 (Gnome Sort)",
        "best": "O(n)",
        "avg": "O(n²)",
        "worst": "O(n²)",
        "space": "O(1)",
        "stable": "稳定",
        "desc": "类似插入排序但实现更简单，地精向前走遇到逆序就交换并后退"
    },
    "cycle": {
        "name": "循环排序 (Cycle Sort)",
        "best": "O(n²)",
        "avg": "O(n²)",
        "worst": "O(n²)",
        "space": "O(1)",
        "stable": "不稳定",
        "desc": "将元素放到最终位置，需要最少的写入操作"
    },
    "pancake": {
        "name": "煎饼排序 (Pancake Sort)",
        "best": "O(n)",
        "avg": "O(n²)",
        "worst": "O(n²)",
        "space": "O(1)",
        "stable": "不稳定",
        "desc": "只能通过翻转数组前缀来排序，类似翻转煎饼"
    },
    "oddeven": {
        "name": "奇偶排序 (Odd-Even Sort)",
        "best": "O(n)",
        "avg": "O(n²)",
        "worst": "O(n²)",
        "space": "O(1)",
        "stable": "稳定",
        "desc": "冒泡排序的并行版本，交替比较奇数位和偶数位的相邻元素"
    },
    "comb": {
        "name": "梳排序 (Comb Sort)",
        "best": "O(n log n)",
        "avg": "O(n²/2^k)",
        "worst": "O(n²)",
        "space": "O(1)",
        "stable": "不稳定",
        "desc": "冒泡排序的改进，用逐渐缩小的间隔比较元素"
    },
    "bitonic": {
        "name": "双调排序 (Bitonic Sort)",
        "best": "O(log² n)",
        "avg": "O(log² n)",
        "worst": "O(log² n)",
        "space": "O(n log² n)",
        "stable": "稳定",
        "desc": "适合并行计算的排序算法，要求输入大小为2的幂"
    },
    "stooge": {
        "name": "傻瓜排序 (Stooge Sort)",
        "best": "O(n^2.7)",
        "avg": "O(n^2.7)",
        "worst": "O(n^2.7)",
        "space": "O(n)",
        "stable": "不稳定",
        "desc": "一种效率极低的排序算法，仅用于教学演示"
    },
    "bogo": {
        "name": "博戈排序 (Bogo Sort)",
        "best": "O(n)",
        "avg": "O((n+1)!)",
        "worst": "O(∞)",
        "space": "O(1)",
        "stable": "不稳定",
        "desc": "随机打乱数组直到有序，纯靠运气的排序算法"
    }
}


def print_complexity(algo_key):
    """
    打印排序算法的复杂度信息
    :param algo_key: 算法标识
    """
    info = COMPLEXITY_INFO.get(algo_key)
    if not info:
        return
    
    print(f"\n{'='*60}")
    print(f"  {info['name']}")
    print(f"{'='*60}")
    print(f"  算法描述: {info['desc']}")
    print(f"  最优时间复杂度: {info['best']}")
    print(f"  平均时间复杂度: {info['avg']}")
    print(f"  最差时间复杂度: {info['worst']}")
    print(f"  空间复杂度:     {info['space']}")
    print(f"  稳定性:         {info['stable']}")
    print(f"{'='*60}\n")


def print_result(algo_key, step_count, arr, start_time):
    """
    打印排序结果
    """
    elapsed = (time.time() - start_time) * 1000
    print(f"\n{'='*60}")
    print(f"  排序完成!")
    print(f"  总步数: {step_count}")
    print(f"  耗时: {elapsed:.2f} 毫秒")
    print(f"  排序结果: {arr}")
    print_complexity(algo_key)


# ============================================================
# 通用装饰器
# ============================================================

def sort_with_animation(sort_func, algo_key):
    """
    为排序函数添加动画显示的装饰器
    :param sort_func: 排序函数，需要返回 (排序后数组, 步数)
    :param algo_key: 算法标识
    :return: 包装后的函数
    """
    def wrapper(arr, *args, **kwargs):
        print(f"\n原始数组: {arr}")
        print_array(arr, title="初始状态")
        
        start_time = time.time()
        sorted_arr, steps = sort_func(arr.copy(), *args, **kwargs)
        print_result(algo_key, steps, sorted_arr, start_time)
        return sorted_arr, steps
    return wrapper
