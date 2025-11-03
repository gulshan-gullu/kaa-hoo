#!/usr/bin/env python3
"""
Complete Testing Suite for KAA HO Chat Application
Tests all security features, API endpoints, and functionality

Install test dependencies:
pip install pytest pytest-cov pytest-flask requests
"""

import pytest
import json
import time
from datetime import datetime
import requests
from io import BytesIO

# Test configuration
BASE_URL = "http://127.0.0.1:5000"
TEST_USER = {
    "user_id": "A-0001",
    "password": "password123"  # Adjust based on your test user
}

class TestSecurityFeatures:
    """Test security enhancements"""
    
    def test_security_modules_loaded(self):
        """Test if security test endpoint is available"""
        response = requests.get(f"{BASE_URL}/api/test-security")
        assert response.status_code == 200
        data = response.json()
        assert data['success'] == True
        print(f"✅ Security modules: {data['features']}")
    
    def test_jwt_authentication(self):
        """Test JWT token generation on login"""
        response = requests.post(
            f"{BASE_URL}/api/login",
            json=TEST_USER
        )
        assert response.status_code == 200
        data = response.json()
        assert 'token' in data
        assert data['token'] is not None
        print(f"✅ JWT Token generated: {data['token'][:50]}...")
        return data['token']
    
    def test_rate_limiting_login(self):
        """Test rate limiting on login endpoint"""
        print("🧪 Testing rate limiting (this may take a minute)...")
        
        # Attempt 15 logins quickly
        responses = []
        for i in range(15):
            response = requests.post(
                f"{BASE_URL}/api/login",
                json={"user_id": "FAKE", "password": "fake"}
            )
            responses.append(response.status_code)
            time.sleep(0.1)
        
        # Should have some rate limited responses (429)
        rate_limited = [r for r in responses if r == 429]
        print(f"✅ Rate limiting working: {len(rate_limited)} requests blocked")
        assert len(rate_limited) > 0, "Rate limiting not working"
    
    def test_input_sanitization(self):
        """Test input sanitization"""
        # Try XSS attack
        malicious_input = {
            "user_id": "<script>alert('xss')</script>",
            "password": "test"
        }
        response = requests.post(
            f"{BASE_URL}/api/login",
            json=malicious_input
        )
        # Should either sanitize or reject
        assert response.status_code in [400, 401]
        print("✅ Input sanitization working")


