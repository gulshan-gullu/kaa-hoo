"""
KAA HO - Real Calling System Stress Tests
Tests with actual users: client01 and admin01
"""

import requests
import time
import threading
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor

class RealCallingStressTester:
    def __init__(self, base_url="http://localhost"):
        self.base_url = base_url
        self.results = []
        
    def log(self, test_name, status, details=""):
        """Log test results"""
        timestamp = datetime.now().strftime('%H:%M:%S')
        emoji = "✅" if status == "pass" else "❌" if status == "fail" else "⚠️"
        
        self.results.append({
            'time': timestamp,
            'test': test_name,
            'status': status,
            'details': details
        })
        
        print(f"[{timestamp}] {emoji} {test_name}")
        if details:
            print(f"           {details}")
    
    def create_authenticated_session(self, user_id, password="test123"):
        """Create authenticated session"""
        try:
            session = requests.Session()
            r = session.post(
                f"{self.base_url}/api/login",
                json={'user_id': user_id, 'password': password},
                timeout=10
            )
            
            if r.status_code == 200:
                return session
            return None
        except:
            return None
    
    def test_turn_credentials_stress(self, num_requests=200):
        """Stress test TURN credentials with real authenticated user"""
        print("\n" + "="*70)
        print(f"🧊 TEST 1: TURN Credentials Under Heavy Load")
        print(f"   Testing with {num_requests} authenticated requests")
        print("="*70)
        
        # Create authenticated session
        print("Creating authenticated session as client01...")
        session = self.create_authenticated_session('client01')
        
        if not session:
            self.log("TURN Credentials Stress", "fail", "Cannot authenticate")
            return
        
        print(f"✅ Authenticated! Making {num_requests} TURN requests...\n")
        
        success_count = 0
        fail_count = 0
        times = []
        ice_servers_count = []
        
        for i in range(num_requests):
            try:
                start = time.time()
                r = session.get(f"{self.base_url}/api/turn-credentials", timeout=5)
                elapsed = time.time() - start
                
                if r.status_code == 200:
                    data = r.json()
                    if 'ice_servers' in data:
                        ice_count = len(data['ice_servers'])
                        ice_servers_count.append(ice_count)
                        success_count += 1
                        times.append(elapsed)
                    else:
                        fail_count += 1
                else:
                    fail_count += 1
                
                if (i + 1) % 40 == 0:
                    current_rate = (success_count / (i + 1)) * 100
                    avg_time = sum(times) / len(times) if times else 0
                    print(f"   Progress: {i + 1}/{num_requests} "
                          f"({current_rate:.0f}% success, {avg_time:.3f}s avg)")
                
            except Exception as e:
                fail_count += 1
        
        success_rate = (success_count / num_requests) * 100
        avg_time = sum(times) / len(times) if times else 0
        max_time = max(times) if times else 0
        min_time = min(times) if times else 0
        avg_ice = sum(ice_servers_count) / len(ice_servers_count) if ice_servers_count else 0
        
        print(f"\n📊 Results:")
        print(f"   ✅ Successful: {success_count}/{num_requests}")
        print(f"   ❌ Failed: {fail_count}/{num_requests}")
        print(f"   📈 Success Rate: {success_rate:.1f}%")
        print(f"   🧊 Avg ICE Servers: {avg_ice:.1f}")
        print(f"   ⏱️  Response Times:")
        print(f"      Avg: {avg_time:.3f}s")
        print(f"      Min: {min_time:.3f}s")
        print(f"      Max: {max_time:.3f}s")
        
        if success_rate >= 98 and avg_time < 0.1:
            self.log("TURN Credentials Stress", "pass",
                    f"{success_rate:.1f}% success, {avg_time:.3f}s avg - EXCELLENT!")
        elif success_rate >= 95 and avg_time < 0.5:
            self.log("TURN Credentials Stress", "pass",
                    f"{success_rate:.1f}% success, {avg_time:.3f}s avg")
        elif success_rate >= 90:
            self.log("TURN Credentials Stress", "warn",
                    f"{success_rate:.1f}% success, {avg_time:.3f}s avg")
        else:
            self.log("TURN Credentials Stress", "fail",
                    f"{success_rate:.1f}% success")
    
    def test_concurrent_turn_requests(self, num_concurrent=20):
        """Test concurrent TURN credential requests"""
        print("\n" + "="*70)
        print(f"🔥 TEST 2: Concurrent TURN Requests")
        print(f"   {num_concurrent} simultaneous requests")
        print("="*70)
        
        def make_turn_request(session_num):
            """Make TURN request with authenticated session"""
            session = self.create_authenticated_session('client01')
            if not session:
                return {'success': False, 'error': 'Auth failed'}
            
            try:
                start = time.time()
                r = session.get(f"{self.base_url}/api/turn-credentials", timeout=10)
                elapsed = time.time() - start
                
                if r.status_code == 200:
                    data = r.json()
                    return {
                        'success': True,
                        'time': elapsed,
                        'ice_servers': len(data.get('ice_servers', []))
                    }
                else:
                    return {'success': False, 'status': r.status_code}
            except Exception as e:
                return {'success': False, 'error': str(e)}
        
        print(f"Starting {num_concurrent} concurrent TURN requests...")
        start_time = time.time()
        
        with ThreadPoolExecutor(max_workers=num_concurrent) as executor:
            futures = [executor.submit(make_turn_request, i) 
                      for i in range(num_concurrent)]
            results = [f.result() for f in futures]
        
        total_time = time.time() - start_time
        
        successful = sum(1 for r in results if r.get('success'))
        failed = num_concurrent - successful
        
        times = [r['time'] for r in results if r.get('success')]
        avg_time = sum(times) / len(times) if times else 0
        
        print(f"\n📊 Results:")
        print(f"   ✅ Successful: {successful}/{num_concurrent}")
        print(f"   ❌ Failed: {failed}/{num_concurrent}")
        print(f"   ⏱️  Total Time: {total_time:.2f}s")
        print(f"   ⏱️  Avg Response: {avg_time:.3f}s")
        
        success_rate = (successful / num_concurrent) * 100
        
        if success_rate >= 95 and total_time < 5:
            self.log("Concurrent TURN Requests", "pass",
                    f"{successful}/{num_concurrent} successful in {total_time:.2f}s")
        elif success_rate >= 80:
            self.log("Concurrent TURN Requests", "warn",
                    f"{successful}/{num_concurrent} successful")
        else:
            self.log("Concurrent TURN Requests", "fail",
                    f"Only {successful}/{num_concurrent} successful")
    
    def test_rapid_authentication_cycles(self, cycles=30):
        """Test rapid login/logout cycles"""
        print("\n" + "="*70)
        print(f"🔄 TEST 3: Rapid Authentication Cycles")
        print(f"   {cycles} login/request/logout cycles")
        print("="*70)
        
        print(f"Testing {cycles} rapid auth cycles...")
        
        success_count = 0
        times = []
        
        for i in range(cycles):
            try:
                start = time.time()
                
                # Login
                session = self.create_authenticated_session('client01')
                if not session:
                    continue
                
                # Make TURN request
                r = session.get(f"{self.base_url}/api/turn-credentials", timeout=5)
                
                if r.status_code == 200:
                    success_count += 1
                    elapsed = time.time() - start
                    times.append(elapsed)
                
                # Close session
                session.close()
                
                if (i + 1) % 10 == 0:
                    current_rate = (success_count / (i + 1)) * 100
                    print(f"   Progress: {i + 1}/{cycles} ({current_rate:.0f}% success)")
                
            except Exception as e:
                pass
        
        success_rate = (success_count / cycles) * 100
        avg_time = sum(times) / len(times) if times else 0
        
        print(f"\n📊 Results:")
        print(f"   ✅ Successful: {success_count}/{cycles}")
        print(f"   📈 Success Rate: {success_rate:.1f}%")
        print(f"   ⏱️  Avg Cycle Time: {avg_time:.3f}s")
        
        if success_rate >= 90:
            self.log("Rapid Auth Cycles", "pass",
                    f"{success_rate:.0f}% success")
        elif success_rate >= 75:
            self.log("Rapid Auth Cycles", "warn",
                    f"{success_rate:.0f}% success")
        else:
            self.log("Rapid Auth Cycles", "fail",
                    f"{success_rate:.0f}% success")
    
    def test_session_persistence(self):
        """Test session persistence across requests"""
        print("\n" + "="*70)
        print("🔒 TEST 4: Session Persistence")
        print("="*70)
        
        print("Creating session and testing persistence...")
        
        session = self.create_authenticated_session('client01')
        if not session:
            self.log("Session Persistence", "fail", "Cannot authenticate")
            return
        
        # Make multiple requests with same session
        success_count = 0
        
        for i in range(10):
            try:
                r = session.get(f"{self.base_url}/api/turn-credentials", timeout=5)
                if r.status_code == 200:
                    success_count += 1
                time.sleep(0.5)
            except:
                pass
        
        print(f"\n📊 Results:")
        print(f"   ✅ Successful requests: {success_count}/10")
        
        if success_count == 10:
            self.log("Session Persistence", "pass",
                    "All 10 requests successful")
        elif success_count >= 8:
            self.log("Session Persistence", "warn",
                    f"{success_count}/10 requests successful")
        else:
            self.log("Session Persistence", "fail",
                    f"Only {success_count}/10 requests successful")
    
    def test_multi_user_concurrent(self):
        """Test both users (client01 and admin01) making concurrent requests"""
        print("\n" + "="*70)
        print("👥 TEST 5: Multi-User Concurrent Access")
        print("="*70)
        
        def user_stress(user_id, num_requests=20):
            """Simulate user making multiple requests"""
            session = self.create_authenticated_session(user_id)
            if not session:
                return {'user': user_id, 'success': 0, 'total': num_requests}
            
            success = 0
            for _ in range(num_requests):
                try:
                    r = session.get(f"{self.base_url}/api/turn-credentials", timeout=5)
                    if r.status_code == 200:
                        success += 1
                    time.sleep(0.1)
                except:
                    pass
            
            return {'user': user_id, 'success': success, 'total': num_requests}
        
        print("Both users making 20 TURN requests simultaneously...")
        
        with ThreadPoolExecutor(max_workers=2) as executor:
            future1 = executor.submit(user_stress, 'client01', 20)
            future2 = executor.submit(user_stress, 'admin01', 20)
            
            result1 = future1.result()
            result2 = future2.result()
        
        total_success = result1['success'] + result2['success']
        total_requests = result1['total'] + result2['total']
        
        print(f"\n📊 Results:")
        print(f"   client01: {result1['success']}/{result1['total']} successful")
        print(f"   admin01: {result2['success']}/{result2['total']} successful")
        print(f"   Total: {total_success}/{total_requests} successful")
        
        success_rate = (total_success / total_requests) * 100
        
        if success_rate >= 95:
            self.log("Multi-User Concurrent", "pass",
                    f"{success_rate:.0f}% success rate")
        elif success_rate >= 80:
            self.log("Multi-User Concurrent", "warn",
                    f"{success_rate:.0f}% success rate")
        else:
            self.log("Multi-User Concurrent", "fail",
                    f"{success_rate:.0f}% success rate")
    
    def run_all_tests(self):
        """Run all stress tests"""
        print("\n" + "="*70)
        print("🔥 KAA HO - REAL CALLING SYSTEM STRESS TESTS")
        print("   Testing with actual authenticated users")
        print("="*70)
        print(f"\nStarted: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"Server: {self.base_url}")
        print(f"Test Users: client01, admin01\n")
        
        # Run all tests
        self.test_turn_credentials_stress(200)
        self.test_concurrent_turn_requests(20)
        self.test_rapid_authentication_cycles(30)
        self.test_session_persistence()
        self.test_multi_user_concurrent()
        
        # Print summary
        self.print_summary()
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "="*70)
        print("📊 FINAL STRESS TEST SUMMARY")
        print("="*70)
        
        passed = sum(1 for r in self.results if r['status'] == 'pass')
        warnings = sum(1 for r in self.results if r['status'] == 'warn')
        failed = sum(1 for r in self.results if r['status'] == 'fail')
        total = len(self.results)
        
        print(f"\n✅ Passed:   {passed}/{total}")
        print(f"⚠️  Warnings: {warnings}/{total}")
        print(f"❌ Failed:   {failed}/{total}")
        
        if failed == 0 and warnings == 0:
            print("\n🎉 PERFECT! Your calling system is production-ready!")
            print("✅ Excellent performance under stress")
            print("✅ Ready for heavy load and demanding conditions")
        elif failed == 0:
            print("\n✅ EXCELLENT! System performs very well!")
            print("⚠️  Minor optimizations possible")
        else:
            print("\n⚠️  System needs some optimization")
        
        print("\n" + "="*70)
        print("📋 DETAILED RESULTS")
        print("="*70)
        
        for result in self.results:
            emoji = "✅" if result['status'] == "pass" else "⚠️" if result['status'] == "warn" else "❌"
            print(f"\n[{result['time']}] {emoji} {result['test']}")
            if result['details']:
                print(f"   {result['details']}")
        
        print("\n" + "="*70)
        print("🎬 NEXT: MANUAL NETWORK STRESS TESTING")
        print("="*70)
        print("""
Your automated tests are complete! Now test real calling:

1. 🎥 Manual Call Test:
   • Open 2 browser windows
   • Login as client01 and admin01
   • Make actual voice/video calls
   • Test under network stress (see guide)

2. 🌐 Network Conditions:
   • Use Chrome DevTools throttling
   • Test WiFi → Mobile switching
   • Simulate poor connectivity
   • Test reconnection behavior

3. 📊 Monitor During Calls:
   • Browser console (F12)
   • Network tab
   • ICE connection states
   • Video/audio quality

The Manual Network Stress Testing Guide has detailed scenarios!
        """)
        print("="*70)


if __name__ == "__main__":
    tester = RealCallingStressTester()
    tester.run_all_tests()