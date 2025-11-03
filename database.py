'''
Database Connection and Query Functions
All database operations in one place
'''
import mysql.connector
from mysql.connector import pooling
from datetime import datetime
import hashlib

# --- âœ… THE FIX IS HERE ---
# Import the new, individual variables from your updated config file.
from config import DATABASE_HOST, DATABASE_USER, DATABASE_PASSWORD, DATABASE_NAME

# Build the configuration dictionary that the connection pool expects.
MYSQL_CONFIG = {
    'host': DATABASE_HOST,
    'user': DATABASE_USER,
    'password': DATABASE_PASSWORD,
    'database': DATABASE_NAME,
    'port': 3306
}
# -------------------------

# Global variable for connection pool
_connection_pool = None

def get_connection_pool():
    '''Get or create connection pool (lazy initialization)'''
    global _connection_pool
    if _connection_pool is None:
        try:
            _connection_pool = pooling.MySQLConnectionPool(
                pool_name='ca360_pool',
                pool_size=32, # Increased pool size for better performance
                pool_reset_session=True,
                **MYSQL_CONFIG
            )
            print('[SUCCESS] Database connection pool created.')
        except mysql.connector.Error as err:
            print(f'[DB ERROR] Failed to create connection pool: {err}')
            _connection_pool = None # Ensure it stays None on failure
    return _connection_pool

def get_db():
    '''Get database connection from pool'''
    try:
        pool = get_connection_pool()
        if not pool:
            raise Exception('Database connection pool is not available.')
        conn = pool.get_connection()
        return conn
    except Exception as e:
        print(f'[DB ERROR] Failed to get connection: {e}')
        raise

def hash_password(password):
    '''Hash password using SHA256'''
    return hashlib.sha256(password.encode()).hexdigest()

# ==================== USER FUNCTIONS ====================

def get_user(user_id):
    '''Get user by user_id'''
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    cursor.execute('SELECT * FROM users WHERE user_id = %s', (user_id,))
    user = cursor.fetchone()
    cursor.close()
    conn.close()
    return user

def verify_user(login_input, password):
    '''Login with user_id, email, or mobile'''
    conn = None
    cursor = None
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        
        cursor.execute('''
            SELECT * FROM users 
            WHERE user_id = %s OR email = %s
        ''', (login_input, login_input))
        
        user = cursor.fetchone()
        
        if user and ((user.get('password') or user.get('password_hash', '')) == hash_password(password)):
            cursor.execute('UPDATE users SET last_seen = NOW() WHERE user_id = %s', (user['user_id'],))
            conn.commit()
            return user
        
        return None
        
    except Exception as e:
        print(f'[DB ERROR] verify_user failed: {e}')
        return None
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

def get_all_users(except_user_id=None):
    '''Get all users'''
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    
    if except_user_id:
        cursor.execute('''
            SELECT user_id, name, email, mobile, role, profile_picture
            FROM users 
            WHERE user_id != %s
            ORDER BY name
        ''', (except_user_id,))
    else:
        cursor.execute('''
            SELECT user_id, name, email, mobile, role, profile_picture
            FROM users 
            ORDER BY name
        ''')
    
    users = cursor.fetchall()
    cursor.close()
    conn.close()
    return users

def create_user(user_id, name, password, role='client', email=None, mobile=None, 
                google_id=None, display_name=None, profile_picture=None):
    '''Create new user'''
    conn = get_db()
    cursor = conn.cursor()
    
    hashed_pw = hash_password(password) if password else None
    
    cursor.execute('''
        INSERT INTO users 
        (user_id, name, password, role, email, mobile, google_id, display_name, profile_picture, is_verified)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, TRUE)
    ''', (user_id, name, hashed_pw, role, email, mobile, google_id, 
          display_name or name, profile_picture))
    
    conn.commit()
    cursor.close()
    conn.close()

def update_user(user_id, **kwargs):
    '''Update user fields'''
    conn = get_db()
    cursor = conn.cursor()
    
    fields = []
    values = []
    for key, value in kwargs.items():
        if value == 'NOW()':
            fields.append(f'{key} = NOW()')
        else:
            fields.append(f'{key} = %s')
            values.append(value)
    
    if not fields:
        cursor.close()
        conn.close()
        return

    values.append(user_id)
    query = f'UPDATE users SET {', '.join(fields)} WHERE user_id = %s'
    
    cursor.execute(query, tuple(values))
    conn.commit()
    cursor.close()
    conn.close()

def delete_user(user_id):
    '''Delete user'''
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM users WHERE user_id = %s', (user_id,))
    deleted = cursor.rowcount
    conn.commit()
    cursor.close()
    conn.close()
    return deleted > 0

# ==================== MESSAGE FUNCTIONS ====================

def save_message(sender_id, receiver_id, message_text, message_type='text', file_id=None):
    '''Save a message'''
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    
    current_time = datetime.now()
    cursor.execute('''
        INSERT INTO messages (sender_id, receiver_id, text, timestamp, message_type, file_id) 
        VALUES (%s, %s, %s, %s, %s, %s)
    ''', (sender_id, receiver_id, message_text, current_time.strftime('%Y-%m-%d %H:%M:%S.%f'), message_type, file_id))
    
    message_id = cursor.lastrowid
    conn.commit()
    
    cursor.execute('SELECT * FROM messages WHERE id = %s', (message_id,))
    message = cursor.fetchone()
    
    cursor.close()
    conn.close()

    if not message:
        return None
    
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

