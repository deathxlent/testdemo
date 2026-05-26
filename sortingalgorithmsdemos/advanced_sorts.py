# -*- coding: utf-8 -*-
"""
高级排序算法模块
包含：快速排序、归并排序、堆排序、希尔排序、蒂姆排序、综合排序
"""

import time
from utils import print_array, print_step, print_exchange_step, print_compare_step


# ============================================================
# 快速排序 (Quick Sort)
# ============================================================

def quick_sort(arr):
    """
    快速排序算法（迭代版本，便于显示步骤）
    原理：采用分治策略，选择一个基准元素（pivot），
          将数组分为两部分：小于基准的放左边，大于基准的放右边，
          然后递归对两部分进行排序
    
    步骤：
    1. 选择一个基准元素（通常选第一个或随机选择）
    2. 分区：将小于基准的元素放左边，大于基准的放右边
    3. 递归对左右两部分进行快速排序
    
    时间复杂度：平均O(n log n)，最坏O(n²)
    空间复杂度：O(log n)（递归栈）
    """
    steps = [0]  # 使用列表以便在嵌套函数中修改
    
    print(f"\n{'='*60}")
    print(f"  开始快速排序，数组长度: {len(arr)}")
    print(f"{'='*60}")
    
    def partition(low, high):
        """
        分区函数：选择基准元素，将数组分为两部分
        :return: 基准元素的最终位置
        """
        pivot = arr[high]  # 选择最后一个元素作为基准
        i = low - 1        # 小于基准元素的区域边界
        
        steps[0] += 1
        print_step(steps[0], arr, [high], f"选择基准元素 pivot = arr[{high}]={pivot}", 'yellow')
        
        for j in range(low, high):
            steps[0] += 1
            print_compare_step(steps[0], arr, j, high)
            
            if arr[j] <= pivot:
                i += 1
                if i != j:
                    arr[i], arr[j] = arr[j], arr[i]
                    steps[0] += 1
                    print_exchange_step(steps[0], arr, i, j)
        
        # 将基准元素放到正确位置
        if i + 1 != high:
            arr[i + 1], arr[high] = arr[high], arr[i + 1]
            steps[0] += 1
            print_exchange_step(steps[0], arr, i + 1, high)
        
        steps[0] += 1
        print_step(steps[0], arr, [i + 1], f"基准元素 {pivot} 已就位，位置 {i + 1}", 'green')
        
        return i + 1
    
    # 使用栈实现迭代版本的快速排序
    stack = [(0, len(arr) - 1)]
    
    while stack:
        low, high = stack.pop()
        
        if low < high:
            pi = partition(low, high)
            
            # 将右半部分先入栈（后处理）
            stack.append((pi + 1, high))
            # 将左半部分入栈（先处理）
            stack.append((low, pi - 1))
    
    return arr, steps[0]


# ============================================================
# 归并排序 (Merge Sort)
# ============================================================

def merge_sort(arr):
    """
    归并排序算法
    原理：采用分治策略，将数组不断二分，
          对每个子数组排序后再合并成有序数组
    
    步骤：
    1. 分：将数组从中间分成两个子数组
    2. 治：递归对两个子数组进行归并排序
    3. 合：将两个有序子数组合并成一个有序数组
    
    时间复杂度：O(n log n)（稳定）
    空间复杂度：O(n)（需要辅助数组）
    """
    steps = [0]
    n = len(arr)
    
    print(f"\n{'='*60}")
    print(f"  开始归并排序，数组长度: {n}")
    print(f"{'='*60}")
    
    def merge(left, mid, right):
        """
        合并两个有序子数组
        左子数组：arr[left..mid]
        右子数组：arr[mid+1..right]
        """
        # 创建临时数组
        left_arr = arr[left:mid + 1]
        right_arr = arr[mid + 1:right + 1]
        
        steps[0] += 1
        print_step(steps[0], arr, list(range(left, right + 1)), 
                   f"合并: 左{left_arr} + 右{right_arr}", 'yellow')
        
        i = j = 0  # 左右子数组的索引
        k = left   # 合并后数组的索引
        
        # 比较并合并
        while i < len(left_arr) and j < len(right_arr):
            steps[0] += 1
            print_compare_step(steps[0], arr, left + i, mid + 1 + j)
            
            if left_arr[i] <= right_arr[j]:
                arr[k] = left_arr[i]
                i += 1
            else:
                arr[k] = right_arr[j]
                j += 1
            
            steps[0] += 1
            print_step(steps[0], arr, [k], f"放置 arr[{k}]={arr[k]}", 'blue')
            k += 1
        
        # 复制剩余元素
        while i < len(left_arr):
            arr[k] = left_arr[i]
            steps[0] += 1
            print_step(steps[0], arr, [k], f"复制剩余 arr[{k}]={arr[k]}", 'blue')
            i += 1
            k += 1
        
        while j < len(right_arr):
            arr[k] = right_arr[j]
            steps[0] += 1
            print_step(steps[0], arr, [k], f"复制剩余 arr[{k}]={arr[k]}", 'blue')
            j += 1
            k += 1
        
        steps[0] += 1
        print_step(steps[0], arr, list(range(left, right + 1)), 
                   f"合并完成: {arr[left:right + 1]}", 'green')
    
    # 自底向上的迭代版本
    size = 1
    while size < n:
        steps[0] += 1
        print(f"\n  --- 当前合并大小: {size} ---")
        
        for left in range(0, n, 2 * size):
            mid = min(left + size - 1, n - 1)
            right = min(left + 2 * size - 1, n - 1)
            
            if mid < right:
                merge(left, mid, right)
        
        size *= 2
    
    return arr, steps[0]


