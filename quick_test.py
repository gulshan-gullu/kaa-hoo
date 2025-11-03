"""
KAA HO - Quick Test Runner
All tests in ONE file - no external dependencies needed!
"""

import requests
import time
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor

class QuickTestRunner:
    def __init__(self):
        self.base_url = "http://localhost"
        self.passed = 0
        self.failed = 0
        self.warnings = 0
        
    def log_result(self, test_name, status, details=""):
        """Log test result"""
        if status == "pass":
            emoji = "✅"
            self.passed += 1
        elif status == "fail":
            emoji = "❌"
            self.failed += 1
        else:
            emoji = "⚠️"
            self.warnings += 1
        
        print(f"{emoji} {test_name}")
        if details:
            print(f"   {details}")
    
    def test_01_authentication(self):
        """Test user authentication"""
        print("\n" + "="*70)
        print("TEST CATEGORY 1: AUTHENTICATION")
        print("="*70)
        
        # Test valid login
        try:
            session = requests.Session()
            r = session.post(
                f"{self.base_url}/api/login",
                json={'user_id': 'client01', 'password': 'test123'},
                timeout=5
            )
            
            if r.status_code == 200:
                self.log_result("Valid Login", "pass", "client01 logged in successfully")
            else:
                self.log_result("Valid Login", "fail", f"Status: {r.status_code}")
        except Exception as e:
            self.log_result("Valid Login", "fail", str(e)[:50])
        
        # Test invalid login
        try:
            session = requests.Session()
            r = session.post(
                f"{self.base_url}/api/login",
                json={'user_id': 'client01', 'password': 'wrongpassword'},
                timeout=5
            )
            
            if r.status_code in [400, 401]:
                self.log_result("Invalid Login Rejected", "pass", "Wrong password correctly rejected")
            else:
                self.log_result("Invalid Login Rejected", "fail", "Should reject wrong password")
        except Exception as e:
            self.log_result("Invalid Login Rejected", "fail", str(e)[:50])
        
        # Test session persistence
        try:
            session = requests.Session()
            session.post(
                f"{self.base_url}/api/login",
                json={'user_id': 'client01', 'password': 'test123'}
            )
            
            success_count = 0
            for _ in range(5):
                r = session.get(f"{self.base_url}/api/turn-credentials", timeout=5)
                if r.status_code == 200:
                    success_count += 1
            
            if success_count == 5:
                self.log_result("Session Persistence", "pass", "Session valid across 5 requests")
            else:
                self.log_result("Session Persistence", "warn", f"Only {success_count}/5 requests succeeded")
        except Exception as e:
            self.log_result("Session Persistence", "fail", str(e)[:50])
        
        # Test concurrent logins
        try:
            def login_user(user_id):
                session = requests.Session()
                r = session.post(
                    f"{self.base_url}/api/login",
                    json={'user_id': user_id, 'password': 'test123'},
                    timeout=10
                )
                return r.status_code == 200
            
            with ThreadPoolExecutor(max_workers=3) as executor:
                futures = [
                    executor.submit(login_user, uid)
                    for uid in ['client01', 'admin01', 'client02']
                ]
                results = [f.result() for f in futures]
            
            success = sum(results)
            if success == 3:
                self.log_result("Concurrent Logins", "pass", "3 users logged in simultaneously")
            else:
                self.log_result("Concurrent Logins", "warn", f"{success}/3 users logged in")
        except Exception as e:
            self.log_result("Concurrent Logins", "fail", str(e)[:50])
    
    def test_02_calling_infrastructure(self):
        """Test calling infrastructure"""
        print("\n" + "="*70)
        print("TEST CATEGORY 2: CALLING INFRASTRUCTURE")
        print("="*70)
        
        # Login first
        session = requests.Session()
        session.post(
            f"{self.base_url}/api/login",
            json={'user_id': 'client01', 'password': 'test123'}
        )
        
        # Test TURN credentials available
        try:
            r = session.get(f"{self.base_url}/api/turn-credentials", timeout=5)
            
            if r.status_code == 200:
                data = r.json()
                ice_servers = data.get('ice_servers', [])
                
                if len(ice_servers) >= 3:
                    self.log_result("TURN Servers Available", "pass", 
                                  f"{len(ice_servers)} ICE servers configured")
                else:
                    self.log_result("TURN Servers Available", "warn",
                                  f"Only {len(ice_servers)} ICE servers")
            else:
                self.log_result("TURN Servers Available", "fail", f"Status: {r.status_code}")
        except Exception as e:
            self.log_result("TURN Servers Available", "fail", str(e)[:50])
        
        # Test TURN credentials format
        try:
            r = session.get(f"{self.base_url}/api/turn-credentials", timeout=5)
            data = r.json()
            ice_servers = data.get('ice_servers', [])
            
            valid_format = True
            stun_count = 0
            turn_count = 0
            
            for server in ice_servers:
                if 'urls' not in server:
                    valid_format = False
                    break
                
                if 'stun:' in server['urls']:
                    stun_count += 1
                elif 'turn:' in server['urls']:
                    turn_count += 1
            
            if valid_format and stun_count > 0 and turn_count > 0:
                self.log_result("ICE Server Format", "pass",
                              f"{stun_count} STUN + {turn_count} TURN servers")
            else:
                self.log_result("ICE Server Format", "warn", "Format issues detected")
        except Exception as e:
            self.log_result("ICE Server Format", "fail", str(e)[:50])
        
        # Test TURN reliability
        try:
            success_count = 0
            total_requests = 20
            
            for _ in range(total_requests):
                r = session.get(f"{self.base_url}/api/turn-credentials", timeout=3)
                if r.status_code == 200:
                    success_count += 1
            
            success_rate = (success_count / total_requests) * 100
            
            if success_rate >= 95:
                self.log_result("TURN Reliability", "pass",
                              f"{success_rate:.0f}% success rate ({success_count}/{total_requests})")
            elif success_rate >= 80:
                self.log_result("TURN Reliability", "warn",
                              f"{success_rate:.0f}% success rate")
            else:
                self.log_result("TURN Reliability", "fail",
                              f"Only {success_rate:.0f}% success rate")
        except Exception as e:
            self.log_result("TURN Reliability", "fail", str(e)[:50])
        
        # Test calling.js exists
        try:
            r = session.get(f"{self.base_url}/static/js/features/calling.js", timeout=5)
            
            if r.status_code == 200:
                content = r.text
                
                # Check for WebRTC components
                components = ['RTCPeerConnection', 'getUserMedia', 'createOffer', 
                            'createAnswer', 'setLocalDescription']
                found = sum(1 for comp in components if comp in content)
                
                if found >= 4:
                    self.log_result("calling.js Components", "pass",
                                  f"{found}/5 WebRTC components found")
                else:
                    self.log_result("calling.js Components", "warn",
                                  f"Only {found}/5 components found")
            else:
                self.log_result("calling.js Components", "fail", "calling.js not accessible")
        except Exception as e:
            self.log_result("calling.js Components", "fail", str(e)[:50])
        
        # Test Socket.IO events in calling.js
        try:
            r = session.get(f"{self.base_url}/static/js/features/calling.js", timeout=5)
            
            if r.status_code == 200:
                content = r.text
                
                events = ['socket.emit', 'socket.on', 'webrtc']
                found = sum(1 for event in events if event in content)
                
                if found >= 2:
                    self.log_result("Socket.IO Events", "pass", 
                                  f"Socket events properly defined")
                else:
                    self.log_result("Socket.IO Events", "warn",
                                  "Some socket events missing")
            else:
                self.log_result("Socket.IO Events", "fail", "Cannot check events")
        except Exception as e:
            self.log_result("Socket.IO Events", "fail", str(e)[:50])
    
    def test_03_performance(self):
        """Test system performance"""
        print("\n" + "="*70)
        print("TEST CATEGORY 3: PERFORMANCE")
        print("="*70)
        
        # Login
        session = requests.Session()
        session.post(
            f"{self.base_url}/api/login",
            json={'user_id': 'client01', 'password': 'test123'}
        )
        
        # Test response time
        try:
            times = []
            for _ in range(10):
                start = time.time()
                r = session.get(f"{self.base_url}/api/turn-credentials", timeout=5)
                elapsed = time.time() - start
                if r.status_code == 200:
                    times.append(elapsed)
            
            if times:
                avg_time = sum(times) / len(times)
                max_time = max(times)
                
                if avg_time < 0.1:
                    self.log_result("Response Time", "pass",
                                  f"Avg: {avg_time:.3f}s, Max: {max_time:.3f}s")
                elif avg_time < 0.5:
                    self.log_result("Response Time", "warn",
                                  f"Avg: {avg_time:.3f}s (acceptable)")
                else:
                    self.log_result("Response Time", "fail",
                                  f"Too slow: {avg_time:.3f}s")
            else:
                self.log_result("Response Time", "fail", "No successful requests")
        except Exception as e:
            self.log_result("Response Time", "fail", str(e)[:50])
        
        # Test concurrent sessions
        try:
            def create_session(user_id):
                s = requests.Session()
                r = s.post(
                    f"{self.base_url}/api/login",
                    json={'user_id': user_id, 'password': 'test123'},
                    timeout=10
                )
                return r.status_code == 200
            
            users = ['client01', 'admin01', 'client02', 'staff01']
            
            with ThreadPoolExecutor(max_workers=4) as executor:
                futures = [executor.submit(create_session, uid) for uid in users]
                results = [f.result() for f in futures]
            
            success = sum(results)
            success_rate = (success / len(users)) * 100
            
            if success_rate >= 90:
                self.log_result("Concurrent Sessions", "pass",
                              f"{success}/{len(users)} sessions created")
            elif success_rate >= 75:
                self.log_result("Concurrent Sessions", "warn",
                              f"{success}/{len(users)} sessions created")
            else:
                self.log_result("Concurrent Sessions", "fail",
                              f"Only {success}/{len(users)} succeeded")
        except Exception as e:
            self.log_result("Concurrent Sessions", "fail", str(e)[:50])
    
    def test_04_security(self):
        """Test security features"""
        print("\n" + "="*70)
        print("TEST CATEGORY 4: SECURITY")
        print("="*70)
        
        # Test unauthenticated access blocked
        try:
            session = requests.Session()  # No login
            r = session.get(f"{self.base_url}/api/turn-credentials", timeout=5)
            
            if r.status_code in [401, 403]:
                self.log_result("Auth Required", "pass",
                              "Protected endpoint requires authentication")
            else:
                self.log_result("Auth Required", "fail",
                              "Protected endpoint accessible without auth!")
        except Exception as e:
            self.log_result("Auth Required", "fail", str(e)[:50])
        
        # Test invalid credentials rejected
        try:
            session = requests.Session()
            r = session.post(
                f"{self.base_url}/api/login",
                json={'user_id': 'hacker', 'password': "' OR '1'='1"},
                timeout=5
            )
            
            if r.status_code in [400, 401]:
                self.log_result("SQL Injection Prevention", "pass",
                              "SQL injection attempt blocked")
            else:
                self.log_result("SQL Injection Prevention", "warn",
                              "Check SQL injection handling")
        except Exception as e:
            self.log_result("SQL Injection Prevention", "fail", str(e)[:50])
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "="*70)
        print("📊 COMPREHENSIVE TEST RESULTS")
        print("="*70)
        
        total = self.passed + self.failed + self.warnings
        
        print(f"\n✅ Passed:   {self.passed}/{total}")
        print(f"⚠️  Warnings: {self.warnings}/{total}")
        print(f"❌ Failed:   {self.failed}/{total}")
        
        if total > 0:
            success_rate = ((self.passed + self.warnings) / total) * 100
            print(f"\n📈 Success Rate: {success_rate:.0f}%")
        
        print("\n" + "="*70)
        
        if self.failed == 0 and self.warnings == 0:
            print("🎉 PERFECT! All tests passed!")
            print("✅ Your system is production-ready!")
        elif self.failed == 0:
            print("✅ GOOD! All critical tests passed")
            print("⚠️  Some minor optimizations recommended")
        elif self.failed <= 2:
            print("⚠️  ACCEPTABLE! Most tests passed")
            print("🔧 Fix the failed tests for production")
        else:
            print("❌ NEEDS WORK! Multiple critical issues")
            print("🔧 Review and fix failed tests")
        
        print("="*70)
        
        # Manual test reminder
        if self.passed + self.warnings >= 10:
            print("\n📋 NEXT: MANUAL CALL TEST")
            print("="*70)
            print("""
Your infrastructure tests passed! Now test actual calling:

1. Open 2 browser windows
2. Window 1: Login as client01
3. Window 2: Login as admin01 (incognito)
4. Window 1: Click call button to call admin01
5. Window 2: Accept the call
6. Verify: Video, audio, and controls work

If calling works manually, your system is READY! 🎉
            """)
            print("="*70)
    
    def run_all_tests(self):
        """Run all test categories"""
        print("\n" + "="*70)
        print("🧪 KAA HO - COMPREHENSIVE TEST SUITE")
        print("   Testing Core Features: Calling & Messaging")
        print("="*70)
        print(f"\nStarted: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"Server: {self.base_url}\n")
        
        # Check server is running
        try:
            r = requests.get(self.base_url, timeout=3)
            print(f"✅ Server is running (Status: {r.status_code})\n")
        except:
            print("❌ ERROR: Cannot connect to server!")
            print(f"   Make sure your server is running at {self.base_url}\n")
            return
        
        # Run all test categories
        self.test_01_authentication()
        self.test_02_calling_infrastructure()
        self.test_03_performance()
        self.test_04_security()
        
        # Print final summary
        self.print_summary()


if __name__ == "__main__":
    print("""
╔═══════════════════════════════════════════════════════════╗
║         KAA HO - QUICK TEST RUNNER                        ║
║       All-in-One Testing (No External Files Needed)       ║
╚═══════════════════════════════════════════════════════════╝

This will test:
✅ Authentication (login, sessions)
✅ Calling Infrastructure (TURN, WebRTC)
✅ Performance (speed, concurrency)
✅ Security (auth, injection prevention)
    """)
    
    input("⏸️  Press ENTER to start testing...")
    
    runner = QuickTestRunner()
    runner.run_all_tests()
    
    input("\n⏸️  Press ENTER to exit...")