import os
import zipfile
from typing import Dict, Any, Optional
from bs4 import BeautifulSoup
from ebooklib import epub
from PIL import Image
import io
import re


class EbookParser:
    SUPPORTED_EXTENSIONS = {'.mobi', '.epub', '.azw3', '.azw'}
    
    def __init__(self, covers_dir: str = "covers"):
        self.covers_dir = covers_dir
        os.makedirs(covers_dir, exist_ok=True)
    
    def is_supported_file(self, filepath: str) -> bool:
        ext = os.path.splitext(filepath)[1].lower()
        return ext in self.SUPPORTED_EXTENSIONS
    
    def parse_book(self, filepath: str) -> Dict[str, Any]:
        if not os.path.exists(filepath):
            return {}
        
        ext = os.path.splitext(filepath)[1].lower()
        
        book_data = {
            'physical_path': filepath,
            'extension': ext[1:],
            'file_size': os.path.getsize(filepath)
        }
        
        if ext == '.epub':
            parsed_data = self._parse_epub(filepath)
        elif ext in ['.mobi', '.azw3', '.azw']:
            parsed_data = self._parse_mobi_azw3(filepath)
        else:
            parsed_data = {}
        
        book_data.update(parsed_data)
        
        if not book_data.get('title'):
            book_data['title'] = os.path.splitext(os.path.basename(filepath))[0]
        
        return book_data
    
    def _parse_epub(self, filepath: str) -> Dict[str, Any]:
        data = {}
        try:
            book = epub.read_epub(filepath, options={'ignore_ncx': True})
            
            title = self._get_metadata(book, 'title')
            if title:
                data['title'] = title
            
            creator = self._get_metadata(book, 'creator')
            if creator:
                data['author'] = creator
            
            description = self._get_metadata(book, 'description')
            if description:
                data['subtitle'] = description[:200]
            
            isbn = self._get_metadata(book, 'identifier')
            if isbn and len(isbn) in [10, 13] and isbn.isdigit():
                data['isbn'] = isbn
            
            subject = self._get_metadata(book, 'subject')
            if subject:
                data['category'] = subject
            
            cover_path = self._extract_epub_cover(filepath, book)
            if cover_path:
                data['cover_path'] = cover_path
                
        except Exception as e:
            print(f"Error parsing EPUB {filepath}: {e}")
        
        return data
    
    def _get_metadata(self, book, name: str) -> Optional[str]:
        try:
            meta = book.get_metadata('DC', name)
            if meta and len(meta) > 0:
                value = meta[0][0]
                if value and isinstance(value, str):
                    value = value.strip()
                    if value and value.lower() not in ['none', 'null', 'nan']:
                        return value
        except:
            pass
        return None
    
    def _extract_epub_cover(self, filepath: str, book: epub.EpubBook) -> Optional[str]:
        try:
            cover_item = None
            cover_id = None
            
            print(f"\n=== 开始提取封面: {os.path.basename(filepath)} ===")
            
            try:
                items_info = []
                for item in book.get_items():
                    try:
                        t = item.get_type() if hasattr(item, 'get_type') else 'N/A'
                        n = item.get_name() if hasattr(item, 'get_name') else 'N/A'
                        i = item.get_id() if hasattr(item, 'get_id') else 'N/A'
                        items_info.append(f"  id={i}, type={t}, name={n}")
                    except:
                        pass
                print(f"  ebooklib items ({len(items_info)}个):")
                for info in items_info[:15]:
                    print(info)
                if len(items_info) > 15:
                    print(f"  ... 还有 {len(items_info) - 15} 个")
            except Exception as e:
                print(f"  打印调试信息失败: {e}")
            
            try:
                for item in book.get_metadata('OPF', 'cover'):
                    print(f"  OPF cover 元数据: {item}")
                    cover_id = None
                    if isinstance(item, tuple) and len(item) > 1:
                        for k, v in item[1].items():
                            if k.endswith('content'):
                                cover_id = v
                                print(f"  找到 cover_id: {cover_id}")
                                break
                    if cover_id:
                        break
            except Exception as e:
                print(f"  从OPF元数据获取cover_id失败: {e}")
            
            if cover_id:
                for item in book.get_items():
                    try:
                        if item.get_id() == cover_id:
                            cover_item = item
                            print(f"  ✅ 通过cover_id找到封面: {item.get_name()}")
                            break
                    except:
                        pass
            
            if not cover_item:
                for item in book.get_items():
                    try:
                        item_type = item.get_type() if hasattr(item, 'get_type') else None
                        if item_type == 10:
                            cover_item = item
                            print(f"  ✅ 通过ITEM_COVER(10)找到封面: {item.get_name()}")
                            break
                    except:
                        pass
            
            if not cover_item:
                for item in book.get_items():
                    try:
                        item_type = item.get_type() if hasattr(item, 'get_type') else None
                        if item_type == 8:
                            fname = item.get_name().lower()
                            if 'cover' in fname or 'jacket' in fname:
                                cover_item = item
                                print(f"  ✅ 通过ITEM_IMAGE(8)+文件名找到封面: {item.get_name()}")
                                break
                    except:
                        pass
            
            if not cover_item:
                for item in book.get_items():
                    try:
                        fname = item.get_name().lower()
                        if ('cover' in fname or 'jacket' in fname) and fname.endswith(('.jpg', '.jpeg', '.png', '.gif', '.webp')):
                            cover_item = item
                            print(f"  ✅ 通过文件名匹配找到封面: {item.get_name()}")
                            break
                    except:
                        pass
            
            if not cover_item:
                try:
                    image_items = []
                    for item in book.get_items():
                        try:
                            item_type = item.get_type() if hasattr(item, 'get_type') else None
                            if item_type == 8 or item.get_name().lower().endswith(('.jpg', '.jpeg', '.png')):
                                image_items.append(item)
                        except:
                            pass
                    if image_items:
                        print(f"  找到 {len(image_items)} 个图片文件，按大小排序...")
                        valid_images = []
                        for img_item in image_items:
                            try:
                                content = img_item.get_content()
                                if content:
                                    valid_images.append((len(content), img_item))
                            except:
                                pass
                        if valid_images:
                            valid_images.sort(reverse=True, key=lambda x: x[0])
                            cover_item = valid_images[0][1]
                            print(f"  ✅ 选择最大的图片作为封面: {cover_item.get_name()} ({valid_images[0][0]} bytes)")
                except Exception as e:
                    print(f"  按大小选择图片失败: {e}")
            
            if cover_item:
                file_hash = abs(hash(filepath))
                cover_filename = f"cover_{file_hash}.jpg"
                cover_path = os.path.join(self.covers_dir, cover_filename)
                
                if not os.path.exists(cover_path):
                    try:
                        img_data = cover_item.get_content()
                        if img_data and len(img_data) > 0:
                            try:
                                img = Image.open(io.BytesIO(img_data))
                                print(f"  图片模式: {img.mode}, 尺寸: {img.size}")
                                if img.mode in ('RGBA', 'P', 'LA'):
                                    background = Image.new('RGB', img.size, (255, 255, 255))
                                    if img.mode == 'RGBA':
                                        background.paste(img, mask=img.split()[3])
                                    else:
                                        background.paste(img, mask=img.split()[1])
                                    img = background
                                elif img.mode != 'RGB':
                                    img = img.convert('RGB')
                                img.thumbnail((400, 600))
                                img.save(cover_path, 'JPEG', quality=85)
                                print(f"  ✅ 封面已保存: {cover_path}")
                            except Exception as img_error:
                                print(f"❌ 图片处理错误: {img_error}")
                                import traceback
                                traceback.print_exc()
                                return None
                    except Exception as content_error:
                        print(f"❌ 获取图片内容错误: {content_error}")
                        return None
                else:
                    print(f"  封面已存在，跳过: {cover_path}")
                
                return cover_path
            else:
                print("❌ 未找到任何封面图片!")
        except Exception as e:
            print(f"❌ 提取封面异常: {e}")
            import traceback
            traceback.print_exc()
        
        return None
    
    def _parse_mobi_azw3(self, filepath: str) -> Dict[str, Any]:
        data = {}
        print(f"\n=== 开始解析MOBI/AZW3: {os.path.basename(filepath)} ===")
        print("  提示: 对于MOBI/AZW3文件，建议安装kindleunpack库来提取内容")
        print("  安装命令: pip install kindleunpack")
        
        try:
            try:
                from kindleunpack import mobi_book
                print("  ✅ 检测到kindleunpack库，尝试解析...")
            except ImportError:
                print("  ⚠️ kindleunpack未安装，使用基础解析方式")
                
                with open(filepath, 'rb') as f:
                    content = f.read(50000)
                    
                    title_match = re.search(b'(?:title|Title|TITLE)\x00+([^\x00]{2,100})', content)
                    if title_match:
                        try:
                            title = title_match.group(1).decode('utf-8', errors='ignore').strip()
                            if title:
                                data['title'] = title
                                print(f"  找到标题: {title}")
                        except:
                            pass
                    
                    author_match = re.search(b'(?:creator|Creator|CREATOR|author|Author|AUTHOR)\x00+([^\x00]{2,100})', content)
                    if author_match:
                        try:
                            author = author_match.group(1).decode('utf-8', errors='ignore').strip()
                            if author:
                                data['author'] = author
                                print(f"  找到作者: {author}")
                        except:
                            pass
                
        except Exception as e:
            print(f"❌ 解析MOBI/AZW3错误: {e}")
        
        return data
    
    def scan_directory(self, dirpath: str) -> list:
        books = []
        for root, dirs, files in os.walk(dirpath):
            for file in files:
                filepath = os.path.join(root, file)
                if self.is_supported_file(filepath):
                    books.append(filepath)
        return books
    
    def format_file_size(self, size_bytes: int) -> str:
        if not size_bytes:
            return ''
        if size_bytes < 1024:
            return f"{size_bytes} B"
        elif size_bytes < 1024 * 1024:
            return f"{size_bytes / 1024:.1f} KB"
        elif size_bytes < 1024 * 1024 * 1024:
            return f"{size_bytes / (1024 * 1024):.1f} MB"
        else:
            return f"{size_bytes / (1024 * 1024 * 1024):.1f} GB"
