import mysql.connector
import json
from datetime import datetime

config = {
    'host': 'localhost',
    'user': 'kaa_ho_user',
    'password': '123',
    'database': 'kaa_ho'
}

print("Connecting to database...")
conn = mysql.connector.connect(**config)
cursor = conn.cursor(dictionary=True)
print("Connected!\n")

# Get users
print("Fetching users...")
cursor.execute("SELECT * FROM users")
users = cursor.fetchall()
print(f"Found {len(users)} users\n")

for i, user in enumerate(users, 1):
    print(f"USER #{i}:")
    print(f"  ID: {user['user_id']}")
    print(f"  Name: {user['name']}")
    print(f"  Email: {user['email']}")
    print(f"  Password Hash: {user['password']}")
    print()

# Get messages
print("\nFetching messages...")
cursor.execute("SELECT * FROM messages")
messages = cursor.fetchall()
print(f"Found {len(messages)} messages\n")

# Get files
print("Fetching files...")
cursor.execute("SELECT * FROM files")
files = cursor.fetchall()
print(f"Found {len(files)} files\n")

# Export to JSON
data = {
    'users': users,
    'messages': messages,
    'files': files,
    'exported': datetime.now().isoformat()
}

with open('ca360_data.json', 'w') as f:
    json.dump(data, f, indent=2, default=str)

print("Exported to: ca360_data.json")
print(f"\nSummary: {len(users)} users, {len(messages)} messages, {len(files)} files")

cursor.close()
conn.close()
