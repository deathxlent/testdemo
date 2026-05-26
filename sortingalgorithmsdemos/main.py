# -*- coding: utf-8 -*-
"""
排序算法演示程序 - 主入口
提供菜单选择不同的排序算法进行演示
"""

import sys
import time
from utils import (
    generate_random_array, 
    generate_nearly_sorted_array,
    generate_reverse_array,
    print_array, 
    print_complexity,
    COMPLEXITY_INFO
)

# 导入所有排序算法
from basic_sorts import (
    bubble_sort,
    selection_sort,
    insertion_sort,
    exchange_sort,
    cocktail_sort
)

from advanced_sorts import (
    quick_sort,
    merge_sort,
    heap_sort,
    shell_sort,
    tim_sort,
    intro_sort
)

from special_sorts import (
    radix_lsd_sort,
    radix_msd_sort,
    counting_sort,
    gnome_sort,
    cycle_sort,
    pancake_sort,
    odd_even_sort,
    comb_sort
)

from bitonic_sort import bitonic_sort
from fun_sorts import stooge_sort, bogo_sort


# ============================================================
# 算法注册中心
# ============================================================

# 所有排序算法的注册表
SORT_ALGORITHMS = {
    "1": {
        "name": "冒泡排序",
        "en_name": "Bubble Sort",
        "func": bubble_sort,
        "key": "bubble",
        "category": "基础排序"
    },
    "2": {
        "name": "快速排序",
        "en_name": "Quick Sort",
        "func": quick_sort,
        "key": "quick",
        "category": "高级排序"
    },
    "3": {
        "name": "希尔排序",
        "en_name": "Shell Sort",
        "func": shell_sort,
        "key": "shell",
        "category": "高级排序"
    },
    "4": {
        "name": "归并排序",
        "en_name": "Merge Sort",
        "func": merge_sort,
        "key": "merge",
        "category": "高级排序"
    },
    "5": {
        "name": "插入排序",
        "en_name": "Insertion Sort",
        "func": insertion_sort,
        "key": "insertion",
        "category": "基础排序"
    },
    "6": {
        "name": "选择排序",
        "en_name": "Selection Sort",
        "func": selection_sort,
        "key": "selection",
        "category": "基础排序"
    },
    "7": {
        "name": "基数排序 - LSD",
        "en_name": "Radix LSD Sort",
        "func": radix_lsd_sort,
        "key": "radix_lsd",
        "category": "特殊排序"
    },
    "8": {
        "name": "基数排序 - MSD",
        "en_name": "Radix MSD Sort",
        "func": radix_msd_sort,
        "key": "radix_msd",
        "category": "特殊排序"
    },
    "9": {
        "name": "堆排序",
        "en_name": "Heap Sort",
        "func": heap_sort,
        "key": "heap",
        "category": "高级排序"
    },
    "10": {
        "name": "双调排序",
        "en_name": "Bitonic Sort",
        "func": bitonic_sort,
        "key": "bitonic",
        "category": "特殊排序"
    },
    "11": {
        "name": "蒂姆排序",
        "en_name": "Tim Sort",
        "func": tim_sort,
        "key": "tim",
        "category": "高级排序"
    },
    "12": {
        "name": "地精排序",
        "en_name": "Gnome Sort",
        "func": gnome_sort,
        "key": "gnome",
        "category": "特殊排序"
    },
    "13": {
        "name": "循环排序",
        "en_name": "Cycle Sort",
        "func": cycle_sort,
        "key": "cycle",
        "category": "特殊排序"
    },
    "14": {
        "name": "鸡尾酒排序",
        "en_name": "Cocktail Sort",
        "func": cocktail_sort,
        "key": "cocktail",
        "category": "基础排序"
    },
    "15": {
        "name": "煎饼排序",
        "en_name": "Pancake Sort",
        "func": pancake_sort,
        "key": "pancake",
        "category": "特殊排序"
    },
    "16": {
        "name": "傻瓜排序",
        "en_name": "Stooge Sort",
        "func": stooge_sort,
        "key": "stooge",
        "category": "趣味排序"
    },
    "17": {
        "name": "博戈排序",
        "en_name": "Bogo Sort",
        "func": bogo_sort,
        "key": "bogo",
        "category": "趣味排序"
    },
    "18": {
        "name": "交换排序",
        "en_name": "Exchange Sort",
        "func": exchange_sort,
        "key": "exchange",
        "category": "基础排序"
    },
    "19": {
        "name": "奇偶排序",
        "en_name": "Odd-Even Sort",
        "func": odd_even_sort,
        "key": "oddeven",
        "category": "特殊排序"
    },
    "20": {
        "name": "计数排序",
        "en_name": "Counting Sort",
        "func": counting_sort,
        "key": "counting",
        "category": "特殊排序"
    },
    "21": {
        "name": "梳排序",
        "en_name": "Comb Sort",
        "func": comb_sort,
        "key": "comb",
        "category": "特殊排序"
    },
    "22": {
        "name": "综合排序",
        "en_name": "Intro Sort",
        "func": intro_sort,
        "key": "intro",
        "category": "高级排序"
    }
}


