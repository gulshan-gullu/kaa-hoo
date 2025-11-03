"""
CA360 Chat Real-Time Monitoring System
Tracks system metrics, performance, and health
"""
import time
import psutil
import os
from datetime import datetime
from collections import deque
import json

class SystemMonitor:
    def __init__(self, max_history=100):
        self.max_history = max_history
        self.metrics = {
            'cpu': deque(maxlen=max_history),
            'memory': deque(maxlen=max_history),
            'calls': deque(maxlen=max_history),
            'messages': deque(maxlen=max_history),
            'active_users': deque(maxlen=max_history),
            'response_times': deque(maxlen=max_history)
        }
        self.start_time = time.time()
        self.call_count = 0
        self.message_count = 0
        self.active_users = set()
    
    def collect_system_metrics(self):
        """Collect system performance metrics"""
        metrics = {
            'timestamp': datetime.now().isoformat(),
            'cpu_percent': psutil.cpu_percent(interval=0.1),
            'memory_percent': psutil.virtual_memory().percent,
            'memory_used_mb': psutil.virtual_memory().used / (1024 * 1024),
            'memory_available_mb': psutil.virtual_memory().available / (1024 * 1024),
            'disk_usage_percent': psutil.disk_usage('/').percent if os.name != 'nt' else psutil.disk_usage('C:\\').percent,
            'uptime_seconds': time.time() - self.start_time
        }
        
        self.metrics['cpu'].append(metrics['cpu_percent'])
        self.metrics['memory'].append(metrics['memory_percent'])
        
        return metrics
    
    def record_call(self, duration=0):
        """Record a call event"""
        self.call_count += 1
        self.metrics['calls'].append({
            'timestamp': datetime.now().isoformat(),
            'duration': duration
        })
    
    def record_message(self):
        """Record a message event"""
        self.message_count += 1
        self.metrics['messages'].append({
            'timestamp': datetime.now().isoformat()
        })
    
    def add_active_user(self, user_id):
        """Add active user"""
        self.active_users.add(user_id)
        self.metrics['active_users'].append(len(self.active_users))
    
    def remove_active_user(self, user_id):
        """Remove active user"""
        self.active_users.discard(user_id)
        self.metrics['active_users'].append(len(self.active_users))
    
    def record_response_time(self, response_time):
        """Record API response time"""
        self.metrics['response_times'].append({
            'timestamp': datetime.now().isoformat(),
            'time_ms': response_time * 1000
        })
    
    def get_statistics(self):
        """Get current statistics"""
        cpu_avg = sum(self.metrics['cpu']) / len(self.metrics['cpu']) if self.metrics['cpu'] else 0
        memory_avg = sum(self.metrics['memory']) / len(self.metrics['memory']) if self.metrics['memory'] else 0
        
        response_times = [rt['time_ms'] for rt in self.metrics['response_times']]
        avg_response = sum(response_times) / len(response_times) if response_times else 0
        
        return {
            'uptime_seconds': time.time() - self.start_time,
            'total_calls': self.call_count,
            'total_messages': self.message_count,
            'active_users': len(self.active_users),
            'avg_cpu_percent': cpu_avg,
            'avg_memory_percent': memory_avg,
            'avg_response_time_ms': avg_response,
            'current_cpu': psutil.cpu_percent(),
            'current_memory': psutil.virtual_memory().percent
        }
    
    def get_health_status(self):
        """Get system health status"""
        stats = self.get_statistics()
        
        health = {
            'status': 'healthy',
            'issues': []
        }
        
        # Check CPU
        if stats['current_cpu'] > 80:
            health['status'] = 'warning'
            health['issues'].append(f"High CPU usage: {stats['current_cpu']:.1f}%")
        
        # Check Memory
        if stats['current_memory'] > 80:
            health['status'] = 'warning'
            health['issues'].append(f"High memory usage: {stats['current_memory']:.1f}%")
        
        # Check response time
        if stats['avg_response_time_ms'] > 1000:
            health['status'] = 'warning'
            health['issues'].append(f"Slow response time: {stats['avg_response_time_ms']:.1f}ms")
        
        if stats['current_cpu'] > 90 or stats['current_memory'] > 90:
            health['status'] = 'critical'
        
        return health
    
    def generate_report(self):
        """Generate monitoring report"""
        stats = self.get_statistics()
        health = self.get_health_status()
        
        report = f"""
╔════════════════════════════════════════════════════════╗
║   📊 CA360 CHAT - SYSTEM MONITORING REPORT            ║
╠════════════════════════════════════════════════════════╣

⏱️  UPTIME
   {stats['uptime_seconds']/3600:.2f} hours

📞 CALLS
   Total: {stats['total_calls']}
   
💬 MESSAGES
   Total: {stats['total_messages']}
   
👥 ACTIVE USERS
   Current: {stats['active_users']}

💻 CPU USAGE
   Current: {stats['current_cpu']:.1f}%
   Average: {stats['avg_cpu_percent']:.1f}%

🧠 MEMORY USAGE
   Current: {stats['current_memory']:.1f}%
   Average: {stats['avg_memory_percent']:.1f}%

⚡ RESPONSE TIME
   Average: {stats['avg_response_time_ms']:.2f}ms

🏥 HEALTH STATUS
   Status: {health['status'].upper()}
   Issues: {', '.join(health['issues']) if health['issues'] else 'None'}

╚════════════════════════════════════════════════════════╝
"""
        return report
    
    def save_report(self, filename='reports/monitoring_report.txt'):
        """Save monitoring report to file"""
        os.makedirs('reports', exist_ok=True)
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(self.generate_report())
    
    def export_metrics(self, filename='reports/metrics.json'):
        """Export metrics to JSON"""
        os.makedirs('reports', exist_ok=True)
        
        data = {
            'timestamp': datetime.now().isoformat(),
            'statistics': self.get_statistics(),
            'health': self.get_health_status(),
            'metrics': {
                'cpu_history': list(self.metrics['cpu']),
                'memory_history': list(self.metrics['memory']),
                'active_users_history': list(self.metrics['active_users'])
            }
        }
        
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2)

# Global monitor instance
monitor = SystemMonitor()

if __name__ == '__main__':
    # Demo monitoring
    print("Starting CA360 Chat Monitor...")
    print()
    
    # Simulate some activity
    monitor.record_call(120)
    monitor.record_call(300)
    monitor.record_message()
    monitor.record_message()
    monitor.add_active_user('user1')
    monitor.add_active_user('user2')
    monitor.record_response_time(0.05)
    monitor.record_response_time(0.03)
    
    # Generate report
    print(monitor.generate_report())
    
    # Save reports
    monitor.save_report()
    monitor.export_metrics()
    
    print("\n✅ Reports saved!")
    print("   - reports/monitoring_report.txt")
    print("   - reports/metrics.json")
