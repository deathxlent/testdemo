# fetch_info 豆瓣书籍信息获取工具 使用手册

## 一、工具概述

fetch_info 是一个专门用于从豆瓣获取书籍详细信息的 Python 工具，源自 calibre-web 项目的元数据提取模块。相比 ver1 中的豆瓣解析器，这个工具采用了更稳定、更可靠的实现方式，能够有效获取豆瓣书籍信息。

**核心优势：**
- ✅ 更稳定的 HTML 解析（使用 lxml + XPath 代替正则表达式）
- ✅ 更好的反爬虫应对机制
- ✅ 支持封面代理功能
- ✅ 内置 LRU 缓存机制
- ✅ 线程池并发处理
- ✅ 完整的元数据结构定义

## 二、功能特性

### 2.1 核心功能

| 功能 | 说明 |
|------|------|
| 🔍 书籍搜索 | 根据书名关键词在豆瓣搜索相关书籍 |
| 📖 详情获取 | 获取书籍的完整详细信息 |
| 🖼️ 封面下载 | 支持下载书籍封面图片 |
| 🏷️ 标签提取 | 自动提取书籍标签 |
| ⭐ 评分获取 | 获取豆瓣评分信息 |
| 📚 元数据提取 | 提取作者、出版社、ISBN、出版日期、简介等完整元数据 |
| 🔄 封面代理 | 内置封面代理服务，避免跨域和防盗链问题 |
| 💾 结果缓存 | LRU 缓存最近查询结果，提升访问速度 |

### 2.2 可获取的书籍字段

| 字段 | 类型 | 说明 |
|------|------|------|
| id | str | 豆瓣书籍 ID |
| title | str | 书籍标题（含副标题） |
| authors | List[str] | 作者列表（含译者） |
| publisher | str | 出版社 |
| publishedDate | str | 出版日期（格式：YYYY-MM-DD） |
| description | str | 内容简介（HTML 格式） |
| url | str | 豆瓣书籍详情页链接 |
| cover | str | 封面图片链接 |
| rating | float | 豆瓣评分（0-5 分制，乘以 2 为 10 分制） |
| tags | List[str] | 书籍标签列表 |
| series | str | 丛书信息 |
| identifiers | Dict | 标识符字典（含 ISBN） |
| source | MetaSourceInfo | 数据源信息 |

## 三、安装和配置

### 3.1 安装依赖

```bash
pip install -r requirements.txt
```

**依赖包说明：**
- `undetected-chromedriver~=3.5.5` - 反检测的 Chrome 驱动（可选，用于更复杂的反爬场景）
- `calibreweb` - 元数据基础框架（本项目已提取相关模块）
- `requests` - HTTP 请求库
- `lxml` - HTML/XML 解析库
- `flask` - Web 框架（用于封面代理）

### 3.2 配置 Cookie

**重要：必须配置 Cookie 才能正常使用！**

