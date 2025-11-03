# Save as test_file_detail.py
import requests
import io

BASE_URL = "http://localhost"
session = requests.Session()

# Login
r = session.post(f"{BASE_URL}/api/login", 
    json={'user_id': 'client01', 'password': 'test123'}
)
print(f"Login: {r.status_code}")
print(f"Login response: {r.json()}\n")

# Try uploading with detailed logging
print("Testing file upload with proper format...")

# Create a proper test file
test_data = b'TEST FILE CONTENT ' * 1000  # Small test data

files = {
    'file': ('test_upload.txt', io.BytesIO(test_data), 'text/plain')
}
data = {
    'target_user': 'admin01',
    'caption': 'Test upload from Python'
}

print(f"Sending: file=test_upload.txt, target_user=admin01")
r = session.post(f"{BASE_URL}/api/send-file", files=files, data=data)

print(f"\nStatus: {r.status_code}")
print(f"Response: {r.text}")

# Check if it's a file type issue
if r.status_code == 400:
    print("\n--- Trying without caption ---")
    files = {'file': ('test.txt', io.BytesIO(b'test'), 'text/plain')}
    data = {'target_user': 'admin01'}
    r = session.post(f"{BASE_URL}/api/send-file", files=files, data=data)
    print(f"Status: {r.status_code}")
    print(f"Response: {r.text}")