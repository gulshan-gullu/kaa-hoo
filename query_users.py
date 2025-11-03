# query_users.py
from database import get_db_connection

try:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT user_id, name, role FROM users LIMIT 10")
    users = cursor.fetchall()
    
    print("Users in database:")
    for user in users:
        print(f"  User ID: {user[0]}, Name: {user[1]}, Role: {user[2]}")
    
    cursor.close()
    conn.close()
    
except Exception as e:
    print(f"Error: {e}")
