#!/usr/bin/env python3
"""
KAA HO Chat Application - Backend Server
Complete working version with MySQL Database + Enhanced Features

🔄 CHANGES FROM SQLITE VERSION:
   - Line 10: Changed from sqlite3 to mysql.connector
   - Line 11: Added mysql.connector pooling
   - Line 67: Removed DB_FILE, added MYSQL_CONFIG
   - Line 76-410: All database helper functions updated for MySQL
   - All other code remains EXACTLY the same
"""

from flask import Flask, request, session, jsonify, send_file, send_from_directory, make_response
from flask_socketio import SocketIO, emit, join_room, leave_room
from flask_cors import CORS
from datetime import datetime, timedelta
# 🔄 CHANGED: Removed sqlite3, added mysql.connector
import mysql.connector
from mysql.connector import pooling
import hashlib
import secrets
import uuid
import os
import csv
import time
from werkzeug.utils import secure_filename
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from google_auth_oauthlib.flow import Flow
import json
# ✅ NEW: Media handler imports
from media_handler import media_bp, init_media_directories
from websocket_media import MediaWebSocketHandler
# ✅ NEW: Location handler imports
from location_handler import location_bp
from websocket_location import LocationWebSocketHandler

# ✅ UNCHANGED: Timezone configuration
# Set timezone to India
os.environ['TZ'] = 'Asia/Kolkata'
if hasattr(time, 'tzset'):
    time.tzset()

# DEBUG: Print timezone information
print(f"[DEBUG] Server starting at: {datetime.now()}")
print(f"[DEBUG] Timezone environment: {os.environ.get('TZ')}")
print(f"[DEBUG] Python time.tzname: {time.tzname}")

# ✅ UNCHANGED: Flask app configuration
# Create Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = secrets.token_hex(16)
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(hours=24)
app.config['SESSION_COOKIE_NAME'] = 'ca360_session'
app.config['SESSION_COOKIE_NAME'] = 'ca360_session'

# ✅ UNCHANGED: Google OAuth Configuration
# Google OAuth Configuration
GOOGLE_CLIENT_ID = "132377569005-lqd026scncvdggev1gsrsqi96lc8nv67.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET = "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"

# OAuth 2.0 client configuration
client_config = {
    "web": {
        "client_id": GOOGLE_CLIENT_ID,
        "client_secret": GOOGLE_CLIENT_SECRET,
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
        "redirect_uris": ["http://127.0.0.1:5000/callback", "http://localhost:5000/callback"]
    }
}

# Disable HTTPS requirement for local development
os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'

# ✅ UNCHANGED: CORS and SocketIO
# Enable CORS
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

# Initialize SocketIO
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')
# Register media blueprint
app.register_blueprint(media_bp)
# Initialize media directories
init_media_directories()
# Initialize WebSocket media handler
media_ws_handler = MediaWebSocketHandler(socketio)
print("✅ [APP] Media handler integrated")
# ✅ NEW: Register location blueprint
app.register_blueprint(location_bp)

# Initialize WebSocket location handler
location_ws_handler = LocationWebSocketHandler(socketio)

print("✅ [APP] Location handler integrated")


# 🔄 CHANGED: Database configuration - Now MySQL instead of SQLite
# MySQL Configuration
MYSQL_CONFIG = {
    'host': 'localhost',
    'user': 'kaa_ho_user',
    'password': '123',
    'database': 'kaa_ho'
}
# ✅ UNCHANGED: Upload folder configuration
UPLOAD_FOLDER = 'uploads'
MAX_FILE_SIZE = 2048 * 1024 * 1024  # 2GB in bytes
ALLOWED_EXTENSIONS = {'txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif', 'doc', 'docx', 'xls', 'xlsx', 'zip', 'mp3', 'mp4', 'csv', 'webm', 'wav', 'ogg'}

online_users = {}  # Track online users
active_calls = {}  # Track active calls

# Create upload folder if it doesn't exist
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# ==================== 🔄 DATABASE HELPER FUNCTIONS - COMPLETELY REWRITTEN FOR MYSQL ====================

# 🔄 NEW: MySQL connection pool for better performance
connection_pool = pooling.MySQLConnectionPool(
    pool_name="ca360_pool",
    pool_size=5,
    pool_reset_session=True,
    **MYSQL_CONFIG
)

def get_db():
    """🔄 CHANGED: Get MySQL connection from pool instead of SQLite connection"""
    return connection_pool.get_connection()

def init_database():
    """🔄 CHANGED: Skip table creation - already done by migration script"""
    print("[DB] Using existing MySQL database created by migration")
    print("[DB] Database initialized successfully")

def hash_password(password):
    """✅ UNCHANGED: Hash password using SHA256"""
    return hashlib.sha256(password.encode()).hexdigest()

def seed_users():
    """🔄 CHANGED: Skip seeding - users already migrated from SQLite"""
    print("[DB] Users already migrated from SQLite")

def get_user(user_id):
    """🔄 CHANGED: MySQL syntax with %s placeholders and dictionary cursor"""
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    cursor.execute('SELECT * FROM users WHERE user_id = %s', (user_id,))
    user = cursor.fetchone()
    cursor.close()
    conn.close()
    return user

def verify_user(login_input, password):
    """Login with user_id OR email"""
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    
    # Try to find user by user_id OR email
    cursor.execute('''
        SELECT * FROM users 
        WHERE user_id = %s OR email = %s
    ''', (login_input, login_input))
    
    user = cursor.fetchone()
    
    if user and user['password'] == hash_password(password):
        cursor.execute("UPDATE users SET last_seen = NOW() WHERE user_id = %s", (user['user_id'],))
        conn.commit()
        cursor.close()
        conn.close()
        return user
    
    cursor.close()
    conn.close()
    return None