# ============================================================
# 堆排序 (Heap Sort)
# ============================================================

def heap_sort(arr):
    """
    堆排序算法
    原理：利用二叉堆（最大堆）数据结构，
          每次取出堆顶（最大值）元素，然后调整堆
    
    步骤：
    1. 建堆：将数组构建成最大堆
    2. 排序：将堆顶元素与末尾元素交换，然后调整堆
    3. 重复步骤2，直到堆为空
    
    时间复杂度：O(n log n)
    空间复杂度：O(1)
    """
    steps = [0]
    n = len(arr)
    
    print(f"\n{'='*60}")
    print(f"  开始堆排序，数组长度: {n}")
    print(f"{'='*60}")
    
    def heapify(size, root):
        """
        调整堆（使以root为根的子树成为最大堆）
        :param size: 堆的大小
        :param root: 根节点索引
        """
        largest = root       # 假设根节点最大
        left = 2 * root + 1  # 左子节点
        right = 2 * root + 2 # 右子节点
        
        # 找出最大的节点
        if left < size:
            steps[0] += 1
            print_compare_step(steps[0], arr, largest, left)
            if arr[left] > arr[largest]:
                largest = left
        
        if right < size:
            steps[0] += 1
            print_compare_step(steps[0], arr, largest, right)
            if arr[right] > arr[largest]:
                largest = right
        
        # 如果最大节点不是根节点，交换并继续调整
        if largest != root:
            arr[root], arr[largest] = arr[largest], arr[root]
            steps[0] += 1
            print_exchange_step(steps[0], arr, root, largest)
            
            # 递归调整受影响的子树
            heapify(size, largest)
    
    # 步骤1：构建最大堆（从最后一个非叶子节点开始）
    print(f"\n  --- 阶段1: 构建最大堆 ---")
    for i in range(n // 2 - 1, -1, -1):
        heapify(n, i)
    
    steps[0] += 1
    print_step(steps[0], arr, title="最大堆构建完成")
    
    # 步骤2：排序过程
    print(f"\n  --- 阶段2: 排序 ---")
    for i in range(n - 1, 0, -1):
        # 将堆顶（最大值）与末尾元素交换
        arr[0], arr[i] = arr[i], arr[0]
        steps[0] += 1
        print_exchange_step(steps[0], arr, 0, i)
        
        steps[0] += 1
        print_step(steps[0], arr, [i], f"最大值 {arr[i]} 已就位，位置 {i}", 'green')
        
        # 调整剩余的堆
        heapify(i, 0)
    
    return arr, steps[0]


# ============================================================
# 希尔排序 (Shell Sort)
# ============================================================

def shell_sort(arr):
    """
    希尔排序算法
    原理：插入排序的改进版，按不同增量分组进行插入排序，
          逐步缩小增量，最终增量为1时完成排序
    
    步骤：
    1. 选择一个增量序列（如 n/2, n/4, ..., 1）
    2. 按当前增量将数组分组
    3. 对每组进行插入排序
    4. 缩小增量，重复步骤2-3，直到增量为1
    
    时间复杂度：取决于增量序列，约O(n^1.3)
    空间复杂度：O(1)
    """
    steps = [0]
    n = len(arr)
    
    print(f"\n{'='*60}")
    print(f"  开始希尔排序，数组长度: {n}")
    print(f"{'='*60}")
    
    # 使用Knuth增量序列：1, 4, 13, 40, ...
    gap = 1
    while gap < n // 3:
        gap = gap * 3 + 1
    
    while gap > 0:
        steps[0] += 1
        print(f"\n  --- 当前增量 gap = {gap} ---")
        
        # 对每个分组进行插入排序
        for i in range(gap, n):
            temp = arr[i]
            j = i
            
            steps[0] += 1
            print_step(steps[0], arr, [i], f"取出 arr[{i}]={temp}", 'yellow')
            
            # 在分组内进行插入排序
            while j >= gap and arr[j - gap] > temp:
                steps[0] += 1
                print_compare_step(steps[0], arr, j, j - gap)
                
                arr[j] = arr[j - gap]
                steps[0] += 1
                print_step(steps[0], arr, [j], f"将 arr[{j - gap}]={arr[j]} 移到位置 {j}", 'blue')
                j -= gap
            
            arr[j] = temp
            steps[0] += 1
            print_step(steps[0], arr, [j], f"将 {temp} 插入到位置 {j}", 'green')
        
        gap //= 3  # 缩小增量
    
    return arr, steps[0]


# ============================================================
# 蒂姆排序 (Tim Sort)
# ============================================================

def tim_sort(arr):
    """
    蒂姆排序算法（简化版）
    原理：Python和Java的默认排序算法，
          结合归并排序和插入排序的混合算法
    
    步骤：
    1. 将数组分成多个小块（run）
    2. 对每个小块使用插入排序
    3. 使用归并排序的方法合并这些块
    
    时间复杂度：O(n log n)
    空间复杂度：O(n)
    """
    steps = [0]
    n = len(arr)
    MIN_MERGE = 8  # 最小run大小
    
    print(f"\n{'='*60}")
    print(f"  开始蒂姆排序，数组长度: {n}")
    print(f"  最小块大小: {MIN_MERGE}")
    print(f"{'='*60}")
    
    def insertion_sort_subarray(left, right):
        """对指定子数组进行插入排序"""
        for i in range(left + 1, right + 1):
            key = arr[i]
            j = i - 1
            
            steps[0] += 1
            print_step(steps[0], arr, [i], f"取出 arr[{i}]={key}", 'yellow')
            
            while j >= left and arr[j] > key:
                steps[0] += 1
                print_compare_step(steps[0], arr, j, j + 1)
                
                arr[j + 1] = arr[j]
                steps[0] += 1
                print_step(steps[0], arr, [j + 1], f"将 arr[{j}]={arr[j]} 后移", 'blue')
                j -= 1
            
            arr[j + 1] = key
            steps[0] += 1
            print_step(steps[0], arr, [j + 1], f"插入 {key} 到位置 {j + 1}", 'green')
    
    def merge(left, mid, right):
        """合并两个有序子数组"""
        left_arr = arr[left:mid + 1]
        right_arr = arr[mid + 1:right + 1]
        
        steps[0] += 1
        print_step(steps[0], arr, list(range(left, right + 1)), 
                   f"合并: 左{left_arr} + 右{right_arr}", 'yellow')
        
        i = j = 0
        k = left
        
        while i < len(left_arr) and j < len(right_arr):
            steps[0] += 1
            if left_arr[i] <= right_arr[j]:
                arr[k] = left_arr[i]
                i += 1
            else:
                arr[k] = right_arr[j]
                j += 1
            steps[0] += 1
            print_step(steps[0], arr, [k], f"放置 arr[{k}]={arr[k]}", 'blue')
            k += 1
        
        while i < len(left_arr):
            arr[k] = left_arr[i]
            steps[0] += 1
            print_step(steps[0], arr, [k], f"复制剩余 arr[{k}]={arr[k]}", 'blue')
            i += 1
            k += 1
        
        while j < len(right_arr):
            arr[k] = right_arr[j]
            steps[0] += 1
            print_step(steps[0], arr, [k], f"复制剩余 arr[{k}]={arr[k]}", 'blue')
            j += 1
            k += 1
    
    # 步骤1：对每个小块进行插入排序
    print(f"\n  --- 阶段1: 对每个小块进行插入排序 ---")
    for i in range(0, n, MIN_MERGE):
        end = min(i + MIN_MERGE - 1, n - 1)
        print(f"\n  排序块 [{i}, {end}]: {arr[i:end + 1]}")
        insertion_sort_subarray(i, end)
    
    # 步骤2：合并所有块
    print(f"\n  --- 阶段2: 合并所有块 ---")
    size = MIN_MERGE
    while size < n:
        for left in range(0, n, 2 * size):
            mid = min(left + size - 1, n - 1)
            right = min(left + 2 * size - 1, n - 1)
            
            if mid < right:
                merge(left, mid, right)
        
        size *= 2
    
    return arr, steps[0]


# ============================================================
# 综合排序 (Intro Sort)
# ============================================================

def intro_sort(arr):
    """
    综合排序算法（简化版）
    原理：C++标准库的排序算法，
          结合快速排序、堆排序和插入排序
    
    步骤：
    1. 先使用快速排序
    2. 如果递归深度超过阈值，切换到堆排序
    3. 当子数组足够小时，使用插入排序
    
    时间复杂度：O(n log n)
    空间复杂度：O(log n)
    """
    steps = [0]
    n = len(arr)
    MAX_DEPTH = 2 * (n.bit_length())  # 最大递归深度
    
    print(f"\n{'='*60}")
    print(f"  开始综合排序，数组长度: {n}")
    print(f"  最大递归深度: {MAX_DEPTH}")
    print(f"{'='*60}")
    
    def insertion_sort_subarray(left, right):
        """对指定子数组进行插入排序"""
        for i in range(left + 1, right + 1):
            key = arr[i]
            j = i - 1
            
            steps[0] += 1
            print_step(steps[0], arr, [i], f"[插入排序] 取出 arr[{i}]={key}", 'yellow')
            
            while j >= left and arr[j] > key:
                steps[0] += 1
                print_compare_step(steps[0], arr, j, j + 1)
                
                arr[j + 1] = arr[j]
                steps[0] += 1
                print_step(steps[0], arr, [j + 1], f"[插入排序] 后移 arr[{j}]", 'blue')
                j -= 1
            
            arr[j + 1] = key
            steps[0] += 1
            print_step(steps[0], arr, [j + 1], f"[插入排序] 插入 {key} 到位置 {j + 1}", 'green')
    
    def heapify(size, root):
        """调整堆"""
        largest = root
        left = 2 * root + 1
        right = 2 * root + 2
        
        if left < size:
            steps[0] += 1
            if arr[left] > arr[largest]:
                largest = left
        
        if right < size:
            steps[0] += 1
            if arr[right] > arr[largest]:
                largest = right
        
        if largest != root:
            arr[root], arr[largest] = arr[largest], arr[root]
            steps[0] += 1
            print_exchange_step(steps[0], arr, root, largest)
            heapify(size, largest)
    
    def heap_sort_subarray(left, right):
        """对指定子数组进行堆排序"""
        print(f"\n  --- [切换到堆排序] 子数组 [{left}, {right}] ---")
        sub_len = right - left + 1
        
        # 构建最大堆
        for i in range(sub_len // 2 - 1, -1, -1):
            heapify(sub_len, i + left)
        
        # 排序
        for i in range(sub_len - 1, 0, -1):
            arr[left], arr[left + i] = arr[left + i], arr[left]
            steps[0] += 1
            print_exchange_step(steps[0], arr, left, left + i)
            heapify(i, left)
    
    def partition(low, high):
        """分区函数"""
        pivot = arr[high]
        i = low - 1
        
        steps[0] += 1
        print_step(steps[0], arr, [high], f"[快速排序] 选择基准 pivot = {pivot}", 'yellow')
        
        for j in range(low, high):
            steps[0] += 1
            print_compare_step(steps[0], arr, j, high)
            
            if arr[j] <= pivot:
                i += 1
                if i != j:
                    arr[i], arr[j] = arr[j], arr[i]
                    steps[0] += 1
                    print_exchange_step(steps[0], arr, i, j)
        
        if i + 1 != high:
            arr[i + 1], arr[high] = arr[high], arr[i + 1]
            steps[0] += 1
            print_exchange_step(steps[0], arr, i + 1, high)
        
        return i + 1
    
    # 使用栈实现迭代版本
    stack = [(0, n - 1, 0)]  # (low, high, depth)
    
    while stack:
        low, high, depth = stack.pop()
        
        if low >= high:
            continue
        
        # 如果子数组足够小，使用插入排序
        if high - low < 16:
            print(f"\n  --- [切换到插入排序] 子数组 [{low}, {high}] ---")
            insertion_sort_subarray(low, high)
            continue
        
        # 如果递归深度超过阈值，使用堆排序
        if depth > MAX_DEPTH:
            heap_sort_subarray(low, high)
            continue
        
        # 使用快速排序
        pi = partition(low, high)
        
        stack.append((pi + 1, high, depth + 1))
        stack.append((low, pi - 1, depth + 1))
    
    return arr, steps[0]
