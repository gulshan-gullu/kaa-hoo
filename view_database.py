# view_database.py
import os
import mysql.connector
from config import MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE

try:
    print(f"Connecting to MySQL database...")
    print(f"Host: {MYSQL_HOST}")
    print(f"User: {MYSQL_USER}")
    print(f"Database: {MYSQL_DATABASE}")
    
    conn = mysql.connector.connect(
        host=MYSQL_HOST,
        user=MYSQL_USER,
        password=MYSQL_PASSWORD,
        database=MYSQL_DATABASE
    )
    
    cursor = conn.cursor()
    
    # Show all tables
    cursor.execute("SHOW TABLES")
    tables = cursor.fetchall()
    print("\nTables in database:")
    for table in tables:
        print(f"  - {table[0]}")
    
    # Show users table if it exists
    cursor.execute("SELECT COUNT(*) FROM users")
    user_count = cursor.fetchone()[0]
    print(f"\nTotal users in database: {user_count}")
    
    if user_count > 0:
        print("\nUsers table structure:")
        cursor.execute("DESCRIBE users")
        columns = cursor.fetchall()
        for col in columns:
            print(f"  {col[0]} ({col[1]})")
        
        print("\nFirst 10 users:")
        cursor.execute("SELECT user_id, name, role FROM users LIMIT 10")
        users = cursor.fetchall()
        for user in users:
            print(f"  ID: {user[0]}, Name: {user[1]}, Role: {user[2]}")
    
    cursor.close()
    conn.close()
    
except mysql.connector.Error as e:
    print(f"MySQL Error: {e}")
except Exception as e:
    print(f"Error: {e}")
