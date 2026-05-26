# -*- coding: utf-8 -*-
"""
基础排序算法模块
包含：冒泡排序、选择排序、插入排序、交换排序、鸡尾酒排序
"""

import time
from utils import print_array, print_step, print_exchange_step, print_compare_step


# ============================================================
# 冒泡排序 (Bubble Sort)
# ============================================================

def bubble_sort(arr):
    """
    冒泡排序算法
    原理：通过反复比较相邻元素并交换顺序错误的元素，
          使较大的元素像气泡一样逐渐"浮"到数组末端
    
    步骤：
    1. 从第一个元素开始，比较相邻的两个元素
    2. 如果前一个比后一个大，则交换它们
    3. 对每一对相邻元素重复上述步骤，一轮结束后最大元素到达末尾
    4. 重复以上步骤，每轮减少一个末尾已排序元素
    
    时间复杂度：O(n²)
    空间复杂度：O(1)
    """
    n = len(arr)
    steps = 0
    
    print(f"\n{'='*60}")
    print(f"  开始冒泡排序，数组长度: {n}")
    print(f"{'='*60}")
    
    # 外层循环控制排序轮数，每轮将一个最大值放到末尾
    for i in range(n):
        swapped = False  # 标记本轮是否有交换，用于优化
        
        # 内层循环进行相邻元素比较，已排序的末尾i个元素不再比较
        for j in range(0, n - i - 1):
            steps += 1
            print_compare_step(steps, arr, j, j + 1)
            
            # 如果前一个元素大于后一个元素，交换它们
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
                swapped = True
                steps += 1
                print_exchange_step(steps, arr, j, j + 1)
        
        # 如果本轮没有发生交换，说明数组已经有序，可以提前结束
        if not swapped:
            print(f"\n  ✓ 本轮无交换，数组已有序，提前结束")
            break
    
    return arr, steps


# ============================================================
# 选择排序 (Selection Sort)
# ============================================================

def selection_sort(arr):
    """
    选择排序算法
    原理：每轮从未排序部分选择最小的元素，放到已排序部分的末尾
    
    步骤：
    1. 在未排序部分中找到最小元素
    2. 将最小元素与未排序部分的第一个元素交换
    3. 重复以上步骤，直到所有元素排序完成
    
    时间复杂度：O(n²)（无论什么情况都是n²次比较）
    空间复杂度：O(1)
    """
    n = len(arr)
    steps = 0
    
    print(f"\n{'='*60}")
    print(f"  开始选择排序，数组长度: {n}")
    print(f"{'='*60}")
    
    # 外层循环：每次确定一个位置的元素
    for i in range(n):
        min_idx = i  # 假设当前位置是最小值的索引
        
        # 内层循环：在未排序部分中找到真正的最小值索引
        for j in range(i + 1, n):
            steps += 1
            print_compare_step(steps, arr, min_idx, j)
            
            if arr[j] < arr[min_idx]:
                min_idx = j
                steps += 1
                print_step(steps, arr, [min_idx], f"找到更小的值 arr[{min_idx}]={arr[min_idx]}", 'green')
        
        # 将找到的最小值交换到已排序部分的末尾
        if min_idx != i:
            arr[i], arr[min_idx] = arr[min_idx], arr[i]
            steps += 1
            print_exchange_step(steps, arr, i, min_idx)
        else:
            steps += 1
            print_step(steps, arr, [i], f"arr[{i}]={arr[i]} 已在正确位置", 'green')
    
    return arr, steps


# ============================================================
# 插入排序 (Insertion Sort)
# ============================================================