1. 在浏览器中登录 [豆瓣](https://www.douban.com)
2. 打开浏览器开发者工具（F12），切换到 Network（网络）标签
3. 刷新页面，点击任意一个请求
4. 在请求头中找到 `Cookie` 字段，复制完整的 Cookie 值
5. 编辑 `book/NewDouban.py` 文件，找到第 39 行：
   ```python
   COOKIES_STR='' #这块必须填写cookie才能用
   ```
6. 将 Cookie 粘贴到引号中：
   ```python
   COOKIES_STR='viewed="xxx"; bid=xxx; ...'
   ```

**Cookie 格式示例：**
```
viewed="37844982"; bid=Q2hUro2xx-k; _vwo_uuid_v2=D8B26A5B448B0D2CAEB7E4196DD4F8AF3|72c2ce6b90f15e6787d9c5d24fb9ff46; ll="108288"; dbcl2="73544729:Fk/mTpBq06w"; ck=0s3K; ap_v=0,6.0; frodotk_db="52281fefef4ffd62f6785fcfcdeff826"; push_noty_num=0; push_doumail_num=0
```

## 四、快速开始

### 4.1 基础使用

```python
from book.NewDouban import NewDouban

# 初始化解析器
douban = NewDouban()

# 搜索书籍
results = douban.search("三体 刘慈欣")

# 遍历结果
for book in results:
    print(f"书名: {book.title}")
    print(f"作者: {', '.join(book.authors)}")
    print(f"评分: {book.rating * 2} / 10")
    print(f"出版社: {book.publisher}")
    print(f"ISBN: {book.identifiers.get('isbn', 'N/A')}")
    print(f"豆瓣链接: {book.url}")
    print(f"标签: {', '.join(book.tags)}")
    print("---")
```

### 4.2 运行示例程序

项目自带了一个示例程序 `main_cp.py`，演示了如何批量处理多个书名：

```bash
python main_cp.py
```

**示例程序功能：**
1. 预定义了一个书名列表
2. 自动清理书名中的括号、作者等冗余信息
3. 依次搜索每本书
4. 如果搜索不到，尝试用更短的关键词重试
5. 输出格式化的书籍信息（评分、简介、标题、作者、ISBN、链接、标签）
6. 每次请求间隔约 5.5 秒，避免触发反爬

## 五、API 详解

### 5.1 NewDouban 类

**核心类，提供搜索功能。**

```python
class NewDouban(Metadata):
    def __init__(self):
        # 初始化，自动加载搜索器和封面处理

    def search(self, query: str, generic_cover: str = "", locale: str = "en"):
        """
        搜索书籍
        
        Args:
            query: 搜索关键词（书名 + 作者 效果最佳）
            generic_cover: 通用封面路径（可选）
            locale: 语言设置（默认 en）
            
        Returns:
            List[DoubanMetaRecord]: 书籍列表，按相关度排序
        """
```

### 5.2 DoubanMetaRecord 类

**书籍元数据记录类，继承自 MetaRecord。**

**字段属性：**
```python
book.id                # 豆瓣书籍 ID，如 '37844982'
book.title             # 书名，如 '三体：地球往事三部曲之一'
book.authors           # 作者列表，如 ['刘慈欣']
book.publisher         # 出版社，如 '重庆出版社'
book.publishedDate     # 出版日期，如 '2008-1-1'
book.description       # 内容简介（HTML 格式）
book.url               # 豆瓣链接，如 'https://book.douban.com/subject/37844982/'
book.cover             # 封面图片链接
book.rating            # 评分（0-5 分制）
book.tags              # 标签列表，如 ['科幻', '刘慈欣', '三体']
book.series            # 丛书名称
book.identifiers       # 标识符字典，如 {'isbn': '9787536692930'}
book.source            # 数据源信息
```

**特殊属性 - cover 代理：**
当 `DOUBAN_PROXY_COVER = True` 时，`book.cover` 会自动返回代理地址，避免豆瓣的防盗链限制。

### 5.3 MetaSourceInfo 类

**数据源信息类。**

```python
@dataclasses.dataclass
class MetaSourceInfo:
    id: str           # 数据源 ID，固定为 'new_douban'
    description: str  # 数据源描述，固定为 'New Douban Books'
    link: str         # 数据源链接，固定为 'https://book.douban.com/'
```

## 六、高级配置

### 6.1 配置项说明

在 `book/NewDouban.py` 文件头部可以配置以下参数：

```python
# 是否自动代理封面地址
DOUBAN_PROXY_COVER = True

# 代理服务器地址（如果自动检测失败，可以手动指定）
# 示例：'http://192.168.1.100:8083/'
DOUBAN_PROXY_COVER_HOST_URL = ''

# 封面代理路径
DOUBAN_PROXY_COVER_PATH = 'metadata/douban_cover?cover='

# 豆瓣搜索 URL
DOUBAN_SEARCH_URL = "https://www.douban.com/search"

# 最大缓存数量（LRU 缓存）
DOUBAN_BOOK_CACHE_SIZE = 10

# 并发查询数（建议保持为 1，避免触发反爬）
DOUBAN_CONCURRENCY_SIZE = 1

# 请求间隔（随机 0-0.1 秒）
# 在 DoubanBookLoader.random_sleep() 中定义
```

### 6.2 封面代理功能

工具内置了一个 Flask 路由用于代理豆瓣封面：

```python
@meta.route("/metadata/douban_cover", methods=["GET"])
def proxy_douban_cover():
    """
    代理豆瓣封面展示
    使用方式：/metadata/douban_cover?cover={URL编码后的封面地址}
    """
```

**使用场景：**
- 在 Web 应用中展示豆瓣封面时，避免防盗链
- 解决跨域问题
- 统一图片来源

### 6.3 缓存机制

使用 `functools.lru_cache` 实现缓存：

```python
@lru_cache(maxsize=DOUBAN_BOOK_CACHE_SIZE)
def load_book(self, url):
    # 缓存最近查询的书籍详情
    # 默认缓存最近 10 本书的详情
```

**缓存优势：**
- 减少重复请求
- 提高响应速度
- 降低被封风险

### 6.4 并发处理

使用 `ThreadPoolExecutor` 实现并发搜索：

```python
self.thread_pool = ThreadPoolExecutor(max_workers=10, thread_name_prefix='douban_async')
```

虽然线程池大小为 10，但 `DOUBAN_CONCURRENCY_SIZE = 1` 限制了实际并发数，确保每次只请求一本书，避免触发反爬。

## 七、核心实现原理

### 7.1 搜索流程

```
用户输入关键词
    ↓
调用豆瓣搜索接口：https://www.douban.com/search?cat=1001&q={关键词}
    ↓
解析搜索结果页面，提取书籍详情页链接
    ↓
使用 XPath 提取所有 <a class="nbg"> 标签的 href 属性
    ↓
解析 href 中的跳转参数，提取真实的书籍详情页 URL
    ↓
使用线程池并发加载书籍详情
    ↓
返回书籍列表
```

### 7.2 详情页解析

使用 `lxml` + `XPath` 解析，主要提取：

| 信息 | XPath 表达式 |
|------|-------------|
| 书名 | `//span[@property='v:itemreviewed']` |
| 封面 | `//a[@class='nbg']/@href` |
| 评分 | `//strong[@property='v:average']` |
| 作者 | `//span[@class='pl']`（文本以"作者"开头的节点） |
| 出版社 | `//span[@class='pl']`（文本以"出版社"开头的节点） |
| 出版年 | `//span[@class='pl']`（文本以"出版年"开头的节点） |
| ISBN | `//span[@class='pl']`（文本以"ISBN"开头的节点） |
| 简介 | `//div[@id='link-report']//div[@class='intro']` |
| 标签 | `//a[contains(@class, 'tag')]` |

### 7.3 为什么比 ver1 更稳定？

| 对比项 | ver1 | fetch_info |
|--------|------|------------|
| 解析方式 | 正则表达式 | lxml + XPath |
| 搜索接口 | `subject_suggest` API | 通用搜索页面 |
| 错误处理 | 简单 try-except | 完善的状态码检查 |
| 请求间隔 | 固定 7 秒 | 随机 0-0.1 秒 + 外部控制 |
| 封面处理 | 直接下载 | 支持代理 |
| 结果缓存 | 无 | LRU 缓存 |
| HTML 解析 | 字符串匹配 | 结构化解析 |

**关键优势说明：**

1. **XPath 比正则更稳定**
   - 正则表达式对页面结构变化敏感
   - XPath 基于文档结构，更能抵抗微小变化
   - 如标题提取：`//span[@property='v:itemreviewed']` 比 `<span property="v:itemreviewed">([^<]+)</span>` 更可靠

2. **使用通用搜索页面**
   - `subject_suggest` API 可能随时被限制或关闭
   - 通用搜索页面更稳定，是正常用户访问的路径

3. **更好的请求伪装**
   - 完整的请求头设置
   - 合理的 Referer 设置
   - 随机延迟避免规律检测

## 八、完整使用示例

### 8.1 单本查询

```python
from book.NewDouban import NewDouban

def search_single_book(keyword):
    douban = NewDouban()
    results = douban.search(keyword)
    
    if not results:
        print("未找到相关书籍")
        return None
    
    book = results[0]  # 取第一个结果
    
    print("=" * 50)
    print(f"📚 {book.title}")
    print("=" * 50)
    print(f"👤 作者: {', '.join(book.authors)}")
    print(f"🏢 出版社: {book.publisher}")
    print(f"📅 出版日期: {book.publishedDate}")
    print(f"⭐ 评分: {book.rating * 2:.1f} / 10")
    print(f"🏷️  标签: {', '.join(book.tags)}")
    print(f"🔗 链接: {book.url}")
    print(f"📖 ISBN: {book.identifiers.get('isbn', 'N/A')}")
    print("-" * 50)
    print("📝 简介:")
    # 清理 HTML 标签
    import re
    description = re.sub(r'<[^>]+>', '', book.description)
    print(description[:500] + "..." if len(description) > 500 else description)
    
    return book

# 使用示例
search_single_book("百年孤独 马尔克斯")
```

### 8.2 批量查询

```python
import time
from book.NewDouban import NewDouban

def batch_search(book_list, interval=5.5):
    """
    批量搜索书籍
    
    Args:
        book_list: 书名列表
        interval: 请求间隔（秒）
    """
    douban = NewDouban()
    results = []
    
    for i, book_name in enumerate(book_list, 1):
        print(f"\n[{i}/{len(book_list)}] 正在搜索: {book_name}")
        
        # 清理书名
        clean_name = clean_book_name(book_name)
        
        # 搜索
        books = douban.search(clean_name)
        
        if not books:
            # 重试策略：尝试更短的关键词
            print(f"  未找到，尝试简化关键词...")
            for strategy in [
                lambda x: x.split(":")[0] if ":" in x else None,
                lambda x: x.split("：")[0] if "：" in x else None,
                lambda x: x.rsplit("-", 1)[0] if "-" in x else None,
            ]:
                retry_name = strategy(clean_name)
                if retry_name:
                    books = douban.search(retry_name)
                    if books:
                        break
        
        if books:
            book = books[0]
            print(f"  ✅ 找到: {book.title} (评分: {book.rating * 2:.1f})")
            results.append(book)
        else:
            print(f"  ❌ 未找到: {book_name}")
            results.append(None)
        
        # 间隔
        if i < len(book_list):
            time.sleep(interval)
    
    return results

def clean_book_name(name):
    """清理书名中的冗余信息"""
    import re
    
    # 移除扩展名
    name = name.rsplit(".", 1)[0]
    
    # 移除各种括号及内容
    patterns = [
        r'\([^)]*\)',      # ()
        r'（[^）]*）',      # （）
        r'\[[^\]]*\]',      # []
        r'【[^】]*】',      # 【】
        r'《[^》]*》',      # 《》
    ]
    
    for pattern in patterns:
        name = re.sub(pattern, '', name)
    
    return name.strip()

# 使用示例
books = [
    "艺术小史_从史前岩画到当代艺术 - [英] 夏洛特·马林斯.epub",
    "税的荒唐与智慧_历史上的税收故事 - [美] 迈克尔·基恩.epub",
    "三体 - 刘慈欣.epub",
]

results = batch_search(books)
```

### 8.3 下载封面

```python
import requests
import os
from book.NewDouban import NewDouban

def download_cover(book, save_dir="covers"):
    """
    下载书籍封面
    
    Args:
        book: DoubanMetaRecord 对象
        save_dir: 保存目录
    """
    os.makedirs(save_dir, exist_ok=True)
    
    cover_url = book.cover
    if not cover_url:
        print("无封面链接")
        return None
    
    # 处理代理封面
    if DOUBAN_PROXY_COVER and DOUBAN_COVER_DOMAIN in cover_url:
        # 直接使用原始 URL 下载
        import urllib.parse
        component = urllib.parse.urlparse(cover_url)
        query = urllib.parse.parse_qs(component.query)
        if 'cover' in query:
            cover_url = urllib.parse.unquote(query['cover'][0])
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://book.douban.com/',
        'Cookie': COOKIES_STR
    }
    
    try:
        response = requests.get(cover_url, headers=headers, timeout=10)
        if response.status_code == 200:
            ext = cover_url.rsplit('.', 1)[-1].lower()
            if ext not in ['jpg', 'jpeg', 'png', 'webp']:
                ext = 'jpg'
            filename = f"{book.id}.{ext}"
            filepath = os.path.join(save_dir, filename)
            
            with open(filepath, 'wb') as f:
                f.write(response.content)
            
            print(f"✅ 封面已保存: {filepath}")
            return filepath
        else:
            print(f"❌ 下载失败，状态码: {response.status_code}")
    except Exception as e:
        print(f"❌ 下载异常: {e}")
    
    return None

# 使用示例
douban = NewDouban()
results = douban.search("三体")
if results:
    download_cover(results[0])
```

## 九、文件结构

```
fetch_info/
├── main_cp.py           # 示例程序，演示批量搜索
├── requirements.txt     # 依赖包列表
└── book/
    ├── __init__.py      # 包初始化文件
    ├── NewDouban.py     # 核心模块，豆瓣解析实现
    ├── Metadata.py      # 元数据基类定义
    ├── helper.py        # 辅助函数（封面保存）
    ├── search_metadata.py  # Flask 应用模拟
    └── mocks.py         # 模拟类（用于独立运行）
```

### 文件说明

**NewDouban.py** - 核心模块
- `NewDouban` 类：主入口，提供 `search()` 方法
- `DoubanBookSearcher` 类：搜索器，负责搜索页面解析
- `DoubanBookLoader` 类：加载器，负责详情页加载（含缓存）
- `DoubanBookHtmlParser` 类：解析器，负责 HTML 解析
- `DoubanMetaRecord` 类：数据记录类
- `proxy_douban_cover()`：封面代理路由

**Metadata.py** - 元数据定义
- `MetaSourceInfo` 类：数据源信息
- `MetaRecord` 类：元数据记录基类
- `Metadata` 类：元数据提供者抽象基类

**helper.py** - 辅助函数
- `save_cover_from_url()`：从 URL 保存封面
- `save_cover()`：保存封面数据

## 十、常见问题

### Q1: 搜索总是返回空列表？
A: 请检查：
1. 是否已正确配置 `COOKIES_STR`
2. Cookie 是否过期（重新登录豆瓣获取）
3. 网络是否正常，能否访问豆瓣
4. 尝试更换搜索关键词

### Q2: 提示 403 Forbidden？
A: 这是豆瓣的反爬虫机制：
1. 等待一段时间再尝试
2. 确保 Cookie 有效
3. 增加请求间隔时间
4. 考虑更换 IP

### Q3: 封面图片无法显示？
A: 豆瓣有防盗链机制：
1. 开启 `DOUBAN_PROXY_COVER = True`
2. 使用内置的封面代理服务
3. 下载到本地后再使用

### Q4: 如何提高搜索准确率？
A: 建议：
1. 关键词包含书名 + 作者，如 "三体 刘慈欣"
2. 去掉书名中的版本、系列等冗余信息
3. 如果第一次搜索不到，尝试简化关键词重试

### Q5: 程序运行缓慢？
A: 正常现象，为了避免被封：
1. 每次请求有随机延迟
2. 并发数限制为 1
3. 可以调整 `DOUBAN_CONCURRENCY_SIZE`，但不建议大于 2

## 十一、注意事项

1. **Cookie 必须配置**：没有有效 Cookie 无法获取任何数据
2. **遵守访问频率**：不要过于频繁地请求，建议间隔至少 3-5 秒
3. **Cookie 有效期**：豆瓣 Cookie 会过期，需要定期更新
4. **仅供个人使用**：请遵守豆瓣的使用条款，不要用于商业用途
5. **数据版权**：书籍信息版权归豆瓣和原作者所有
6. **备份 Cookie**：建议备份有效的 Cookie，避免频繁重新登录

## 十二、与 ver1 集成建议

### 12.1 为什么需要集成？
ver1 中的 `douban_parser.py` 存在以下问题：
- 使用正则表达式解析，不稳定
- 搜索 API 可能被限制
- 错误处理不完善
- 没有封面代理功能

### 12.2 集成方案

**方案一：替换解析器**
```python
# 在 main_window.py 中
# from douban_parser import DoubanParser  # 旧的
from book.NewDouban import NewDouban      # 新的

# 适配 NewDouban 的接口
class DoubanParserAdapter:
    def __init__(self):
        self.douban = NewDouban()
    
    def search_book(self, title, author=''):
        keyword = f"{title} {author}".strip()
        results = self.douban.search(keyword)
        if results:
            book = results[0]
            return {
                'title': book.title,
                'author': ', '.join(book.authors),
                'isbn': book.identifiers.get('isbn', ''),
                'rating': book.rating * 2,
                'douban_url': book.url,
                'douban_id': book.id,
                'publisher': book.publisher,
                'pubdate': book.publishedDate,
                'summary': book.description,
                'cover_url': book.cover,
            }
        return None
```

**方案二：直接使用 NewDouban**
1. 将 `book/` 目录复制到 ver1 目录下
2. 修改相关导入语句
3. 配置 Cookie（可以复用 ver1 的 config.json）

**关键修改点：**
- 配置读取：从 `config.json` 读取 Cookie 并设置到 `COOKIES_STR`
- 结果转换：将 `DoubanMetaRecord` 转换为 ver1 需要的字典格式
- 封面处理：使用 `download_cover` 函数下载封面

## 十三、版本信息

- **来源**: calibre-web 项目元数据模块
- **适配**: 独立运行版本
- **核心文件**: `book/NewDouban.py`
- **推荐用途**: 作为 ver1 的替代或补充解析方案
- **优势**: 稳定、可靠、反爬能力强
