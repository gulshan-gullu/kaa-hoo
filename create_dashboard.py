import mysql.connector
from datetime import datetime

# Database connection
config = {
    'host': 'localhost',
    'user': 'kaa_ho_user',
    'password': '123',
    'database': 'kaa_ho'
}

print("Fetching data from database...")
conn = mysql.connector.connect(**config)
cursor = conn.cursor(dictionary=True)

# Get all data
cursor.execute("SELECT * FROM users ORDER BY created_at DESC")
users = cursor.fetchall()

cursor.execute("SELECT m.*, u1.name as sender, u2.name as receiver FROM messages m LEFT JOIN users u1 ON m.sender_id = u1.user_id LEFT JOIN users u2 ON m.receiver_id = u2.user_id ORDER BY m.timestamp DESC LIMIT 50")
messages = cursor.fetchall()

cursor.execute("SELECT f.*, u.name as uploader FROM files f LEFT JOIN users u ON f.uploaded_by = u.user_id ORDER BY f.upload_date DESC")
files = cursor.fetchall()

cursor.close()
conn.close()

# Create HTML Dashboard
html = '''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CA360 Chat - Dashboard</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
            min-height: 100vh;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
        }
        
        .header {
            background: white;
            border-radius: 15px;
            padding: 30px;
            margin-bottom: 30px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.1);
            text-align: center;
        }
        
        .header h1 {
            color: #667eea;
            font-size: 2.5em;
            margin-bottom: 10px;
        }
        
        .header p {
            color: #666;
            font-size: 1.1em;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .stat-card {
            background: white;
            border-radius: 15px;
            padding: 25px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.1);
            transition: transform 0.3s;
        }
        
        .stat-card:hover {
            transform: translateY(-5px);
        }
        
        .stat-icon {
            font-size: 3em;
            margin-bottom: 10px;
        }
        
        .stat-value {
            font-size: 2.5em;
            font-weight: bold;
            color: #667eea;
            margin-bottom: 5px;
        }
        
        .stat-label {
            color: #666;
            font-size: 1em;
        }
        
        .section {
            background: white;
            border-radius: 15px;
            padding: 30px;
            margin-bottom: 30px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.1);
        }
        
        .section-title {
            color: #667eea;
            font-size: 1.8em;
            margin-bottom: 20px;
            border-bottom: 3px solid #667eea;
            padding-bottom: 10px;
        }
        
        .search-box {
            width: 100%;
            padding: 12px 20px;
            border: 2px solid #ddd;
            border-radius: 8px;
            font-size: 1em;
            margin-bottom: 20px;
            transition: border 0.3s;
        }
        
        .search-box:focus {
            outline: none;
            border-color: #667eea;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
        }
        
        th {
            background: #667eea;
            color: white;
            padding: 15px;
            text-align: left;
            font-weight: 600;
        }
        
        td {
            padding: 12px 15px;
            border-bottom: 1px solid #eee;
        }
        
        tr:hover {
            background: #f8f9ff;
        }
        
        .badge {
            display: inline-block;
            padding: 5px 12px;
            border-radius: 20px;
            font-size: 0.85em;
            font-weight: 600;
        }
        
        .badge-success {
            background: #10b981;
            color: white;
        }
        
        .badge-warning {
            background: #f59e0b;
            color: white;
        }
        
        .badge-info {
            background: #3b82f6;
            color: white;
        }
        
        .password-hash {
            font-family: 'Courier New', monospace;
            font-size: 0.85em;
            color: #666;
            max-width: 150px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        
        .timestamp {
            color: #666;
            font-size: 0.9em;
        }
        
        .footer {
            text-align: center;
            color: white;
            margin-top: 30px;
            padding: 20px;
        }
        
        .refresh-btn {
            background: #667eea;
            color: white;
            border: none;
            padding: 12px 30px;
            border-radius: 8px;
            font-size: 1em;
            cursor: pointer;
            transition: background 0.3s;
            margin-top: 20px;
        }
        
        .refresh-btn:hover {
            background: #5568d3;
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <h1>🚀 CA360 Chat Dashboard</h1>
            <p>Real-time Database Monitoring & Analytics</p>
            <p class="timestamp">Generated: ''' + datetime.now().strftime('%Y-%m-%d %H:%M:%S') + '''</p>
        </div>
        
        <!-- Statistics -->
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon">👥</div>
                <div class="stat-value">''' + str(len(users)) + '''</div>
                <div class="stat-label">Total Users</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">💬</div>
                <div class="stat-value">''' + str(len(messages)) + '''</div>
                <div class="stat-label">Recent Messages</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">📁</div>
                <div class="stat-value">''' + str(len(files)) + '''</div>
                <div class="stat-label">Total Files</div>
            </div>
            <div class="stat-card">
                <div class="stat-icon">✅</div>
                <div class="stat-value">''' + str(sum(1 for u in users if u.get('is_verified'))) + '''</div>
                <div class="stat-label">Verified Users</div>
            </div>
        </div>
        
        <!-- Users Section -->
        <div class="section">
            <h2 class="section-title">👥 All Users</h2>
            <input type="text" class="search-box" id="userSearch" placeholder="🔍 Search users by name, email, or ID...">
            <div style="overflow-x: auto;">
                <table id="usersTable">
                    <thead>
                        <tr>
                            <th>User ID</th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Mobile</th>
                            <th>Role</th>
                            <th>Password Hash</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>'''