# ============================================================
# 菜单和交互功能
# ============================================================

def print_banner():
    """打印程序标题"""
    banner = """
╔══════════════════════════════════════════════════════════════╗
║              排序算法演示程序 (Sorting Algorithms Demo)       ║
╠══════════════════════════════════════════════════════════════╣
║  本程序演示各种常见排序算法的执行过程                          ║
║  每种算法都会：                                              ║
║    1. 实时生成待排序的数据                                    ║
║    2. 显示每一步的排序过程                                    ║
║    3. 统计并显示总步数                                        ║
║    4. 展示时间复杂度和空间复杂度                               ║
╚══════════════════════════════════════════════════════════════╝
"""
    print(banner)


def print_menu():
    """打印主菜单"""
    print("\n" + "="*70)
    print("  选择排序算法:")
    print("="*70)
    
    categories = {}
    for key, algo in SORT_ALGORITHMS.items():
        cat = algo["category"]
        if cat not in categories:
            categories[cat] = []
        categories[cat].append((key, algo))
    
    for cat in ["基础排序", "高级排序", "特殊排序", "趣味排序"]:
        if cat in categories:
            print(f"\n  【{cat}】")
            for key, algo in categories[cat]:
                print(f"    {key:>2}. {algo['name']:<14} ({algo['en_name']})")
    
    print(f"\n  {'---':>2}. 查看所有算法的复杂度对比")
    print(f"  {'0':>2}. 退出程序")
    print("="*70)


def print_complexity_comparison():
    """打印所有算法的复杂度对比表"""
    print("\n" + "="*100)
    print(f"  {'算法名称':<20} {'最优时间':<14} {'平均时间':<14} {'最差时间':<14} {'空间复杂度':<12} {'稳定性':<8}")
    print("="*100)
    
    for key, algo in SORT_ALGORITHMS.items():
        info = COMPLEXITY_INFO.get(algo["key"], {})
        name = f"{algo['name']}({algo['en_name']})"
        if len(name) > 18:
            name = name[:17] + ".."
        print(f"  {name:<20} {info.get('best', 'N/A'):<14} {info.get('avg', 'N/A'):<14} "
              f"{info.get('worst', 'N/A'):<14} {info.get('space', 'N/A'):<12} {info.get('stable', 'N/A'):<8}")
    
    print("="*100)


def get_data_type_choice():
    """获取用户选择的数据类型"""
    print("\n" + "-"*50)
    print("  选择待排序数据类型:")
    print("  1. 随机数据 (Random)")
    print("  2. 近乎有序 (Nearly Sorted)")
    print("  3. 完全逆序 (Reverse Sorted)")
    print("-"*50)
    
    while True:
        try:
            choice = input("  请选择 (1-3，默认1): ").strip()
            if choice == "":
                return 1
            choice = int(choice)
            if 1 <= choice <= 3:
                return choice
            else:
                print("  请输入1-3之间的数字！")
        except ValueError:
            print("  请输入有效的数字！")


