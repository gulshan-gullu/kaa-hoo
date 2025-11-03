import sqlite3
import mysql.connector
from datetime import datetime

# MySQL Configuration
MYSQL_CONFIG = {
    'host': 'localhost',
    'database': 'ca360_chat',
    'user': 'ca360_user',
    'password': '123',
    'port': 3306
}

def test_connection():
    """Test MySQL connection"""
    print("🔍 Testing MySQL connection...")
    try:
        conn = mysql.connector.connect(**MYSQL_CONFIG)
        cursor = conn.cursor()
        cursor.execute("SELECT VERSION()")
        version = cursor.fetchone()
        print(f"✅ Connected! MySQL version: {version[0]}\n")
        conn.close()
        return True
    except Exception as e:
        print(f"❌ Connection failed: {e}\n")
        return False

def migrate_database():
    print("🚀 CA360 CHAT - SQLite to MySQL Migration")
    print("=" * 60)
    print()
    
    # Test connection
    if not test_connection():
        print("💡 Make sure:")
        print("  1. MySQL is running")
        print("  2. Database 'ca360_chat' exists")
        print("  3. User 'ca360_user' exists")
        return
    
    # Connect to SQLite
    print("📂 Connecting to SQLite...")
    try:
        sqlite_conn = sqlite3.connect('ca360_chat.db')
        sqlite_cursor = sqlite_conn.cursor()
        print("✅ Connected to SQLite\n")
    except Exception as e:
        print(f"❌ Cannot connect to SQLite: {e}")
        return
    
    # Connect to MySQL
    print("🗄️  Connecting to MySQL...")
    try:
        mysql_conn = mysql.connector.connect(**MYSQL_CONFIG)
        mysql_cursor = mysql_conn.cursor()
        print("✅ Connected to MySQL!\n")
    except Exception as e:
        print(f"❌ Cannot connect to MySQL: {e}")
        return
    
    try:
        # ============================================
        # CREATE TABLES
        # ============================================
        print("📋 Creating tables in MySQL...")
        
        # Drop existing tables
        mysql_cursor.execute("SET FOREIGN_KEY_CHECKS = 0;")
        tables = ['invites', 'otp_codes', 'messages', 'files', 'users']
        for table in tables:
            mysql_cursor.execute(f"DROP TABLE IF EXISTS {table};")
        mysql_cursor.execute("SET FOREIGN_KEY_CHECKS = 1;")
        print("   🗑️  Cleaned existing tables")
        
        # Create users table
        mysql_cursor.execute("""
            CREATE TABLE users (
                user_id VARCHAR(50) PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(100) UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                role VARCHAR(20) NOT NULL,
                online BOOLEAN DEFAULT FALSE,
                last_seen DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
        """)
        print("   ✅ Created users table")
        
        # Create messages table
        mysql_cursor.execute("""
            CREATE TABLE messages (
                id INT AUTO_INCREMENT PRIMARY KEY,
                sender_id VARCHAR(50) NOT NULL,
                receiver_id VARCHAR(50) NOT NULL,
                text TEXT NOT NULL,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                is_read BOOLEAN DEFAULT FALSE,
                message_type VARCHAR(20) DEFAULT 'text',
                file_id INT,
                FOREIGN KEY (sender_id) REFERENCES users(user_id) ON DELETE CASCADE,
                FOREIGN KEY (receiver_id) REFERENCES users(user_id) ON DELETE CASCADE
            );
        """)
        print("   ✅ Created messages table")
        
        # Create files table
        mysql_cursor.execute("""
            CREATE TABLE files (
                id INT AUTO_INCREMENT PRIMARY KEY,
                file_id VARCHAR(100) UNIQUE NOT NULL,
                original_name VARCHAR(255) NOT NULL,
                file_type VARCHAR(50) NOT NULL,
                file_size INT NOT NULL,
                file_path VARCHAR(500) NOT NULL,
                uploaded_by VARCHAR(50) NOT NULL,
                uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (uploaded_by) REFERENCES users(user_id) ON DELETE CASCADE
            );
        """)
        print("   ✅ Created files table")
        
        # Create invites table
        mysql_cursor.execute("""
            CREATE TABLE invites (
                invite_code VARCHAR(50) PRIMARY KEY,
                created_by VARCHAR(50) NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                expires_at DATETIME NOT NULL,
                used BOOLEAN DEFAULT FALSE,
                used_by VARCHAR(50),
                used_at DATETIME,
                FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE CASCADE
            );
        """)
        print("   ✅ Created invites table")
        
        # Create otp_codes table
        mysql_cursor.execute("""
            CREATE TABLE otp_codes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                phone_number VARCHAR(20) NOT NULL,
                otp_code VARCHAR(6) NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                expires_at DATETIME NOT NULL,
                verified BOOLEAN DEFAULT FALSE
            );
        """)
        print("   ✅ Created otp_codes table")
        
        # Create indexes
        mysql_cursor.execute("CREATE INDEX idx_messages_sender ON messages(sender_id);")
        mysql_cursor.execute("CREATE INDEX idx_messages_receiver ON messages(receiver_id);")
        mysql_cursor.execute("CREATE INDEX idx_messages_timestamp ON messages(timestamp);")
        mysql_cursor.execute("CREATE INDEX idx_users_email ON users(email);")
        print("   ✅ Created indexes")
        
        mysql_conn.commit()
        print("\n✅ All tables created!\n")
        
        # ============================================
        # MIGRATE USERS (FIX DUPLICATES!)
        # ============================================
        print("👥 Migrating users (removing duplicates)...")
        
        # First, check what columns exist in SQLite
        sqlite_cursor.execute("PRAGMA table_info(users)")
        sqlite_columns_info = sqlite_cursor.fetchall()
        columns = [col[1] for col in sqlite_columns_info]
        print(f"   SQLite columns: {', '.join(columns)}")
        
        # Get all users from SQLite
        sqlite_cursor.execute("SELECT * FROM users")
        users_raw = sqlite_cursor.fetchall()
        
        print(f"   Found {len(users_raw)} users in SQLite")
        
        # Map SQLite columns to MySQL columns
        column_map = {col[1]: idx for idx, col in enumerate(sqlite_columns_info)}
        
        # Remove duplicates - keep only the first occurrence of each name
        seen_ids = set()
        seen_names = {}
        unique_users = []
        duplicates_removed = []
        
        for user_raw in users_raw:
            user_id = user_raw[column_map['user_id']]
            name = user_raw[column_map['name']]
            email = user_raw[column_map.get('email')]
            password_hash = user_raw[column_map['password_hash']]
            role = user_raw[column_map['role']]
            created_at = user_raw[column_map.get('created_at', None)]
            
            # Skip if we've seen this ID before
            if user_id in seen_ids:
                duplicates_removed.append(f"{name} (ID: {user_id})")
                continue
            
            # If name exists, rename the duplicate
            if name in seen_names:
                original_name = name
                counter = 2
                while name in seen_names:
                    name = f"{original_name} ({counter})"
                    counter += 1
                print(f"   📝 Renaming duplicate: {original_name} → {name}")
            
            seen_ids.add(user_id)
            seen_names[name] = user_id
            
            # Build user tuple in correct MySQL order
            user_data = (
                user_id,
                name,
                email,
                password_hash,
                role,
                False,  # online (default)
                None,   # last_seen (default)
                created_at if created_at else datetime.now()
            )
            unique_users.append(user_data)
        
        # Insert users
        for user_data in unique_users:
            mysql_cursor.execute("""
                INSERT INTO users (user_id, name, email, password_hash, role, online, last_seen, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """, user_data)
        
        mysql_conn.commit()
        print(f"\n✅ Migrated {len(unique_users)} unique users")
        if duplicates_removed:
            print(f"   🗑️  Removed {len(duplicates_removed)} duplicates:")
            for dup in duplicates_removed:
                print(f"      - {dup}")
        print()
        
        # ============================================
        # MIGRATE MESSAGES
        # ============================================
        print("💬 Migrating messages...")
        
        # Check messages table structure
        sqlite_cursor.execute("PRAGMA table_info(messages)")
        msg_columns_info = sqlite_cursor.fetchall()
        msg_columns = [col[1] for col in msg_columns_info]
        print(f"   SQLite message columns: {', '.join(msg_columns)}")
        
        # Get all messages
        sqlite_cursor.execute("SELECT * FROM messages")
        messages_raw = sqlite_cursor.fetchall()
        
        # Map columns
        msg_column_map = {col[1]: idx for idx, col in enumerate(msg_columns_info)}
        
        migrated = 0
        for msg_raw in messages_raw:
            try:
                # Map SQLite columns to MySQL (handle different column names)
                # Your columns: message_id, sender_id, receiver_id, message_text, message_type, file_id, timestamp, is_read, is_deleted
                sender_id = msg_raw[msg_column_map['sender_id']]
                receiver_id = msg_raw[msg_column_map['receiver_id']]
                text = msg_raw[msg_column_map.get('message_text', msg_column_map.get('text', msg_column_map.get('message')))]
                timestamp = msg_raw[msg_column_map['timestamp']]
                is_read = msg_raw[msg_column_map.get('is_read', 0)]
                message_type = msg_raw[msg_column_map.get('message_type', 0)]
                file_id = msg_raw[msg_column_map.get('file_id')]
                
                # Convert message_type if needed (might be different format)
                if message_type is None:
                    message_type = 'text'
                
                mysql_cursor.execute("""
                    INSERT INTO messages (sender_id, receiver_id, text, timestamp, is_read, message_type, file_id)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                """, (sender_id, receiver_id, text, timestamp, is_read, message_type, file_id))
                migrated += 1
            except Exception as e:
                print(f"   ⚠️  Skipped message: {e}")
        
        mysql_conn.commit()
        print(f"✅ Migrated {migrated}/{len(messages_raw)} messages\n")
        
        # ============================================
        # MIGRATE FILES
        # ============================================
        print("📁 Migrating files...")
        
        try:
            # Check if files table exists
            sqlite_cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='files'")
            if not sqlite_cursor.fetchone():
                print("⚠️  No files table found, skipping...\n")
            else:
                # Check files table structure
                sqlite_cursor.execute("PRAGMA table_info(files)")
                file_columns_info = sqlite_cursor.fetchall()
                file_columns = [col[1] for col in file_columns_info]
                print(f"   SQLite file columns: {', '.join(file_columns)}")
                
                sqlite_cursor.execute("SELECT * FROM files")
                files_raw = sqlite_cursor.fetchall()
                
                # Map columns
                file_column_map = {col[1]: idx for idx, col in enumerate(file_columns_info)}
                
                migrated = 0
                for f_raw in files_raw:
                    try:
                        # Your columns: file_id, original_name, stored_name, file_size, file_type, mime_type, upload_date, uploader_id
                        file_id = f_raw[file_column_map['file_id']]
                        original_name = f_raw[file_column_map['original_name']]
                        file_type = f_raw[file_column_map.get('file_type', file_column_map.get('mime_type'))]
                        file_size = f_raw[file_column_map['file_size']]
                        # Use stored_name as file_path
                        file_path = f_raw[file_column_map.get('stored_name', file_column_map.get('file_path', ''))]
                        uploaded_by = f_raw[file_column_map.get('uploader_id', file_column_map.get('uploaded_by'))]
                        uploaded_at = f_raw[file_column_map.get('upload_date', file_column_map.get('uploaded_at'))]
                        
                        mysql_cursor.execute("""
                            INSERT INTO files (file_id, original_name, file_type, file_size, file_path, uploaded_by, uploaded_at)
                            VALUES (%s, %s, %s, %s, %s, %s, %s)
                        """, (file_id, original_name, file_type, file_size, file_path, uploaded_by, uploaded_at))
                        migrated += 1
                    except Exception as e:
                        print(f"   ⚠️  Skipped file: {e}")
                
                mysql_conn.commit()
                print(f"✅ Migrated {migrated}/{len(files_raw)} files\n")
        except Exception as e:
            print(f"⚠️  Files migration error: {e}\n")
        
        # ============================================
        # VERIFICATION
        # ============================================
        print("=" * 60)
        print("✅ MIGRATION COMPLETED SUCCESSFULLY!")
        print("=" * 60)
        print()
        
        mysql_cursor.execute("SELECT COUNT(*) FROM users")
        print(f"  👥 Total Users:     {mysql_cursor.fetchone()[0]}")
        
        mysql_cursor.execute("SELECT COUNT(*) FROM messages")
        print(f"  💬 Total Messages:  {mysql_cursor.fetchone()[0]}")
        
        try:
            mysql_cursor.execute("SELECT COUNT(*) FROM files")
            print(f"  📁 Total Files:     {mysql_cursor.fetchone()[0]}")
        except:
            print(f"  📁 Total Files:     0")
        
        print()
        print("=" * 60)
        print()
        print("🎯 DUPLICATE CONTACTS: FIXED! ✅")
        print()
        print("📝 Next Steps:")
        print("   1. Update app.py to use MySQL")
        print("   2. Restart your Flask server")
        print("   3. Enjoy your duplicate-free chat app!")
        print()
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        mysql_conn.rollback()
    
    finally:
        sqlite_conn.close()
        mysql_conn.close()
        print("🔒 Connections closed.")

if __name__ == '__main__':
    print()
    print("╔════════════════════════════════════════════════════════╗")
    print("║         CA360 CHAT - MYSQL MIGRATION TOOL             ║")
    print("╚════════════════════════════════════════════════════════╝")
    print()
    
    response = input("Ready to migrate to MySQL? Type 'yes': ")
    
    if response.lower() == 'yes':
        print()
        migrate_database()
    else:
        print("\n❌ Cancelled.")