# Save as debug_login.py
import requests
import json

BASE_URL = "http://localhost:5000"  # Changed from localhost to localhost:5000
session = requests.Session()

print("Testing /api/login with different formats...")

# Test 1: JSON with email/password
print("\n1. JSON: {'email': '...', 'password': '...'}")
try:
    r = session.post(f"{BASE_URL}/api/login", 
        json={'email': 'client01@kaa.com', 'password': 'test123'},
        headers={'Content-Type': 'application/json'}
    )
    print(f"   Status: {r.status_code}")
    print(f"   Response: {r.text}")
except Exception as e:
    print(f"   Error: {e}")

# Test 2: JSON with user_id/password
print("\n2. JSON: {'user_id': 'client01', 'password': 'test123'}")
try:
    r = session.post(f"{BASE_URL}/api/login",
        json={'user_id': 'client01', 'password': 'test123'}
    )
    print(f"   Status: {r.status_code}")
    print(f"   Response: {r.text}")
except Exception as e:
    print(f"   Error: {e}")

print("\nDone!")
