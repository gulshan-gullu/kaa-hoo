import mysql.connector
from dotenv import load_dotenv
import os

load_dotenv()

db_config = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'user': os.getenv('DB_USER', 'kaa_ho_user'),
    'password': os.getenv('DB_PASSWORD', '123'),
    'database': os.getenv('DB_NAME', 'kaa_ho'),
}

try:
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor()
    
    print("🔍 Checking messages table...")
    cursor.execute("DESCRIBE messages")
    columns = cursor.fetchall()
    
    print("\nCurrent columns:")
    for col in columns:
        print(f"  - {col[0]} ({col[1]})")
    
    # Check if we have created_at or sent_at or timestamp
    column_names = [col[0] for col in columns]
    
    if 'created_at' not in column_names:
        print("\n❌ Missing 'created_at' column!")
        
        if 'sent_at' in column_names:
            print("✅ Found 'sent_at' - we can use that!")
        elif 'timestamp' in column_names:
            print("✅ Found 'timestamp' - we can use that!")
        else:
            print("🔧 Adding 'created_at' column...")
            cursor.execute("""
                ALTER TABLE messages 
                ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            """)
            conn.commit()
            print("✅ Added 'created_at' column!")
    else:
        print("\n✅ 'created_at' column exists!")
    
    cursor.close()
    conn.close()
    
    print("\n✅ Check complete!")
    
except Exception as e:
    print(f"❌ Error: {e}")