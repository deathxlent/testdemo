import os
import re
import time
import json
import threading
import queue
from datetime import datetime
from typing import Dict, Any, Optional, Callable
import urllib.request
import urllib.parse


class DoubanParser:
    def __init__(self, config_path: str = None):
        self.cookie = ''
        self.config_path = config_path or os.path.join(os.path.dirname(__file__), 'config.json')
        self.load_config()
        
        self.parse_queue = queue.Queue()
        self.is_running = False
        self.parse_thread = None
        self.last_parse_time = 0
        self.min_interval = 7
        
        self.progress_callback = None
        self.status_callback = None
        self.complete_callback = None
    
    def load_config(self):
        try:
            if os.path.exists(self.config_path):
                with open(self.config_path, 'r', encoding='utf-8') as f:
                    config = json.load(f)
                    self.cookie = config.get('douban_cookie', '')
        except Exception as e:
            print(f"加载配置失败: {e}")
    
    def save_config(self, cookie: str):
        try:
            config = {'douban_cookie': cookie}
            os.makedirs(os.path.dirname(self.config_path), exist_ok=True)
            with open(self.config_path, 'w', encoding='utf-8') as f:
                json.dump(config, f, ensure_ascii=False, indent=2)
            self.cookie = cookie
            return True
        except Exception as e:
            print(f"保存配置失败: {e}")
            return False
    
    def has_cookie(self) -> bool:
        return bool(self.cookie and self.cookie.strip())
    
    def search_book(self, title: str, author: str = '') -> Optional[Dict[str, Any]]:
        if not self.has_cookie():
            return {'error': '未配置豆瓣 Cookie'}
        
        try:
            search_keyword = f"{title} {author}".strip()
            print(f"搜索豆瓣: {search_keyword}")
            
            search_url = f"https://book.douban.com/j/subject_suggest?q={urllib.parse.quote(search_keyword)}"
            
            headers = {
                'Cookie': self.cookie,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': 'https://book.douban.com/'
            }
            
            req = urllib.request.Request(search_url, headers=headers)
            with urllib.request.urlopen(req, timeout=10) as response:
                data = response.read().decode('utf-8')
                results = json.loads(data)
                
                if results and len(results) > 0:
                    print(f"找到 {len(results)} 个结果")
                    book_info = results[0]
                    subject_id = book_info.get('id', '')
                    
                    if subject_id:
                        return self.get_book_detail(subject_id)
                return None
        except Exception as e:
            print(f"搜索书籍失败: {e}")
            return {'error': str(e)}
    
    def get_book_detail(self, subject_id: str) -> Optional[Dict[str, Any]]:
        try:
            url = f"https://book.douban.com/subject/{subject_id}/"
            
            headers = {
                'Cookie': self.cookie,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': 'https://book.douban.com/'
            }
            
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=15) as response:
                html = response.read().decode('utf-8')
                
                book_data = self._parse_book_html(html, subject_id)
                return book_data
        except Exception as e:
            print(f"获取书籍详情失败: {e}")
            return {'error': str(e)}
    
    def _parse_book_html(self, html: str, subject_id: str) -> Dict[str, Any]:
        data = {
            'douban_url': f"https://book.douban.com/subject/{subject_id}/",
            'douban_id': subject_id
        }
        
        try:
            title_match = re.search(r'<span property="v:itemreviewed">([^<]+)</span>', html)
            if title_match:
                data['title'] = title_match.group(1).strip()
            
            subtitle_match = re.search(r'<span class="subtitle">([^<]+)</span>', html)
            if subtitle_match:
                data['subtitle'] = subtitle_match.group(1).strip()
            
            author_match = re.search(r'<span class="pl">作者</span>:[^<]*<a[^>]*>([^<]+)</a>', html)
            if author_match:
                data['author'] = author_match.group(1).strip()
            else:
                author_match2 = re.search(r'<span class="pl"> 作者</span>:([\s\S]*?)</a>', html)
                if author_match2:
                    author_text = re.sub(r'<[^>]+>', '', author_match2.group(1))
                    data['author'] = author_text.strip()
            
            rating_match = re.search(r'<strong class="ll rating_num" property="v:average">([^<]+)</strong>', html)
            if rating_match:
                try:
                    data['rating'] = float(rating_match.group(1).strip())
                except:
                    pass
            
            isbn_match = re.search(r'<span class="pl">ISBN:</span>\s*([0-9]+)', html)
            if isbn_match:
                data['isbn'] = isbn_match.group(1).strip()
            
            publisher_match = re.search(r'<span class="pl">出版社:</span>\s*([^<]+)<br/>', html)
            if publisher_match:
                data['publisher'] = publisher_match.group(1).strip()
            
            pubdate_match = re.search(r'<span class="pl">出版年:</span>\s*([^<]+)<br/>', html)
            if pubdate_match:
                data['pubdate'] = pubdate_match.group(1).strip()
            
            cover_match = re.search(r'<a class="nbg" href="([^"]+)" title="点击看大图">', html)
            if cover_match:
                data['cover_url'] = cover_match.group(1)
            
            summary_match = re.search(r'<span class="all hidden">([\s\S]*?)</span>', html)
            if not summary_match:
                summary_match = re.search(
                    r'<div class="intro"[^>]*>([\s\S]*?)</div>\s*<div class="indent">', 
                    html
                )
            if summary_match:
                summary = re.sub(r'<[^>]+>', '', summary_match.group(1))
                summary = re.sub(r'\s+', ' ', summary).strip()
                data['summary'] = summary[:500] if len(summary) > 500 else summary
            
            print(f"解析完成: {data.get('title', '未知')}")
        except Exception as e:
            print(f"解析HTML错误: {e}")
        
        return data
    
    def download_cover(self, cover_url: str, save_path: str) -> bool:
        try:
            if os.path.exists(save_path):
                return True
            
            headers = {
                'Cookie': self.cookie,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': 'https://book.douban.com/'
            }
            
            req = urllib.request.Request(cover_url, headers=headers)
            with urllib.request.urlopen(req, timeout=10) as response:
                img_data = response.read()
                os.makedirs(os.path.dirname(save_path), exist_ok=True)
                with open(save_path, 'wb') as f:
                    f.write(img_data)
                return True
        except Exception as e:
            print(f"下载封面失败: {e}")
            return False
    
    def add_to_queue(self, book_id: int, book_data: Dict[str, Any], callback: Callable = None):
        self.parse_queue.put({
            'book_id': book_id,
            'book_data': book_data,
            'callback': callback,
            'timestamp': time.time()
        })
        
        if not self.is_running:
            self.start_parser()
    
    def queue_size(self) -> int:
        return self.parse_queue.qsize()
    
    def start_parser(self):
        if self.is_running:
            return
        
        self.is_running = True
        self.parse_thread = threading.Thread(target=self._parse_worker, daemon=True)
        self.parse_thread.start()
    
    def stop_parser(self):
        self.is_running = False
    
    def _parse_worker(self):
        print("豆瓣解析队列已启动")
        
        while self.is_running:
            try:
                task = self.parse_queue.get(timeout=1)
                
                now = time.time()
                time_since_last = now - self.last_parse_time
                if time_since_last < self.min_interval:
                    wait_time = self.min_interval - time_since_last
                    print(f"等待 {wait_time:.1f} 秒后继续解析...")
                    time.sleep(wait_time)
                
                self.last_parse_time = time.time()
                
                if self.status_callback:
                    self.status_callback(f"正在解析: {task['book_data'].get('title', '未知')}")
                
                result = self.search_book(
                    task['book_data'].get('title', ''),
                    task['book_data'].get('author', '')
                )
                
                if result and 'error' not in result:
                    result['book_id'] = task['book_id']
                    
                    if 'cover_url' in result and result['cover_url']:
                        file_hash = abs(hash(task['book_data'].get('physical_path', '') + str(task['book_id'])))
                        cover_filename = f"cover_{file_hash}.jpg"
                        covers_dir = os.path.join(os.path.dirname(__file__), 'covers')
                        cover_path = os.path.join(covers_dir, cover_filename)
                        
                        if self.download_cover(result['cover_url'], cover_path):
                            result['cover_path'] = cover_path
                    
                    if task['callback']:
                        task['callback'](result, None)
                else:
                    error_msg = result.get('error', '解析失败') if result else '解析失败'
                    if task['callback']:
                        task['callback'](None, error_msg)
                
                if self.progress_callback:
                    self.progress_callback()
                
                self.parse_queue.task_done()
                
            except queue.Empty:
                if self.parse_queue.qsize() == 0:
                    self.is_running = False
                    if self.status_callback:
                        self.status_callback("解析队列已空闲")
                    break
            except Exception as e:
                print(f"解析队列错误: {e}")
                time.sleep(1)
        
        print("豆瓣解析队列已停止")
