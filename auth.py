"""
Authentication Logic Module
Handles login, logout, and OAuth flows.
"""
from flask import session, redirect, request
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from google_auth_oauthlib.flow import Flow
import secrets

# --- ✅ THE FIX IS HERE ---
# Import the new, individual variables from your updated config file.
from config import GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
# -------------------------

from database import get_user, create_user, update_user, hash_password

def login_user(user_data):
    """Creates a Flask session for the given user."""
    session.clear()
    session.permanent = True
    session['user_authenticated'] = True
    session['user_id'] = user_data['user_id']
    session['user_name'] = user_data['name']
    session['user_role'] = user_data['role']
    if user_data.get('google_id'):
        session['google_id'] = user_data['google_id']
    session.modified = True
    print(f"[AUTH] ✅ Session created for {user_data['user_id']}")

def logout_user():
    """Clears the user's session."""
    user_id = session.get('user_id', 'unknown')
    session.clear()
    print(f"[AUTH]  logout for user {user_id}")

def create_oauth_flow():
    """Creates a Google OAuth flow object."""
    # Build the client_config dictionary internally using the new variables.
    client_config = {
        "web": {
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "redirect_uris": [
                "http://127.0.0.1:5000/callback",
                "http://localhost:5000/callback",
                "https://localhost/callback" # Added for Nginx proxy
            ]
        }
    }

    flow = Flow.from_client_config(
        client_config,
        scopes=[
            'openid',
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/userinfo.profile'
        ],
        redirect_uri='https://localhost/callback' # Use the public-facing URI
    )
    return flow

def handle_google_callback():
    """Handles the callback from Google, verifies user, and logs them in."""
    try:
        flow = create_oauth_flow()
        # Use the full, original URL from the request to fetch the token
        flow.fetch_token(authorization_response=request.url)
        credentials = flow.credentials

        idinfo = id_token.verify_oauth2_token(
            credentials.id_token,
            google_requests.Request(),
            GOOGLE_CLIENT_ID,
            clock_skew_in_seconds=120
        )

        google_id = idinfo['sub']
        email = idinfo.get('email')
        name = idinfo.get('name')
        picture = idinfo.get('picture')

        # Find or create user in the database
        # (This logic is simplified; you might have a more complex version)
        user = get_user(google_id) # Assuming you might use google_id as a primary lookup
        if not user:
             # A more robust check would be to search by email as well
            user_id = f"G-{secrets.token_hex(4)}"
            create_user(
                user_id=user_id,
                name=name,
                password=secrets.token_hex(16), # Create a random password for OAuth users
                email=email,
                google_id=google_id,
                display_name=name,
                profile_picture=picture
            )
            user = get_user(user_id)
        
        if user:
            # Update user info and log them in
            update_user(user['user_id'], last_seen='NOW()', profile_picture=picture)
            login_user(user)
            return True, "Login successful"
        else:
            return False, "Failed to create or find user account."

    except Exception as e:
        print(f"[AUTH ERROR] Google callback failed: {e}")
        import traceback
        traceback.print_exc()
        return False, str(e)