# -*- coding: utf-8 -*-
"""
测试脚本：验证所有排序算法是否正常工作
"""

import sys
import os

# 将当前目录添加到路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from utils import generate_random_array
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


def test_sort_algorithm(name, func, arr, max_steps=10000):
    """测试单个排序算法"""
    try:
        # 对于博戈排序，限制数组大小
        if name == "Bogo Sort" and len(arr) > 8:
            arr = arr[:8]
        
        # 对于傻瓜排序，限制数组大小
        if name == "Stooge Sort" and len(arr) > 10:
            arr = arr[:10]
        
        # 保存原始数组
        original = arr.copy()
        
        # 运行排序
        sorted_arr, steps = func(arr.copy())
        
        # 验证排序结果
        expected = sorted(original)
        if sorted_arr == expected:
            print(f"  ✓ {name}: PASS ({steps} steps)")
            return True
        else:
            print(f"  ✗ {name}: FAIL (结果不正确)")
            print(f"    期望: {expected}")
            print(f"    实际: {sorted_arr}")
            return False
    except Exception as e:
        print(f"  ✗ {name}: ERROR - {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    print("="*60)
    print("  排序算法测试")
    print("="*60)
    
    # 生成测试数组
    test_arrays = [
        [5, 3, 8, 1, 9, 2, 7, 4, 6],  # 随机
        [1, 2, 3, 4, 5, 6, 7, 8, 9],  # 已排序
        [9, 8, 7, 6, 5, 4, 3, 2, 1],  # 逆序
        [3, 3, 3, 3, 3],  # 全相同
        [1],  # 单元素
        [],  # 空数组
    ]
    
    # 注册所有算法
    algorithms = [
        ("Bubble Sort", bubble_sort),
        ("Selection Sort", selection_sort),
        ("Insertion Sort", insertion_sort),
        ("Exchange Sort", exchange_sort),
        ("Cocktail Sort", cocktail_sort),
        ("Quick Sort", quick_sort),
        ("Merge Sort", merge_sort),
        ("Heap Sort", heap_sort),
        ("Shell Sort", shell_sort),
        ("Tim Sort", tim_sort),
        ("Intro Sort", intro_sort),
        ("Radix LSD Sort", radix_lsd_sort),
        ("Radix MSD Sort", radix_msd_sort),
        ("Counting Sort", counting_sort),
        ("Gnome Sort", gnome_sort),
        ("Cycle Sort", cycle_sort),
        ("Pancake Sort", pancake_sort),
        ("Odd-Even Sort", odd_even_sort),
        ("Comb Sort", comb_sort),
        ("Bitonic Sort", bitonic_sort),
        ("Stooge Sort", stooge_sort),
        ("Bogo Sort", bogo_sort),
    ]
    
    passed = 0
    failed = 0
    
    for name, func in algorithms:
        print(f"\n测试 {name}:")
        all_pass = True
        
        for i, arr in enumerate(test_arrays):
            if not test_sort_algorithm(f"  测试 {i+1}", func, arr.copy()):
                all_pass = False
        
        if all_pass:
            passed += 1
        else:
            failed += 1
    
    print(f"\n{'='*60}")
    print(f"  测试结果: {passed}/{len(algorithms)} 通过")
    if failed > 0:
        print(f"  ⚠ {failed} 个算法存在问题")
    else:
        print(f"  ✓ 所有算法测试通过！")
    print(f"{'='*60}")
    
    return failed == 0


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
