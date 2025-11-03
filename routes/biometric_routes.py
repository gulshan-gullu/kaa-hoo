"""
Biometric Authentication Routes
WebAuthn/FIDO2 Endpoints
"""
from flask import Blueprint, request, jsonify, session
from database import get_user, get_db
from auth import login_user
from biometric_system import (
    create_registration_options,
    verify_registration,
    create_authentication_options,
    verify_authentication,
    get_user_devices,
    delete_biometric_credential
)
import traceback

biometric_bp = Blueprint('biometric', __name__)

# ==================== REGISTRATION (Enrollment) ====================

@biometric_bp.route('/api/biometric/register/begin', methods=['POST'])
def begin_biometric_registration():
    """
    Step 1: Start biometric registration
    User must be logged in
    """
    print("=" * 80)  # ✅ TEST PRINT
    print("ROUTE CALLED: begin_biometric_registration")  # ✅ TEST PRINT
    print("=" * 80)  # ✅ TEST PRINT
    
    if not session.get('user_authenticated'):
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401
    
    user_id = session.get('user_id')
    user = get_user(user_id)
    
    if not user:
        return jsonify({'success': False, 'message': 'User not found'}), 404
    
    try:
        # Create registration options
        options = create_registration_options(
            user_id=user['user_id'],
            user_name=user['name'],
            user_email=user.get('email')
        )
        
        # Store challenge in session
        session['webauthn_challenge'] = options['challenge']
        session['webauthn_user_id'] = user_id
        session.modified = True
        
        # ✅ DEBUG: Verify challenge was saved
        print(f"[DEBUG] Challenge SAVED to session: {session.get('webauthn_challenge')}")
        print(f"[DEBUG] Session ID: {request.cookies.get('session')}")
        
        return jsonify({
            'success': True,
            'options': options
        })
        
    except Exception as e:
        print(f"[BIOMETRIC] Error: {e}")
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': f'Failed to create registration options: {str(e)}'
        }), 500

@biometric_bp.route('/api/biometric/register/complete', methods=['POST'])
def complete_biometric_registration():
    """
    Step 2: Complete biometric registration
    Verify and save credential
    """
    print("=" * 80)  # ✅ TEST PRINT
    print("ROUTE CALLED: complete_biometric_registration")  # ✅ TEST PRINT
    print("=" * 80)  # ✅ TEST PRINT
    
    if not session.get('user_authenticated'):
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401
    
    data = request.get_json()
    credential = data.get('credential')
    device_name = data.get('device_name', 'My Device')
    
    if not credential:
        return jsonify({'success': False, 'message': 'Credential required'}), 400
    
    # ✅ DEBUG: Check session state
    print(f"[DEBUG] Verifying... looking for challenge in session.")
    print(f"[DEBUG] Session ID: {request.cookies.get('session')}")
    print(f"[DEBUG] Session data: {dict(session)}")
    
    # Get challenge from session
    challenge = session.get('webauthn_challenge')
    user_id = session.get('webauthn_user_id')
    
    print(f"[DEBUG] Challenge FOUND in session: {challenge}")
    print(f"[DEBUG] User ID from session: {user_id}")
    
    if not challenge or not user_id:
        print(f"[DEBUG ERROR] Missing data - challenge: {challenge}, user_id: {user_id}")
        return jsonify({'success': False, 'message': 'Invalid session - challenge or user_id missing'}), 400
    
    try:
        success, message = verify_registration(user_id, credential, challenge)
        
        # Clear challenge from session
        session.pop('webauthn_challenge', None)
        session.pop('webauthn_user_id', None)
        session.modified = True
        
        if success:
            return jsonify({
                'success': True,
                'message': 'Biometric login enabled successfully!'
            })
        else:
            return jsonify({
                'success': False,
                'message': message
            }), 400
            
    except Exception as e:
        print(f"[BIOMETRIC] Error: {e}")
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': 'Registration failed'
        }), 500

# ==================== AUTHENTICATION (Login) ====================

