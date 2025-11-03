"""
Biometric Authentication System
WebAuthn/FIDO2 Implementation for Fingerprint & Face ID
"""
import secrets
import base64
import json
from datetime import datetime
from database import get_db

try:
    from webauthn import (
        generate_registration_options,
        verify_registration_response,
        generate_authentication_options,
        verify_authentication_response,
        options_to_json
    )
    from webauthn.helpers.structs import (
        AuthenticatorSelectionCriteria,
        UserVerificationRequirement,
        ResidentKeyRequirement,
        PublicKeyCredentialDescriptor,
        AttestationConveyancePreference,
        AuthenticatorAttachment
    )
    from webauthn.helpers.cose import COSEAlgorithmIdentifier
    WEBAUTHN_AVAILABLE = True
except ImportError:
    WEBAUTHN_AVAILABLE = False
    print("[BIOMETRIC] ⚠️ WebAuthn library not installed. Run: pip install webauthn")

# WebAuthn Configuration
RP_ID = "localhost"  # Change to your domain in production
RP_NAME = "KAA HO Chat"
ORIGIN = "https://localhost"  # Change to https://yourdomain.com in production

def generate_challenge():
    """Generate random challenge for WebAuthn"""
    return base64.urlsafe_b64encode(secrets.token_bytes(32)).decode('utf-8')

def get_user_credentials(user_id):
    """Get all registered biometric credentials for a user"""
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute('''
        SELECT * FROM biometric_credentials 
        WHERE user_id = %s AND is_active = TRUE
    ''', (user_id,))
    
    credentials = cursor.fetchall()
    cursor.close()
    conn.close()
    
    return credentials

