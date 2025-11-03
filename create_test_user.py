# create_test_user.py
# This uses your existing Flask app's database connection

import sys
import os
sys.path.append('.')

from database import verify_user
import mysql.connector

# Try to create a simple test user
try:
    # Your Flask app connects somehow, so let's use the same method
    # Check if there's a working connection in your app
    
    # For now, let's test with a known working user
    print("Testing if any users exist...")
    
    # Test common admin credentials
    test_creds = [
        ("admin", "admin"),
        ("admin", "password"),
        ("test", "test"),
        ("demo", "demo")
    ]
    
    for user_id, password in test_creds:
        result = verify_user(user_id, password)
        if result:
            print(f"FOUND WORKING USER: {user_id} / {password}")
            print(f"User details: {result}")
            break
    else:
        print("No working credentials found")
        
except Exception as e:
    print(f"Error: {e}")
