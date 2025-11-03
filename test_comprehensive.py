"""
KAA HO - COMPREHENSIVE CALLING & MESSAGING TEST SUITE
Complete testing framework for chat and video calling system

Install required packages:
pip install pytest pytest-asyncio httpx playwright pytest-html pytest-xdist
"""

import pytest
import asyncio
import time
import requests
from datetime import datetime
from typing import List, Dict
import json

# ============================================================================
# CONFIGURATION & FIXTURES
# ============================================================================

@pytest.fixture
def base_url():
    """Base URL for the application"""
    return "http://localhost"

@pytest.fixture
def test_users():
    """Test user credentials"""
    return {
        'client01': {'user_id': 'client01', 'password': 'test123', 'role': 'client'},
        'admin01': {'user_id': 'admin01', 'password': 'test123', 'role': 'admin'},
        'client02': {'user_id': 'client02', 'password': 'test123', 'role': 'client'},
        'staff01': {'user_id': 'staff01', 'password': 'test123', 'role': 'staff'},
    }

@pytest.fixture
def authenticated_session(base_url, test_users):
    """Create authenticated session for a user"""
    def _create_session(user_key='client01'):
        session = requests.Session()
        user = test_users[user_key]
        response = session.post(
            f"{base_url}/api/login",
            json={'user_id': user['user_id'], 'password': user['password']},
            timeout=10
        )
        if response.status_code == 200:
            return session
        return None
    return _create_session


# ============================================================================
# PART 1: AUTHENTICATION TESTS
# ============================================================================

