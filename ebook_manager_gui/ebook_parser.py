import os
import zipfile
from typing import Dict, Any, Optional
from bs4 import BeautifulSoup
from ebooklib import epub
from PIL import Image
import io


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
            book = epub.read_epub(filepath)
            
            if book.get_metadata('DC', 'title'):
                data['title'] = book.get_metadata('DC', 'title')[0][0]
            
            if book.get_metadata('DC', 'creator'):
                data['author'] = book.get_metadata('DC', 'creator')[0][0]
            
            if book.get_metadata('DC', 'description'):
                data['subtitle'] = book.get_metadata('DC', 'description')[0][0][:200]
            
            if book.get_metadata('DC', 'identifier'):
                for identifier in book.get_metadata('DC', 'identifier'):
                    id_value = identifier[0]
                    if 'isbn' in identifier[1].get('scheme', '').lower() or len(id_value) in [10, 13]:
                        data['isbn'] = id_value
                        break
            
            if book.get_metadata('DC', 'subject'):
                subjects = [s[0] for s in book.get_metadata('DC', 'subject')]
                data['category'] = ', '.join(subjects[:3])
            
            cover_path = self._extract_epub_cover(filepath, book)
            if cover_path:
                data['cover_path'] = cover_path
                
        except Exception as e:
            print(f"Error parsing EPUB {filepath}: {e}")
        
        return data
    
    def _extract_epub_cover(self, filepath: str, book: epub.EpubBook) -> Optional[str]:
        try:
            cover_item = None
            
            for item in book.get_items():
                if item.get_type() == 9:
                    cover_item = item
                    break
            
            if not cover_item:
                for item in book.get_items():
                    fname = item.get_name().lower()
                    if 'cover' in fname and fname.endswith(('.jpg', '.jpeg', '.png')):
                        cover_item = item
                        break
            
            if cover_item:
                cover_filename = f"cover_{os.path.splitext(os.path.basename(filepath))[0]}.jpg"
                cover_path = os.path.join(self.covers_dir, cover_filename)
                
                img_data = cover_item.get_content()
                img = Image.open(io.BytesIO(img_data))
                img.thumbnail((200, 300))
                img.save(cover_path, 'JPEG', quality=85)
                
                return cover_path
        except Exception as e:
            print(f"Error extracting cover: {e}")
        
        return None
    
    def _parse_mobi_azw3(self, filepath: str) -> Dict[str, Any]:
        data = {}
        try:
            with open(filepath, 'rb') as f:
                header = f.read(100)
                
                if b'MOBI' in header or b'EXTH' in header:
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
        if size_bytes < 1024:
            return f"{size_bytes} B"
        elif size_bytes < 1024 * 1024:
            return f"{size_bytes / 1024:.1f} KB"
        elif size_bytes < 1024 * 1024 * 1024:
            return f"{size_bytes / (1024 * 1024):.1f} MB"
        else:
            return f"{size_bytes / (1024 * 1024 * 1024):.1f} GB"