@biometric_bp.route('/api/biometric/login/begin', methods=['POST'])
def begin_biometric_login():
    """
    Step 1: Start biometric login
    Get authentication options
    """
    print("=" * 80)  # ✅ TEST PRINT
    print("ROUTE CALLED: begin_biometric_login")  # ✅ TEST PRINT
    print("=" * 80)  # ✅ TEST PRINT
    
    data = request.get_json()
    user_identifier = data.get('user_id')  # Can be user_id, email, or mobile
    
    print(f"[DEBUG AUTH] User identifier received: {user_identifier}")  # ✅ DEBUG
    
    if not user_identifier:
        return jsonify({'success': False, 'message': 'User identifier required'}), 400
    
    # Find user
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    cursor.execute('''
        SELECT * FROM users 
        WHERE user_id = %s OR email = %s OR mobile = %s
    ''', (user_identifier, user_identifier, user_identifier))
    user = cursor.fetchone()
    cursor.close()
    conn.close()
    
    if not user:
        print(f"[DEBUG AUTH] User not found: {user_identifier}")  # ✅ DEBUG
        return jsonify({'success': False, 'message': 'User not found'}), 404
    
    print(f"[DEBUG AUTH] User found: {user['user_id']}")  # ✅ DEBUG
    
    try:
        options, error = create_authentication_options(user['user_id'])
        
        if not options:
            print(f"[DEBUG AUTH] No credentials: {error}")  # ✅ DEBUG
            return jsonify({
                'success': False,
                'message': error or 'No biometric credentials registered'
            }), 400
        
        # Store challenge in session
        session['webauthn_auth_challenge'] = options['challenge']
        session['webauthn_auth_user_id'] = user['user_id']
        session.modified = True
        
        # ✅ DEBUG: Verify challenge was saved
        print(f"[DEBUG AUTH] Challenge SAVED to session: {session.get('webauthn_auth_challenge')}")
        print(f"[DEBUG AUTH] Session ID: {request.cookies.get('session')}")
        
        return jsonify({
            'success': True,
            'options': options
        })
        
    except Exception as e:
        print(f"[BIOMETRIC] Error: {e}")
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': 'Failed to create authentication options'
        }), 500

@biometric_bp.route('/api/biometric/login/complete', methods=['POST'])
def complete_biometric_login():
    """
    Step 2: Complete biometric login
    Verify credential and log in user
    """
    print("=" * 80)  # ✅ TEST PRINT
    print("ROUTE CALLED: complete_biometric_login")  # ✅ TEST PRINT
    print("=" * 80)  # ✅ TEST PRINT
    
    data = request.get_json()
    credential = data.get('credential')
    
    if not credential:
        print("[DEBUG AUTH] No credential provided")  # ✅ DEBUG
        return jsonify({'success': False, 'message': 'Credential required'}), 400
    
    # ✅ DEBUG: Check session state
    print(f"[DEBUG AUTH] Verifying... looking for challenge in session.")
    print(f"[DEBUG AUTH] Session ID: {request.cookies.get('session')}")
    print(f"[DEBUG AUTH] Session data: {dict(session)}")
    
    # Get challenge from session
    challenge = session.get('webauthn_auth_challenge')
    user_id = session.get('webauthn_auth_user_id')
    
    print(f"[DEBUG AUTH] Challenge FOUND in session: {challenge}")
    print(f"[DEBUG AUTH] User ID from session: {user_id}")
    
    if not challenge or not user_id:
        print(f"[DEBUG AUTH ERROR] Missing data - challenge: {challenge}, user_id: {user_id}")
        return jsonify({'success': False, 'message': 'Invalid session'}), 400
    
    try:
        success, message, verified_user_id = verify_authentication(
            credential, challenge, user_id
        )
        
        print(f"[DEBUG AUTH] Verification result: success={success}, message={message}")  # ✅ DEBUG
        
        # Clear challenge from session
        session.pop('webauthn_auth_challenge', None)
        session.pop('webauthn_auth_user_id', None)
        session.modified = True
        
        if success:
            # Get user and log in
            user = get_user(verified_user_id)
            if user:
                login_user(user)
                
                print(f"[DEBUG AUTH] Login successful for: {user['user_id']}")  # ✅ DEBUG
                
                return jsonify({
                    'success': True,
                    'message': 'Login successful!',
                    'user': {
                        'id': user['user_id'],
                        'name': user['name'],
                        'role': user['role']
                    }
                })
            else:
                return jsonify({'success': False, 'message': 'User not found'}), 404
        else:
            return jsonify({
                'success': False,
                'message': message
            }), 400
            
    except Exception as e:
        print(f"[BIOMETRIC] Error: {e}")
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': 'Authentication failed'
        }), 500

# ==================== DEVICE MANAGEMENT ====================

@biometric_bp.route('/api/biometric/devices', methods=['GET'])
def list_biometric_devices():
    """Get list of registered biometric devices"""
    if not session.get('user_authenticated'):
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401
    
    user_id = session.get('user_id')
    devices = get_user_devices(user_id)
    
    return jsonify({
        'success': True,
        'devices': devices
    })

@biometric_bp.route('/api/biometric/devices/<credential_id>', methods=['DELETE'])
def remove_biometric_device(credential_id):
    """Remove a biometric device"""
    if not session.get('user_authenticated'):
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401
    
    user_id = session.get('user_id')
    
    if delete_biometric_credential(user_id, credential_id):
        return jsonify({
            'success': True,
            'message': 'Device removed successfully'
        })
    else:
        return jsonify({
            'success': False,
            'message': 'Device not found'
        }), 404

@biometric_bp.route('/api/biometric/check', methods=['GET'])
def check_biometric_support():
    """Check if user has biometric credentials registered"""
    if not session.get('user_authenticated'):
        return jsonify({'success': False, 'authenticated': False}), 401
    
    user_id = session.get('user_id')
    devices = get_user_devices(user_id)
    
    return jsonify({
        'success': True,
        'has_biometric': len(devices) > 0,
        'device_count': len(devices)
    })