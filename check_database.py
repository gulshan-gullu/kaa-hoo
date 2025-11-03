#!/usr/bin/env python3
"""
View all uploaded files in the database
Shows: ID, filename, size, type, uploader, timestamp, storage location
"""

import mysql.connector
import os
from datetime import datetime
from pathlib import Path

# ==================== CONFIGURATION ====================
DB_CONFIG = {
    'host': 'localhost',
    'port': 3306,
    'user': 'root',
    'password': 'root',  # UPDATE THIS
    'database': 'ca360_chat'
}

# ==================== COLOR OUTPUT ====================
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    MAGENTA = '\033[95m'
    BOLD = '\033[1m'
    END = '\033[0m'

def format_size(bytes):
    """Format file size to human readable"""
    if bytes == 0:
        return "0 B"
    
    units = ['B', 'KB', 'MB', 'GB', 'TB']
    i = 0
    size = float(bytes)
    
    while size >= 1024 and i < len(units) - 1:
        size /= 1024
        i += 1
    
    return f"{size:.2f} {units[i]}"

def print_header(msg):
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*80}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.BLUE}{msg.center(80)}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.BLUE}{'='*80}{Colors.END}\n")

def check_file_exists(filepath):
    """Check if file actually exists on disk"""
    if os.path.exists(filepath):
        actual_size = os.path.getsize(filepath)
        return True, actual_size
    return False, 0