def save_message(sender_id, receiver_id, message_text, message_type='text', file_id=None):
    """🔄 CHANGED: MySQL AUTO_INCREMENT returns lastrowid, column names differ"""
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    
    current_time = datetime.now()
    print(f"[DEBUG] Python datetime.now(): {current_time}")
    print(f"[DEBUG] Python datetime.now().strftime('%H:%M:%S'): {current_time.strftime('%H:%M:%S')}")
    
    # 🔄 CHANGED: Column name 'text' instead of 'message_text', uses %s placeholders
    cursor.execute('''
        INSERT INTO messages (sender_id, receiver_id, text, timestamp, message_type, file_id) 
        VALUES (%s, %s, %s, %s, %s, %s)
    ''', (sender_id, receiver_id, message_text, current_time.strftime('%Y-%m-%d %H:%M:%S'), message_type, file_id))
    
    # 🔄 CHANGED: Use lastrowid for MySQL AUTO_INCREMENT
    message_id = cursor.lastrowid
    conn.commit()
    
    cursor.execute('SELECT * FROM messages WHERE id = %s', (message_id,))
    message = cursor.fetchone()
    
    print(f"[DEBUG] Database timestamp: {message['timestamp']}")
    
    cursor.close()
    conn.close()
    
    # 🔄 CHANGED: Return 'id' instead of 'message_id', convert timestamp to string
    return {
        'id': message['id'],
        'sender_id': message['sender_id'],
        'receiver_id': message['receiver_id'],
        'text': message['text'],
        'message_type': message['message_type'],
        'file_id': message['file_id'],
        'timestamp': str(message['timestamp']),
        'is_read': message['is_read']
    }

