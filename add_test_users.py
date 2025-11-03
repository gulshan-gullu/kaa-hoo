import mysql.connector
from datetime import datetime

print("🔧 Connecting to database...")

# Try to connect with kaa_ho_user credentials
try:
    db = mysql.connector.connect(
        host="localhost",
        user="kaa_ho_user",
        password="123",
        database="kaa_ho",
    )
    print("✅ Connected successfully!")
except Exception as e:
    print(f"❌ Connection failed: {e}")
    print("\n🔧 Trying with root credentials...")
    try:
        db = mysql.connector.connect(
            host="localhost",
            user="root",
            password="newpassword123",
            database="ca360_chat"
        )
        print("✅ Connected successfully with root!")
    except Exception as e2:
        print(f"❌ Root connection also failed: {e2}")
        print("\n💡 Please check your MySQL credentials in app.py")
        exit(1)

cursor = db.cursor()

# Test users to add
test_users = [
    ('+919876543210', 'Rahul Kumar'),
    ('+919876543211', 'Priya Singh'),
    ('+919876543212', 'Amit Sharma'),
    ('+919876543213', 'Sneha Patel'),
    ('+919876543214', 'Vikas Gupta')
]

print("\n🔧 Adding test users...")

for phone, name in test_users:
    try:
        # Check if user exists
        cursor.execute("SELECT id FROM users WHERE phone = %s", (phone,))
        existing = cursor.fetchone()
        
        if existing:
            print(f"✅ {name} ({phone}) - Already exists (ID: {existing[0]})")
        else:
            # Insert new user
            cursor.execute("""
                INSERT INTO users (phone, name, created_at, last_seen)
                VALUES (%s, %s, %s, %s)
            """, (phone, name, datetime.now(), datetime.now()))
            
            user_id = cursor.lastrowid
            print(f"✅ {name} ({phone}) - Created (ID: {user_id})")
            
    except Exception as e:
        print(f"❌ Error adding {name}: {e}")

db.commit()
cursor.close()
db.close()

print("\n🎉 Done! Test users added!")
print("\nYou can now login with any of these phone numbers:")
for phone, name in test_users:
    print(f"  📱 {phone} - {name}")

print("\n✅ Script completed successfully!")