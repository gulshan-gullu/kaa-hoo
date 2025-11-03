# Save as debug_login.py
import requests
import json

BASE_URL = "http://localhost"
session = requests.Session()

print("Testing /api/login with different formats...")

# Test 1: JSON with email/password
print("\n1. JSON: {'email': '...', 'password': '...'}")
r = session.post(f"{BASE_URL}/api/login", 
    json={'email': 'client01@kaa.com', 'password': 'test123'},
    headers={'Content-Type': 'application/json'}
)
print(f"   Status: {r.status_code}")
print(f"   Response: {r.text}")

# Test 2: Form data
print("\n2. Form data: email=...&password=...")
r = session.post(f"{BASE_URL}/api/login",
    data={'email': 'client01@kaa.com', 'password': 'test123'}
)
print(f"   Status: {r.status_code}")
print(f"   Response: {r.text}")

# Test 3: Different field names
print("\n3. JSON: {'username': '...', 'password': '...'}")
r = session.post(f"{BASE_URL}/api/login",
    json={'username': 'client01@kaa.com', 'password': 'test123'}
)
print(f"   Status: {r.status_code}")
print(f"   Response: {r.text}")

# Test 4: With user_id
print("\n4. JSON: {'user_id': 'client01', 'password': '...'}")
r = session.post(f"{BASE_URL}/api/login",
    json={'user_id': 'client01', 'password': 'test123'}
)
print(f"   Status: {r.status_code}")
print(f"   Response: {r.text}")

# Check what endpoints exist
print("\n5. Checking available auth routes...")
for endpoint in ['/api/auth', '/api/session', '/api/authenticate']:
    try:
        r = session.post(f"{BASE_URL}{endpoint}",
            json={'email': 'client01@kaa.com', 'password': 'test123'}
        )
        if r.status_code != 404:
            print(f"   {endpoint}: {r.status_code}")
    except:
        pass

print("\nDone!")