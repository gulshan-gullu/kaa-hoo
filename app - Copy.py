#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CA360 Chat Application - Main Application
Ultra-Clean Professional Architecture with Enterprise-Grade Session Management
"""

# Monkey patching is handled by Gunicorn's eventlet worker
# DO NOT call eventlet.monkey_patch() here to avoid double-patching

from flask import Flask, send_from_directory, make_response, request, jsonify, session, render_template, redirect
from flask_login import LoginManager, login_required
from flask_socketio import SocketIO
from flask_cors import CORS
import os

# Import configurations
from config import (SECRET_KEY, SESSION_LIFETIME, SESSION_COOKIE_NAME,
                    SESSION_COOKIE_SAMESITE, SESSION_COOKIE_SECURE,
                    SESSION_COOKIE_HTTPONLY, SESSION_COOKIE_DOMAIN,
                    TIMEZONE, UPLOAD_FOLDER, MAX_FILE_SIZE)

# Import route blueprints
from routes.auth_routes import auth_bp
from routes.user_routes import user_bp
from routes.message_routes import message_bp, init_socketio as init_message_socketio
from routes.database_routes import database_bp

# Import existing handlers
from media_handler import media_bp, init_media_directories
from websocket_media import MediaWebSocketHandler
from location_handler import location_bp
from websocket_location import LocationWebSocketHandler

# Import socket events
from socket_events import register_socket_events

# Import time here to avoid eventlet conflicts
import time

# Set timezone
os.environ['TZ'] = TIMEZONE
if hasattr(time, 'tzset'):
    time.tzset()

print(f"[DEBUG] Server starting at: {time.strftime('%Y-%m-%d %H:%M:%S')}")
print(f"[DEBUG] Timezone: {TIMEZONE}")

# ==================== SESSION HELPER ====================

def is_authenticated():
    """Enterprise-grade authentication check"""
    try:
        return (
            session.get('user_authenticated') == True and 
            session.get('user_id') is not None and
            session.get('user_id') != ''
        )
    except Exception as e:
        print(f"[AUTH] Session check failed: {e}")
        return False

def require_auth():
    """Check authentication and redirect if needed"""
    if not is_authenticated():
        print(f"[AUTH] Unauthorized access attempt - redirecting to login")
        return redirect('/login', code=302)
    return None

# ==================== FLASK APP INITIALIZATION ====================

# Create Flask app
app = Flask(__name__)
# Initialize Flask-Login
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'auth.login'

@login_manager.user_loader
def load_user(user_id):
    """Load user by ID for Flask-Login"""
    from flask_login import UserMixin
    class User(UserMixin):
        def __init__(self, id):
            self.id = id
    return User(user_id) if user_id else None

app.config['SECRET_KEY'] = SECRET_KEY
app.config['PERMANENT_SESSION_LIFETIME'] = SESSION_LIFETIME
app.config['SESSION_COOKIE_NAME'] = SESSION_COOKIE_NAME
app.config['SESSION_COOKIE_SAMESITE'] = SESSION_COOKIE_SAMESITE
app.config['SESSION_COOKIE_SECURE'] = SESSION_COOKIE_SECURE
app.config['SESSION_COOKIE_HTTPONLY'] = SESSION_COOKIE_HTTPONLY
app.config['SESSION_COOKIE_DOMAIN'] = SESSION_COOKIE_DOMAIN

# ✅ CRITICAL FIX: Set maximum file upload size to 3GB
app.config['MAX_CONTENT_LENGTH'] = MAX_FILE_SIZE  # 3GB for chunked uploads
print(f"[CONFIG] Max file upload size: {MAX_FILE_SIZE / (1024 * 1024 * 1024):.1f}GB")

os.environ['OAUTHLIB_INSECURE_TRANSPORT'] = '1'

# Enable CORS
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

# Initialize SocketIO with eventlet async mode
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='eventlet',
                    max_http_buffer_size=10 * 1024 * 1024)  # 10MB WebSocket buffer

init_message_socketio(socketio)
# Register socket events
register_socket_events(socketio)

# Register blueprints
app.register_blueprint(auth_bp)
app.register_blueprint(user_bp)
app.register_blueprint(message_bp)
app.register_blueprint(media_bp)
app.register_blueprint(location_bp)
app.register_blueprint(database_bp)
print("[SUCCESS] Database Manager loaded")

# Register Biometric routes
try:
    from routes.biometric_routes import biometric_bp
    app.register_blueprint(biometric_bp)
    print("[SUCCESS] Biometric system loaded")
except ImportError as e:
    print(f"[WARNING] Biometric system not loaded: {e}")

# Initialize handlers
init_media_directories()
media_ws_handler = MediaWebSocketHandler(socketio)
location_ws_handler = LocationWebSocketHandler(socketio)

# Ensure upload folder exists
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# ✅ Create chunks folder for chunked uploads
chunks_folder = os.path.join(UPLOAD_FOLDER, 'chunks')
if not os.path.exists(chunks_folder):
    os.makedirs(chunks_folder)
    print(f"[SUCCESS] Created chunks folder: {chunks_folder}")

print("[SUCCESS] All modules loaded successfully")

# ==================== MAIN ROUTES ====================

@app.route('/')
def index():
    """Main route - redirect based on authentication"""
    auth_check = require_auth()
    if auth_check:
        return auth_check
    
    print(f"[ACCESS] User {session.get('user_id')} accessing main page")
    return render_template('index.html')

@app.route('/login')
def login_page():
    """Serve unified login page"""
    if is_authenticated():
        print(f"[AUTH] User {session.get('user_id')} already authenticated - redirecting to main")
        return redirect('/', code=302)
    
    print("[AUTH] Serving login page")
    return render_template('login.html')

@app.route('/test_biometric')
def test_biometric():
    """Biometric test page"""
    return render_template('test_biometric.html')

# ==================== HEALTH CHECK ====================

@app.route('/health')
def health_check():
    """Health check endpoint for Docker and monitoring"""
    return jsonify({
        'status': 'healthy',
        'timestamp': time.time(),
        'service': 'CA360 Chat',
        'version': '2.0'
    }), 200

# ==================== STATIC ROUTES ====================

@app.route('/sw.js')
def service_worker():
    """Serve service worker"""
    response = make_response(send_from_directory('static', 'sw.js'))
    response.headers['Content-Type'] = 'application/javascript'
    response.headers['Service-Worker-Allowed'] = '/'
    return response

@app.route('/api/log-error', methods=['POST'])
def log_error():
    """Log client-side errors"""
    try:
        data = request.json
        user_id = data.get('user_id', 'unknown')
        error_msg = data.get('error', 'No message')
        stack = data.get('stack', '')
        url = data.get('url', '')
        timestamp = data.get('timestamp', '')
        
        print(f"\n{'='*60}")
        print(f"[CLIENT ERROR] User: {user_id}")
        print(f"[MSG] {error_msg}")
        print(f"[URL] {url}")
        print(f"[TIME] {timestamp}")
        if stack:
            print(f"[STACK] {stack[:500]}...")
        print(f"{'='*60}\n")
        
        return jsonify({'success': True})
    except Exception as e:
        print(f"[ERROR] Failed to log client error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

# ==================== ERROR HANDLERS ====================

@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    print(f"[404] Not found: {request.url}")
    return jsonify({'error': 'Not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    print(f"[500] Internal error: {error}")
    return jsonify({'error': 'Internal server error'}), 500

@app.errorhandler(413)
def request_entity_too_large(error):
    """Handle file too large errors"""
    print(f"[413] File too large")
    return jsonify({'error': 'File too large. Maximum size is 3GB'}), 413

# ==================== DATABASE MANAGER ROUTES ====================

@app.route('/database-manager')
@login_required
def database_manager():
    """Database Manager Page - Super Admin Only"""
    if session.get('role') not in ['admin', 'superadmin']:
        from flask import flash, url_for
        flash('Access denied. Admin privileges required.', 'error')
        return redirect(url_for('index'))
    return render_template('database_manager.html')

@app.route('/api/backup/create', methods=['POST'])
@login_required
def create_backup():
    """Create backup via API"""
    if session.get('role') not in ['admin', 'superadmin']:
        return jsonify({'success': False, 'message': 'Access denied'})
    
    try:
        import shutil
        from datetime import datetime
        
        backup_base = '/backups'
        timestamp = datetime.now().strftime('%Y-%m-%d_%H-%M-%S')
        backup_folder = os.path.join(backup_base, f'Backup_{timestamp}')
        os.makedirs(backup_folder, exist_ok=True)
        
        for item in ['templates', 'static', 'routes']:
            src = os.path.join('/app', item)
            if os.path.exists(src):
                dst = os.path.join(backup_folder, item)
                shutil.copytree(src, dst, dirs_exist_ok=True)
        
        for file in os.listdir('/app'):
            if file.endswith('.py'):
                shutil.copy2(os.path.join('/app', file), backup_folder)
        
        for file in ['docker-compose.yml', 'Dockerfile', 'nginx.conf']:
            src_file = os.path.join('/app', file)
            if os.path.exists(src_file):
                shutil.copy2(src_file, backup_folder)
        
        db_backup = os.path.join(backup_folder, 'database_backup.sql')
        import subprocess
        subprocess.run(['mysqldump', '-h', 'kaa_mysql', '-u', 'root', '-p123', 'kaa_ho'], 
                      stdout=open(db_backup, 'w'), stderr=subprocess.DEVNULL)
        
        total_size = sum(os.path.getsize(os.path.join(dirpath, filename))
                        for dirpath, dirnames, filenames in os.walk(backup_folder)
                        for filename in filenames) / (1024 * 1024)
        
        return jsonify({
            'success': True,
            'backup_name': f'Backup_{timestamp}',
            'size': f'{total_size:.2f} MB'
        })
        
    except Exception as e:
        import traceback
        return jsonify({'success': False, 'message': f'{str(e)}\n{traceback.format_exc()}'})

# ==================== STARTUP (Only for local development) ====================
# Note: This block is NOT executed when running via Gunicorn

if __name__ == '__main__':
    print("\n" + "="*70)
    print(" CA360 CHAT - ENTERPRISE ARCHITECTURE")
    print("="*70)
    print("\n[WARNING] Running in development mode!")
    print("[INFO] For production, use: gunicorn --worker-class eventlet app:socketio")
    print("="*70 + "\n")
    
    # Run the application with eventlet (development only)
    socketio.run(app, debug=True, host='0.0.0.0', port=5000, allow_unsafe_werkzeug=True)