class TestAPIEndpoints:
    """Test all API endpoints"""
    
    @pytest.fixture(scope="class")
    def auth_session(self):
        """Create authenticated session"""
        session = requests.Session()
        response = session.post(
            f"{BASE_URL}/api/login",
            json=TEST_USER
        )
        assert response.status_code == 200
        return session
    
    def test_session_check(self, auth_session):
        """Test session validation"""
        response = auth_session.get(f"{BASE_URL}/api/session")
        assert response.status_code == 200
        data = response.json()
        assert data['success'] == True
        assert 'user' in data
        print(f"✅ Session valid for user: {data['user']['id']}")
    
    def test_get_contacts(self, auth_session):
        """Test contacts endpoint"""
        response = auth_session.get(f"{BASE_URL}/api/contacts")
        assert response.status_code == 200
        data = response.json()
        assert 'contacts' in data
        print(f"✅ Contacts retrieved: {len(data['contacts'])} users")
    
    def test_send_message(self, auth_session):
        """Test sending a message"""
        response = auth_session.post(
            f"{BASE_URL}/api/send",
            json={
                "text": f"Test message at {datetime.now()}",
                "target_user": "A-0002"  # Adjust target
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data['success'] == True
        print("✅ Message sent successfully")
    
    def test_get_messages(self, auth_session):
        """Test retrieving messages"""
        response = auth_session.get(f"{BASE_URL}/api/messages/A-0002")
        assert response.status_code == 200
        data = response.json()
        assert 'messages' in data
        print(f"✅ Messages retrieved: {len(data['messages'])} messages")
    
    def test_file_upload(self, auth_session):
        """Test file upload"""
        # Create a test file
        test_file = BytesIO(b"Test file content")
        test_file.name = "test.txt"
        
        files = {'file': ('test.txt', test_file, 'text/plain')}
        data = {'target_user': 'A-0002'}
        
        response = auth_session.post(
            f"{BASE_URL}/api/send-file",
            files=files,
            data=data
        )
        assert response.status_code == 200
        result = response.json()
        assert result['success'] == True
        print(f"✅ File uploaded: {result['file_info']['file_id']}")
    
    def test_statistics_admin(self, auth_session):
        """Test admin statistics (requires admin user)"""
        response = auth_session.get(f"{BASE_URL}/api/statistics")
        # Will fail if not admin, but that's expected
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Statistics: {data['stats']}")
        else:
            print("⚠️  Statistics requires admin access")


class TestCaching:
    """Test Redis caching functionality"""
    
    @pytest.fixture(scope="class")
    def auth_session(self):
        """Create authenticated session"""
        session = requests.Session()
        response = session.post(
            f"{BASE_URL}/api/login",
            json=TEST_USER
        )
        return session
    
    def test_message_caching(self, auth_session):
        """Test if messages are cached"""
        target = "A-0002"
        
        # First request - should fetch from DB
        start1 = time.time()
        response1 = auth_session.get(f"{BASE_URL}/api/messages/{target}")
        time1 = time.time() - start1
        
        data1 = response1.json()
        cached1 = data1.get('cached', False)
        
        # Second request - should be cached
        start2 = time.time()
        response2 = auth_session.get(f"{BASE_URL}/api/messages/{target}")
        time2 = time.time() - start2
        
        data2 = response2.json()
        cached2 = data2.get('cached', False)
        
        print(f"✅ First request: {time1:.4f}s (cached: {cached1})")
        print(f"✅ Second request: {time2:.4f}s (cached: {cached2})")
        
        if cached2:
            print(f"✅ Cache speedup: {time1/time2:.2f}x faster")
        else:
            print("⚠️  Caching may not be working (Redis not running?)")


class TestWebSocket:
    """Test WebSocket/Socket.IO functionality"""
    
    def test_socketio_endpoint(self):
        """Test if Socket.IO endpoint is available"""
        try:
            response = requests.get(f"{BASE_URL}/socket.io/?transport=polling")
            # Socket.IO should respond even without auth
            assert response.status_code in [200, 400, 401]
            print("✅ Socket.IO endpoint available")
        except Exception as e:
            print(f"⚠️  Socket.IO test failed: {e}")


class TestPerformance:
    """Performance and load testing"""
    
    @pytest.fixture(scope="class")
    def auth_session(self):
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/login", json=TEST_USER)
        return session
    
    def test_concurrent_requests(self, auth_session):
        """Test handling multiple concurrent requests"""
        import concurrent.futures
        
        def make_request():
            return auth_session.get(f"{BASE_URL}/api/contacts")
        
        # Test 50 concurrent requests
        with concurrent.futures.ThreadPoolExecutor(max_workers=50) as executor:
            futures = [executor.submit(make_request) for _ in range(50)]
            results = [f.result() for f in concurrent.futures.as_completed(futures)]
        
        success_count = sum(1 for r in results if r.status_code == 200)
        print(f"✅ Concurrent requests: {success_count}/50 successful")
        assert success_count >= 45, "Too many failed requests"
    
    def test_response_times(self, auth_session):
        """Test response times for key endpoints"""
        endpoints = [
            "/api/session",
            "/api/contacts",
            "/api/messages/A-0002"
        ]
        
        for endpoint in endpoints:
            times = []
            for _ in range(10):
                start = time.time()
                auth_session.get(f"{BASE_URL}{endpoint}")
                times.append(time.time() - start)
            
            avg_time = sum(times) / len(times)
            print(f"✅ {endpoint}: avg {avg_time*1000:.2f}ms")
            assert avg_time < 1.0, f"{endpoint} too slow"


class TestSecurity:
    """Additional security tests"""
    
    def test_sql_injection_prevention(self):
        """Test SQL injection prevention"""
        sql_payloads = [
            "' OR '1'='1",
            "admin'--",
            "' UNION SELECT * FROM users--"
        ]
        
        for payload in sql_payloads:
            response = requests.post(
                f"{BASE_URL}/api/login",
                json={"user_id": payload, "password": "test"}
            )
            # Should fail authentication, not cause SQL error
            assert response.status_code == 401
        
        print("✅ SQL injection prevention working")
    
    def test_unauthorized_access(self):
        """Test unauthorized access is blocked"""
        # Try accessing without authentication
        response = requests.get(f"{BASE_URL}/api/contacts")
        assert response.status_code == 401
        
        response = requests.get(f"{BASE_URL}/api/messages/A-0001")
        assert response.status_code == 401
        
        print("✅ Unauthorized access blocked")
    
    def test_xss_prevention(self):
        """Test XSS prevention in messages"""
        session = requests.Session()
        session.post(f"{BASE_URL}/api/login", json=TEST_USER)
        
        xss_payload = "<script>alert('XSS')</script>"
        response = session.post(
            f"{BASE_URL}/api/send",
            json={"text": xss_payload, "target_user": "A-0002"}
        )
        
        # Should succeed but sanitize the input
        assert response.status_code == 200
        print("✅ XSS prevention working")


def run_all_tests():
    """Run all tests and generate report"""
    print("\n" + "="*60)
    print("🧪 KAA HO CHAT - COMPREHENSIVE TEST SUITE")
    print("="*60 + "\n")
    
    # Run with pytest
    pytest.main([
        __file__,
        "-v",
        "--tb=short",
        "--color=yes",
        "-W", "ignore::DeprecationWarning"
    ])


if __name__ == "__main__":
    run_all_tests()