def get_messages(user1_id, user2_id, limit=100):
    '''Get messages between two users'''
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

def mark_message_as_read(message_id, user_id):
    '''Mark message as read'''
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE messages SET is_read = 1 
        WHERE id = %s AND receiver_id = %s
    ''', (message_id, user_id))
    conn.commit()
    cursor.close()
    conn.close()

def get_unread_count(user_id, sender_id):
    '''Get unread message count'''
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

# ==================== FILE FUNCTIONS ====================

def save_file_info(file_id, original_name, file_type, file_size, file_path, uploaded_by):
    '''Save file information (legacy function)'''
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO files (file_id, original_name, file_type, file_size, file_path, uploaded_by)
        VALUES (%s, %s, %s, %s, %s, %s)
    ''', (file_id, original_name, file_type, file_size, file_path, uploaded_by))
    conn.commit()
    cursor.close()
    conn.close()

def save_file_to_db(file_info):
    '''
    Save file metadata to database (for chunked uploads)
    
    Args:
        file_info (dict): Dictionary containing:
            - file_id: Unique file identifier
            - original_name: Original filename
            - file_path: Path where file is stored
            - file_size: Size in bytes
            - file_type: MIME type
            - uploaded_by: User ID who uploaded
    
    Returns:
        bool: True if successful, False otherwise
    '''
    conn = None
    cursor = None
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO files (file_id, original_name, file_type, file_size, file_path, uploaded_by, upload_date)
            VALUES (%s, %s, %s, %s, %s, %s, NOW())
        ''', (
            file_info['file_id'],
            file_info['original_name'],
            file_info['file_type'],
            file_info['file_size'],
            file_info['file_path'],
            file_info['uploaded_by']
        ))
        
        conn.commit()
        print(f'✅ [DB] File saved: {file_info['original_name']} ({file_info['file_size']} bytes)')
        return True
        
    except Exception as e:
        print(f'❌ [DB ERROR] save_file_to_db failed: {e}')
        if conn:
            conn.rollback()
        return False
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

def get_file_info(file_id):
    '''Get file information'''
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    cursor.execute('SELECT * FROM files WHERE file_id = %s', (file_id,))
    file_info = cursor.fetchone()
    cursor.close()
    conn.close()
    return file_info

# ==================== STATISTICS FUNCTIONS ====================

def get_statistics():
    '''Get application statistics'''
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
    
    cursor.execute('''
        SELECT COUNT(*) as count FROM messages 
        WHERE DATE(timestamp) = CURDATE()
    ''')
    stats['messages_today'] = cursor.fetchone()['count']
    
    cursor.close()
    conn.close()
    return stats

def search_messages(query, user_id):
    '''Search messages'''
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
    
    return results

# ==================== CALL MODEL & FUNCTIONS ====================

# Call table model for audio/video calling system
CALL_MODEL = {
    'table': 'calls',
    'description': 'Stores call history and status for audio and video calls',
    'fields': ['call_id', 'caller_id', 'receiver_id', 'call_type', 'call_status', 'duration']
}

def get_call_history(user_id, limit=50):
    '''Get call history for a user'''
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute('''
        SELECT * FROM calls 
        WHERE caller_id = %s OR receiver_id = %s
        ORDER BY created_at DESC 
        LIMIT %s
    ''', (user_id, user_id, limit))
    
    calls = cursor.fetchall()
    cursor.close()
    conn.close()
    return calls

def save_call(call_id, caller_id, receiver_id, call_type='audio', call_status='initiated'):
    '''Save call record to database'''
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO calls (call_id, caller_id, receiver_id, call_type, call_status)
        VALUES (%s, %s, %s, %s, %s)
    ''', (call_id, caller_id, receiver_id, call_type, call_status))
    
    conn.commit()
    cursor.close()
    conn.close()

def update_call_status(call_id, status, duration=None):
    '''Update call status and duration'''
    conn = get_db()
    cursor = conn.cursor()
    
    if duration is not None:
        cursor.execute('''
            UPDATE calls 
            SET call_status = %s, duration = %s, end_time = NOW()
            WHERE call_id = %s
        ''', (status, duration, call_id))
    else:
        cursor.execute('''
            UPDATE calls 
            SET call_status = %s
            WHERE call_id = %s
        ''', (status, call_id))
    
    conn.commit()
    cursor.close()
    conn.close()

# ==================== âœ… NEW: CONTACT LAST MESSAGE FUNCTION ====================

def get_contact_with_last_message(user_id, contact_id):
    '''Get last message between user and contact'''
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    
    try:
        # Get last message
        cursor.execute('''
            SELECT text, timestamp, sender_id, message_type
            FROM messages 
            WHERE (sender_id = %s AND receiver_id = %s) 
               OR (sender_id = %s AND receiver_id = %s)
            ORDER BY timestamp DESC 
            LIMIT 1
        ''', (user_id, contact_id, contact_id, user_id))
        
        last_msg = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        return last_msg
        
    except Exception as e:
        print(f'[DB ERROR] get_contact_with_last_message failed: {e}')
        if cursor:
            cursor.close()
        if conn:
            conn.close()
        return None