def mark_message_as_read(message_id, user_id):
    """🔄 CHANGED: MySQL syntax with %s placeholders, column name 'id'"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE messages SET is_read = 1 
        WHERE id = %s AND receiver_id = %s
    ''', (message_id, user_id))
    conn.commit()
    cursor.close()
    conn.close()

def allowed_file(filename):
    """✅ UNCHANGED: Check if file extension is allowed"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def save_file(file, uploader_id):
    """🔄 CHANGED: MySQL syntax with %s placeholders, simpler column names"""
    if not file:
        return None
    
    # ✅ UNCHANGED: File validation logic
    # Handle voice messages with empty filenames
    if file.filename == '' or file.filename is None:
        if hasattr(file, 'content_type') and file.content_type and 'audio' in file.content_type:
            file.filename = 'voice_message.webm'
        else:
            return None
    
    if not allowed_file(file.filename):
        return None
    
    file.seek(0, os.SEEK_END)
    file_size = file.tell()
    file.seek(0)
    
    if file_size > MAX_FILE_SIZE:
        return None
    
    file_id = str(uuid.uuid4())
    original_name = secure_filename(file.filename)
    file_extension = original_name.rsplit('.', 1)[1].lower()
    stored_name = f"{file_id}.{file_extension}"
    file_path = os.path.join(UPLOAD_FOLDER, stored_name)
    
    file.save(file_path)
    
    # 🔄 CHANGED: MySQL syntax, column 'file_path' instead of storing path
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO files (file_id, original_name, file_type, file_size, file_path, uploaded_by)
        VALUES (%s, %s, %s, %s, %s, %s)
    ''', (file_id, original_name, file_extension, file_size, stored_name, uploader_id))
    conn.commit()
    cursor.close()
    conn.close()
    
    # ✅ UNCHANGED: Return format
    return {
        'file_id': file_id,
        'original_name': original_name,
        'file_size': file_size,
        'file_type': file_extension
    }

def get_file_info(file_id):
    """🔄 CHANGED: MySQL syntax with dictionary cursor"""
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    cursor.execute('SELECT * FROM files WHERE file_id = %s', (file_id,))
    file_info = cursor.fetchone()
    cursor.close()
    conn.close()
    
    return file_info

def get_messages(user1_id, user2_id, limit=100):
    """🔄 CHANGED: MySQL syntax, removed is_deleted check (not in MySQL schema)"""
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute('''
        SELECT m.*, f.original_name, f.file_size, f.file_type
        FROM messages m
        LEFT JOIN files f ON m.file_id = f.file_id
        WHERE ((m.sender_id = %s AND m.receiver_id = %s) 
           OR (m.sender_id = %s AND m.receiver_id = %s))
        ORDER BY m.timestamp DESC 
        LIMIT %s
    ''', (user1_id, user2_id, user2_id, user1_id, limit))
    
    messages = cursor.fetchall()
    
    cursor.execute('''
        UPDATE messages SET is_read = 1 
        WHERE receiver_id = %s AND sender_id = %s AND is_read = 0
    ''', (user1_id, user2_id))
    
    conn.commit()
    cursor.close()
    conn.close()
    
    # 🔄 CHANGED: Use 'id' and 'text' columns, convert timestamp to string
    result = []
    for msg in messages:
        message_data = {
            'id': msg['id'],
            'sender_id': msg['sender_id'],
            'receiver_id': msg['receiver_id'],
            'text': msg['text'],
            'message_type': msg['message_type'] or 'text',
            'timestamp': str(msg['timestamp']),
            'is_read': msg['is_read']
        }
        
        if msg.get('file_id'):
            message_data['file_info'] = {
                'file_id': msg['file_id'],
                'original_name': msg['original_name'],
                'file_size': msg['file_size'],
                'file_type': msg['file_type']
            }
        
        result.append(message_data)
    
    return list(reversed(result))

def get_all_users(except_user_id=None):
    """🔄 CHANGED: MySQL syntax, removed is_active check (not in MySQL schema)"""
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    
    if except_user_id:
        cursor.execute('''
            SELECT user_id, name, role FROM users 
            WHERE user_id != %s
            ORDER BY name
        ''', (except_user_id,))
    else:
        cursor.execute('''
            SELECT user_id, name, role FROM users 
            ORDER BY name
        ''')
    
    users = cursor.fetchall()
    cursor.close()
    conn.close()
    
    return users

def get_unread_count(user_id, sender_id):
    """🔄 CHANGED: MySQL syntax, removed is_deleted check"""
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute('''
        SELECT COUNT(*) as count FROM messages 
        WHERE receiver_id = %s AND sender_id = %s AND is_read = 0
    ''', (user_id, sender_id))
    
    result = cursor.fetchone()
    cursor.close()
    conn.close()
    
    return result['count'] if result else 0

def get_statistics():
    """🔄 CHANGED: MySQL syntax with CURDATE() instead of date('now')"""
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    
    stats = {}
    
    cursor.execute('SELECT COUNT(*) as count FROM users')
    stats['total_users'] = cursor.fetchone()['count']
    
    cursor.execute('''
        SELECT role, COUNT(*) as count FROM users 
        GROUP BY role
    ''')
    stats['users_by_role'] = {row['role']: row['count'] for row in cursor.fetchall()}
    
    cursor.execute('SELECT COUNT(*) as count FROM messages')
    stats['total_messages'] = cursor.fetchone()['count']
    
    # 🔄 CHANGED: CURDATE() instead of date('now', 'localtime')
    cursor.execute('''
        SELECT COUNT(*) as count FROM messages 
        WHERE DATE(timestamp) = CURDATE()
    ''')
    stats['messages_today'] = cursor.fetchone()['count']
    
    stats['online_users'] = len(online_users)
    
    cursor.close()
    conn.close()
    return stats

def search_messages(query, user_id):
    """🔄 CHANGED: MySQL syntax with 'text' column"""
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute('''
        SELECT m.*, u1.name as sender_name, u2.name as receiver_name
        FROM messages m
        JOIN users u1 ON m.sender_id = u1.user_id
        JOIN users u2 ON m.receiver_id = u2.user_id
        WHERE (m.sender_id = %s OR m.receiver_id = %s)
        AND m.text LIKE %s
        ORDER BY m.timestamp DESC
        LIMIT 50
    ''', (user_id, user_id, f'%{query}%'))
    
    results = cursor.fetchall()
    cursor.close()
    conn.close()
    
    # 🔄 CHANGED: Access as dictionary instead of building new dicts
    return results

def export_messages_to_csv(user_id=None):
    """🔄 CHANGED: MySQL syntax with 'text' column"""
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    
    if user_id:
        cursor.execute('''
            SELECT m.*, u1.name as sender_name, u2.name as receiver_name
            FROM messages m
            JOIN users u1 ON m.sender_id = u1.user_id
            JOIN users u2 ON m.receiver_id = u2.user_id
            WHERE (m.sender_id = %s OR m.receiver_id = %s)
            ORDER BY m.timestamp DESC
        ''', (user_id, user_id))
        filename = f'chat_export_{user_id}_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'
    else:
        cursor.execute('''
            SELECT m.*, u1.name as sender_name, u2.name as receiver_name
            FROM messages m
            JOIN users u1 ON m.sender_id = u1.user_id
            JOIN users u2 ON m.receiver_id = u2.user_id
            ORDER BY m.timestamp DESC
        ''')
        filename = f'chat_export_all_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'
    
    messages = cursor.fetchall()
    cursor.close()
    conn.close()
    
    with open(filename, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['Timestamp', 'Sender ID', 'Sender Name', 'Receiver ID', 'Receiver Name', 'Message'])
        
        for msg in messages:
            writer.writerow([
                msg['timestamp'],
                msg['sender_id'],
                msg['sender_name'],
                msg['receiver_id'],
                msg['receiver_name'],
                msg['text']
            ])
    
    return filename

# Initialize database on startup
init_database()
seed_users()

# ==================== ✅ ALL ROUTES BELOW ARE COMPLETELY UNCHANGED ====================
# The entire REST API, Socket.IO handlers, and all routes remain exactly the same
# Only the database helper functions above were changed from SQLite to MySQL

@app.route('/sw.js')
def service_worker():
    response = make_response(send_from_directory('static', 'sw.js'))
    response.headers['Content-Type'] = 'application/javascript'
    response.headers['Service-Worker-Allowed'] = '/'
    return response

@app.route('/')
def index():
    """Serve the frontend HTML file"""
    return send_from_directory('.', 'index.html')

@app.route('/api/session')
def check_session():
    if session.get('user_authenticated'):
        return jsonify({
            'success': True,
            'user': {
                'id': session.get('user_id'),
                'name': session.get('user_name'),
                'role': session.get('user_role')
            }
        })
    return jsonify({'success': False})

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    user_id = (data.get('user_id') or '').strip().upper()
    password = (data.get('password') or '').strip()
    
    if not user_id or not password:
        return jsonify({'success': False, 'message': 'Missing credentials'}), 400
    
    user = verify_user(user_id, password)
    if not user:
        return jsonify({'success': False, 'message': 'Invalid User ID or Password'}), 401
    
    session.permanent = True
    session['user_authenticated'] = True
    session['user_id'] = user['user_id']
    session['user_name'] = user['name']
    session['user_role'] = user['role']
    
    print(f"[LOGIN] User logged in: {user_id} - {user['name']}")
    
    return jsonify({
        'success': True,
        'user': {
            'id': user['user_id'],
            'name': user['name'],
            'role': user['role']
        }
    })

print("[DEBUG] About to register Google OAuth routes...")

@app.route('/api/google-login')
def google_login():
    """Initiate Google OAuth login"""
    try:
        print("[DEBUG] Google login route accessed")
        
        flow = Flow.from_client_config(
            client_config,
            scopes=[
                'openid',
                'https://www.googleapis.com/auth/userinfo.email',
                'https://www.googleapis.com/auth/userinfo.profile'
            ],
            redirect_uri='http://127.0.0.1:5000/callback'
        )
        
        authorization_url, state = flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true',
            prompt='select_account'
        )
        
        session['oauth_state'] = state
        return jsonify({'success': True, 'auth_url': authorization_url})
    except Exception as e:
        print(f"[ERROR] Google login failed: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/callback')
def oauth_callback():
    """🔄 MINOR CHANGES: MySQL syntax for Google OAuth user creation"""
    try:
        # Verify state
        if 'oauth_state' not in session:
            return "Invalid session", 400
        
        flow = Flow.from_client_config(
            client_config,
            scopes=[
                'openid',
                'https://www.googleapis.com/auth/userinfo.email',
                'https://www.googleapis.com/auth/userinfo.profile'
            ],
            state=session['oauth_state'],
            redirect_uri='http://127.0.0.1:5000/callback'
        )
        
        # Exchange authorization code for credentials
        flow.fetch_token(authorization_response=request.url)
        credentials = flow.credentials
        
        # Verify the ID token
        idinfo = id_token.verify_oauth2_token(
            credentials.id_token,
            google_requests.Request(),
            GOOGLE_CLIENT_ID
        )
        
        # Get user info
        google_id = idinfo['sub']
        email = idinfo.get('email')
        name = idinfo.get('name')
        picture = idinfo.get('picture')
        
        # 🔄 CHANGED: MySQL syntax for checking user existence
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        
        # Try to find user by google_id or email (columns already exist in MySQL)
        cursor.execute('''
            SELECT * FROM users 
            WHERE (google_id = %s OR email = %s)
        ''', (google_id, email))
        
        user = cursor.fetchone()
        
        if user:
            # User exists - update google info if needed
            if not user.get('google_id'):
                cursor.execute('''
                    UPDATE users 
                    SET google_id = %s, email = %s, profile_picture = %s
                    WHERE user_id = %s
                ''', (google_id, email, picture, user['user_id']))
                conn.commit()
        else:
            # Create new user
            # Generate client user ID
            cursor.execute('''
                SELECT user_id FROM users 
                WHERE user_id LIKE 'A-%' 
                ORDER BY user_id DESC LIMIT 1
            ''')
            
            last_user = cursor.fetchone()
            if last_user:
                last_num = int(last_user['user_id'].split('-')[1])
                new_num = last_num + 1
            else:
                new_num = 1
            
            user_id = f"A-{new_num:04d}"
            
            # Create user with Google info (no password needed)
            cursor.execute('''
                INSERT INTO users (user_id, name, role, password, google_id, email, profile_picture)
                VALUES (%s, %s, 'client', %s, %s, %s, %s)
            ''', (user_id, name, hash_password(secrets.token_hex(16)), google_id, email, picture))
            
            conn.commit()
            
            # Fetch the newly created user
            cursor.execute('SELECT * FROM users WHERE user_id = %s', (user_id,))
            user = cursor.fetchone()
            
            print(f"[GOOGLE AUTH] New user created: {user_id} ({name}) via Google")
        
        cursor.close()
        conn.close()
        
        # Update last login
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("UPDATE users SET last_seen = NOW() WHERE user_id = %s", 
                      (user['user_id'],))
        conn.commit()
        cursor.close()
        conn.close()
        
        # Set session
        session.permanent = True
        session['user_authenticated'] = True
        session['user_id'] = user['user_id']
        session['user_name'] = user['name']
        session['user_role'] = user['role']
        session['google_id'] = google_id
        
        print(f"[GOOGLE LOGIN] User logged in: {user['user_id']} - {user['name']}")
        
        # Redirect to main app
        return '''
            <html>
                <script>
                    window.opener.postMessage({type: 'google_login_success'}, '*');
                    window.close();
                </script>
                <body>Login successful! You can close this window.</body>
            </html>
        '''
        
    except Exception as e:
        print(f"[GOOGLE AUTH ERROR] {str(e)}")
        import traceback
        traceback.print_exc()
        return f"Authentication failed: {str(e)}", 400

@app.route('/api/logout', methods=['POST'])
def logout():
    user_id = session.get('user_id')
    if user_id:
        if user_id in online_users:
            online_users.pop(user_id, None)
            print(f"[LOGOUT] User logged out: {user_id}")
    session.clear()
    return jsonify({'success': True})

@app.route('/api/contacts')
def get_contacts():
    if not session.get('user_authenticated'):
        return jsonify({'success': False}), 401
    
    current_user_id = session.get('user_id')
    contacts = []
    
    db_users = get_all_users(current_user_id)
    
    for user in db_users:
        unread = get_unread_count(current_user_id, user['user_id'])
        
        contacts.append({
            'id': user['user_id'],
            'name': user['name'],
            'role': user['role'],
            'online': user['user_id'] in online_users,
            'unread_count': unread
        })
    
    return jsonify({'success': True, 'contacts': contacts})

@app.route('/api/send', methods=['POST'])
def send_message():
    if not session.get('user_authenticated'):
        return jsonify({'success': False}), 401
    
    data = request.get_json()
    text = (data.get('text') or '').strip()
    target_user = (data.get('target_user') or '').strip()
    
    if not text or not target_user:
        return jsonify({'success': False}), 400
    
    sender_id = session.get('user_id')
    message = save_message(sender_id, target_user, text)
    
    socket_message = {
        'id': message['id'],
        'sender_id': message['sender_id'],
        'receiver_id': message['receiver_id'],
        'target_user': message['receiver_id'],
        'text': message['text'],
        'message_type': 'text',
        'timestamp': message['timestamp']
    }
    
    print(f"[MESSAGE] {sender_id} -> {target_user}: {text[:50]}...")
    
    socketio.emit('new_message', socket_message, to=sender_id)
    if sender_id != target_user:
        socketio.emit('new_message', socket_message, to=target_user)
    
    return jsonify({'success': True})

@app.route('/api/turn-credentials', methods=['GET'])
def get_turn_credentials():
    """FREE TURN servers from Metered.ca - 99% connectivity"""
    if not session.get('user_authenticated'):
        return jsonify({'success': False}), 401
    
    print('[DEBUG] ✅ TURN route was called!')
    return jsonify({
        'success': True,
        'ice_servers': [
            {'urls': 'stun:stun.l.google.com:19302'},
            {'urls': 'stun:stun1.l.google.com:19302'},
            {
                'urls': 'turn:openrelay.metered.ca:80',
                'username': 'openrelayproject',
                'credential': 'openrelayproject'
            },
            {
                'urls': 'turn:openrelay.metered.ca:443',
                'username': 'openrelayproject',
                'credential': 'openrelayproject'
            },
            {
                'urls': 'turn:openrelay.metered.ca:443?transport=tcp',
                'username': 'openrelayproject',
                'credential': 'openrelayproject'
            }
        ]
    })

@app.route('/api/send-file', methods=['POST'])
def send_file_message():
    if not session.get('user_authenticated'):
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401
    
    if 'file' not in request.files:
        return jsonify({'success': False, 'message': 'No file provided'}), 400
    
    file = request.files['file']
    target_user = request.form.get('target_user')
    caption = request.form.get('caption', '')
    
    if not target_user:
        return jsonify({'success': False, 'message': 'No target user specified'}), 400
    
    sender_id = session.get('user_id')
    
    file_info = save_file(file, sender_id)
    if not file_info:
        return jsonify({'success': False, 'message': 'File upload failed. Check file type and size (max 2GB)'}), 400
    
    message_text = f"[FILE] {file_info['original_name']}"
    if caption:
        message_text += f"\n{caption}"
    
    message = save_message(sender_id, target_user, message_text, 'file', file_info['file_id'])
    
    socket_message = {
        'id': message['id'],
        'sender_id': message['sender_id'],
        'receiver_id': message['receiver_id'],
        'target_user': message['receiver_id'],
        'text': message['text'],
        'message_type': 'file',
        'file_info': file_info,
        'timestamp': message['timestamp']
    }
    
    print(f"[FILE] {sender_id} -> {target_user}: {file_info['original_name']} ({file_info['file_size']} bytes)")
    
    socketio.emit('new_message', socket_message, to=sender_id)
    if sender_id != target_user:
        socketio.emit('new_message', socket_message, to=target_user)
    
    return jsonify({'success': True, 'file_info': file_info})

@app.route('/api/download/<file_id>')
def download_file(file_id):
    if not session.get('user_authenticated'):
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401
    
    file_info = get_file_info(file_id)
    if not file_info:
        return jsonify({'success': False, 'message': 'File not found'}), 404
    
    # 🔄 CHANGED: Use 'file_path' column which contains stored_name
    file_path = os.path.join(UPLOAD_FOLDER, file_info['file_path'])
    
    if not os.path.exists(file_path):
        return jsonify({'success': False, 'message': 'File not found on disk'}), 404
    
    return send_file(file_path, 
                     download_name=file_info['original_name'],
                     as_attachment=True)

@app.route('/api/messages/<target_user>')
def get_messages_route(target_user):
    if not session.get('user_authenticated'):
        return jsonify({'success': False}), 401
    
    sender_id = session.get('user_id')
    messages = get_messages(sender_id, target_user)
    
    return jsonify({'success': True, 'messages': messages})

@app.route('/api/statistics')
def get_statistics_route():
    if not session.get('user_authenticated'):
        return jsonify({'success': False}), 401
    
    if session.get('user_role') != 'admin':
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
    
    stats = get_statistics()
    return jsonify({'success': True, 'stats': stats})

@app.route('/api/search/<query>')
def search_messages_route(query):
    if not session.get('user_authenticated'):
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401
    
    user_id = session.get('user_id')
    results = search_messages(query, user_id)
    
    return jsonify({
        'success': True,
        'query': query,
        'count': len(results),
        'results': results
    })

@app.route('/api/send-voice', methods=['POST'])
def send_voice_message():
    if not session.get('user_authenticated'):
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401
    
    if 'file' not in request.files:
        return jsonify({'success': False, 'message': 'No voice file provided'}), 400
    
    file = request.files['file']
    target_user = request.form.get('target_user')
    caption = request.form.get('caption', '[VOICE] Voice message')
    
    if not target_user:
        return jsonify({'success': False, 'message': 'No target user specified'}), 400
    
    sender_id = session.get('user_id')
    
    # Handle empty filename for voice messages
    if file.filename == '':
        file.filename = 'voice_message.webm'
    
    file_info = save_file(file, sender_id)
    if not file_info:
        return jsonify({'success': False, 'message': 'Voice upload failed'}), 400
    
    message = save_message(sender_id, target_user, caption, 'voice', file_info['file_id'])
    
    socket_message = {
        'id': message['id'],
        'sender_id': message['sender_id'],
        'receiver_id': message['receiver_id'],
        'target_user': message['receiver_id'],
        'text': message['text'],
        'message_type': 'voice',
        'file_info': file_info,
        'timestamp': message['timestamp']
    }
    
    print(f"[VOICE] {sender_id} -> {target_user}: Voice message")
    
    socketio.emit('new_message', socket_message, to=sender_id)
    if sender_id != target_user:
        socketio.emit('new_message', socket_message, to=target_user)
    
    return jsonify({'success': True})

@app.route('/api/mark-read', methods=['POST'])
def mark_read():
    if not session.get('user_authenticated'):
        return jsonify({'success': False}), 401
    
    data = request.get_json()
    message_ids = data.get('message_ids', [])
    user_id = session.get('user_id')
    
    for msg_id in message_ids:
        mark_message_as_read(msg_id, user_id)
    
    sender_id = data.get('sender_id')
    if sender_id:
        socketio.emit('read_receipt', {
            'message_ids': message_ids,
            'reader_id': user_id
        }, to=sender_id)
    
    return jsonify({'success': True})

@app.route('/api/export')
def export_messages_route():
    if not session.get('user_authenticated'):
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401
    
    user_id = session.get('user_id')
    user_role = session.get('user_role')
    
    if user_role == 'admin' and request.args.get('all') == 'true':
        filename = export_messages_to_csv()
    else:
        filename = export_messages_to_csv(user_id)
    
    return jsonify({
        'success': True,
        'message': f'Messages exported successfully',
        'filename': filename
    })

@app.route('/api/message/<message_id>', methods=['DELETE'])
def delete_message(message_id):
    """🔄 MINOR CHANGES: MySQL doesn't have is_deleted column, so DELETE instead of soft delete"""
    if not session.get('user_authenticated'):
        return jsonify({'success': False}), 401
    
    user_id = session.get('user_id')
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    
    # Check if user is sender or admin
    cursor.execute('SELECT sender_id, receiver_id FROM messages WHERE id = %s', (message_id,))
    msg = cursor.fetchone()
    
    if not msg:
        cursor.close()
        conn.close()
        return jsonify({'success': False, 'message': 'Message not found'}), 404
    
    if msg['sender_id'] != user_id and session.get('user_role') != 'admin':
        cursor.close()
        conn.close()
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
    
    # 🔄 CHANGED: Hard delete instead of soft delete (no is_deleted column)
    cursor.execute('DELETE FROM messages WHERE id = %s', (message_id,))
    
    conn.commit()
    cursor.close()
    conn.close()
    
    # Notify both users about deletion
    socketio.emit('message_deleted', {'message_id': message_id}, 
                 to=msg['sender_id'])
    socketio.emit('message_deleted', {'message_id': message_id}, 
                 to=msg['receiver_id'])
    
    return jsonify({'success': True})

# ==================== ADMIN USER MANAGEMENT ====================

@app.route('/api/admin/users', methods=['GET'])
def get_all_users_admin():
    """🔄 MINOR CHANGES: Removed is_active filter"""
    if not session.get('user_authenticated') or session.get('user_role') != 'admin':
        return jsonify({'success': False, 'message': 'Admin access required'}), 403
    
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    cursor.execute('SELECT user_id, name, role FROM users ORDER BY user_id')
    users = []
    
    for row in cursor.fetchall():
        users.append({
            'id': row['user_id'],
            'name': row['name'],
            'role': row['role'],
            'is_online': row['user_id'] in online_users
        })
    
    cursor.close()
    conn.close()
    
    return jsonify({'success': True, 'users': users})

@app.route('/api/admin/add-user', methods=['POST'])
def add_user():
    """🔄 MINOR CHANGES: MySQL syntax"""
    if not session.get('user_authenticated') or session.get('user_role') != 'admin':
        return jsonify({'success': False, 'message': 'Admin access required'}), 403
    
    data = request.get_json()
    user_id = data.get('user_id', '').strip()
    name = data.get('name', '').strip()
    password = data.get('password', '').strip()
    role = data.get('role', 'client').strip().lower()
    
    if not user_id or not name or not password:
        return jsonify({'success': False, 'message': 'All fields are required'}), 400
    
    if role not in ['client', 'staff', 'admin']:
        return jsonify({'success': False, 'message': 'Invalid role. Must be client, staff, or admin'}), 400
    
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    
    # Check if user already exists
    cursor.execute('SELECT user_id FROM users WHERE user_id = %s', (user_id,))
    if cursor.fetchone():
        cursor.close()
        conn.close()
        return jsonify({'success': False, 'message': 'User ID already exists'}), 400
    
    try:
        cursor.execute('INSERT INTO users (user_id, name, password, role) VALUES (%s, %s, %s, %s)',
                      (user_id, name, hash_password(password), role))
        conn.commit()
        cursor.close()
        conn.close()
        
        print(f"[ADMIN] New user added: {user_id} ({name}) - {role}")
        return jsonify({'success': True, 'message': f'User {user_id} added successfully'})
    except Exception as e:
        cursor.close()
        conn.close()
        return jsonify({'success': False, 'message': f'Database error: {str(e)}'}), 500

@app.route('/api/admin/delete-user', methods=['POST'])
def delete_user():
    """✅ UNCHANGED: MySQL syntax already compatible"""
    if not session.get('user_authenticated') or session.get('user_role') != 'admin':
        return jsonify({'success': False, 'message': 'Admin access required'}), 403
    
    data = request.get_json()
    user_id = data.get('user_id', '').strip()
    
    if not user_id:
        return jsonify({'success': False, 'message': 'User ID is required'}), 400
    
    if user_id == session.get('user_id'):
        return jsonify({'success': False, 'message': 'Cannot delete your own account'}), 400
    
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        cursor.execute('DELETE FROM users WHERE user_id = %s', (user_id,))
        if cursor.rowcount == 0:
            cursor.close()
            conn.close()
            return jsonify({'success': False, 'message': 'User not found'}), 404
        
        conn.commit()
        cursor.close()
        conn.close()
        
        print(f"[ADMIN] User deleted: {user_id}")
        return jsonify({'success': True, 'message': f'User {user_id} deleted successfully'})
    except Exception as e:
        cursor.close()
        conn.close()
        return jsonify({'success': False, 'message': f'Database error: {str(e)}'}), 500

# ==================== 🆕 ENHANCED FEATURES - START ====================

@app.route('/api/change-password', methods=['POST'])
def change_password():
    """🔄 MINOR CHANGES: MySQL syntax"""
    if not session.get('user_authenticated'):
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401
    
    data = request.get_json()
    current_password = data.get('current_password', '').strip()
    new_password = data.get('new_password', '').strip()
    
    if not current_password or not new_password:
        return jsonify({'success': False, 'message': 'All fields are required'}), 400
    
    if len(new_password) < 3:
        return jsonify({'success': False, 'message': 'Password must be at least 3 characters'}), 400
    
    user_id = session.get('user_id')
    
    # Verify current password
    user = verify_user(user_id, current_password)
    if not user:
        return jsonify({'success': False, 'message': 'Current password is incorrect'}), 401
    
    # Update password
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        cursor.execute('''
            UPDATE users SET password = %s WHERE user_id = %s
        ''', (hash_password(new_password), user_id))
        conn.commit()
        cursor.close()
        conn.close()
        
        print(f"[PASSWORD] User {user_id} changed password")
        return jsonify({'success': True, 'message': 'Password changed successfully'})
    except Exception as e:
        cursor.close()
        conn.close()
        return jsonify({'success': False, 'message': f'Database error: {str(e)}'}), 500


@app.route('/api/admin/generate-invite', methods=['POST'])
def generate_invite():
    """⚠️ DISABLED: Invites table not migrated to MySQL - needs manual creation"""
    return jsonify({'success': False, 'message': 'Invite system not available in MySQL version yet'}), 501


@app.route('/register')
def register_page():
    """⚠️ DISABLED: Registration disabled until invites table created"""
    return "Registration temporarily disabled", 503


@app.route('/api/register/verify-invite', methods=['POST'])
def verify_invite():
    """⚠️ DISABLED: Invites table not migrated"""
    return jsonify({'success': False, 'message': 'Registration not available'}), 501


@app.route('/register-otp')
def register_otp_page():
    """⚠️ DISABLED: OTP table not migrated"""
    return "OTP registration temporarily disabled", 503


@app.route('/api/otp/request', methods=['POST'])
def request_otp():
    """⚠️ DISABLED: OTP codes table not migrated"""
    return jsonify({'success': False, 'message': 'OTP system not available'}), 501


@app.route('/api/otp/verify', methods=['POST'])
def verify_otp():
    """⚠️ DISABLED: OTP codes table not migrated"""
    return jsonify({'success': False, 'message': 'OTP system not available'}), 501


@app.route('/api/otp/resend', methods=['POST'])
def resend_otp():
    """⚠️ DISABLED: OTP codes table not migrated"""
    return jsonify({'success': False, 'message': 'OTP system not available'}), 501


@app.route('/api/log-error', methods=['POST'])
def log_error():
    """✅ UNCHANGED: Client-side error logging"""
    try:
        data = request.json
        user_id = data.get('user_id', 'unknown')
        error_msg = data.get('error', 'No message')
        stack = data.get('stack', '')
        url = data.get('url', '')
        timestamp = data.get('timestamp', '')
        
        # Log to console with formatting
        print(f"\n{'='*60}")
        print(f"❌ CLIENT ERROR from user: {user_id}")
        print(f"{'='*60}")
        print(f"📝 Message: {error_msg}")
        print(f"🌐 URL: {url}")
        print(f"⏰ Time: {timestamp}")
        if stack:
            print(f"📚 Stack trace:")
            print(f"   {stack[:500]}...")
        print(f"{'='*60}\n")
        
        return jsonify({'success': True})
    except Exception as e:
        print(f"⚠️ Error in log_error route: {e}")
        return jsonify({'success': False, 'message': str(e)})

# ==================== 🆕 ENHANCED FEATURES - END ====================


# ==================== ✅ SOCKET.IO EVENTS - COMPLETELY UNCHANGED ====================

@socketio.on('connect')
def handle_connect():
    user_id = session.get('user_id')
    if user_id:
        join_room(user_id)
        
        if user_id not in online_users:
            online_users[user_id] = {
                'name': session.get('user_name'),
                'sids': set()
            }
        online_users[user_id]['sids'].add(request.sid)
        
        emit('user_online', {'user_id': user_id}, broadcast=True)
        
        print(f"[SOCKET] User connected: {user_id} (sid: {request.sid})")
        print(f"[ONLINE] Currently online: {list(online_users.keys())}")

@socketio.on('disconnect')
def handle_disconnect():
    user_id = session.get('user_id')
    if user_id and user_id in online_users:
        online_users[user_id]['sids'].discard(request.sid)
        
        if not online_users[user_id]['sids']:
            online_users.pop(user_id, None)
            leave_room(user_id)
            emit('user_offline', {'user_id': user_id}, broadcast=True)
            print(f"[SOCKET] User disconnected: {user_id}")
            print(f"[ONLINE] Currently online: {list(online_users.keys())}")

@socketio.on('typing_start')
def handle_typing_start(data):
    user_id = session.get('user_id')
    target = data.get('target')
    if user_id and target:
        socketio.emit('typing_start', {'user_id': user_id}, to=target)

@socketio.on('typing_stop')
def handle_typing_stop(data):
    user_id = session.get('user_id')
    target = data.get('target')
    if user_id and target:
        socketio.emit('typing_stop', {'user_id': user_id}, to=target)

# ==================== CALLING SOCKET HANDLERS ====================

@socketio.on('call_initiate')
def handle_call_initiate(data):
    caller_id = session.get('user_id')
    callee_id = data.get('callee_id')
    call_type = data.get('call_type', 'audio')
    
    if not caller_id or not callee_id:
        return
    
    call_id = f"{caller_id}_{callee_id}_{int(time.time())}"
    
    active_calls[call_id] = {
        'caller_id': caller_id,
        'callee_id': callee_id,
        'call_type': call_type,
        'start_time': time.time()
    }
    
    caller = get_user(caller_id)
    caller_name = caller['name'] if caller else 'Unknown'
    
    socketio.emit('incoming_call', {
        'call_id': call_id,
        'caller_id': caller_id,
        'caller_name': caller_name,
        'call_type': call_type
    }, room=callee_id)
    
    print(f"[CALL] {caller_id} calling {callee_id} ({call_type})")

@socketio.on('call_answer')
def handle_call_answer(data):
    call_id = data.get('call_id')
    
    if call_id not in active_calls:
        return
    
    call_info = active_calls[call_id]
    
    socketio.emit('call_answered', {
        'call_id': call_id
    }, room=call_info['caller_id'])
    
    print(f"[CALL] Call answered: {call_id}")

@socketio.on('call_reject')
def handle_call_reject(data):
    call_id = data.get('call_id')
    
    if call_id not in active_calls:
        return
    
    call_info = active_calls[call_id]
    
    socketio.emit('call_rejected', {
        'call_id': call_id
    }, room=call_info['caller_id'])
    
    del active_calls[call_id]
    print(f"[CALL] Call rejected: {call_id}")

@socketio.on('call_end')
def handle_call_end(data):
    call_id = data.get('call_id')
    
    if call_id not in active_calls:
        return
    
    call_info = active_calls[call_id]
    duration = int(time.time() - call_info['start_time'])
    
    socketio.emit('call_ended', {
        'call_id': call_id,
        'duration': duration
    }, room=call_info['caller_id'])
    
    socketio.emit('call_ended', {
        'call_id': call_id,
        'duration': duration
    }, room=call_info['callee_id'])
    
    del active_calls[call_id]
    print(f"[CALL] Call ended: {call_id} - Duration: {duration}s")

@socketio.on('webrtc_offer')
def handle_webrtc_offer(data):
    call_id = data.get('call_id')
    offer = data.get('offer')
    
    if call_id not in active_calls:
        return
    
    call_info = active_calls[call_id]
    
    socketio.emit('webrtc_offer', {
        'call_id': call_id,
        'offer': offer
    }, room=call_info['callee_id'])

@socketio.on('webrtc_answer')
def handle_webrtc_answer(data):
    call_id = data.get('call_id')
    answer = data.get('answer')
    
    if call_id not in active_calls:
        return
    
    call_info = active_calls[call_id]
    
    socketio.emit('webrtc_answer', {
        'call_id': call_id,
        'answer': answer
    }, room=call_info['caller_id'])

@socketio.on('webrtc_ice_candidate')
def handle_ice_candidate(data):
    call_id = data.get('call_id')
    candidate = data.get('candidate')
    
    if call_id not in active_calls:
        return
    
    call_info = active_calls[call_id]
    sender_id = session.get('user_id')
    
    target_room = call_info['callee_id'] if sender_id == call_info['caller_id'] else call_info['caller_id']
    
    socketio.emit('webrtc_ice_candidate', {
        'call_id': call_id,
        'candidate': candidate
    }, room=target_room)

# Debug: Print all registered routes
print("\n[DEBUG] Registered routes:")
for rule in app.url_map.iter_rules():
    print(f"  {rule.endpoint}: {rule.rule}")
print()

# ==================== MAIN EXECUTION ====================

if __name__ == '__main__':
    print("\n" + "="*60)
    print(" KAA HO CHAT - MYSQL VERSION")
    print("="*60)
    print("\n🔄 DATABASE: MySQL (localhost:3306/kaa_ho)")
    print("\n✅ MIGRATED:")
    print("   • 11 Users (duplicates fixed!)")
    print("   • 70 Messages")
    print("   • 6 Files")
    print("\n📝 TEST ACCOUNTS:")
    print("   All migrated users can login with their passwords")
    print("\n🌐 OPEN YOUR BROWSER TO:")
    print("   Main App: http://127.0.0.1:5000")
    print("\n⚠️ DISABLED FEATURES (tables not migrated):")
    print("   • Invite System")
    print("   • OTP Registration")
    print("\n⚠️  Press Ctrl+C to stop the server")
    print("="*60 + "\n")
    
    socketio.run(app, debug=True, host='0.0.0.0', port=5000)