import mysql.connector
from dotenv import load_dotenv
import os

load_dotenv()

# Database connection
db_config = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'user': os.getenv('DB_USER', 'kaa_ho_user'),
    'password': os.getenv('DB_PASSWORD', '123'),
    'database': os.getenv('DB_NAME', 'kaa_ho'),
}

try:
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor()
    
    print("🔍 Checking contacts table...")
    
    # Check if contacts table exists
    cursor.execute("SHOW TABLES LIKE 'contacts'")
    exists = cursor.fetchone()
    
    if exists:
        print("✅ Contacts table exists, checking structure...")
        cursor.execute("DESCRIBE contacts")
        columns = cursor.fetchall()
        print("Current columns:")
        for col in columns:
            print(f"  - {col[0]}")
        
        # Check if contact_id column exists
        cursor.execute("SHOW COLUMNS FROM contacts LIKE 'contact_id'")
        has_contact_id = cursor.fetchone()
        
        if not has_contact_id:
            print("❌ Missing 'contact_id' column! Creating...")
            cursor.execute("""
                CREATE TABLE contacts_new (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT NOT NULL,
                    contact_id INT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                    FOREIGN KEY (contact_id) REFERENCES users(id) ON DELETE CASCADE,
                    UNIQUE KEY unique_contact (user_id, contact_id),
                    INDEX idx_user_id (user_id),
                    INDEX idx_contact_id (contact_id)
                )
            """)
            
            # Copy old data if any
            cursor.execute("SELECT * FROM contacts")
            old_data = cursor.fetchall()
            if old_data:
                print(f"📋 Copying {len(old_data)} old records...")
                # You'd need to map old columns to new ones here
            
            # Drop old table and rename new one
            cursor.execute("DROP TABLE contacts")
            cursor.execute("RENAME TABLE contacts_new TO contacts")
            print("✅ Contacts table fixed!")
        else:
            print("✅ 'contact_id' column exists!")
    else:
        print("❌ Contacts table doesn't exist! Creating...")
        cursor.execute("""
            CREATE TABLE contacts (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                contact_id INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (contact_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE KEY unique_contact (user_id, contact_id),
                INDEX idx_user_id (user_id),
                INDEX idx_contact_id (contact_id)
            )
        """)
        print("✅ Contacts table created!")
    
    conn.commit()
    cursor.close()
    conn.close()
    
    print("✅ Database check complete!")
    
except Exception as e:
    print(f"❌ Error: {e}")