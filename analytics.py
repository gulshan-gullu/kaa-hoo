"""
CA360 Chat Analytics Dashboard
Generate visual analytics and insights
"""
from datetime import datetime, timedelta
import json
import os

class Analytics:
    def __init__(self):
        self.data = {
            'calls': [],
            'messages': [],
            'users': [],
            'performance': []
        }
    
    def add_call_data(self, caller, recipient, duration, status):
        """Add call data"""
        self.data['calls'].append({
            'timestamp': datetime.now().isoformat(),
            'caller': caller,
            'recipient': recipient,
            'duration': duration,
            'status': status
        })
    
    def add_message_data(self, sender, recipient, message_type='text'):
        """Add message data"""
        self.data['messages'].append({
            'timestamp': datetime.now().isoformat(),
            'sender': sender,
            'recipient': recipient,
            'type': message_type
        })
    
    def add_user_activity(self, user_id, action):
        """Add user activity"""
        self.data['users'].append({
            'timestamp': datetime.now().isoformat(),
            'user_id': user_id,
            'action': action
        })
    
    def generate_analytics_report(self):
        """Generate comprehensive analytics report"""
        total_calls = len(self.data['calls'])
        total_messages = len(self.data['messages'])
        unique_users = len(set([u['user_id'] for u in self.data['users']]))
        
        # Call statistics
        completed_calls = len([c for c in self.data['calls'] if c['status'] == 'completed'])
        missed_calls = len([c for c in self.data['calls'] if c['status'] == 'missed'])
        rejected_calls = len([c for c in self.data['calls'] if c['status'] == 'rejected'])
        
        avg_call_duration = sum([c['duration'] for c in self.data['calls']]) / total_calls if total_calls > 0 else 0
        
        report = f"""
╔════════════════════════════════════════════════════════╗
║   📈 CA360 CHAT - ANALYTICS DASHBOARD                 ║
╠════════════════════════════════════════════════════════╣

📊 OVERVIEW
   Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

📞 CALL STATISTICS
   Total Calls: {total_calls}
   ├─ Completed: {completed_calls}
   ├─ Missed: {missed_calls}
   └─ Rejected: {rejected_calls}
   
   Average Duration: {avg_call_duration:.1f} seconds

💬 MESSAGE STATISTICS
   Total Messages: {total_messages}

👥 USER STATISTICS
   Unique Active Users: {unique_users}

📈 TRENDS
   Calls per Hour: {total_calls / max(1, unique_users):.1f}
   Messages per User: {total_messages / max(1, unique_users):.1f}

╚════════════════════════════════════════════════════════╝
"""
        return report
    
    def export_analytics(self, filename='reports/analytics.json'):
        """Export analytics data"""
        os.makedirs('reports', exist_ok=True)
        
        analytics_data = {
            'generated_at': datetime.now().isoformat(),
            'summary': {
                'total_calls': len(self.data['calls']),
                'total_messages': len(self.data['messages']),
                'unique_users': len(set([u['user_id'] for u in self.data['users']]))
            },
            'data': self.data
        }
        
        with open(filename, 'w') as f:
            json.dump(analytics_data, f, indent=2)
        
        print(f"✅ Analytics exported to: {filename}")

if __name__ == '__main__':
    # Demo analytics
    analytics = Analytics()
    
    # Add sample data
    analytics.add_call_data('user1', 'user2', 120, 'completed')
    analytics.add_call_data('user2', 'user3', 300, 'completed')
    analytics.add_call_data('user3', 'user1', 0, 'missed')
    
    analytics.add_message_data('user1', 'user2')
    analytics.add_message_data('user2', 'user1')
    analytics.add_message_data('user1', 'user3')
    
    analytics.add_user_activity('user1', 'login')
    analytics.add_user_activity('user2', 'login')
    analytics.add_user_activity('user3', 'login')
    
    # Generate report
    print(analytics.generate_analytics_report())
    
    # Export data
    analytics.export_analytics()