def view_all_files():
    """View all files in database with details"""
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor(dictionary=True)
        
        # Get all files
        cursor.execute('''
            SELECT 
                f.file_id,
                f.original_name,
                f.stored_name,
                f.file_size,
                f.file_type,
                f.uploaded_by,
                f.uploaded_at,
                u.name as uploader_name
            FROM files f
            LEFT JOIN users u ON f.uploaded_by = u.id
            ORDER BY f.uploaded_at DESC
        ''')
        
        files = cursor.fetchall()
        
        if not files:
            print(f"{Colors.YELLOW}No files found in database.{Colors.END}")
            return
        
        print_header("📁 FILES IN DATABASE")
        
        print(f"{Colors.BOLD}Total Files: {len(files)}{Colors.END}\n")
        
        total_size = 0
        files_on_disk = 0
        missing_files = 0
        
        for idx, file in enumerate(files, 1):
            print(f"{Colors.CYAN}{Colors.BOLD}File #{idx}{Colors.END}")
            print(f"{'─' * 80}")
            
            # File ID
            print(f"  {Colors.BOLD}File ID:{Colors.END} {file['file_id']}")
            
            # Original filename
            print(f"  {Colors.BOLD}Original Name:{Colors.END} {file['original_name']}")
            
            # Storage location
            storage_path = os.path.join('data/uploads', file['stored_name'])
            print(f"  {Colors.BOLD}Stored As:{Colors.END} {file['stored_name']}")
            print(f"  {Colors.BOLD}Full Path:{Colors.END} {storage_path}")
            
            # Check if file exists on disk
            exists, actual_size = check_file_exists(storage_path)
            if exists:
                print(f"  {Colors.GREEN}✓ File exists on disk{Colors.END}")
                files_on_disk += 1
                
                # Compare sizes
                if actual_size != file['file_size']:
                    print(f"  {Colors.YELLOW}⚠ Size mismatch!{Colors.END}")
                    print(f"    DB: {format_size(file['file_size'])}, Disk: {format_size(actual_size)}")
            else:
                print(f"  {Colors.RED}✗ File missing from disk!{Colors.END}")
                missing_files += 1
            
            # File size
            print(f"  {Colors.BOLD}Size:{Colors.END} {format_size(file['file_size'])}")
            total_size += file['file_size']
            
            # File type
            print(f"  {Colors.BOLD}Type:{Colors.END} {file['file_type']}")
            
            # Uploader
            uploader_display = file['uploader_name'] if file['uploader_name'] else file['uploaded_by']
            print(f"  {Colors.BOLD}Uploaded By:{Colors.END} {uploader_display} ({file['uploaded_by']})")
            
            # Upload time
            upload_time = file['uploaded_at'].strftime('%Y-%m-%d %H:%M:%S') if file['uploaded_at'] else 'Unknown'
            print(f"  {Colors.BOLD}Uploaded At:{Colors.END} {upload_time}")
            
            # Check which messages use this file
            cursor.execute('''
                SELECT 
                    m.id,
                    m.sender_id,
                    m.receiver_id,
                    m.message_type,
                    s.name as sender_name,
                    r.name as receiver_name
                FROM messages m
                LEFT JOIN users s ON m.sender_id = s.id
                LEFT JOIN users r ON m.receiver_id = r.id
                WHERE m.file_id = %s
            ''', (file['file_id'],))
            
            messages = cursor.fetchall()
            
            if messages:
                print(f"  {Colors.BOLD}Used in Messages:{Colors.END}")
                for msg in messages:
                    sender = msg['sender_name'] or msg['sender_id']
                    receiver = msg['receiver_name'] or msg['receiver_id']
                    print(f"    • Message #{msg['id']}: {sender} → {receiver} (Type: {msg['message_type']})")
            else:
                print(f"  {Colors.YELLOW}⚠ Not used in any messages (orphaned file){Colors.END}")
            
            print()
        
        # Summary
        print_header("📊 SUMMARY")
        print(f"Total Files in DB:     {Colors.BOLD}{len(files)}{Colors.END}")
        print(f"Files on Disk:         {Colors.GREEN}{files_on_disk}{Colors.END}")
        print(f"Missing Files:         {Colors.RED}{missing_files}{Colors.END}")
        print(f"Total Storage Used:    {Colors.BOLD}{format_size(total_size)}{Colors.END}")
        
        # Disk usage
        uploads_dir = Path('data/uploads')
        if uploads_dir.exists():
            actual_disk_usage = sum(f.stat().st_size for f in uploads_dir.glob('**/*') if f.is_file())
            print(f"Actual Disk Usage:     {Colors.BOLD}{format_size(actual_disk_usage)}{Colors.END}")
            
            if actual_disk_usage != total_size:
                diff = actual_disk_usage - total_size
                if diff > 0:
                    print(f"{Colors.YELLOW}⚠ Extra files on disk: {format_size(diff)}{Colors.END}")
                else:
                    print(f"{Colors.YELLOW}⚠ Database size mismatch: {format_size(abs(diff))}{Colors.END}")
        
        cursor.close()
        conn.close()
        
    except mysql.connector.Error as e:
        print(f"{Colors.RED}Database error: {e}{Colors.END}")
    except Exception as e:
        print(f"{Colors.RED}Error: {e}{Colors.END}")

def view_recent_files(limit=10):
    """View most recent files"""
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute(f'''
            SELECT 
                f.original_name,
                f.file_size,
                f.uploaded_at,
                u.name as uploader_name
            FROM files f
            LEFT JOIN users u ON f.uploaded_by = u.id
            ORDER BY f.uploaded_at DESC
            LIMIT {limit}
        ''')
        
        files = cursor.fetchall()
        
        print_header(f"📅 {limit} MOST RECENT FILES")
        
        for idx, file in enumerate(files, 1):
            upload_time = file['uploaded_at'].strftime('%Y-%m-%d %H:%M:%S') if file['uploaded_at'] else 'Unknown'
            uploader = file['uploader_name'] or 'Unknown'
            
            print(f"{idx}. {Colors.BOLD}{file['original_name']}{Colors.END}")
            print(f"   Size: {format_size(file['file_size'])} | "
                  f"By: {uploader} | "
                  f"At: {upload_time}\n")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"{Colors.RED}Error: {e}{Colors.END}")

