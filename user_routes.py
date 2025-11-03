'''
User Management Routes
'''
from flask import Blueprint, request, jsonify, session
from database import (get_all_users, get_unread_count, create_user, 
                      delete_user, hash_password, get_db, verify_user, get_user,
                      get_contact_with_last_message)
from utils import format_user_for_response

user_bp = Blueprint('users', __name__)

# ==================== 📞 CALLING SYSTEM ROUTE ====================

@user_bp.route('/api/users/<user_id>')
def get_user_api(user_id):
    '''
    Get user details by user_id
    Required for calling system to display caller/receiver names
    
    Returns:
        JSON with user details (name, email, role, etc.)
    '''
    try:
        user = get_user(user_id)
        if not user:
            print(f'[API] ❌ User not found: {user_id}')
            return jsonify({'error': 'User not found'}), 404
        
        response = {
            'user_id': user['user_id'],
            'name': user['name'] or user['user_id'],
            'email': user.get('email'),
            'mobile': user.get('mobile'),
            'role': user.get('role', 'client'),
            'profile_picture': user.get('profile_picture'),
            'display_name': user.get('display_name') or user['name']
        }
        
        print(f'[API] ✅ User details fetched: {user_id} ({user['name']})')
        return jsonify(response)
        
    except Exception as e:
        print(f'[API] ❌ Error fetching user {user_id}: {e}')
        import traceback
        traceback.print_exc()
        return jsonify({'error': 'Server error'}), 500

# ==================== CONTACT ROUTES ====================

@user_bp.route('/api/contacts')
def get_contacts():
    '''Get all users (contacts) with last messages'''
    if not session.get('user_authenticated'):
        return jsonify({'success': False}), 401
    
    from socket_events import get_online_users
    
    online_users = get_online_users()
    current_user_id = session.get('user_id')
    users = get_all_users(current_user_id)
    
    contacts = []
    for user in users:
        unread = get_unread_count(current_user_id, user['user_id'])
        is_online = user['user_id'] in online_users
        
        # âœ… GET LAST MESSAGE
        last_msg = get_contact_with_last_message(current_user_id, user['user_id'])
        
        contact_data = {
            'id': user['user_id'],
            'name': user['name'],
            'email': user.get('email'),
            'mobile': user.get('mobile'),
            'role': user['role'],
            'profile_picture': user.get('profile_picture'),
            'online': is_online,
            'unread_count': unread
        }
        
        # Add last message info
        if last_msg:
            msg_text = last_msg['text'] or ''
            # Truncate long messages
            if len(msg_text) > 50:
                msg_text = msg_text[:50] + '...'
            
            contact_data['last_message'] = msg_text
            contact_data['last_message_time'] = str(last_msg['timestamp'])
            contact_data['last_message_type'] = last_msg.get('message_type', 'text')
        else:
            contact_data['last_message'] = 'No messages yet'
            contact_data['last_message_time'] = None
            contact_data['last_message_type'] = 'text'
        
        contacts.append(contact_data)
    
    # Sort by last message time (most recent first)
    contacts.sort(key=lambda x: x['last_message_time'] or '', reverse=True)
    
    print(f'[CONTACTS] Loaded {len(contacts)} contacts for {current_user_id}')
    return jsonify({'success': True, 'contacts': contacts})

# ==================== ADMIN ROUTES ====================

@user_bp.route('/api/admin/users', methods=['GET'])
def get_all_users_admin():
    '''Get all users (admin only)'''
    if not session.get('user_authenticated') or session.get('user_role') != 'admin':
        return jsonify({'success': False, 'message': 'Admin access required'}), 403
    
    from socket_events import get_online_users
    online_users = get_online_users()
    
    users = get_all_users()
    
    user_list = []
    for user in users:
        user_list.append({
            'id': user['user_id'],
            'name': user['name'],
            'email': user.get('email'),
            'mobile': user.get('mobile'),
            'role': user['role'],
            'is_online': user['user_id'] in online_users
        })
    
    return jsonify({'success': True, 'users': user_list})

