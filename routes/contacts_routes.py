"""
Enhanced Contacts Routes - WhatsApp Style
"""
from flask import Blueprint, request, jsonify, session
from functools import wraps

contacts_bp = Blueprint('contacts', __name__)

# Import from parent
def get_db_connection():
    """Will be set from main app"""
    from app import get_db_connection as gdc
    return gdc()

def login_required(f):
    """Will be set from main app"""
    from app import login_required as lr
    return lr(f)

@contacts_bp.route('/api/contacts/sync', methods=['POST'])
def sync_contacts():
    """Sync phone contacts - WhatsApp style"""
    if not session.get('user_authenticated'):
        return jsonify({'success': False}), 401
    
    user_id = session.get('user_id')
    data = request.json
    phone_contacts = data.get('contacts', [])
    
    if not phone_contacts:
        return jsonify({'error': 'No contacts provided'}), 400
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = conn.cursor(dictionary=True)
        synced_contacts = []
        
        for contact in phone_contacts:
            name = contact.get('name')
            phone = contact.get('phone')
            
            if not phone.startswith('+'):
                phone = '+91' + phone
            
            # Check if registered
            cursor.execute("SELECT id, name, profile_picture, status_message, is_online, last_seen FROM users WHERE phone = %s", (phone,))
            registered_user = cursor.fetchone()
            
            if registered_user:
                contact_user_id = registered_user['id']
                
                cursor.execute("SELECT id FROM contacts WHERE user_id = %s AND contact_id = %s", (user_id, contact_user_id))
                
                if not cursor.fetchone():
                    cursor.execute("""
                        INSERT INTO contacts (user_id, contact_id, contact_phone, contact_name, is_registered)
                        VALUES (%s, %s, %s, %s, TRUE)
                    """, (user_id, contact_user_id, phone, name))
                
                synced_contacts.append({
                    'id': contact_user_id,
                    'name': registered_user['name'],
                    'phone': phone,
                    'profile_picture': registered_user['profile_picture'],
                    'is_registered': True
                })
            else:
                synced_contacts.append({
                    'name': name,
                    'phone': phone,
                    'is_registered': False
                })
        
        conn.commit()
        return jsonify({'success': True, 'contacts': synced_contacts}), 200
        
    except Exception as e:
        print(f"❌ Error syncing contacts: {e}")
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()


@contacts_bp.route('/api/contacts/invite', methods=['POST'])
def invite_contact():
    """Send invite to non-registered contact"""
    if not session.get('user_authenticated'):
        return jsonify({'success': False}), 401
    
    user_id = session.get('user_id')
    data = request.json
    
    invited_phone = data.get('phone')
    invited_name = data.get('name')
    method = data.get('method', 'sms')
    
    if not invited_phone:
        return jsonify({'error': 'Phone required'}), 400
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO invites (inviter_user_id, invited_phone, invited_name, invite_method)
            VALUES (%s, %s, %s, %s)
        """, (user_id, invited_phone, invited_name, method))
        conn.commit()
        
        invite_link = f"https://ca360chat.com/download?ref={user_id}"
        
        return jsonify({
            'success': True,
            'message': 'Invite sent!',
            'invite_link': invite_link
        }), 200
        
    except Exception as e:
        print(f"❌ Error sending invite: {e}")
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()


@contacts_bp.route('/api/contacts/check-registered', methods=['POST'])
def check_contact_registered():
    """Check if phone is registered"""
    if not session.get('user_authenticated'):
        return jsonify({'success': False}), 401
    
    data = request.json
    phone = data.get('phone')
    
    if not phone:
        return jsonify({'error': 'Phone required'}), 400
    
    if not phone.startswith('+'):
        phone = '+91' + phone
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT id, name, profile_picture FROM users WHERE phone = %s", (phone,))
        user = cursor.fetchone()
        cursor.close()
        conn.close()
        
        if user:
            return jsonify({
                'registered': True,
                'user': {
                    'id': user['id'],
                    'name': user['name'],
                    'profile_picture': user['profile_picture']
                }
            }), 200
        else:
            return jsonify({'registered': False}), 200
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return jsonify({'error': str(e)}), 500