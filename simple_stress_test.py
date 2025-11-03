"""
KAA HO - Simple & Reliable Stress Tests
Focus on HTTP/REST API stress testing and TURN server reliability
"""

import requests
import time
import threading
import random
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed

class SimpleStressTester:
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
    
    def test_concurrent_logins(self, num_users=20):
        """Test concurrent user logins"""
        print("\n" + "="*70)
        print(f"👥 TEST 1: Concurrent Logins ({num_users} users)")
        print("="*70)
        
        def login_user(user_id):
            try:
                session = requests.Session()
                start = time.time()
                
                r = session.post(
                    f"{self.base_url}/api/login",
                    json={'user_id': f'user{user_id}', 'password': 'test123'},
                    timeout=10
                )
                
                elapsed = time.time() - start
                
                return {
                    'success': r.status_code == 200,
                    'time': elapsed,
                    'status': r.status_code
                }
            except Exception as e:
                return {'success': False, 'error': str(e)}
        
        print(f"Attempting {num_users} simultaneous logins...")
        
        start_time = time.time()
        
        with ThreadPoolExecutor(max_workers=10) as executor:
            futures = [executor.submit(login_user, i) for i in range(num_users)]
            results = [f.result() for f in as_completed(futures)]
        
        total_time = time.time() - start_time
        
        successful = sum(1 for r in results if r.get('success'))
        failed = num_users - successful
        
        if successful > 0:
            avg_time = sum(r.get('time', 0) for r in results if r.get('success')) / successful
        else:
            avg_time = 0
        
        print(f"\n📊 Results:")
        print(f"   ✅ Successful: {successful}/{num_users}")
        print(f"   ❌ Failed: {failed}/{num_users}")
        print(f"   ⏱️  Average time: {avg_time:.2f}s")
        print(f"   ⏱️  Total time: {total_time:.2f}s")
        
        success_rate = (successful / num_users) * 100
        
        if success_rate >= 95:
            self.log("Concurrent Logins", "pass", 
                    f"{success_rate:.0f}% success ({successful}/{num_users})")
        elif success_rate >= 80:
            self.log("Concurrent Logins", "warn",
                    f"{success_rate:.0f}% success ({successful}/{num_users})")
        else:
            self.log("Concurrent Logins", "fail",
                    f"{success_rate:.0f}% success ({successful}/{num_users})")
    
    def test_turn_server_stress(self, num_requests=100):
        """Stress test TURN credential endpoint"""
        print("\n" + "="*70)
        print(f"🧊 TEST 2: TURN Server Stress ({num_requests} requests)")
        print("="*70)
        
        # Login first
        session = requests.Session()
        r = session.post(f"{self.base_url}/api/login",
            json={'user_id': 'client01', 'password': 'test123'})
        
        if r.status_code != 200:
            self.log("TURN Stress Test", "fail", "Cannot login")
            return
        
        print(f"Making {num_requests} TURN credential requests...")
        
        success_count = 0
        fail_count = 0
        times = []
        
        for i in range(num_requests):
            try:
                start = time.time()
                r = session.get(f"{self.base_url}/api/turn-credentials", timeout=5)
                elapsed = time.time() - start
                
                if r.status_code == 200:
                    data = r.json()
                    if 'ice_servers' in data and len(data['ice_servers']) > 0:
                        success_count += 1
                        times.append(elapsed)
                    else:
                        fail_count += 1
                else:
                    fail_count += 1
                
                # Progress indicator
                if (i + 1) % 20 == 0:
                    current_rate = (success_count / (i + 1)) * 100
                    avg_time = sum(times) / len(times) if times else 0
                    print(f"   Progress: {i + 1}/{num_requests} "
                          f"({current_rate:.0f}% success, avg {avg_time:.3f}s)")
                
            except requests.Timeout:
                fail_count += 1
            except Exception as e:
                fail_count += 1
        
        success_rate = (success_count / num_requests) * 100
        avg_time = sum(times) / len(times) if times else 0
        max_time = max(times) if times else 0
        min_time = min(times) if times else 0
        
        print(f"\n📊 Results:")
        print(f"   ✅ Successful: {success_count}/{num_requests}")
        print(f"   ❌ Failed: {fail_count}/{num_requests}")
        print(f"   📈 Success Rate: {success_rate:.1f}%")
        print(f"   ⏱️  Avg Response: {avg_time:.3f}s")
        print(f"   ⏱️  Min Response: {min_time:.3f}s")
        print(f"   ⏱️  Max Response: {max_time:.3f}s")
        
        if success_rate >= 98 and avg_time < 0.5:
            self.log("TURN Server Stress", "pass",
                    f"{success_rate:.1f}% success, {avg_time:.3f}s avg")
        elif success_rate >= 90:
            self.log("TURN Server Stress", "warn",
                    f"{success_rate:.1f}% success, {avg_time:.3f}s avg")
        else:
            self.log("TURN Server Stress", "fail",
                    f"{success_rate:.1f}% success, {avg_time:.3f}s avg")
    
    def test_rapid_session_creation(self, cycles=50):
        """Test rapid session creation and destruction"""
        print("\n" + "="*70)
        print(f"🔄 TEST 3: Rapid Session Cycles ({cycles} cycles)")
        print("="*70)
        
        print(f"Creating and destroying {cycles} sessions rapidly...")
        
        success_count = 0
        fail_count = 0
        times = []
        
        for i in range(cycles):
            try:
                start = time.time()
                
                # Create session and login
                session = requests.Session()
                r = session.post(
                    f"{self.base_url}/api/login",
                    json={'user_id': 'client01', 'password': 'test123'},
                    timeout=5
                )
                
                if r.status_code == 200:
                    # Make a request
                    session.get(f"{self.base_url}/api/turn-credentials", timeout=5)
                    
                    # Logout/destroy
                    session.close()
                    
                    elapsed = time.time() - start
                    times.append(elapsed)
                    success_count += 1
                else:
                    fail_count += 1
                
                # Small random delay
                time.sleep(random.uniform(0.05, 0.15))
                
                if (i + 1) % 10 == 0:
                    current_rate = (success_count / (i + 1)) * 100
                    print(f"   Progress: {i + 1}/{cycles} ({current_rate:.0f}% success)")
                
            except Exception as e:
                fail_count += 1
        
        success_rate = (success_count / cycles) * 100
        avg_time = sum(times) / len(times) if times else 0
        
        print(f"\n📊 Results:")
        print(f"   ✅ Successful: {success_count}/{cycles}")
        print(f"   ❌ Failed: {fail_count}/{cycles}")
        print(f"   📈 Success Rate: {success_rate:.1f}%")
        print(f"   ⏱️  Avg Cycle Time: {avg_time:.3f}s")
        
        if success_rate >= 95:
            self.log("Rapid Session Cycles", "pass",
                    f"{success_rate:.0f}% success")
        elif success_rate >= 80:
            self.log("Rapid Session Cycles", "warn",
                    f"{success_rate:.0f}% success")
        else:
            self.log("Rapid Session Cycles", "fail",
                    f"{success_rate:.0f}% success")
    
    def test_api_response_under_load(self):
        """Test API response times under concurrent load"""
        print("\n" + "="*70)
        print("⚡ TEST 4: API Response Under Load")
        print("="*70)
        
        # Login first
        session = requests.Session()
        session.post(f"{self.base_url}/api/login",
            json={'user_id': 'client01', 'password': 'test123'})
        
        endpoints = [
            '/api/turn-credentials',
            '/api/users',
            '/',
        ]
        
        def test_endpoint(endpoint, repeat=10):
            times = []
            success = 0
            
            for _ in range(repeat):
                try:
                    start = time.time()
                    r = session.get(f"{self.base_url}{endpoint}", timeout=10)
                    elapsed = time.time() - start
                    
                    if r.status_code == 200:
                        times.append(elapsed)
                        success += 1
                        
                except:
                    pass
            
            return {
                'endpoint': endpoint,
                'success': success,
                'total': repeat,
                'times': times
            }
        
        print("Testing endpoints under concurrent load...")
        
        with ThreadPoolExecutor(max_workers=5) as executor:
            futures = [
                executor.submit(test_endpoint, ep, 10) 
                for ep in endpoints
            ]
            results = [f.result() for f in as_completed(futures)]
        
        print(f"\n📊 Results by Endpoint:")
        
        all_passed = True
        
        for result in results:
            endpoint = result['endpoint']
            success = result['success']
            total = result['total']
            times = result['times']
            
            if times:
                avg_time = sum(times) / len(times)
                max_time = max(times)
                success_rate = (success / total) * 100
                
                print(f"\n   {endpoint}")
                print(f"      Success: {success}/{total} ({success_rate:.0f}%)")
                print(f"      Avg: {avg_time:.3f}s, Max: {max_time:.3f}s")
                
                if success_rate < 90 or avg_time > 2.0:
                    all_passed = False
            else:
                print(f"\n   {endpoint}")
                print(f"      ❌ All requests failed")
                all_passed = False
        
        if all_passed:
            self.log("API Load Test", "pass", "All endpoints responsive")
        else:
            self.log("API Load Test", "warn", "Some endpoints slow/failing")
    
    def test_connection_limit(self):
        """Test server connection limits"""
        print("\n" + "="*70)
        print("🔌 TEST 5: Connection Limit Test")
        print("="*70)
        
        print("Testing maximum concurrent connections...")
        
        sessions = []
        successful_connections = 0
        
        # Try to create many concurrent sessions
        for i in range(50):
            try:
                session = requests.Session()
                r = session.post(
                    f"{self.base_url}/api/login",
                    json={'user_id': f'user{i}', 'password': 'test123'},
                    timeout=5
                )
                
                if r.status_code == 200:
                    sessions.append(session)
                    successful_connections += 1
                
                if (i + 1) % 10 == 0:
                    print(f"   Created {i + 1} connections...")
                    
            except Exception as e:
                break
        
        print(f"\n📊 Results:")
        print(f"   ✅ Max Concurrent Connections: {successful_connections}")
        
        # Cleanup
        for session in sessions:
            try:
                session.close()
            except:
                pass
        
        if successful_connections >= 40:
            self.log("Connection Limit", "pass",
                    f"Supports {successful_connections} concurrent connections")
        elif successful_connections >= 20:
            self.log("Connection Limit", "warn",
                    f"Supports {successful_connections} concurrent connections")
        else:
            self.log("Connection Limit", "fail",
                    f"Only supports {successful_connections} concurrent connections")
    
    def run_all_tests(self):
        """Run all stress tests"""
        print("\n" + "="*70)
        print("🔥 KAA HO - SIMPLE STRESS TEST SUITE")
        print("   Reliable HTTP/REST API Testing")
        print("="*70)
        print(f"\nStarted: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"Server: {self.base_url}\n")
        
        # Run tests in order
        self.test_concurrent_logins(20)
        self.test_turn_server_stress(100)
        self.test_rapid_session_creation(50)
        self.test_api_response_under_load()
        self.test_connection_limit()
        
        # Print summary
        self.print_summary()
    
    def print_summary(self):
        """Print final summary"""
        print("\n" + "="*70)
        print("📊 FINAL TEST SUMMARY")
        print("="*70)
        
        passed = sum(1 for r in self.results if r['status'] == 'pass')
        warnings = sum(1 for r in self.results if r['status'] == 'warn')
        failed = sum(1 for r in self.results if r['status'] == 'fail')
        total = len(self.results)
        
        print(f"\n✅ Passed:   {passed}/{total}")
        print(f"⚠️  Warnings: {warnings}/{total}")
        print(f"❌ Failed:   {failed}/{total}")
        
        success_rate = ((passed + warnings) / total * 100) if total > 0 else 0
        
        print(f"\n📈 Overall Success Rate: {success_rate:.0f}%")
        
        if failed == 0 and warnings == 0:
            print("\n🎉 EXCELLENT! System handles stress perfectly!")
            print("✅ Ready for production under heavy load")
        elif failed == 0:
            print("\n✅ GOOD! System is stable with minor issues")
            print("⚠️  Consider optimization for better performance")
        elif failed <= 2:
            print("\n⚠️  ACCEPTABLE! System mostly stable")
            print("🔧 Some areas need attention")
        else:
            print("\n❌ NEEDS WORK! Multiple critical issues")
            print("🔧 Review and fix failing tests")
        
        print("\n" + "="*70)
        print("📋 DETAILED RESULTS")
        print("="*70)
        
        for result in self.results:
            emoji = "✅" if result['status'] == "pass" else "⚠️" if result['status'] == "warn" else "❌"
            print(f"\n[{result['time']}] {emoji} {result['test']}")
            if result['details']:
                print(f"   {result['details']}")
        
        print("\n" + "="*70)
        print("🎬 NEXT STEPS:")
        print("="*70)
        print("""
1. ✅ Review test results above
2. 🌐 Run manual network tests (see guide)
3. 🎥 Test actual video calls between two browsers
4. 📊 Monitor browser console during calls
5. 🚀 Test on real poor networks

Manual Testing Guide is ready in the artifacts!
        """)
        print("="*70)


if __name__ == "__main__":
    tester = SimpleStressTester()
    tester.run_all_tests()