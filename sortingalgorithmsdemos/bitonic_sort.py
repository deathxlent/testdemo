# -*- coding: utf-8 -*-
"""
双调排序算法模块
双调排序是一种适合并行计算的排序算法
要求输入数组的大小必须是2的幂
"""

import time
from utils import print_array, print_step, print_exchange_step, print_compare_step


def bitonic_sort(arr):
    """
    双调排序算法
    原理：通过构建双调序列（先升后降或先降后升的序列）
          然后对双调序列进行排序
    
    双调序列定义：存在一个位置i，使得
      arr[0] <= arr[1] <= ... <= arr[i] >= arr[i+1] >= ... >= arr[n-1]
    或者
      arr[0] >= arr[1] >= ... >= arr[i] <= arr[i+1] <= ... <= arr[n-1]
    
    步骤：
    1. 将每两个元素构建成双调序列
    2. 将每4个元素构建成双调序列
    3. 继续加倍，直到整个数组成为双调序列
    4. 对双调序列进行排序
    
    时间复杂度：O(log² n) 比较轮数
    空间复杂度：O(n log² n)（并行版本）
    """
    steps = [0]
    n = len(arr)
    
    # 检查数组长度是否是2的幂
    if n & (n - 1) != 0:
        print(f"\n  ⚠ 警告：双调排序要求数组长度是2的幂，当前长度: {n}")
        # 填充到下一个2的幂
        next_power = 1
        while next_power < n:
            next_power *= 2
        print(f"  填充到 {next_power} 个元素")
        max_val = max(arr) if arr else 0
        arr.extend([max_val] * (next_power - n))
        n = next_power
    
    print(f"\n{'='*60}")
    print(f"  开始双调排序，数组长度: {n}")
    print(f"{'='*60}")
    
    def bitonic_merge(low, count, direction):
        """
        双调合并：将双调序列排序
        :param low: 起始位置
        :param count: 元素数量
        :param direction: 排序方向（True=升序，False=降序）
        """
        if count <= 1:
            return
        
        k = count // 2
        
        steps[0] += 1
        print_step(steps[0], arr, list(range(low, low + count)), 
                   f"双调合并 [{low}, {low + count - 1}]，方向: {'升序' if direction else '降序'}", 'yellow')
        
        # 比较并交换
        for i in range(low, low + k):
            steps[0] += 1
            print_compare_step(steps[0], arr, i, i + k)
            
            if (direction and arr[i] > arr[i + k]) or (not direction and arr[i] < arr[i + k]):
                arr[i], arr[i + k] = arr[i + k], arr[i]
                steps[0] += 1
                print_exchange_step(steps[0], arr, i, i + k)
        
        # 递归合并两半
        bitonic_merge(low, k, direction)
        bitonic_merge(low + k, k, direction)
    
    def bitonic_sort_recursive(low, count, direction):
        """
        双调排序的递归实现
        """
        if count <= 1:
            return
        
        k = count // 2
        
        # 对前半部分升序排序
        bitonic_sort_recursive(low, k, True)
        
        # 对后半部分降序排序
        bitonic_sort_recursive(low + k, k, False)
        
        # 合并整个双调序列
        bitonic_merge(low, count, direction)
    
    # 执行双调排序
    bitonic_sort_recursive(0, n, True)
    
    # 移除填充的元素
    while len(arr) > 1 and arr[-1] == arr[-2]:
        arr.pop()
    
    return arr, steps[0]