@user_bp.route('/api/admin/add-user', methods=['POST'])
def add_user():
    '''Add new user (admin only)'''
    if not session.get('user_authenticated') or session.get('user_role') != 'admin':
        return jsonify({'success': False, 'message': 'Admin access required'}), 403
    
    data = request.get_json()
    user_id = data.get('user_id', '').strip()
    name = data.get('name', '').strip()
    email = data.get('email', '').strip() or None
    mobile = data.get('mobile', '').strip() or None
    password = data.get('password', '').strip()
    role = data.get('role', 'client').strip().lower()
    
    # Validation
    if not user_id or not name or not password:
        return jsonify({'success': False, 'message': 'User ID, name, and password required'}), 400
    
    if not email and not mobile:
        return jsonify({'success': False, 'message': 'Either email or mobile required'}), 400
    
    if role not in ['client', 'staff', 'admin']:
        return jsonify({'success': False, 'message': 'Invalid role'}), 400
    
    # Check duplicates
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute('SELECT user_id FROM users WHERE user_id = %s', (user_id,))
    if cursor.fetchone():
        cursor.close()
        conn.close()
        return jsonify({'success': False, 'message': 'User ID already exists'}), 400
    
    if email:
        cursor.execute('SELECT user_id FROM users WHERE email = %s', (email,))
        if cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({'success': False, 'message': 'Email already exists'}), 400
    
    if mobile:
        cursor.execute('SELECT user_id FROM users WHERE mobile = %s', (mobile,))
        if cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({'success': False, 'message': 'Mobile already exists'}), 400
    
    cursor.close()
    conn.close()
    
    # Create user
    try:
        create_user(
            user_id=user_id,
            name=name,
            password=password,
            role=role,
            email=email,
            mobile=mobile,
            display_name=name
        )
        
        print(f'[ADMIN] ✅ New user: {name} (ID: {user_id}, Email: {email}, Mobile: {mobile})')
        return jsonify({'success': True, 'message': f'User {user_id} added successfully'})
        
    except Exception as e:
        return jsonify({'success': False, 'message': f'Database error: {str(e)}'}), 500

@user_bp.route('/api/admin/delete-user', methods=['POST'])
def delete_user_route():
    '''Delete user (admin only)'''
    if not session.get('user_authenticated') or session.get('user_role') != 'admin':
        return jsonify({'success': False, 'message': 'Admin access required'}), 403
    
    data = request.get_json()
    user_id = data.get('user_id', '').strip()
    
    if not user_id:
        return jsonify({'success': False, 'message': 'User ID required'}), 400
    
    if user_id == session.get('user_id'):
        return jsonify({'success': False, 'message': 'Cannot delete your own account'}), 400
    
    if delete_user(user_id):
        print(f'[ADMIN] ❌ User deleted: {user_id}')
        return jsonify({'success': True, 'message': f'User {user_id} deleted'})
    else:
        return jsonify({'success': False, 'message': 'User not found'}), 404

@user_bp.route('/api/change-password', methods=['POST'])
def change_password():
    '''Change user password'''
    if not session.get('user_authenticated'):
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401
    
    data = request.get_json()
    current_password = data.get('current_password', '').strip()
    new_password = data.get('new_password', '').strip()
    
    if not current_password or not new_password:
        return jsonify({'success': False, 'message': 'All fields required'}), 400
    
    if len(new_password) < 3:
        return jsonify({'success': False, 'message': 'Password must be at least 3 characters'}), 400
    
    user_id = session.get('user_id')
    user = verify_user(user_id, current_password)
    
    if not user:
        return jsonify({'success': False, 'message': 'Current password incorrect'}), 401
    
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('UPDATE users SET password = %s WHERE user_id = %s', 
                   (hash_password(new_password), user_id))
    conn.commit()
    cursor.close()
    conn.close()
    
    print(f'[PASSWORD] User {user_id} changed password')
    return jsonify({'success': True, 'message': 'Password changed successfully'})
