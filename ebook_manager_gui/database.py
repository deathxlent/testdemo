import sqlite3
import os
from typing import List, Dict, Optional, Any


class Database:
    def __init__(self, db_path: str = "ebook_manager.db"):
        self.db_path = db_path
        self.init_database()

    def get_connection(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def init_database(self):
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS books (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT,
                subtitle TEXT,
                author TEXT,
                category TEXT,
                file_size INTEGER,
                physical_path TEXT UNIQUE,
                extension TEXT,
                isbn TEXT,
                rating INTEGER,
                douban_url TEXT,
                notes TEXT,
                cover_path TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        conn.commit()
        conn.close()

    def add_book(self, book_data: Dict[str, Any]) -> int:
        conn = self.get_connection()
        cursor = conn.cursor()
        
        columns = ', '.join(book_data.keys())
        placeholders = ', '.join(['?' for _ in book_data])
        values = list(book_data.values())
        
        try:
            cursor.execute(
                f'INSERT INTO books ({columns}) VALUES ({placeholders})',
                values
            )
            book_id = cursor.lastrowid
            conn.commit()
            return book_id
        except sqlite3.IntegrityError:
            return -1
        finally:
            conn.close()

    def update_book(self, book_id: int, book_data: Dict[str, Any]) -> bool:
        conn = self.get_connection()
        cursor = conn.cursor()
        
        book_data['updated_at'] = 'CURRENT_TIMESTAMP'
        set_clause = ', '.join([f'{k} = ?' for k in book_data.keys()])
        values = list(book_data.values())
        values.append(book_id)
        
        cursor.execute(
            f'UPDATE books SET {set_clause} WHERE id = ?',
            values
        )
        
        conn.commit()
        affected = cursor.rowcount
        conn.close()
        return affected > 0

    def delete_book(self, book_id: int) -> bool:
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('DELETE FROM books WHERE id = ?', (book_id,))
        
        conn.commit()
        affected = cursor.rowcount
        conn.close()
        return affected > 0

    def get_book(self, book_id: int) -> Optional[Dict[str, Any]]:
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT * FROM books WHERE id = ?', (book_id,))
        row = cursor.fetchone()
        conn.close()
        
        if row:
            return dict(row)
        return None

    def get_all_books(self, sort_by: str = "title", order: str = "ASC", search: str = "") -> List[Dict[str, Any]]:
        conn = self.get_connection()
        cursor = conn.cursor()
        
        query = 'SELECT * FROM books'
        params = []
        
        if search:
            search_pattern = f'%{search}%'
            query += ''' WHERE title LIKE ? OR subtitle LIKE ? OR author LIKE ? 
                          OR category LIKE ? OR physical_path LIKE ? OR extension LIKE ? OR isbn LIKE ?'''
            params = [search_pattern] * 7
        
        valid_columns = ["title", "subtitle", "author", "category", "file_size", 
                        "physical_path", "extension", "isbn", "rating", "id"]
        if sort_by in valid_columns:
            query += f' ORDER BY {sort_by} {order}'
        
        cursor.execute(query, params)
        rows = cursor.fetchall()
        conn.close()
        
        return [dict(row) for row in rows]

    def book_exists(self, physical_path: str) -> bool:
        conn = self.get_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT id FROM books WHERE physical_path = ?', (physical_path,))
        exists = cursor.fetchone() is not None
        conn.close()
        
        return exists