def get_array_size(default=10):
    """获取用户输入的数组大小"""
    while True:
        try:
            size = input(f"\n  输入数组大小 (默认{default}): ").strip()
            if size == "":
                return default
            size = int(size)
            if size >= 2:
                return size
            else:
                print("  数组大小必须大于等于2！")
        except ValueError:
            print("  请输入有效的数字！")


def generate_array(choice, size):
    """根据用户选择生成数组"""
    if choice == 1:
        return generate_random_array(size)
    elif choice == 2:
        return generate_nearly_sorted_array(size)
    elif choice == 3:
        return generate_reverse_array(size)


def run_sort_algorithm(algo_key, arr):
    """运行指定的排序算法"""
    algo = SORT_ALGORITHMS[algo_key]
    func = algo["func"]
    key = algo["key"]
    
    print(f"\n{'='*70}")
    print(f"  正在运行: {algo['name']} ({algo['en_name']})")
    print(f"{'='*70}")
    
    # 显示复杂度信息
    print_complexity(key)
    
    # 显示原始数组
    print(f"\n  原始数组: {arr}")
    print_array(arr, title="初始状态")
    
    # 运行排序
    start_time = time.time()
    sorted_arr, steps = func(arr.copy())
    elapsed = (time.time() - start_time) * 1000
    
    # 显示结果
    print(f"\n{'='*70}")
    print(f"  ✅ 排序完成!")
    print(f"  ┌─────────────────────────────────────────────")
    print(f"  │ 算法: {algo['name']} ({algo['en_name']})")
    print(f"  │ 总步数: {steps}")
    print(f"  │ 耗时: {elapsed:.2f} 毫秒")
    print(f"  │ 排序结果: {sorted_arr}")
    print(f"  └─────────────────────────────────────────────")
    print(f"{'='*70}")
    
    return sorted_arr, steps


def run_all_algorithms(arr):
    """运行所有排序算法进行对比"""
    print(f"\n{'='*70}")
    print(f"  运行所有算法对比，原始数组: {arr}")
    print(f"{'='*70}")
    
    results = []
    
    for key, algo in SORT_ALGORITHMS.items():
        print(f"\n  运行 {algo['name']}...")
        try:
            start_time = time.time()
            sorted_arr, steps = algo["func"](arr.copy())
            elapsed = (time.time() - start_time) * 1000
            results.append((algo['name'], steps, elapsed, sorted_arr))
            print(f"    ✓ {steps} 步, {elapsed:.2f} 毫秒")
        except Exception as e:
            print(f"    ✗ 错误: {e}")
    
    print(f"\n{'='*70}")
    print(f"  {'算法名称':<18} {'步数':<10} {'耗时(ms)':<12} {'结果'}")
    print("-"*70)
    for name, steps, elapsed, sorted_arr in sorted(results, key=lambda x: x[2]):
        print(f"  {name:<18} {steps:<10} {elapsed:<12.2f} {sorted_arr[:8]}{'...' if len(sorted_arr) > 8 else ''}")
    print(f"{'='*70}")


# ============================================================
# 主函数
# ============================================================

def main():
    """主函数"""
    print_banner()
    
    while True:
        print_menu()
        
        try:
            choice = input("\n  请选择算法编号 (输入0退出): ").strip()
            
            if choice == "0":
                print("\n  感谢使用排序算法演示程序，再见！\n")
                break
            
            elif choice == "---":
                print_complexity_comparison()
                continue
            
            elif choice not in SORT_ALGORITHMS:
                print("  无效的选择，请重新输入！")
                continue
            
            # 获取数据类型选择
            data_type = get_data_type_choice()
            
            # 获取数组大小
            size = get_array_size(default=10)
            
            # 生成数组
            arr = generate_array(data_type, size)
            
            # 运行排序算法
            run_sort_algorithm(choice, arr)
            
            # 询问是否继续
            again = input("\n  是否继续演示其他算法？(y/n，默认y): ").strip().lower()
            if again == "n":
                print("\n  感谢使用排序算法演示程序，再见！\n")
                break
                
        except KeyboardInterrupt:
            print("\n\n  程序已中断，再见！\n")
            break
        except Exception as e:
            print(f"\n  发生错误: {e}")
            import traceback
            traceback.print_exc()


if __name__ == "__main__":
    main()
