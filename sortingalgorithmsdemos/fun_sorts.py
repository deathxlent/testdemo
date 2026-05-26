# -*- coding: utf-8 -*-
"""
趣味排序算法模块
包含：傻瓜排序、博戈排序
这些算法效率极低，仅用于教学演示
"""

import random
import time
from utils import print_array, print_step, print_exchange_step


# ============================================================
# 傻瓜排序 (Stooge Sort)
# ============================================================

def stooge_sort(arr):
    """
    傻瓜排序算法
    原理：一种效率极低的递归排序算法，仅用于教学演示
    
    步骤：
    1. 如果第一个元素大于最后一个元素，交换它们
    2. 如果数组中有3个或更多元素：
       a. 对前2/3的元素递归排序
       b. 对后2/3的元素递归排序
       c. 再次对前2/3的元素递归排序
    
    时间复杂度：O(n^2.7)
    空间复杂度：O(n)（递归栈）
    """
    steps = [0]
    n = len(arr)
    
    print(f"\n{'='*60}")
    print(f"  开始傻瓜排序，数组长度: {n}")
    print(f"  ⚠ 警告：此算法效率极低，仅用于教学演示！")
    print(f"{'='*60}")
    
    def stooge_sort_helper(low, high):
        """傻瓜排序的递归辅助函数"""
        if low >= high:
            return
        
        steps[0] += 1
        
        # 如果第一个元素大于最后一个元素，交换它们
        if arr[low] > arr[high]:
            arr[low], arr[high] = arr[high], arr[low]
            steps[0] += 1
            print_exchange_step(steps[0], arr, low, high)
        
        # 如果有3个或更多元素
        if high - low + 1 > 2:
            t = (high - low + 1) // 3
            
            print_step(steps[0], arr, list(range(low, high + 1)), 
                       f"递归: [{low}, {high}] t={t}", 'yellow')
            
            # 对前2/3的元素排序
            stooge_sort_helper(low, high - t)
            
            # 对后2/3的元素排序
            stooge_sort_helper(low + t, high)
            
            # 再次对前2/3的元素排序
            stooge_sort_helper(low, high - t)
    
    stooge_sort_helper(0, n - 1)
    
    return arr, steps[0]


# ============================================================
# 博戈排序 (Bogo Sort)
# ============================================================

def bogo_sort(arr, max_attempts=10000):
    """
    博戈排序算法（也叫随机排序、猴子排序）
    原理：随机打乱数组直到有序，纯靠运气
    
    步骤：
    1. 检查数组是否有序
    2. 如果无序，随机打乱数组
    3. 重复步骤1-2直到有序或达到最大尝试次数
    
    时间复杂度：平均O((n+1)!)，理论上最坏为无穷大
    空间复杂度：O(1)
    
    注意：对于较大的数组（n>10），此算法实际上无法完成
    """
    steps = [0]
    n = len(arr)
    
    def is_sorted():
        """检查数组是否有序"""
        for i in range(n - 1):
            if arr[i] > arr[i + 1]:
                return False
        return True
    
    print(f"\n{'='*60}")
    print(f"  开始博戈排序，数组长度: {n}")
    print(f"  ⚠ 警告：此算法效率极低，仅用于教学演示！")
    print(f"  最大尝试次数: {max_attempts}")
    print(f"{'='*60}")
    
    attempts = 0
    
    while not is_sorted() and attempts < max_attempts:
        steps[0] += 1
        attempts += 1
        
        # 每1000次打印一次状态
        if attempts % 1000 == 0:
            print(f"\r  已尝试 {attempts} 次...", end='', flush=True)
            print_array(arr, title=f"第 {attempts} 次尝试")
        
        # 随机打乱数组
        random.shuffle(arr)
    
    if is_sorted():
        print(f"\n  ✓ 排序成功！尝试次数: {attempts}")
        print_array(arr, title="排序完成")
    else:
        print(f"\n  ✗ 已达到最大尝试次数，排序失败！")
        print(f"  当前数组: {arr}")
    
    return arr, steps[0]
