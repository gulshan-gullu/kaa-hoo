# mysql_users.py
import mysql.connector

try:
    # Use connection details from your migrate script
    conn = mysql.connector.connect(
        host='localhost',
        user='root',
        password='your_mysql_password',  # Replace with your actual MySQL password
        database='ca360_chat'
    )
    
    cursor = conn.cursor()
    cursor.execute("SELECT user_id, name, role FROM users LIMIT 10")
    users = cursor.fetchall()
    
    print("Users in MySQL database:")
    for user in users:
        print(f"  User ID: {user[0]}, Name: {user[1]}, Role: {user[2]}")
    
    cursor.close()
    conn.close()
    
except mysql.connector.Error as e:
    print(f"MySQL Error: {e}")
    print("Make sure MySQL is running and check your password")