def save_biometric_credential(user_id, credential_id, public_key, sign_count, device_name=None):
    """Save new biometric credential"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO biometric_credentials 
        (user_id, credential_id, public_key, sign_count, device_name, is_active)
        VALUES (%s, %s, %s, %s, %s, TRUE)
    ''', (user_id, credential_id, public_key, sign_count, device_name or 'Unnamed Device'))
    
    conn.commit()
    cursor.close()
    conn.close()
    
    print(f"[BIOMETRIC] ✅ Credential saved for user {user_id}")

def update_sign_count(credential_id, new_sign_count):
    """Update credential sign count (prevents replay attacks)"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('''
        UPDATE biometric_credentials 
        SET sign_count = %s, last_used = NOW()
        WHERE credential_id = %s
    ''', (new_sign_count, credential_id))
    
    conn.commit()
    cursor.close()
    conn.close()

def delete_biometric_credential(user_id, credential_id):
    """Delete a biometric credential"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('''
        DELETE FROM biometric_credentials 
        WHERE user_id = %s AND credential_id = %s
    ''', (user_id, credential_id))
    
    deleted = cursor.rowcount
    conn.commit()
    cursor.close()
    conn.close()
    
    return deleted > 0

def create_registration_options(user_id, user_name, user_email):
    """
    Create WebAuthn registration options
    This is step 1 of biometric enrollment
    """
    if not WEBAUTHN_AVAILABLE:
        raise Exception("WebAuthn library not available")
    
    try:
        # ✅ FIXED: The user_id is encoded directly to bytes.
        user_handle = user_id.encode('utf-8')
        
        options = generate_registration_options(
            rp_id=RP_ID,
            rp_name=RP_NAME,
            user_id=user_handle,  # Now correctly passed as bytes
            user_name=user_email or user_name,
            user_display_name=user_name,
            attestation=AttestationConveyancePreference.DIRECT,
            authenticator_selection=AuthenticatorSelectionCriteria(
                authenticator_attachment=AuthenticatorAttachment.PLATFORM,
                require_resident_key=True,
                user_verification=UserVerificationRequirement.REQUIRED
            ),
            timeout=30000
        )
        
        # Convert to JSON-serializable dict
        options_json = options_to_json(options)
        
        print(f"[BIOMETRIC] Registration options created for {user_name}")
        return json.loads(options_json)
        
    except Exception as e:
        print(f"[BIOMETRIC ERROR] Failed to create registration options: {e}")
        import traceback
        traceback.print_exc()
        raise

def verify_registration(user_id, credential_data, challenge):
    """
    Verify WebAuthn registration response
    This is step 2 of biometric enrollment
    """
    if not WEBAUTHN_AVAILABLE:
        raise Exception("WebAuthn library not available")
    
    try:
        # ✅ FIX: Add padding if needed before decoding
        # URL-safe base64 can have missing padding
        challenge_padded = challenge + '=' * (4 - len(challenge) % 4) if len(challenge) % 4 else challenge
        
        verification = verify_registration_response(
            credential=credential_data,
            expected_challenge=base64.urlsafe_b64decode(challenge_padded),  # Use padded version
            expected_rp_id=RP_ID,
            expected_origin=ORIGIN,
        )
        
        # Save credential to database
        credential_id_b64 = base64.urlsafe_b64encode(verification.credential_id).decode('utf-8')
        public_key_b64 = base64.urlsafe_b64encode(verification.credential_public_key).decode('utf-8')
        
        save_biometric_credential(
            user_id=user_id,
            credential_id=credential_id_b64,
            public_key=public_key_b64,
            sign_count=verification.sign_count
        )
        
        print(f"[BIOMETRIC] ✅ Registration verified for user {user_id}")
        return True, "Biometric registration successful!"
        
    except Exception as e:
        print(f"[BIOMETRIC] ❌ Registration verification failed: {e}")
        return False, str(e)

def create_authentication_options(user_id):
    """
    Create WebAuthn authentication options
    This is step 1 of biometric login
    """
    if not WEBAUTHN_AVAILABLE:
        return None, "WebAuthn library not available"
    
    try:
        # Get user's registered credentials
        credentials = get_user_credentials(user_id)
        
        if not credentials:
            return None, "No biometric credentials registered"
        
        # Convert credentials to WebAuthn format
        allow_credentials = []
        for cred in credentials:
            credential_id = base64.urlsafe_b64decode(cred['credential_id'])
            allow_credentials.append(
                PublicKeyCredentialDescriptor(id=credential_id)
            )
        
        options = generate_authentication_options(
            rp_id=RP_ID,
            allow_credentials=allow_credentials,
            user_verification=UserVerificationRequirement.PREFERRED,
        )
        
        options_json = options_to_json(options)
        
        print(f"[BIOMETRIC] Authentication options created for user {user_id}")
        return json.loads(options_json), None
        
    except Exception as e:
        print(f"[BIOMETRIC] ❌ Error creating authentication options: {e}")
        return None, str(e)

def verify_authentication(credential_data, challenge, user_id):
    """
    Verify WebAuthn authentication response
    This is step 2 of biometric login
    """
    if not WEBAUTHN_AVAILABLE:
        return False, "WebAuthn library not available", None
    
    try:
        # Get credential from database
        credential_id_received = credential_data.get('id', '')
        # ✅ FIX: Add padding if needed to match database format
        # The browser may strip padding, so we need to add it back
        credential_id_padded = credential_id_received + '=' * (4 - len(credential_id_received) % 4) if len(credential_id_received) % 4 else credential_id_received
        credential_id_b64 = credential_id_padded
        
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        cursor.execute('''
            SELECT * FROM biometric_credentials 
            WHERE credential_id = %s AND user_id = %s AND is_active = TRUE
        ''', (credential_id_b64, user_id))
        
        stored_credential = cursor.fetchone()
        cursor.close()
        conn.close()
        
        if not stored_credential:
            return False, "Credential not found", None
        
        # Decode stored public key
        public_key = base64.urlsafe_b64decode(stored_credential['public_key'])
        
        # ✅ FIX: Add padding if needed before decoding
        challenge_padded = challenge + '=' * (4 - len(challenge) % 4) if len(challenge) % 4 else challenge
        
        # Verify authentication
        verification = verify_authentication_response(
            credential=credential_data,
            expected_challenge=base64.urlsafe_b64decode(challenge_padded),  # Use padded version
            expected_rp_id=RP_ID,
            expected_origin=ORIGIN,
            credential_public_key=public_key,
            credential_current_sign_count=stored_credential['sign_count'],
        )
        
        # Update sign count (anti-replay)
        update_sign_count(credential_id_b64, verification.new_sign_count)
        
        print(f"[BIOMETRIC] ✅ Authentication verified for user {user_id}")
        return True, "Biometric authentication successful!", stored_credential['user_id']
        
    except Exception as e:
        print(f"[BIOMETRIC] ❌ Authentication verification failed: {e}")
        return False, str(e), None

def get_user_devices(user_id):
    """Get list of registered biometric devices for a user"""
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    
    cursor.execute('''
        SELECT 
            credential_id,
            device_name,
            created_at,
            last_used,
            is_active
        FROM biometric_credentials 
        WHERE user_id = %s
        ORDER BY created_at DESC
    ''', (user_id,))
    
    devices = cursor.fetchall()
    cursor.close()
    conn.close()
    
    # Convert datetime to string for JSON serialization
    for device in devices:
        if device['created_at']:
            device['created_at'] = str(device['created_at'])
        if device['last_used']:
            device['last_used'] = str(device['last_used'])
    
    return devices