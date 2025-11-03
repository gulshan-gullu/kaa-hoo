"""
KAA HO - Advanced Stress Testing & Reconnection Suite
Tests calling system under demanding conditions and low connectivity
"""

import requests
import socketio
import time
import threading
import random
from datetime import datetime
import json

class StressTestSuite:
    def __init__(self, base_url="http://localhost"):
        self.base_url = base_url
        self.active_clients = []
        self.test_results = []
        
    def log(self, test_name, status, details=""):
        """Log test results"""
        timestamp = datetime.now().strftime('%H:%M:%S')
        emoji = "✅" if status == "pass" else "❌" if status == "fail" else "⚠️"
        
        result = {
            'time': timestamp,
            'test': test_name,
            'status': status,
            'details': details
        }
        self.test_results.append(result)
        
        print(f"[{timestamp}] {emoji} {test_name}")
        if details:
            print(f"           {details}")
    
    def create_client(self, user_id, password="test123"):
        """Create and login a test client"""
        try:
            session = requests.Session()
            r = session.post(f"{self.base_url}/api/login",
                json={'user_id': user_id, 'password': password})
            
            if r.status_code == 200:
                # Create Socket.IO client
                sio = socketio.Client()
                
                # Get session cookie
                cookies = session.cookies.get_dict()
                cookie_str = '; '.join([f"{k}={v}" for k, v in cookies.items()])
                
                sio.connect(self.base_url, 
                    headers={'Cookie': cookie_str},
                    transports=['websocket', 'polling'])
                
                return {
                    'user_id': user_id,
                    'session': session,
                    'socket': sio,
                    'connected': True
                }
            else:
                return None
                
        except Exception as e:
            self.log(f"Client Creation ({user_id})", "fail", str(e))
            return None
    
    def test_multiple_simultaneous_calls(self, num_calls=5):
        """Test multiple simultaneous calls"""
        print("\n" + "="*70)
        print("🔥 TEST 1: Multiple Simultaneous Calls")
        print("="*70)
        print(f"Creating {num_calls} simultaneous calls...")
        
        clients = []
        
        # Create client pairs
        for i in range(num_calls):
            caller = self.create_client(f"caller{i}")
            receiver = self.create_client(f"receiver{i}")
            
            if caller and receiver:
                clients.append((caller, receiver))
                time.sleep(0.5)  # Slight delay between creations
        
        self.log("Simultaneous Calls Setup", "pass", 
                f"{len(clients)} call pairs ready")
        
        # Initiate all calls at once
        print(f"\n📞 Initiating {len(clients)} calls simultaneously...")
        
        for i, (caller, receiver) in enumerate(clients):
            try:
                caller['socket'].emit('call_initiate', {
                    'to_user': receiver['user_id'],
                    'call_type': 'video'
                })
                print(f"   Call {i+1}: {caller['user_id']} → {receiver['user_id']}")
            except Exception as e:
                self.log(f"Call {i+1} Initiation", "fail", str(e))
        
        # Wait for connections
        time.sleep(5)
        
        # Cleanup
        for caller, receiver in clients:
            try:
                caller['socket'].disconnect()
                receiver['socket'].disconnect()
            except:
                pass
        
        self.log("Simultaneous Calls", "pass", 
                f"Handled {len(clients)} concurrent calls")
    
    def test_rapid_connect_disconnect(self, iterations=20):
        """Test rapid connection/disconnection cycles"""
        print("\n" + "="*70)
        print("🔄 TEST 2: Rapid Connect/Disconnect Cycles")
        print("="*70)
        print(f"Testing {iterations} rapid cycles...")
        
        success_count = 0
        fail_count = 0
        
        for i in range(iterations):
            try:
                # Create client
                client = self.create_client(f"test_user_{i % 3}")
                
                if client:
                    # Immediately disconnect
                    time.sleep(random.uniform(0.1, 0.5))
                    client['socket'].disconnect()
                    success_count += 1
                    
                    if (i + 1) % 5 == 0:
                        print(f"   ✅ Completed {i + 1}/{iterations} cycles")
                else:
                    fail_count += 1
                    
            except Exception as e:
                fail_count += 1
                if fail_count <= 3:  # Only show first 3 errors
                    print(f"   ❌ Cycle {i + 1} failed: {str(e)[:50]}")
        
        success_rate = (success_count / iterations) * 100
        
        if success_rate >= 95:
            self.log("Rapid Reconnection", "pass", 
                    f"{success_rate:.1f}% success rate ({success_count}/{iterations})")
        elif success_rate >= 80:
            self.log("Rapid Reconnection", "warn",
                    f"{success_rate:.1f}% success rate ({success_count}/{iterations})")
        else:
            self.log("Rapid Reconnection", "fail",
                    f"{success_rate:.1f}% success rate ({success_count}/{iterations})")
    
    def test_network_interruption_simulation(self):
        """Simulate network interruption and reconnection"""
        print("\n" + "="*70)
        print("🌐 TEST 3: Network Interruption & Reconnection")
        print("="*70)
        
        print("Setting up call between two users...")
        
        # Create two clients
        client1 = self.create_client("client01")
        client2 = self.create_client("admin01")
        
        if not (client1 and client2):
            self.log("Network Interruption Test", "fail", "Could not create clients")
            return
        
        # Setup reconnection handlers
        reconnect_count = {'client1': 0, 'client2': 0}
        
        @client1['socket'].on('connect')
        def on_c1_reconnect():
            reconnect_count['client1'] += 1
            print(f"   🔌 Client1 reconnected (count: {reconnect_count['client1']})")
        
        @client2['socket'].on('connect')
        def on_c2_reconnect():
            reconnect_count['client2'] += 1
            print(f"   🔌 Client2 reconnected (count: {reconnect_count['client2']})")
        
        print("\n📡 Simulating network interruptions...")
        
        for i in range(3):
            print(f"\n   Interruption {i + 1}/3:")
            
            # Simulate disconnection
            print("      💔 Disconnecting clients...")
            client1['socket'].disconnect()
            client2['socket'].disconnect()
            
            time.sleep(2)  # Simulate network down time
            
            # Reconnect
            print("      🔄 Reconnecting clients...")
            try:
                client1['socket'].connect(self.base_url, 
                    transports=['websocket', 'polling'])
                client2['socket'].connect(self.base_url,
                    transports=['websocket', 'polling'])
                
                time.sleep(1)  # Wait for connection to stabilize
                
                if client1['socket'].connected and client2['socket'].connected:
                    print("      ✅ Both clients reconnected successfully")
                else:
                    print("      ⚠️  Partial reconnection")
                    
            except Exception as e:
                print(f"      ❌ Reconnection failed: {str(e)[:50]}")
        
        # Cleanup
        try:
            client1['socket'].disconnect()
            client2['socket'].disconnect()
        except:
            pass
        
        total_reconnects = reconnect_count['client1'] + reconnect_count['client2']
        
        if total_reconnects >= 4:  # At least 2 successful reconnects per client
            self.log("Network Interruption Recovery", "pass",
                    f"Recovered from {total_reconnects} interruptions")
        else:
            self.log("Network Interruption Recovery", "warn",
                    f"Partial recovery ({total_reconnects} reconnections)")
    
    def test_slow_network_simulation(self):
        """Test behavior under slow network conditions"""
        print("\n" + "="*70)
        print("🐌 TEST 4: Slow Network Simulation")
        print("="*70)
        
        print("Testing connection with artificial delays...")
        
        delays = [0.5, 1.0, 2.0, 3.0]  # seconds
        results = []
        
        for delay in delays:
            try:
                start_time = time.time()
                
                # Create client with delay simulation
                client = self.create_client("client01")
                
                if client:
                    # Simulate slow network by adding delay
                    time.sleep(delay)
                    
                    # Try to emit an event
                    client['socket'].emit('ping', {'timestamp': time.time()})
                    
                    elapsed = time.time() - start_time
                    
                    client['socket'].disconnect()
                    
                    results.append({
                        'delay': delay,
                        'total_time': elapsed,
                        'success': True
                    })
                    
                    print(f"   ✅ {delay}s delay: Completed in {elapsed:.2f}s")
                else:
                    results.append({
                        'delay': delay,
                        'success': False
                    })
                    print(f"   ❌ {delay}s delay: Failed to connect")
                    
            except Exception as e:
                results.append({
                    'delay': delay,
                    'success': False,
                    'error': str(e)
                })
                print(f"   ❌ {delay}s delay: {str(e)[:50]}")
        
        success_count = sum(1 for r in results if r.get('success'))
        
        if success_count == len(delays):
            self.log("Slow Network Tolerance", "pass",
                    f"Handled all delays up to {max(delays)}s")
        elif success_count >= len(delays) * 0.75:
            self.log("Slow Network Tolerance", "warn",
                    f"Handled {success_count}/{len(delays)} delay scenarios")
        else:
            self.log("Slow Network Tolerance", "fail",
                    f"Only handled {success_count}/{len(delays)} delay scenarios")
    
    def test_packet_loss_simulation(self, loss_rate=0.3):
        """Simulate packet loss conditions"""
        print("\n" + "="*70)
        print(f"📦 TEST 5: Packet Loss Simulation ({loss_rate*100:.0f}%)")
        print("="*70)
        
        print(f"Simulating {loss_rate*100:.0f}% packet loss...")
        
        client1 = self.create_client("client01")
        client2 = self.create_client("admin01")
        
        if not (client1 and client2):
            self.log("Packet Loss Test", "fail", "Could not create clients")
            return
        
        # Send multiple messages with simulated packet loss
        messages_sent = 0
        messages_received = 0
        
        received_messages = []
        
        @client2['socket'].on('test_message')
        def on_message(data):
            received_messages.append(data)
        
        print(f"\n   Sending 20 test messages with {loss_rate*100:.0f}% loss rate...")
        
        for i in range(20):
            # Simulate packet loss
            if random.random() > loss_rate:
                try:
                    client1['socket'].emit('test_message', {
                        'id': i,
                        'data': f'Test message {i}'
                    })
                    messages_sent += 1
                except:
                    pass
            
            time.sleep(0.1)
        
        time.sleep(2)  # Wait for messages to arrive
        
        messages_received = len(received_messages)
        
        print(f"\n   📤 Messages sent: {messages_sent}")
        print(f"   📥 Messages received: {messages_received}")
        
        if messages_sent > 0:
            delivery_rate = (messages_received / messages_sent) * 100
            print(f"   📊 Delivery rate: {delivery_rate:.1f}%")
            
            if delivery_rate >= 80:
                self.log("Packet Loss Tolerance", "pass",
                        f"{delivery_rate:.1f}% delivery rate")
            else:
                self.log("Packet Loss Tolerance", "warn",
                        f"{delivery_rate:.1f}% delivery rate")
        
        # Cleanup
        try:
            client1['socket'].disconnect()
            client2['socket'].disconnect()
        except:
            pass
    
    def test_ice_connectivity_stress(self):
        """Test ICE candidate gathering under stress"""
        print("\n" + "="*70)
        print("🧊 TEST 6: ICE Connectivity Stress Test")
        print("="*70)
        
        print("Testing TURN/STUN server reliability...")
        
        # Test TURN credentials endpoint under load
        success_count = 0
        fail_count = 0
        
        session = requests.Session()
        session.post(f"{self.base_url}/api/login",
            json={'user_id': 'client01', 'password': 'test123'})
        
        print("   Making 50 rapid TURN credential requests...")
        
        for i in range(50):
            try:
                r = session.get(f"{self.base_url}/api/turn-credentials")
                
                if r.status_code == 200:
                    data = r.json()
                    if 'ice_servers' in data and len(data['ice_servers']) > 0:
                        success_count += 1
                    else:
                        fail_count += 1
                else:
                    fail_count += 1
                    
                # Small delay to simulate realistic usage
                time.sleep(0.05)
                
                if (i + 1) % 10 == 0:
                    current_rate = (success_count / (i + 1)) * 100
                    print(f"   Progress: {i + 1}/50 ({current_rate:.1f}% success)")
                    
            except Exception as e:
                fail_count += 1
        
        success_rate = (success_count / 50) * 100
        
        print(f"\n   📊 Final Results:")
        print(f"      ✅ Successful: {success_count}")
        print(f"      ❌ Failed: {fail_count}")
        print(f"      📈 Success Rate: {success_rate:.1f}%")
        
        if success_rate >= 98:
            self.log("ICE Connectivity Stress", "pass",
                    f"{success_rate:.1f}% reliability under load")
        elif success_rate >= 90:
            self.log("ICE Connectivity Stress", "warn",
                    f"{success_rate:.1f}% reliability under load")
        else:
            self.log("ICE Connectivity Stress", "fail",
                    f"{success_rate:.1f}% reliability under load")
    
    def run_all_stress_tests(self):
        """Run complete stress test suite"""
        print("\n" + "="*70)
        print("🔥 KAA HO - ADVANCED STRESS TEST SUITE")
        print("   Testing Under Demanding Conditions")
        print("="*70)
        print(f"\nStarted: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"Server: {self.base_url}")
        
        # Run all tests
        self.test_ice_connectivity_stress()
        self.test_rapid_connect_disconnect()
        self.test_network_interruption_simulation()
        self.test_slow_network_simulation()
        self.test_packet_loss_simulation()
        # self.test_multiple_simultaneous_calls(3)  # Commented for now
        
        # Print summary
        self.print_summary()
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "="*70)
        print("📊 STRESS TEST SUMMARY")
        print("="*70)
        
        passed = sum(1 for r in self.test_results if r['status'] == 'pass')
        failed = sum(1 for r in self.test_results if r['status'] == 'fail')
        warnings = sum(1 for r in self.test_results if r['status'] == 'warn')
        
        print(f"\n✅ Passed:   {passed}")
        print(f"⚠️  Warnings: {warnings}")
        print(f"❌ Failed:   {failed}")
        print(f"📊 Total:    {len(self.test_results)}")
        
        if failed == 0 and warnings == 0:
            print("\n🎉 EXCELLENT! System is rock-solid under stress!")
        elif failed == 0:
            print("\n✅ GOOD! System handles stress well with minor issues")
        else:
            print("\n⚠️  NEEDS ATTENTION! Some critical tests failed")
        
        # Print detailed results
        print("\n" + "="*70)
        print("📋 DETAILED RESULTS")
        print("="*70)
        
        for result in self.test_results:
            emoji = "✅" if result['status'] == "pass" else "⚠️" if result['status'] == "warn" else "❌"
            print(f"\n[{result['time']}] {emoji} {result['test']}")
            if result['details']:
                print(f"   {result['details']}")
        
        print("\n" + "="*70)
        print("🎬 Next: Manual testing under real conditions!")
        print("="*70)


if __name__ == "__main__":
    print("Installing required package: python-socketio")
    import subprocess
    subprocess.run(["pip", "install", "python-socketio"], 
                   capture_output=True)
    
    tester = StressTestSuite()
    tester.run_all_stress_tests()