# add_test_user.py
import mysql.connector
import hashlib

try:
    # Use the same connection that works in your Flask app
    conn = mysql.connector.connect(
        host='localhost',
        user='root',
        password='',  # Try with empty password first
        database='ca360_chat'
    )
    
    cursor = conn.cursor()
    
    # Create a simple test user
    hashed_password = hashlib.sha256("test123".encode()).hexdigest()
    
    cursor.execute("""
        INSERT INTO users (user_id, name, password, role) 
        VALUES (%s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE password = VALUES(password)
    """, ("testuser", "Test User", hashed_password, "user"))
    
    conn.commit()
    print("Test user created successfully!")
    print("Credentials: testuser / test123")
    
    cursor.close()
    conn.close()
    
except Exception as e:
    print(f"Error: {e}")
