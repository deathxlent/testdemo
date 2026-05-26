# -*- coding: utf-8 -*-
"""
排序引擎模块
在后台线程中运行排序算法，并通过队列将每一步的状态发送给GUI
"""

import threading
import queue
import time
import sys
import io
import traceback


class SortingEngine:
    """
    排序引擎：在后台线程运行排序算法，通过队列与GUI通信
    
    消息格式（通过queue发送给GUI）:
    {
        'type': 'step' | 'complete' | 'error',
        'step': 步数,
        'array': 当前数组状态,
        'highlight': 高亮索引列表,
        'description': 操作描述,
        'color': 高亮颜色,
        'elapsed': 耗时(ms),
        'algorithm': 算法名称
    }
    """
    
    def __init__(self):
        self._queue = queue.Queue()
        self._thread = None
        self._running = False
        self._paused = False
        self._should_stop = False
        self._pause_event = threading.Event()
        self._pause_event.set()  # set = not paused
        
        # 保存原始的print函数引用（用于恢复）
        self._original_step = None
        self._original_exchange = None
        self._original_compare = None
        self._original_print_array = None
    
    def get_queue(self):
        """获取消息队列"""
        return self._queue
    
    def is_running(self):
        return self._running
    
    def is_paused(self):
        return self._paused
    
    def pause(self):
        """暂停排序"""
        self._paused = True
        self._pause_event.clear()
    
    def resume(self):
        """继续排序"""
        self._paused = False
        self._pause_event.set()
    
    def stop(self):
        """停止排序"""
        self._should_stop = True
        self._paused = False
        self._pause_event.set()
    
    def _install_hooks(self):
        """安装钩子函数，替换utils中的打印函数"""
        import utils
        
        # 保存原始函数
        self._original_step = utils.print_step
        self._original_exchange = utils.print_exchange_step
        self._original_compare = utils.print_compare_step
        self._original_print_array = utils.print_array
        
        # 安装钩子
        utils.print_step = self._hook_step
        utils.print_exchange_step = self._hook_exchange
        utils.print_compare_step = self._hook_compare
        utils.print_array = self._hook_print_array
    
    def _uninstall_hooks(self):
        """恢复原始的打印函数"""
        import utils
        
        if self._original_step:
            utils.print_step = self._original_step
        if self._original_exchange:
            utils.print_exchange_step = self._original_exchange
        if self._original_compare:
            utils.print_compare = self._original_compare
        if self._original_print_array:
            utils.print_array = self._original_print_array
    
    def _hook_step(self, step_count, arr, highlight_indices=None, description="", color='yellow'):
        """print_step的钩子"""
        # 检查是否需要暂停或停止
        self._pause_event.wait()  # 如果paused则阻塞
        if self._should_stop:
            raise StopIteration("Sorting stopped by user")
        
        self._queue.put({
            'type': 'step',
            'step': step_count,
            'array': arr.copy(),
            'highlight': highlight_indices or [],
            'description': description,
            'color': color
        })
        # 控制速度
        time.sleep(0.01)
    
    def _hook_exchange(self, step_count, arr, i, j):
        """print_exchange_step的钩子"""
        self._pause_event.wait()
        if self._should_stop:
            raise StopIteration("Sorting stopped by user")
        
        self._queue.put({
            'type': 'step',
            'step': step_count,
            'array': arr.copy(),
            'highlight': [i, j],
            'description': f'交换 arr[{i}]={arr[i]} 和 arr[{j}]={arr[j]}',
            'color': 'red'
        })
        time.sleep(0.01)
    
    def _hook_compare(self, step_count, arr, i, j):
        """print_compare_step的钩子"""
        self._pause_event.wait()
        if self._should_stop:
            raise StopIteration("Sorting stopped by user")
        
        self._queue.put({
            'type': 'step',
            'step': step_count,
            'array': arr.copy(),
            'highlight': [i, j],
            'description': f'比较 arr[{i}]={arr[i]} 和 arr[{j}]={arr[j]}',
            'color': 'yellow'
        })
        time.sleep(0.01)
    
    def _hook_print_array(self, arr, highlight_indices=None, title="", color=None):
        """print_array的钩子"""
        if title:
            self._queue.put({
                'type': 'step',
                'step': 0,
                'array': arr.copy(),
                'highlight': highlight_indices or [],
                'description': title,
                'color': color or 'green'
            })
    
    def start_sort(self, algorithm_key, algorithm_name, sort_func, arr):
        """
        开始排序（在后台线程中运行）
        
        :param algorithm_key: 算法标识
        :param algorithm_name: 算法显示名称
        :param sort_func: 排序函数
        :param arr: 待排序数组
        """
        if self._running:
            return
        
        self._running = True
        self._paused = False
        self._should_stop = False
        self._pause_event.set()
        
        self._thread = threading.Thread(
            target=self._run_sort,
            args=(algorithm_key, algorithm_name, sort_func, arr),
            daemon=True
        )
        self._thread.start()
    
    def _run_sort(self, algorithm_key, algorithm_name, sort_func, arr):
        """在后台线程中运行排序"""
        try:
            # 安装钩子
            self._install_hooks()
            
            # 发送初始状态
            self._queue.put({
                'type': 'step',
                'step': 0,
                'array': arr.copy(),
                'highlight': [],
                'description': f'初始数组',
                'color': 'green'
            })
            
            start_time = time.time()
            
            # 运行排序算法
            sorted_arr, steps = sort_func(arr.copy())
            
            elapsed = (time.time() - start_time) * 1000
            
            # 发送完成消息
            self._queue.put({
                'type': 'complete',
                'step': steps,
                'array': sorted_arr,
                'highlight': list(range(len(sorted_arr))),
                'description': '排序完成',
                'color': 'green',
                'elapsed': elapsed,
                'algorithm': algorithm_name
            })
            
        except StopIteration:
            self._queue.put({
                'type': 'stopped',
                'description': '排序已停止',
                'algorithm': algorithm_name
            })
        except Exception as e:
            error_msg = traceback.format_exc()
            self._queue.put({
                'type': 'error',
                'description': f'错误: {str(e)}',
                'traceback': error_msg,
                'algorithm': algorithm_name
            })
        finally:
            self._uninstall_hooks()
            self._running = False
            self._paused = False
            self._should_stop = False
    
    def wait(self):
        """等待排序线程结束"""
        if self._thread and self._thread.is_alive():
            self._thread.join(timeout=1)
