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
            
            for item in book.get_metadata('OPF', 'cover'):
                if item and len(item) > 1 and 'content' in item[1]:
                    cover_id = item[1]['content']
                    break
            
            if cover_id:
                for item in book.get_items():
                    if item.get_id() == cover_id:
                        cover_item = item
                        break
            
            if not cover_item:
                for item in book.get_items():
                    if hasattr(item, 'get_type') and item.get_type() == 9:
                        cover_item = item
                        break
            
            if not cover_item:
                for item in book.get_items():
                    fname = item.get_name().lower()
                    if 'cover' in fname and fname.endswith(('.jpg', '.jpeg', '.png', '.gif', '.webp')):
                        cover_item = item
                        break
            
            if not cover_item:
                image_items = [item for item in book.get_items() if item.get_type() == 9 or item.get_name().lower().endswith(('.jpg', '.jpeg', '.png'))]
                if image_items:
                    max_size = 0
                    for item in image_items:
                        try:
                            content = item.get_content()
                            if content and len(content) > max_size:
                                max_size = len(content)
                                cover_item = item
                        except:
                            pass
            
            if cover_item:
                file_hash = abs(hash(filepath))
                cover_filename = f"cover_{file_hash}.jpg"
                cover_path = os.path.join(self.covers_dir, cover_filename)
                
                if not os.path.exists(cover_path):
                    img_data = cover_item.get_content()
                    if img_data:
                        img = Image.open(io.BytesIO(img_data))
                        if img.mode in ('RGBA', 'P'):
                            img = img.convert('RGB')
                        img.thumbnail((200, 300))
                        img.save(cover_path, 'JPEG', quality=85)
                
                return cover_path
        except Exception as e:
            print(f"Error extracting cover from {filepath}: {e}")
        
        return None
    
    def _parse_mobi_azw3(self, filepath: str) -> Dict[str, Any]:
        data = {}
        try:
            with open(filepath, 'rb') as f:
                content = f.read(10000)
                
                title_match = re.search(b'(?:title|Title|TITLE)\x00+([^\x00]{2,100})', content)
                if title_match:
                    try:
                        title = title_match.group(1).decode('utf-8', errors='ignore').strip()
                        if title:
                            data['title'] = title
                    except:
                        pass
                
                author_match = re.search(b'(?:creator|Creator|CREATOR|author|Author|AUTHOR)\x00+([^\x00]{2,100})', content)
                if author_match:
                    try:
                        author = author_match.group(1).decode('utf-8', errors='ignore').strip()
                        if author:
                            data['author'] = author
                    except:
                        pass
                
        except Exception as e:
            print(f"Error parsing MOBI/AZW3 {filepath}: {e}")
        
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
