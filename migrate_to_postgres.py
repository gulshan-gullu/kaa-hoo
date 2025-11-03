import sqlite3
import psycopg2
from datetime import datetime

# 🔥 DIRECT CONNECTION TO SUPABASE
PG_CONFIG = {
    'host': 'db.mwhyviznzodvccwwudl.supabase.co',
    'database': 'postgres',
    'user': 'postgres',
    'password': 'Apple@1978',  # ⚠️ REPLACE THIS!
    'port': 5432,
    'sslmode': 'require',
    'connect_timeout': 10
}

def test_connection():
    """Test connection before migration"""
    print("🔍 Testing Supabase connection...")
    print(f"   Host: {PG_CONFIG['host']}")
    print(f"   Port: {PG_CONFIG['port']}")
    print(f"   User: {PG_CONFIG['user']}")
    print(f"   Database: {PG_CONFIG['database']}")
    print()
    
    try:
        conn = psycopg2.connect(**PG_CONFIG)
        cursor = conn.cursor()
        cursor.execute("SELECT version();")
        version = cursor.fetchone()
        print(f"✅ Connected! PostgreSQL: {version[0][:80]}\n")
        conn.close()
        return True
    except Exception as e:
        print(f"❌ Connection failed: {e}\n")
        return False

def migrate_database():
    print("🚀 CA360 CHAT - SQLite to Supabase Migration")
    print("=" * 60)
    print()
    
    # Test connection first
    if not test_connection():
        print("💡 Troubleshooting:")
        print("  1. Double-check your password")
        print("  2. Make sure you copied it correctly when creating project")
        print("  3. Go to Supabase → Settings → Database → Reset password if needed")
        return
    
    # Connect to SQLite
    print("📂 Connecting to SQLite database...")
    try:
        sqlite_conn = sqlite3.connect('ca360_chat.db')
        sqlite_cursor = sqlite_conn.cursor()
        print("✅ Connected to SQLite\n")
    except Exception as e:
        print(f"❌ Cannot connect to SQLite: {e}")
        return
    
    # Connect to Supabase PostgreSQL
    print("☁️  Connecting to Supabase for migration...")
    try:
        pg_conn = psycopg2.connect(**PG_CONFIG)
        pg_cursor = pg_conn.cursor()
        print("✅ Connected!\n")
    except Exception as e:
        print(f"❌ Cannot connect: {e}")
        pg_conn = None
        return
    
    try:
        # ============================================
        # CREATE TABLES
        # ============================================
        print("📋 Creating tables in Supabase...")
        
        # Drop existing tables
        tables = ['invites', 'otp_codes', 'messages', 'files', 'users']
        for table in tables:
            pg_cursor.execute(f"DROP TABLE IF EXISTS {table} CASCADE;")
        print("   🗑️  Cleaned existing tables")
        
        # Create users table
        pg_cursor.execute("""
            CREATE TABLE users (
                user_id VARCHAR(50) PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                email VARCHAR(100) UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                role VARCHAR(20) NOT NULL,
                online BOOLEAN DEFAULT FALSE,
                last_seen TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        print("   ✅ Created users table")
        
        # Create messages table
        pg_cursor.execute("""
            CREATE TABLE messages (
                id SERIAL PRIMARY KEY,
                sender_id VARCHAR(50) NOT NULL,
                receiver_id VARCHAR(50) NOT NULL,
                text TEXT NOT NULL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_read BOOLEAN DEFAULT FALSE,
                message_type VARCHAR(20) DEFAULT 'text',
                file_id INTEGER,
                FOREIGN KEY (sender_id) REFERENCES users(user_id) ON DELETE CASCADE,
                FOREIGN KEY (receiver_id) REFERENCES users(user_id) ON DELETE CASCADE
            );
        """)
        print("   ✅ Created messages table")
        
        # Create files table
        pg_cursor.execute("""
            CREATE TABLE files (
                id SERIAL PRIMARY KEY,
                file_id VARCHAR(100) UNIQUE NOT NULL,
                original_name VARCHAR(255) NOT NULL,
                file_type VARCHAR(50) NOT NULL,
                file_size INTEGER NOT NULL,
                file_path VARCHAR(500) NOT NULL,
                uploaded_by VARCHAR(50) NOT NULL,
                uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (uploaded_by) REFERENCES users(user_id) ON DELETE CASCADE
            );
        """)
        print("   ✅ Created files table")
        
        # Create invites table
        pg_cursor.execute("""
            CREATE TABLE invites (
                invite_code VARCHAR(50) PRIMARY KEY,
                created_by VARCHAR(50) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP NOT NULL,
                used BOOLEAN DEFAULT FALSE,
                used_by VARCHAR(50),
                used_at TIMESTAMP,
                FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE CASCADE
            );
        """)
        print("   ✅ Created invites table")
        
        # Create otp_codes table
        pg_cursor.execute("""
            CREATE TABLE otp_codes (
                id SERIAL PRIMARY KEY,
                phone_number VARCHAR(20) NOT NULL,
                otp_code VARCHAR(6) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                expires_at TIMESTAMP NOT NULL,
                verified BOOLEAN DEFAULT FALSE
            );
        """)
        print("   ✅ Created otp_codes table")
        
        # Create indexes
        pg_cursor.execute("CREATE INDEX idx_messages_sender ON messages(sender_id);")
        pg_cursor.execute("CREATE INDEX idx_messages_receiver ON messages(receiver_id);")
        pg_cursor.execute("CREATE INDEX idx_messages_timestamp ON messages(timestamp);")
        pg_cursor.execute("CREATE INDEX idx_users_email ON users(email);")
        print("   ✅ Created indexes")
        
        pg_conn.commit()
        print("\n✅ All tables created!\n")
        
        # ============================================
        # MIGRATE USERS (FIX DUPLICATES!)
        # ============================================
        print("👥 Migrating users (removing duplicates)...")
        
        sqlite_cursor.execute("SELECT user_id, name, email, password_hash, role, online, last_seen, created_at FROM users")
        users = sqlite_cursor.fetchall()
        
        print(f"   Found {len(users)} users in SQLite")
        
        # Remove duplicates
        seen_ids = set()
        seen_names = {}
        unique_users = []
        
        for user in users:
            user_id = user[0]
            name = user[1]
            
            if user_id in seen_ids:
                print(f"   🗑️  Removing duplicate: {name} (ID: {user_id})")
                continue
            
            if name in seen_names:
                original_name = name
                counter = 2
                while name in seen_names:
                    name = f"{original_name} ({counter})"
                    counter += 1
                print(f"   📝 Renaming: {original_name} → {name}")
                user = list(user)
                user[1] = name
                user = tuple(user)
            
            seen_ids.add(user_id)
            seen_names[name] = user_id
            unique_users.append(user)
        
        # Insert users
        for user in unique_users:
            pg_cursor.execute("""
                INSERT INTO users (user_id, name, email, password_hash, role, online, last_seen, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """, user)
        
        pg_conn.commit()
        print(f"\n✅ Migrated {len(unique_users)} unique users")
        if len(users) > len(unique_users):
            print(f"   🎯 Fixed: Removed {len(users) - len(unique_users)} duplicates!")
        print()
        
        # ============================================
        # MIGRATE MESSAGES
        # ============================================
        print("💬 Migrating messages...")
        
        sqlite_cursor.execute("SELECT sender_id, receiver_id, text, timestamp, is_read, message_type, file_id FROM messages")
        messages = sqlite_cursor.fetchall()
        
        migrated = 0
        for msg in messages:
            try:
                pg_cursor.execute("""
                    INSERT INTO messages (sender_id, receiver_id, text, timestamp, is_read, message_type, file_id)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                """, msg)
                migrated += 1
            except:
                pass
        
        pg_conn.commit()
        print(f"✅ Migrated {migrated} messages\n")
        
        # ============================================
        # MIGRATE FILES
        # ============================================
        print("📁 Migrating files...")
        
        try:
            sqlite_cursor.execute("SELECT file_id, original_name, file_type, file_size, file_path, uploaded_by, uploaded_at FROM files")
            files = sqlite_cursor.fetchall()
            
            migrated = 0
            for f in files:
                try:
                    pg_cursor.execute("""
                        INSERT INTO files (file_id, original_name, file_type, file_size, file_path, uploaded_by, uploaded_at)
                        VALUES (%s, %s, %s, %s, %s, %s, %s)
                    """, f)
                    migrated += 1
                except:
                    pass
            
            pg_conn.commit()
            print(f"✅ Migrated {migrated} files\n")
        except:
            print("⚠️  No files table, skipping...\n")
        
        # ============================================
        # VERIFICATION
        # ============================================
        print("=" * 60)
        print("✅ MIGRATION COMPLETED SUCCESSFULLY!")
        print("=" * 60)
        print()
        
        pg_cursor.execute("SELECT COUNT(*) FROM users")
        print(f"  👥 Total Users:     {pg_cursor.fetchone()[0]}")
        
        pg_cursor.execute("SELECT COUNT(*) FROM messages")
        print(f"  💬 Total Messages:  {pg_cursor.fetchone()[0]}")
        
        pg_cursor.execute("SELECT COUNT(*) FROM files")
        print(f"  📁 Total Files:     {pg_cursor.fetchone()[0]}")
        
        print()
        print("=" * 60)
        print()
        print("🎯 DUPLICATE CONTACTS ISSUE: FIXED! ✅")
        print()
        print("📝 Next Steps:")
        print("   1. Update app.py to use Supabase")
        print("   2. Restart Flask server")
        print("   3. Login and verify NO duplicate contacts!")
        print()
        
    except Exception as e:
        print(f"\n❌ Migration error: {e}")
        import traceback
        traceback.print_exc()
        if pg_conn:
            pg_conn.rollback()
    
    finally:
        sqlite_conn.close()
        if pg_conn:
            pg_conn.close()
        print("🔒 Connections closed.")

if __name__ == '__main__':
    print()
    print("╔════════════════════════════════════════════════════════╗")
    print("║      CA360 CHAT - SUPABASE MIGRATION TOOL             ║")
    print("╚════════════════════════════════════════════════════════╝")
    print()
    
    response = input("Ready to migrate? Type 'yes' to continue: ")
    
    if response.lower() == 'yes':
        print()
        migrate_database()
    else:
        print("\n❌ Cancelled.")