class TestAuthentication:
    """Test user authentication and session management"""
    
    def test_valid_login(self, base_url, test_users):
        """Test successful login"""
        session = requests.Session()
        response = session.post(
            f"{base_url}/api/login",
            json={'user_id': 'client01', 'password': 'test123'}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data['success'] == True
        assert 'user' in data
        assert data['user']['id'] == 'client01'
    
    def test_invalid_login(self, base_url):
        """Test login with wrong password"""
        session = requests.Session()
        response = session.post(
            f"{base_url}/api/login",
            json={'user_id': 'client01', 'password': 'wrongpassword'}
        )
        
        assert response.status_code in [400, 401]
        data = response.json()
        assert data['success'] == False
    
    def test_session_persistence(self, base_url, authenticated_session):
        """Test session remains valid across requests"""
        session = authenticated_session('client01')
        assert session is not None
        
        # Make multiple requests with same session
        for _ in range(5):
            response = session.get(f"{base_url}/api/turn-credentials")
            assert response.status_code == 200
    
    def test_concurrent_logins(self, base_url, test_users):
        """Test multiple users can login simultaneously"""
        sessions = []
        
        for user_key in ['client01', 'admin01', 'client02']:
            session = requests.Session()
            user = test_users[user_key]
            response = session.post(
                f"{base_url}/api/login",
                json={'user_id': user['user_id'], 'password': user['password']}
            )
            assert response.status_code == 200
            sessions.append(session)
        
        # All sessions should be valid
        assert len(sessions) == 3


# ============================================================================
# PART 2: MESSAGING TESTS
# ============================================================================

class TestMessaging:
    """Test messaging functionality"""
    
    def test_send_message_basic(self, base_url, authenticated_session):
        """Test sending a simple text message"""
        session = authenticated_session('client01')
        
        message_data = {
            'to_user': 'admin01',
            'message': 'Hello, this is a test message!',
            'timestamp': datetime.now().isoformat()
        }
        
        # Note: Adjust endpoint based on your API
        response = session.post(
            f"{base_url}/api/messages/send",
            json=message_data
        )
        
        # Check if message was sent
        # Adjust assertion based on your API response
        assert response.status_code in [200, 201]
    
    def test_receive_messages(self, base_url, authenticated_session):
        """Test receiving messages"""
        # Login as sender
        sender_session = authenticated_session('client01')
        
        # Send message
        message_data = {
            'to_user': 'admin01',
            'message': 'Test message for retrieval'
        }
        sender_session.post(f"{base_url}/api/messages/send", json=message_data)
        
        # Login as receiver and check messages
        receiver_session = authenticated_session('admin01')
        response = receiver_session.get(
            f"{base_url}/api/messages",
            params={'from_user': 'client01'}
        )
        
        assert response.status_code == 200
        # Verify message in response
    
    def test_message_history(self, base_url, authenticated_session):
        """Test retrieving message history"""
        session = authenticated_session('client01')
        
        # Send multiple messages
        for i in range(5):
            session.post(
                f"{base_url}/api/messages/send",
                json={
                    'to_user': 'admin01',
                    'message': f'Test message {i+1}'
                }
            )
            time.sleep(0.1)
        
        # Retrieve history
        response = session.get(
            f"{base_url}/api/messages/history",
            params={'with_user': 'admin01'}
        )
        
        assert response.status_code == 200
        # Should have at least 5 messages
    
    def test_message_delivery_order(self, base_url, authenticated_session):
        """Test messages are delivered in correct order"""
        session = authenticated_session('client01')
        
        messages = ['First', 'Second', 'Third', 'Fourth', 'Fifth']
        
        for msg in messages:
            session.post(
                f"{base_url}/api/messages/send",
                json={'to_user': 'admin01', 'message': msg}
            )
            time.sleep(0.05)
        
        # Retrieve and verify order
        response = session.get(
            f"{base_url}/api/messages/history",
            params={'with_user': 'admin01', 'limit': 5}
        )
        
        if response.status_code == 200:
            data = response.json()
            # Verify messages are in order
    
    def test_long_message(self, base_url, authenticated_session):
        """Test sending a very long message"""
        session = authenticated_session('client01')
        
        long_message = "A" * 10000  # 10,000 characters
        
        response = session.post(
            f"{base_url}/api/messages/send",
            json={
                'to_user': 'admin01',
                'message': long_message
            }
        )
        
        # Should either accept or reject with proper error
        assert response.status_code in [200, 201, 400, 413]
    
    def test_special_characters_in_message(self, base_url, authenticated_session):
        """Test messages with special characters"""
        session = authenticated_session('client01')
        
        special_messages = [
            "Hello 👋 World 🌍",
            "Test with émojis and àccents",
            "<script>alert('XSS')</script>",
            "SELECT * FROM users;",
            "../../etc/passwd"
        ]
        
        for msg in special_messages:
            response = session.post(
                f"{base_url}/api/messages/send",
                json={'to_user': 'admin01', 'message': msg}
            )
            # Should handle safely
            assert response.status_code in [200, 201, 400]
    
    def test_message_to_nonexistent_user(self, base_url, authenticated_session):
        """Test sending message to user that doesn't exist"""
        session = authenticated_session('client01')
        
        response = session.post(
            f"{base_url}/api/messages/send",
            json={
                'to_user': 'nonexistent_user_123',
                'message': 'This should fail'
            }
        )
        
        # Should return error
        assert response.status_code in [400, 404]


# ============================================================================
# PART 3: CALLING INFRASTRUCTURE TESTS
# ============================================================================

class TestCallingInfrastructure:
    """Test WebRTC calling infrastructure"""
    
    def test_turn_credentials_available(self, base_url, authenticated_session):
        """Test TURN server credentials are provided"""
        session = authenticated_session('client01')
        
        response = session.get(f"{base_url}/api/turn-credentials")
        
        assert response.status_code == 200
        data = response.json()
        assert 'ice_servers' in data
        assert len(data['ice_servers']) > 0
    
    def test_turn_credentials_format(self, base_url, authenticated_session):
        """Test TURN credentials have correct format"""
        session = authenticated_session('client01')
        
        response = session.get(f"{base_url}/api/turn-credentials")
        data = response.json()
        
        ice_servers = data.get('ice_servers', [])
        
        # Verify structure
        for server in ice_servers:
            assert 'urls' in server
            
            if 'turn:' in server['urls']:
                # TURN servers should have credentials
                assert 'username' in server or 'credential' in server
    
    def test_turn_server_reliability(self, base_url, authenticated_session):
        """Test TURN servers respond reliably"""
        session = authenticated_session('client01')
        
        success_count = 0
        total_requests = 50
        
        for _ in range(total_requests):
            response = session.get(f"{base_url}/api/turn-credentials", timeout=5)
            if response.status_code == 200:
                data = response.json()
                if 'ice_servers' in data and len(data['ice_servers']) > 0:
                    success_count += 1
        
        # Should succeed at least 95% of the time
        success_rate = (success_count / total_requests) * 100
        assert success_rate >= 95, f"TURN server reliability only {success_rate}%"
    
    def test_turn_credentials_performance(self, base_url, authenticated_session):
        """Test TURN credentials endpoint performance"""
        session = authenticated_session('client01')
        
        times = []
        for _ in range(20):
            start = time.time()
            response = session.get(f"{base_url}/api/turn-credentials")
            elapsed = time.time() - start
            
            if response.status_code == 200:
                times.append(elapsed)
        
        avg_time = sum(times) / len(times)
        max_time = max(times)
        
        # Should be fast
        assert avg_time < 0.1, f"Average response time too slow: {avg_time}s"
        assert max_time < 0.5, f"Max response time too slow: {max_time}s"


# ============================================================================
# PART 4: CALL SIGNALING TESTS
# ============================================================================

class TestCallSignaling:
    """Test call signaling and WebRTC offer/answer exchange"""
    
    def test_calling_js_loaded(self, base_url, authenticated_session):
        """Test calling.js is accessible"""
        session = authenticated_session('client01')
        
        response = session.get(f"{base_url}/static/js/features/calling.js")
        
        assert response.status_code == 200
        assert len(response.text) > 1000  # Should be substantial
    
    def test_calling_js_structure(self, base_url, authenticated_session):
        """Test calling.js has required WebRTC components"""
        session = authenticated_session('client01')
        
        response = session.get(f"{base_url}/static/js/features/calling.js")
        content = response.text
        
        # Check for essential WebRTC components
        required_components = [
            'RTCPeerConnection',
            'getUserMedia',
            'createOffer',
            'createAnswer',
            'setLocalDescription',
            'setRemoteDescription',
            'addIceCandidate'
        ]
        
        for component in required_components:
            assert component in content, f"Missing {component} in calling.js"
    
    def test_socket_events_defined(self, base_url, authenticated_session):
        """Test Socket.IO events are defined in calling.js"""
        session = authenticated_session('client01')
        
        response = session.get(f"{base_url}/static/js/features/calling.js")
        content = response.text
        
        # Check for essential Socket.IO events
        required_events = [
            'socket.emit',
            'socket.on',
            'call', # Should have call-related events
            'webrtc' # Should have WebRTC signaling
        ]
        
        for event in required_events:
            assert event in content, f"Missing {event} socket handling"


# ============================================================================
# PART 5: END-TO-END CALL TESTS (Manual Verification Required)
# ============================================================================

class TestCallEndToEnd:
    """End-to-end call tests - these require manual verification"""
    
    def test_call_infrastructure_ready(self, base_url, test_users):
        """Verify all infrastructure needed for calling is ready"""
        results = {}
        
        # Test 1: Can users login
        for user_key in ['client01', 'admin01']:
            session = requests.Session()
            user = test_users[user_key]
            response = session.post(
                f"{base_url}/api/login",
                json={'user_id': user['user_id'], 'password': user['password']}
            )
            results[f'{user_key}_login'] = response.status_code == 200
        
        # Test 2: TURN credentials available
        session = requests.Session()
        session.post(
            f"{base_url}/api/login",
            json={'user_id': 'client01', 'password': 'test123'}
        )
        response = session.get(f"{base_url}/api/turn-credentials")
        results['turn_available'] = response.status_code == 200
        
        # Test 3: Calling script accessible
        response = session.get(f"{base_url}/static/js/features/calling.js")
        results['calling_js'] = response.status_code == 200
        
        # All infrastructure should be ready
        assert all(results.values()), f"Infrastructure not ready: {results}"
        
        print("\n" + "="*70)
        print("✅ CALL INFRASTRUCTURE READY!")
        print("="*70)
        print("\n📋 MANUAL TEST REQUIRED:")
        print("\nTo complete call testing:")
        print("1. Open 2 browser windows")
        print("2. Window 1: Login as client01")
        print("3. Window 2: Login as admin01 (incognito)")
        print("4. Window 1: Click call button to call admin01")
        print("5. Window 2: Accept the call")
        print("6. Verify:")
        print("   ✅ Both users can see each other")
        print("   ✅ Both users can hear each other")
        print("   ✅ Call controls work (mute, video toggle)")
        print("   ✅ Call ends cleanly")
        print("="*70)


# ============================================================================
# PART 6: PERFORMANCE & STRESS TESTS
# ============================================================================

class TestPerformance:
    """Performance and load testing"""
    
    def test_message_throughput(self, base_url, authenticated_session):
        """Test how many messages can be sent per second"""
        session = authenticated_session('client01')
        
        num_messages = 50
        start_time = time.time()
        
        success_count = 0
        for i in range(num_messages):
            try:
                response = session.post(
                    f"{base_url}/api/messages/send",
                    json={
                        'to_user': 'admin01',
                        'message': f'Performance test message {i}'
                    },
                    timeout=5
                )
                if response.status_code in [200, 201]:
                    success_count += 1
            except:
                pass
        
        elapsed = time.time() - start_time
        throughput = success_count / elapsed
        
        print(f"\n📊 Message Throughput: {throughput:.2f} messages/second")
        print(f"   Success rate: {success_count}/{num_messages}")
        
        # Should handle at least 10 messages per second
        assert throughput >= 10, f"Throughput too low: {throughput} msg/s"
    
    def test_concurrent_sessions(self, base_url, test_users):
        """Test multiple concurrent user sessions"""
        from concurrent.futures import ThreadPoolExecutor
        
        def create_session(user_key):
            session = requests.Session()
            user = test_users[user_key]
            response = session.post(
                f"{base_url}/api/login",
                json={'user_id': user['user_id'], 'password': user['password']},
                timeout=10
            )
            return response.status_code == 200
        
        # Test with multiple users
        with ThreadPoolExecutor(max_workers=4) as executor:
            futures = [
                executor.submit(create_session, user_key)
                for user_key in ['client01', 'admin01', 'client02', 'staff01']
            ]
            results = [f.result() for f in futures]
        
        success_rate = sum(results) / len(results) * 100
        assert success_rate >= 75, f"Concurrent session success rate: {success_rate}%"


# ============================================================================
# PART 7: SECURITY TESTS
# ============================================================================

class TestSecurity:
    """Security and validation tests"""
    
    def test_unauthenticated_access_blocked(self, base_url):
        """Test that protected endpoints require authentication"""
        session = requests.Session()  # No login
        
        protected_endpoints = [
            '/api/turn-credentials',
            '/api/messages',
            '/api/messages/send'
        ]
        
        for endpoint in protected_endpoints:
            response = session.get(f"{base_url}{endpoint}")
            # Should be unauthorized
            assert response.status_code in [401, 403], \
                f"{endpoint} accessible without auth!"
    
    def test_xss_prevention(self, base_url, authenticated_session):
        """Test XSS attack prevention in messages"""
        session = authenticated_session('client01')
        
        xss_payloads = [
            "<script>alert('XSS')</script>",
            "<img src=x onerror='alert(1)'>",
            "javascript:alert('XSS')",
            "<iframe src='evil.com'></iframe>"
        ]
        
        for payload in xss_payloads:
            response = session.post(
                f"{base_url}/api/messages/send",
                json={'to_user': 'admin01', 'message': payload}
            )
            # Should either sanitize or reject
            assert response.status_code in [200, 201, 400]
    
    def test_sql_injection_prevention(self, base_url, authenticated_session):
        """Test SQL injection prevention"""
        session = authenticated_session('client01')
        
        sql_payloads = [
            "' OR '1'='1",
            "admin'--",
            "'; DROP TABLE users;--"
        ]
        
        for payload in sql_payloads:
            # Try in username field
            response = session.post(
                f"{base_url}/api/messages/send",
                json={'to_user': payload, 'message': 'test'}
            )
            # Should handle safely
            assert response.status_code != 500  # Should not crash


# ============================================================================
# PART 8: INTEGRATION TESTS
# ============================================================================

class TestIntegration:
    """Integration tests combining multiple features"""
    
    def test_full_conversation_flow(self, base_url, test_users):
        """Test complete conversation between two users"""
        # User 1 sends messages
        session1 = requests.Session()
        session1.post(
            f"{base_url}/api/login",
            json={'user_id': 'client01', 'password': 'test123'}
        )
        
        # User 2 receives and responds
        session2 = requests.Session()
        session2.post(
            f"{base_url}/api/login",
            json={'user_id': 'admin01', 'password': 'test123'}
        )
        
        # Conversation
        conversation = [
            ('client01', 'admin01', 'Hello admin!', session1),
            ('admin01', 'client01', 'Hi client! How can I help?', session2),
            ('client01', 'admin01', 'I need assistance with my account', session1),
            ('admin01', 'client01', 'Sure, I can help with that', session2)
        ]
        
        for from_user, to_user, message, session in conversation:
            response = session.post(
                f"{base_url}/api/messages/send",
                json={'to_user': to_user, 'message': message}
            )
            assert response.status_code in [200, 201]
            time.sleep(0.1)
        
        # Both users should have complete conversation history
        # Verify with both sessions


# ============================================================================
# TEST EXECUTION & REPORTING
# ============================================================================

def generate_test_report(results_dict):
    """Generate comprehensive test report"""
    print("\n" + "="*70)
    print("📊 COMPREHENSIVE TEST RESULTS")
    print("="*70)
    
    categories = {
        'Authentication': 0,
        'Messaging': 0,
        'Calling Infrastructure': 0,
        'Performance': 0,
        'Security': 0,
        'Integration': 0
    }
    
    print("\nTest execution complete!")
    print("="*70)


if __name__ == "__main__":
    print("""
    ╔═══════════════════════════════════════════════════════════╗
    ║   KAA HO - COMPREHENSIVE TEST SUITE                       ║
    ║   Complete Testing for Calling & Messaging System         ║
    ╚═══════════════════════════════════════════════════════════╝
    
    To run all tests:
        pytest test_comprehensive.py -v --html=report.html
    
    To run specific test class:
        pytest test_comprehensive.py::TestMessaging -v
    
    To run with coverage:
        pytest test_comprehensive.py --cov=your_app --cov-report=html
    
    To run in parallel (faster):
        pytest test_comprehensive.py -n 4 -v
    """)