def insertion_sort(arr):
    """
    插入排序算法
    原理：将未排序元素逐个插入到已排序序列中的正确位置
          类似整理扑克牌时的操作
    
    步骤：
    1. 假设第一个元素已经有序
    2. 取下一个元素，与已排序部分从后往前比较
    3. 如果已排序部分的元素大于当前元素，将其后移
    4. 找到合适位置后插入当前元素
    5. 重复以上步骤
    
    时间复杂度：O(n²)，但在近乎有序的数组上接近O(n)
    空间复杂度：O(1)
    """
    n = len(arr)
    steps = 0
    
    print(f"\n{'='*60}")
    print(f"  开始插入排序，数组长度: {n}")
    print(f"{'='*60}")
    
    # 从第二个元素开始，第一个元素视为已排序
    for i in range(1, n):
        key = arr[i]  # 当前要插入的元素
        j = i - 1     # 已排序部分的最后一个元素索引
        
        steps += 1
        print_step(steps, arr, [i], f"取出元素 arr[{i}]={key}，准备插入", 'yellow')
        
        # 从后往前遍历已排序部分，找到插入位置
        while j >= 0 and arr[j] > key:
            steps += 1
            print_compare_step(steps, arr, j, j + 1)
            
            arr[j + 1] = arr[j]  # 元素后移
            steps += 1
            print_step(steps, arr, [j + 1], f"将 arr[{j}]={arr[j]} 后移到位置 {j + 1}", 'blue')
            j -= 1
        
        # 插入当前元素到正确位置
        arr[j + 1] = key
        steps += 1
        print_step(steps, arr, [j + 1], f"将 {key} 插入到位置 {j + 1}", 'green')
    
    return arr, steps


# ============================================================
# 交换排序 (Exchange Sort)
# ============================================================

def exchange_sort(arr):
    """
    交换排序算法
    原理：将每个元素与它后面的所有元素比较，如果顺序错误则交换
          这是最简单的排序算法之一
    
    步骤：
    1. 对于每个位置i，与后面的所有位置j(j > i)比较
    2. 如果arr[i] > arr[j]，则交换它们
    3. 重复以上步骤
    
    时间复杂度：O(n²)
    空间复杂度：O(1)
    """
    n = len(arr)
    steps = 0
    
    print(f"\n{'='*60}")
    print(f"  开始交换排序，数组长度: {n}")
    print(f"{'='*60}")
    
    # 外层循环：遍历每个位置
    for i in range(n - 1):
        # 内层循环：与后面所有元素比较
        for j in range(i + 1, n):
            steps += 1
            print_compare_step(steps, arr, i, j)
            
            # 如果顺序错误，交换
            if arr[i] > arr[j]:
                arr[i], arr[j] = arr[j], arr[i]
                steps += 1
                print_exchange_step(steps, arr, i, j)
    
    return arr, steps


# ============================================================
# 鸡尾酒排序 (Cocktail Sort)
# ============================================================

def cocktail_sort(arr):
    """
    鸡尾酒排序算法（双向冒泡排序）
    原理：冒泡排序的改进，双向遍历数组
          先从左到右遍历（将最大值移到右端），
          再从右到左遍历（将最小值移到左端）
    
    步骤：
    1. 从左到右遍历，将最大值冒泡到右端
    2. 从右到左遍历，将最小值冒泡到左端
    3. 缩小范围，重复以上步骤
    4. 如果某轮无交换，提前结束
    
    适用：对于两端已有部分有序的数组效率更高
    
    时间复杂度：O(n²)
    空间复杂度：O(1)
    """
    n = len(arr)
    steps = 0
    start = 0
    end = n - 1
    swapped = True
    
    print(f"\n{'='*60}")
    print(f"  开始鸡尾酒排序，数组长度: {n}")
    print(f"{'='*60}")
    
    while swapped:
        swapped = False
        
        # 从左到右遍历，将最大值移到右端
        for i in range(start, end):
            steps += 1
            print_compare_step(steps, arr, i, i + 1)
            
            if arr[i] > arr[i + 1]:
                arr[i], arr[i + 1] = arr[i + 1], arr[i]
                swapped = True
                steps += 1
                print_exchange_step(steps, arr, i, i + 1)
        
        # 如果没有交换，数组已有序
        if not swapped:
            break
        
        swapped = False
        end -= 1  # 右端已排序，缩小范围
        
        # 从右到左遍历，将最小值移到左端
        for i in range(end - 1, start - 1, -1):
            steps += 1
            print_compare_step(steps, arr, i, i + 1)
            
            if arr[i] > arr[i + 1]:
                arr[i], arr[i + 1] = arr[i + 1], arr[i]
                swapped = True
                steps += 1
                print_exchange_step(steps, arr, i, i + 1)
        
        start += 1  # 左端已排序，缩小范围
    
    return arr, steps
