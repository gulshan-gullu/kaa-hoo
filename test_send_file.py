# Save as test_send_file.py
import requests

BASE_URL = "http://localhost"
session = requests.Session()

# Login first
session.post(f"{BASE_URL}/api/login", 
    json={'user_id': 'client01', 'password': 'test123'}
)

print("Testing /api/send-file endpoint...")

# Create small test file
test_data = b'X' * (1024 * 1024)  # 1MB

# Test 1: With target_user
print("\n1. With target_user field:")
files = {'file': ('test.bin', test_data)}
data = {'target_user': 'admin01'}
r = session.post(f"{BASE_URL}/api/send-file", files=files, data=data)
print(f"   Status: {r.status_code}")
print(f"   Response: {r.text[:200]}")

# Test 2: With receiver
print("\n2. With receiver field:")
files = {'file': ('test.bin', test_data)}
data = {'receiver': 'admin01'}
r = session.post(f"{BASE_URL}/api/send-file", files=files, data=data)
print(f"   Status: {r.status_code}")
print(f"   Response: {r.text[:200]}")

# Test 3: With receiver_id
print("\n3. With receiver_id field:")
files = {'file': ('test.bin', test_data)}
data = {'receiver_id': 'admin01'}
r = session.post(f"{BASE_URL}/api/send-file", files=files, data=data)
print(f"   Status: {r.status_code}")
print(f"   Response: {r.text[:200]}")

# Test 4: With targetUser (camelCase)
print("\n4. With targetUser field:")
files = {'file': ('test.bin', test_data)}
data = {'targetUser': 'admin01'}
r = session.post(f"{BASE_URL}/api/send-file", files=files, data=data)
print(f"   Status: {r.status_code}")
print(f"   Response: {r.text[:200]}")