# Add users data
for user in users:
    verified = '<span class="badge badge-success">✓ Verified</span>' if user.get('is_verified') else '<span class="badge badge-warning">⚠ Unverified</span>'
    html += f'''
                        <tr>
                            <td><strong>{user.get('user_id', 'N/A')}</strong></td>
                            <td>{user.get('name', 'N/A')}</td>
                            <td>{user.get('email', 'N/A')}</td>
                            <td>{user.get('mobile', 'N/A')}</td>
                            <td><span class="badge badge-info">{user.get('role', 'N/A')}</span></td>
                            <td><span class="password-hash">{user.get('password', 'N/A')}</span></td>
                            <td>{verified}</td>
                        </tr>'''

html += '''
                    </tbody>
                </table>
            </div>
        </div>
        
        <!-- Messages Section -->
        <div class="section">
            <h2 class="section-title">💬 Recent Messages</h2>
            <input type="text" class="search-box" id="messageSearch" placeholder="🔍 Search messages...">
            <div style="overflow-x: auto;">
                <table id="messagesTable">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>From</th>
                            <th>To</th>
                            <th>Message</th>
                            <th>Timestamp</th>
                            <th>Read</th>
                        </tr>
                    </thead>
                    <tbody>'''

# Add messages data
for msg in messages:
    read_status = '✓✓' if msg.get('is_read') else '✓'
    html += f'''
                        <tr>
                            <td>{msg.get('id', 'N/A')}</td>
                            <td><strong>{msg.get('sender', 'N/A')}</strong></td>
                            <td><strong>{msg.get('receiver', 'N/A')}</strong></td>
                            <td>{msg.get('text', 'N/A')}</td>
                            <td class="timestamp">{msg.get('timestamp', 'N/A')}</td>
                            <td>{read_status}</td>
                        </tr>'''

html += '''
                    </tbody>
                </table>
            </div>
        </div>
        
        <!-- Files Section -->
        <div class="section">
            <h2 class="section-title">📁 Uploaded Files</h2>
            <input type="text" class="search-box" id="fileSearch" placeholder="🔍 Search files...">
            <div style="overflow-x: auto;">
                <table id="filesTable">
                    <thead>
                        <tr>
                            <th>File Name</th>
                            <th>Type</th>
                            <th>Size</th>
                            <th>Uploaded By</th>
                            <th>Upload Date</th>
                        </tr>
                    </thead>
                    <tbody>'''

# Add files data
for file in files:
    size_mb = round(file.get('file_size', 0) / 1024 / 1024, 2) if file.get('file_size') else 0
    html += f'''
                        <tr>
                            <td><strong>{file.get('original_name', 'N/A')}</strong></td>
                            <td><span class="badge badge-info">{file.get('file_type', 'N/A')}</span></td>
                            <td>{size_mb} MB</td>
                            <td>{file.get('uploader', 'N/A')}</td>
                            <td class="timestamp">{file.get('upload_date', 'N/A')}</td>
                        </tr>'''

html += '''
                    </tbody>
                </table>
            </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
            <button class="refresh-btn" onclick="location.reload()">🔄 Refresh Dashboard</button>
            <p style="margin-top: 20px;">© 2024 CA360 Chat - Database Dashboard</p>
        </div>
    </div>
    
    <script>
        // Search functionality for users
        document.getElementById('userSearch').addEventListener('keyup', function() {
            const searchValue = this.value.toLowerCase();
            const rows = document.querySelectorAll('#usersTable tbody tr');
            
            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(searchValue) ? '' : 'none';
            });
        });
        
        // Search functionality for messages
        document.getElementById('messageSearch').addEventListener('keyup', function() {
            const searchValue = this.value.toLowerCase();
            const rows = document.querySelectorAll('#messagesTable tbody tr');
            
            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(searchValue) ? '' : 'none';
            });
        });
        
        // Search functionality for files
        document.getElementById('fileSearch').addEventListener('keyup', function() {
            const searchValue = this.value.toLowerCase();
            const rows = document.querySelectorAll('#filesTable tbody tr');
            
            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(searchValue) ? '' : 'none';
            });
        });
    </script>
</body>
</html>'''

# Save HTML file
with open('ca360_dashboard.html', 'w', encoding='utf-8') as f:
    f.write(html)

print("Dashboard created successfully!")
print("File: ca360_dashboard.html")
print("Opening in browser...")
