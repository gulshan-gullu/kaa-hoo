"""
Authentication Routes
"""
from flask import Blueprint, request, jsonify, session, redirect
from database import verify_user
from auth import login_user, create_oauth_flow, handle_google_callback

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/api/login', methods=['POST'])
def login():
    """Traditional login"""
    data = request.get_json()
    
    login_input = (data.get('user_id') or '').strip()
    password = (data.get('password') or '').strip()
    
    if not login_input or not password:
        return jsonify({'success': False, 'message': 'Missing credentials'}), 400
    
    user = verify_user(login_input, password)
    if not user:
        return jsonify({'success': False, 'message': 'Invalid credentials'}), 401
    
    login_user(user)
    
    return jsonify({
        'success': True,
        'user': {
            'id': user['user_id'],
            'name': user['name'],
            'role': user['role']
        }
    })

@auth_bp.route('/api/google-login')
def google_login():
    """Initiate Google OAuth"""
    try:
        flow = create_oauth_flow()
        authorization_url, state = flow.authorization_url(
            access_type='offline',
            include_granted_scopes='true',
            prompt='select_account'
        )
        
        session['oauth_state'] = state
        return jsonify({'success': True, 'auth_url': authorization_url})
        
    except Exception as e:
        print(f"[ERROR] Google login failed: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@auth_bp.route('/callback')
def oauth_callback():
    """Handle Google OAuth callback"""
    state_from_url = request.args.get('state')
    
    if 'oauth_state' not in session:
        if not state_from_url:
            return redirect('/')
        session_state = state_from_url
    else:
        session_state = session['oauth_state']
    
    success, user = handle_google_callback(request.url, session_state)
    
    if success:
        return '''
            <!DOCTYPE html>
            <html>
            <head>
                <meta http-equiv="refresh" content="0;url=/">
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        height: 100vh;
                        margin: 0;
                        background: #1a1a1a;
                        color: white;
                    }
                    .spinner {
                        border: 4px solid #f3f3f3;
                        border-top: 4px solid #3498db;
                        border-radius: 50%;
                        width: 40px;
                        height: 40px;
                        animation: spin 1s linear infinite;
                        margin: 20px auto;
                    }
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                </style>
            </head>
            <body>
                <div style="text-align: center;">
                    <div class="spinner"></div>
                    <h2>✅ Login Successful!</h2>
                    <p>Redirecting...</p>
                </div>
            </body>
            </html>
        '''
    else:
        return redirect('/')

@auth_bp.route('/api/session')
def check_session():
    """Check if user is logged in"""
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

@auth_bp.route('/api/logout', methods=['POST'])
def logout():
    """Logout user"""
    session.clear()
    return jsonify({'success': True})