def view_large_files(min_size_mb=100):
    """View files larger than specified size"""
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor(dictionary=True)
        
        min_size_bytes = min_size_mb * 1024 * 1024
        
        cursor.execute('''
            SELECT 
                f.original_name,
                f.stored_name,
                f.file_size,
                f.uploaded_at,
                u.name as uploader_name
            FROM files f
            LEFT JOIN users u ON f.uploaded_by = u.id
            WHERE f.file_size > %s
            ORDER BY f.file_size DESC
        ''', (min_size_bytes,))
        
        files = cursor.fetchall()
        
        print_header(f"🐘 LARGE FILES (> {min_size_mb}MB)")
        
        if not files:
            print(f"{Colors.YELLOW}No files larger than {min_size_mb}MB found.{Colors.END}")
        else:
            for idx, file in enumerate(files, 1):
                storage_path = os.path.join('data/uploads', file['stored_name'])
                exists, _ = check_file_exists(storage_path)
                status = f"{Colors.GREEN}✓{Colors.END}" if exists else f"{Colors.RED}✗{Colors.END}"
                
                print(f"{idx}. {status} {Colors.BOLD}{file['original_name']}{Colors.END}")
                print(f"   Size: {Colors.BOLD}{format_size(file['file_size'])}{Colors.END}")
                print(f"   Path: {storage_path}\n")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"{Colors.RED}Error: {e}{Colors.END}")

def cleanup_orphaned_files():
    """Find and optionally delete orphaned files"""
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor(dictionary=True)
        
        # Find files not used in any messages
        cursor.execute('''
            SELECT f.file_id, f.stored_name, f.original_name, f.file_size
            FROM files f
            LEFT JOIN messages m ON f.file_id = m.file_id
            WHERE m.id IS NULL
        ''')
        
        orphaned = cursor.fetchall()
        
        print_header("🗑️ ORPHANED FILES (Not used in any messages)")
        
        if not orphaned:
            print(f"{Colors.GREEN}No orphaned files found. All files are in use!{Colors.END}")
        else:
            total_wasted = sum(f['file_size'] for f in orphaned)
            
            print(f"Found {Colors.BOLD}{len(orphaned)}{Colors.END} orphaned files")
            print(f"Wasting {Colors.BOLD}{format_size(total_wasted)}{Colors.END} of storage\n")
            
            for idx, file in enumerate(orphaned, 1):
                print(f"{idx}. {file['original_name']} ({format_size(file['file_size'])})")
            
            print(f"\n{Colors.YELLOW}To clean up, you can run:{Colors.END}")
            print(f"DELETE FROM files WHERE file_id IN ('{\"','\".join([f['file_id'] for f in orphaned])}');")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"{Colors.RED}Error: {e}{Colors.END}")

def main():
    print(f"\n{Colors.BOLD}{Colors.CYAN}")
    print("╔════════════════════════════════════════════════════════════════════════════╗")
    print("║                    CA360 CHAT - DATABASE FILE VIEWER                      ║")
    print("╚════════════════════════════════════════════════════════════════════════════╝")
    print(f"{Colors.END}\n")
    
    while True:
        print(f"\n{Colors.BOLD}Options:{Colors.END}")
        print("1. View all files (detailed)")
        print("2. View recent files (last 10)")
        print("3. View large files (> 100MB)")
        print("4. Find orphaned files")
        print("5. Exit")
        
        choice = input(f"\n{Colors.CYAN}Enter your choice (1-5): {Colors.END}").strip()
        
        if choice == '1':
            view_all_files()
        elif choice == '2':
            view_recent_files(10)
        elif choice == '3':
            view_large_files(100)
        elif choice == '4':
            cleanup_orphaned_files()
        elif choice == '5':
            print(f"\n{Colors.GREEN}Goodbye!{Colors.END}\n")
            break
        else:
            print(f"{Colors.RED}Invalid choice. Please try again.{Colors.END}")

if __name__ == "__main__":
    main()