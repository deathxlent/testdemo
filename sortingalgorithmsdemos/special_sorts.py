# -*- coding: utf-8 -*-
"""
特殊排序算法模块
包含：基数LSD排序、基数MSD排序、计数排序、地精排序、循环排序、
      煎饼排序、奇偶排序、梳排序
"""

import time
from utils import print_array, print_step, print_exchange_step, print_compare_step


# ============================================================
# 基数排序 - LSD (Radix LSD Sort)
# ============================================================

def radix_lsd_sort(arr):
    """
    基数排序 - LSD（最低位优先）
    原理：从最低位开始，按每一位的值进行稳定排序（通常使用计数排序）
          每一轮根据当前位的值将元素分配到对应的桶中
    
    步骤：
    1. 找出数组中的最大值，确定需要排序的位数
    2. 从最低位（个位）开始，对每一位进行稳定排序
    3. 使用计数排序对当前位进行排序
    4. 逐位处理，直到最高位
    
    时间复杂度：O(nk)，n为元素个数，k为最大位数
    空间复杂度：O(n+k)
    适用：整数排序，位数较小的情况
    """
    steps = [0]
    n = len(arr)
    
    if n == 0:
        return arr, 0
    
    print(f"\n{'='*60}")
    print(f"  开始基数排序(LSD)，数组长度: {n}")
    print(f"{'='*60}")
    
    # 找出最大值，确定需要排序的位数
    max_val = max(arr)
    exp = 1  # 当前位的指数（1=个位，10=十位，100=百位...）
    
    while max_val // exp > 0:
        steps[0] += 1
        print(f"\n  --- 处理第 {exp} 位 ---")
        
        # 使用计数排序对当前位进行排序
        output = [0] * n
        count = [0] * 10  # 0-9共10个数字
        
        # 统计每个数字出现的次数
        for i in range(n):
            digit = (arr[i] // exp) % 10
            count[digit] += 1
        
        steps[0] += 1
        print(f"  计数数组: {count}")
        
        # 计算累积计数
        for i in range(1, 10):
            count[i] += count[i - 1]
        
        # 从后往前遍历，保证稳定性
        for i in range(n - 1, -1, -1):
            digit = (arr[i] // exp) % 10
            count[digit] -= 1
            output[count[digit]] = arr[i]
        
        # 将结果复制回原数组
        for i in range(n):
            arr[i] = output[i]
        
        steps[0] += 1
        print_step(steps[0], arr, title=f"第 {exp} 位排序后")
        
        exp *= 10
    
    return arr, steps[0]


# ============================================================
# 基数排序 - MSD (Radix MSD Sort)
# ============================================================

def radix_msd_sort(arr):
    """
    基数排序 - MSD（最高位优先）
    原理：从最高位开始，按位进行排序
          对每个桶递归进行MSD排序
    
    步骤：
    1. 找出数组中的最大值，确定最高位
    2. 从最高位开始，将元素分配到对应的桶中
    3. 对每个非空桶递归进行MSD排序
    4. 合并所有桶
    
    时间复杂度：O(nk)
    空间复杂度：O(n+k)
    """
    steps = [0]
    
    print(f"\n{'='*60}")
    print(f"  开始基数排序(MSD)，数组长度: {len(arr)}")
    print(f"{'='*60}")
    
    def get_max_digit(arr):
        """获取数组中最大数的位数"""
        if not arr:
            return 0
        max_val = max(arr)
        digits = 0
        while max_val > 0:
            digits += 1
            max_val //= 10
        return digits
    
    def msd_sort_helper(arr, exp):
        """MSD排序的递归辅助函数"""
        if len(arr) <= 1 or exp == 0:
            return arr
        
        steps[0] += 1
        print(f"\n  --- 处理第 {exp} 位 ---")
        print(f"  输入: {arr}")
        
        # 创建10个桶
        buckets = [[] for _ in range(10)]
        
        # 根据当前位将元素分配到桶中
        for num in arr:
            digit = (num // exp) % 10
            buckets[digit].append(num)
            steps[0] += 1
        
        print(f"  分配到桶: {[b for b in buckets if b]}")
        
        # 对每个非空桶递归排序
        result = []
        for bucket in buckets:
            if bucket:
                sorted_bucket = msd_sort_helper(bucket, exp // 10)
                result.extend(sorted_bucket)
        
        steps[0] += 1
        print(f"  合并结果: {result}")
        
        return result
    
    # 获取最高位
    max_digit = get_max_digit(arr)
    exp = 10 ** (max_digit - 1) if max_digit > 0 else 1
    
    # 执行排序
    sorted_arr = msd_sort_helper(arr, exp)
    
    # 将结果复制回原数组
    for i in range(len(arr)):
        arr[i] = sorted_arr[i]
    
    return arr, steps[0]


# ============================================================
# 计数排序 (Counting Sort)
# ============================================================

def counting_sort(arr):
    """
    计数排序算法
    原理：统计每个值出现的次数，然后根据统计结果
          计算每个元素的最终位置
    
    步骤：
    1. 找出数组中的最大值和最小值
    2. 创建计数数组，统计每个值出现的次数
    3. 计算累积计数，确定每个元素的最终位置
    4. 根据累积计数将元素放到正确位置
    
    时间复杂度：O(n+k)，k为最大值与最小值之差
    空间复杂度：O(k)
    适用：小范围整数排序
    """
    steps = [0]
    n = len(arr)
    
    if n == 0:
        return arr, 0
    
    print(f"\n{'='*60}")
    print(f"  开始计数排序，数组长度: {n}")
    print(f"{'='*60}")
    
    # 步骤1：找出最大值和最小值
    min_val = min(arr)
    max_val = max(arr)
    range_val = max_val - min_val + 1
    
    steps[0] += 1
    print(f"  最小值: {min_val}, 最大值: {max_val}, 范围: {range_val}")
    
    # 步骤2：创建计数数组并统计
    count = [0] * range_val
    for i in range(n):
        count[arr[i] - min_val] += 1
    
    steps[0] += 1
    print(f"  计数数组: {count}")
    
    # 步骤3：计算累积计数
    for i in range(1, range_val):
        count[i] += count[i - 1]
    
    steps[0] += 1
    print(f"  累积计数: {count}")
    
    # 步骤4：根据累积计数放置元素（从后往前保证稳定性）
    output = [0] * n
    for i in range(n - 1, -1, -1):
        output[count[arr[i] - min_val] - 1] = arr[i]
        count[arr[i] - min_val] -= 1
        steps[0] += 1
        print_step(steps[0], output[:count[arr[i] - min_val] + 1], 
                   [count[arr[i] - min_val]], 
                   f"放置 arr[{i}]={arr[i]} 到位置 {count[arr[i] - min_val]}", 'blue')
    
    # 将结果复制回原数组
    for i in range(n):
        arr[i] = output[i]
    
    return arr, steps[0]


# ============================================================
# 地精排序 (Gnome Sort)
# ============================================================

def gnome_sort(arr):
    """
    地精排序算法
    原理：类似插入排序但实现更简单
          地精向前走，遇到逆序就交换并后退一步
          否则继续前进
    
    步骤：
    1. 初始位置在索引1
    2. 如果当前元素大于等于前一个元素，前进
    3. 如果当前元素小于前一个元素，交换并后退
    4. 如果在起点，前进
    5. 到达末尾则完成
    
    时间复杂度：O(n²)
    空间复杂度：O(1)
    """
    steps = [0]
    n = len(arr)
    pos = 1  # 地精的位置
    
    print(f"\n{'='*60}")
    print(f"  开始地精排序，数组长度: {n}")
    print(f"{'='*60}")
    
    while pos < n:
        steps[0] += 1
        
        if pos == 0:
            # 在起点，必须前进
            pos += 1
            print_step(steps[0], arr, [pos], f"在起点，前进到位置 {pos}", 'yellow')
        elif arr[pos] >= arr[pos - 1]:
            # 当前元素大于等于前一个，前进
            print_step(steps[0], arr, [pos], 
                       f"arr[{pos}]={arr[pos]} >= arr[{pos-1}]={arr[pos-1]}，前进", 'green')
            pos += 1
        else:
            # 当前元素小于前一个，交换并后退
            print_compare_step(steps[0], arr, pos, pos - 1)
            arr[pos], arr[pos - 1] = arr[pos - 1], arr[pos]
            steps[0] += 1
            print_exchange_step(steps[0], arr, pos, pos - 1)
            pos -= 1
            print_step(steps[0], arr, [pos], f"后退到位置 {pos}", 'red')
    
    return arr, steps[0]


# ============================================================
# 循环排序 (Cycle Sort)
# ============================================================

def cycle_sort(arr):
    """
    循环排序算法
    原理：将元素放到最终位置，需要最少的写入操作
    
    步骤：
    1. 对每个位置，找到该元素应在的位置
    2. 如果元素不在正确位置，形成一个循环
    3. 沿着循环将元素放到正确位置
    4. 重复直到所有元素就位
    
    时间复杂度：O(n²)
    空间复杂度：O(1)
    特点：写入操作最少，适合写入成本高的存储设备
    """
    steps = [0]
    n = len(arr)
    
    print(f"\n{'='*60}")
    print(f"  开始循环排序，数组长度: {n}")
    print(f"{'='*60}")
    
    for cycle_start in range(n - 1):
        item = arr[cycle_start]
        pos = cycle_start
        
        steps[0] += 1
        print_step(steps[0], arr, [cycle_start], 
                   f"循环起点: {cycle_start}, 当前元素: {item}", 'yellow')
        
        # 找到元素应在的位置
        for i in range(cycle_start + 1, n):
            steps[0] += 1
            if arr[i] < item:
                pos += 1
                print_compare_step(steps[0], arr, i, cycle_start)
        
        # 如果元素已在正确位置，跳过
        if pos == cycle_start:
            print_step(steps[0], arr, [cycle_start], 
                       f"元素 {item} 已在正确位置", 'green')
            continue
        
        # 跳过重复元素
        while item == arr[pos]:
            pos += 1
        
        # 放置元素到正确位置
        arr[pos], item = item, arr[pos]
        steps[0] += 1
        print_exchange_step(steps[0], arr, pos, cycle_start)
        print_step(steps[0], arr, [pos], 
                   f"放置 {arr[pos]} 到位置 {pos}，取出 {item}", 'blue')
        
        # 继续处理循环中的剩余元素
        while pos != cycle_start:
            pos = cycle_start
            
            # 找到元素应在的位置
            for i in range(cycle_start + 1, n):
                steps[0] += 1
                if arr[i] < item:
                    pos += 1
            
            # 跳过重复元素
            while item == arr[pos]:
                pos += 1
            
            # 放置元素
            arr[pos], item = item, arr[pos]
            steps[0] += 1
            print_exchange_step(steps[0], arr, pos, cycle_start)
            print_step(steps[0], arr, [pos], 
                       f"放置 {arr[pos]} 到位置 {pos}，取出 {item}", 'blue')
    
    return arr, steps[0]


# ============================================================
# 煎饼排序 (Pancake Sort)
# ============================================================

def pancake_sort(arr):
    """
    煎饼排序算法
    原理：只能通过翻转数组前缀来排序
          类似用铲子翻转煎饼堆
    
    步骤：
    1. 找到当前最大值的位置
    2. 翻转从开头到最大值位置，将最大值移到开头
    3. 翻转整个未排序部分，将最大值移到末尾
    4. 缩小未排序范围，重复以上步骤
    
    时间复杂度：O(n²)
    空间复杂度：O(1)
    """
    steps = [0]
    n = len(arr)
    
    print(f"\n{'='*60}")
    print(f"  开始煎饼排序，数组长度: {n}")
    print(f"{'='*60}")
    
    def flip(k):
        """翻转数组的前k个元素"""
        left, right = 0, k
        while left < right:
            arr[left], arr[right] = arr[right], arr[left]
            left += 1
            right -= 1
    
    # 从大到小依次将最大值放到正确位置
    for size in range(n, 1, -1):
        # 找到最大值的位置
        max_idx = 0
        for i in range(1, size):
            steps[0] += 1
            print_compare_step(steps[0], arr, i, max_idx)
            if arr[i] > arr[max_idx]:
                max_idx = i
        
        steps[0] += 1
        print_step(steps[0], arr, [max_idx], 
                   f"找到最大值 {arr[max_idx]} 在位置 {max_idx}", 'yellow')
        
        # 如果最大值不在正确位置
        if max_idx != size - 1:
            # 第一步：翻转到开头
            if max_idx != 0:
                flip(max_idx)
                steps[0] += 1
                print_step(steps[0], arr, list(range(max_idx + 1)), 
                           f"翻转前 {max_idx + 1} 个元素", 'red')
            
            # 第二步：翻转到末尾
            flip(size - 1)
            steps[0] += 1
            print_step(steps[0], arr, list(range(size)), 
                       f"翻转前 {size} 个元素，最大值 {arr[size-1]} 就位", 'green')
    
    return arr, steps[0]


# ============================================================
# 奇偶排序 (Odd-Even Sort)
# ============================================================

def odd_even_sort(arr):
    """
    奇偶排序算法
    原理：冒泡排序的并行版本
          交替比较奇数位和偶数位的相邻元素
    
    步骤：
    1. 对所有奇数位置的相邻元素进行比较交换（(0,1), (2,3), ...）
    2. 对所有偶数位置的相邻元素进行比较交换（(1,2), (3,4), ...）
    3. 重复以上步骤，直到某轮无交换发生
    
    时间复杂度：O(n²)
    空间复杂度：O(1)
    """
    steps = [0]
    n = len(arr)
    sorted_flag = False
    
    print(f"\n{'='*60}")
    print(f"  开始奇偶排序，数组长度: {n}")
    print(f"{'='*60}")
    
    while not sorted_flag:
        sorted_flag = True
        
        # 奇数位置比较交换：(0,1), (2,3), ...
        print(f"\n  --- 奇数位比较 ---")
        for i in range(0, n - 1, 2):
            steps[0] += 1
            print_compare_step(steps[0], arr, i, i + 1)
            
            if arr[i] > arr[i + 1]:
                arr[i], arr[i + 1] = arr[i + 1], arr[i]
                sorted_flag = False
                steps[0] += 1
                print_exchange_step(steps[0], arr, i, i + 1)
        
        # 偶数位置比较交换：(1,2), (3,4), ...
        print(f"\n  --- 偶数位比较 ---")
        for i in range(1, n - 1, 2):
            steps[0] += 1
            print_compare_step(steps[0], arr, i, i + 1)
            
            if arr[i] > arr[i + 1]:
                arr[i], arr[i + 1] = arr[i + 1], arr[i]
                sorted_flag = False
                steps[0] += 1
                print_exchange_step(steps[0], arr, i, i + 1)
    
    return arr, steps[0]


# ============================================================
# 梳排序 (Comb Sort)
# ============================================================

def comb_sort(arr):
    """
    梳排序算法
    原理：冒泡排序的改进
          用逐渐缩小的间隔比较元素，消除"乌龟"值
          （小值在末尾的情况）
    
    步骤：
    1. 初始间隔为数组长度
    2. 每次将间隔除以收缩因子（通常为1.3）
    3. 按当前间隔比较并交换元素
    4. 当间隔为1且无交换时完成
    
    时间复杂度：平均O(n²/2^k)，最坏O(n²)
    空间复杂度：O(1)
    """
    steps = [0]
    n = len(arr)
    gap = n
    shrink = 1.3  # 收缩因子
    sorted_flag = False
    
    print(f"\n{'='*60}")
    print(f"  开始梳排序，数组长度: {n}")
    print(f"  收缩因子: {shrink}")
    print(f"{'='*60}")
    
    while not sorted_flag:
        # 缩小间隔
        gap = int(gap / shrink)
        
        # 间隔不能小于1
        if gap <= 1:
            gap = 1
            sorted_flag = True
        
        steps[0] += 1
        print(f"\n  --- 当前间隔: {gap} ---")
        
        # 按当前间隔比较并交换
        for i in range(n - gap):
            steps[0] += 1
            print_compare_step(steps[0], arr, i, i + gap)
            
            if arr[i] > arr[i + gap]:
                arr[i], arr[i + gap] = arr[i + gap], arr[i]
                sorted_flag = False
                steps[0] += 1
                print_exchange_step(steps[0], arr, i, i + gap)
    
    return arr, steps[0]
