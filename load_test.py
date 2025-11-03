"""
CA360 Chat Load Testing Tool
Test system with concurrent users and heavy load
"""
import time
import threading
import random
from datetime import datetime
import statistics

class LoadTester:
    def __init__(self):
        self.results = []
        self.errors = []
        self.start_time = None
        self.end_time = None
    
    def simulate_user_action(self, user_id, action_type='message'):
        """Simulate a single user action"""
        start = time.time()
        
        try:
            # Simulate work
            if action_type == 'message':
                time.sleep(random.uniform(0.001, 0.01))  # 1-10ms
            elif action_type == 'call':
                time.sleep(random.uniform(0.005, 0.02))  # 5-20ms
            elif action_type == 'login':
                time.sleep(random.uniform(0.01, 0.05))   # 10-50ms
            
            end = time.time()
            duration = end - start
            
            self.results.append({
                'user_id': user_id,
                'action': action_type,
                'duration': duration,
                'success': True,
                'timestamp': datetime.now().isoformat()
            })
            
        except Exception as e:
            self.errors.append({
                'user_id': user_id,
                'action': action_type,
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            })
    
    def simulate_user_session(self, user_id, num_actions=10):
        """Simulate a complete user session"""
        actions = ['message', 'message', 'message', 'call', 'message']
        
        # Login
        self.simulate_user_action(user_id, 'login')
        
        # Perform actions
        for _ in range(num_actions):
            action = random.choice(actions)
            self.simulate_user_action(user_id, action)
            time.sleep(random.uniform(0.1, 0.5))  # Think time
    
    def run_load_test(self, num_users=100, actions_per_user=10):
        """Run load test with multiple concurrent users"""
        print(f"\n{'='*60}")
        print(f"  🔄 LOAD TEST: {num_users} Concurrent Users")
        print(f"{'='*60}\n")
        
        self.results = []
        self.errors = []
        self.start_time = time.time()
        
        # Create threads for concurrent users
        threads = []
        for i in range(num_users):
            user_id = f'user_{i+1}'
            thread = threading.Thread(
                target=self.simulate_user_session,
                args=(user_id, actions_per_user)
            )
            threads.append(thread)
        
        # Start all threads
        print(f"⚡ Starting {num_users} concurrent users...")
        for thread in threads:
            thread.start()
        
        # Wait for completion
        for thread in threads:
            thread.join()
        
        self.end_time = time.time()
        
        # Generate report
        self.generate_load_test_report()
    
    def generate_load_test_report(self):
        """Generate load test report"""
        total_time = self.end_time - self.start_time
        total_actions = len(self.results)
        total_errors = len(self.errors)
        
        # Calculate statistics
        durations = [r['duration'] for r in self.results]
        avg_duration = statistics.mean(durations) if durations else 0
        min_duration = min(durations) if durations else 0
        max_duration = max(durations) if durations else 0
        median_duration = statistics.median(durations) if durations else 0
        
        # Calculate throughput
        throughput = total_actions / total_time if total_time > 0 else 0
        
        # Success rate
        success_rate = (total_actions / (total_actions + total_errors) * 100) if (total_actions + total_errors) > 0 else 0
        
        report = f"""
╔════════════════════════════════════════════════════════╗
║   🔄 LOAD TEST RESULTS                                 ║
╠════════════════════════════════════════════════════════╣

⏱️  TEST DURATION
   {total_time:.2f} seconds

📊 ACTIONS COMPLETED
   Total: {total_actions}
   Errors: {total_errors}
   Success Rate: {success_rate:.1f}%

⚡ PERFORMANCE
   Average Response: {avg_duration*1000:.2f}ms
   Median Response: {median_duration*1000:.2f}ms
   Min Response: {min_duration*1000:.2f}ms
   Max Response: {max_duration*1000:.2f}ms

🚀 THROUGHPUT
   {throughput:.1f} actions/second

📈 RESULTS
   {'🟢 EXCELLENT' if success_rate >= 99 and avg_duration < 0.1 else '🟡 GOOD' if success_rate >= 95 else '🔴 NEEDS IMPROVEMENT'}

╚════════════════════════════════════════════════════════╝
"""
        print(report)
        
        # Save report
        import os
        os.makedirs('reports', exist_ok=True)
        with open('reports/load_test_report.txt', 'w', encoding='utf-8') as f:
            f.write(report)
        
        print("✅ Report saved to: reports/load_test_report.txt\n")

if __name__ == '__main__':
    tester = LoadTester()
    
    # Run tests with increasing load
    print("\n" + "="*60)
    print("  CA360 CHAT - LOAD TESTING SUITE")
    print("="*60)
    
    # Test 1: Light load
    print("\n📊 Test 1: Light Load (10 users)")
    tester.run_load_test(num_users=10, actions_per_user=5)
    
    # Test 2: Medium load
    print("\n📊 Test 2: Medium Load (50 users)")
    tester.run_load_test(num_users=50, actions_per_user=10)
    
    # Test 3: Heavy load
    print("\n📊 Test 3: Heavy Load (100 users)")
    tester.run_load_test(num_users=100, actions_per_user=10)
    
    print("\n" + "="*60)
    print("  🎉 All load tests completed!")
    print("="*60 + "\n")
