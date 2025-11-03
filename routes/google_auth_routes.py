"""
Google OAuth Authentication Routes
"""
from flask import Blueprint, request, jsonify, session
from datetime import datetime, timedelta
import os

google_auth_bp = Blueprint('google_auth', __name__)

def get_db_connection():
    """Import from main app"""
    from app import get_db_connection as gdc
    return gdc()

def generate_session_token():
    """Import from main app"""
    from app import generate_session_token as gst
    return gst()

@google_auth_bp.route('/api/auth/google/verify', methods=['POST'])
def verify_google_token():
    """Verify Google ID token from frontend"""
    try:
        from google.oauth2 import id_token
        from google.auth.transport import requests as google_requests
        
        data = request.json
        token = data.get('token')
        
        if not token:
            return jsonify({'error': 'Token required'}), 400
        
        client_id = os.getenv('GOOGLE_CLIENT_ID', '').strip()
        
        if not client_id:
            return jsonify({'error': 'Google OAuth not configured'}), 500
        
        # Verify the token
        try:
            idinfo = id_token.verify_oauth2_token(
                token, 
                google_requests.Request(), 
                client_id
            )
            
            google_user_id = idinfo['sub']
            email = idinfo.get('email')
            name = idinfo.get('name')
            picture = idinfo.get('picture')
            email_verified = idinfo.get('email_verified', False)
            
            print(f"✅ Google verified: {email}")
            
            conn = get_db_connection()
            if not conn:
                return jsonify({'error': 'Database connection failed'}), 500
            
            cursor = conn.cursor(dictionary=True)
            
            # Check if Google account exists
            cursor.execute("SELECT * FROM users WHERE google_id = %s", (google_user_id,))
            user = cursor.fetchone()
            
            if user:
                # Existing user - login
                session_token = generate_session_token()
                expires_at = datetime.now() + timedelta(days=30)
                
                cursor.execute("""
                    INSERT INTO user_sessions (user_id, session_token, expires_at)
                    VALUES (%s, %s, %s)
                """, (user['id'], session_token, expires_at))
                
                cursor.execute("""
                    UPDATE users 
                    SET last_login_method = 'google', is_online = TRUE
                    WHERE id = %s
                """, (user['id'],))
                
                conn.commit()
                session['user_id'] = user['id']
                
                cursor.close()
                conn.close()
                
                return jsonify({
                    'success': True,
                    'session_token': session_token,
                    'user': {
                        'id': user['id'],
                        'name': user['name'],
                        'phone': user['phone'],
                        'email': user['email']
                    },
                    'needs_phone': False
                }), 200
            
            else:
                # New user - needs phone
                cursor.close()
                conn.close()
                
                return jsonify({
                    'success': True,
                    'needs_phone': True,
                    'google_data': {
                        'google_id': google_user_id,
                        'email': email,
                        'name': name,
                        'picture': picture,
                        'email_verified': email_verified
                    }
                }), 200
                
        except ValueError as e:
            print(f"❌ Invalid Google token: {e}")
            return jsonify({'error': 'Invalid token'}), 401
            
    except Exception as e:
        print(f"❌ Error verifying Google token: {e}")
        return jsonify({'error': str(e)}), 500


@google_auth_bp.route('/api/auth/google/complete', methods=['POST'])
def complete_google_registration():
    """Complete registration: Google + Phone OTP"""
    try:
        data = request.json
        
        google_id = data.get('google_id')
        email = data.get('email')
        name = data.get('name')
        picture = data.get('picture')
        phone = data.get('phone')
        otp = data.get('otp')
        
        if not all([google_id, phone, otp]):
            return jsonify({'error': 'Missing required fields'}), 400
        
        if not phone.startswith('+'):
            phone = '+91' + phone
        
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        
        cursor = conn.cursor(dictionary=True)
        
        # Verify OTP
        cursor.execute("""
            SELECT id FROM otp_verifications 
            WHERE phone = %s AND otp = %s 
            AND expires_at > NOW() AND verified = FALSE
            ORDER BY created_at DESC LIMIT 1
        """, (phone, otp))
        
        otp_record = cursor.fetchone()
        if not otp_record:
            cursor.close()
            conn.close()
            return jsonify({'error': 'Invalid or expired OTP'}), 400
        
        cursor.execute("UPDATE otp_verifications SET verified = TRUE WHERE id = %s", (otp_record['id'],))
        
        # Check if phone exists
        cursor.execute("SELECT id FROM users WHERE phone = %s", (phone,))
        existing = cursor.fetchone()
        
        if existing:
            # Link Google to existing phone account
            cursor.execute("""
                UPDATE users 
                SET google_id = %s, email = %s, google_profile_picture = %s, 
                    email_verified = TRUE, last_login_method = 'google'
                WHERE phone = %s
            """, (google_id, email, picture, phone))
            
            user_id = existing['id']
            is_new_user = False
        else:
            # Create new user
            cursor.execute("""
                INSERT INTO users (phone, email, google_id, name, 
                                   google_profile_picture, email_verified, 
                                   last_login_method, created_at)
                VALUES (%s, %s, %s, %s, %s, TRUE, 'google', NOW())
            """, (phone, email, google_id, name, picture))
            
            user_id = cursor.lastrowid
            is_new_user = True
        
        # Create session
        session_token = generate_session_token()
        expires_at = datetime.now() + timedelta(days=30)
        
        cursor.execute("""
            INSERT INTO user_sessions (user_id, session_token, expires_at)
            VALUES (%s, %s, %s)
        """, (user_id, session_token, expires_at))
        
        conn.commit()
        
        cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
        user = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        session['user_id'] = user_id
        
        return jsonify({
            'success': True,
            'session_token': session_token,
            'is_new_user': is_new_user,
            'user': {
                'id': user['id'],
                'phone': user['phone'],
                'email': user['email'],
                'name': user['name']
            }
        }), 200
        
    except Exception as e:
        print(f"❌ Error completing registration: {e}")
        if 'conn' in locals():
            conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()