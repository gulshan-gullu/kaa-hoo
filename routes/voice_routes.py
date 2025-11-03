"""
Flask Routes for Voice Calling with Automatic Twilio Fallback
=============================================================
This module adds Twilio as a backup provider for voice calls.
If Agora fails, it automatically tries Twilio.

Add this to your app.py:
    from routes.voice_routes import voice_bp
    app.register_blueprint(voice_bp)
"""

from flask import Blueprint, request, jsonify, session
from twilio_service import twilio_service
import os
import time

voice_bp = Blueprint('voice', __name__, url_prefix='/api/voice')

# Agora configuration (reuse existing)
AGORA_APP_ID = os.getenv('AGORA_APP_ID')
AGORA_APP_CERTIFICATE = os.getenv('AGORA_APP_CERTIFICATE')

@voice_bp.route('/token', methods=['POST'])
def get_voice_token():
    """
    Generate voice call token with automatic fallback
    Tries Agora first, falls back to Twilio if unavailable
    """
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        receiver_id = data.get('receiver_id')
        prefer_provider = data.get('provider', 'auto')  # 'auto', 'agora', 'twilio'
        
        if not user_id:
            return jsonify({'error': 'User ID is required'}), 400
        
        # Create channel/room name
        channel_name = f"call_{min(user_id, receiver_id)}_{max(user_id, receiver_id)}_{int(time.time())}"
        
        # Automatic provider selection
        agora_available = bool(AGORA_APP_ID)
        twilio_available = twilio_service.is_available()
        
        provider_used = None
        token_data = None
        
        # Try Agora first (if available and not explicitly requesting Twilio)
        if prefer_provider != 'twilio' and agora_available:
            try:
                from agora_token_builder import RtcTokenBuilder
                
                # Generate Agora token (testing mode if no certificate)
                if AGORA_APP_CERTIFICATE and AGORA_APP_CERTIFICATE.strip():
                    # Secure mode
                    expiration_time = 86400  # 24 hours
                    current_timestamp = int(time.time())
                    privilege_expired_ts = current_timestamp + expiration_time
                    role = 1  # PUBLISHER
                    
                    token = RtcTokenBuilder.buildTokenWithUid(
                        AGORA_APP_ID,
                        AGORA_APP_CERTIFICATE,
                        channel_name,
                        user_id,
                        role,
                        privilege_expired_ts
                    )
                else:
                    # Testing mode
                    token = None
                
                token_data = {
                    'token': token,
                    'channel': channel_name,
                    'uid': user_id,
                    'appId': AGORA_APP_ID,
                    'provider': 'agora',
                    'testing_mode': not bool(AGORA_APP_CERTIFICATE and AGORA_APP_CERTIFICATE.strip())
                }
                
                provider_used = 'agora'
                print(f"✅ [VOICE] Using Agora for call: {channel_name}")
                
            except Exception as e:
                print(f"⚠️ [VOICE] Agora failed, trying Twilio: {e}")
                agora_available = False
        
        # Fall back to Twilio if Agora failed or explicitly requested
        if not provider_used and twilio_available:
            try:
                token_data = twilio_service.generate_access_token(
                    identity=user_id,
                    room_name=channel_name
                )
                
                if token_data:
                    provider_used = 'twilio'
                    print(f"✅ [VOICE] Using Twilio for call: {channel_name}")
                    
            except Exception as e:
                print(f"❌ [VOICE] Twilio also failed: {e}")
        
        # Return result or error
        if token_data:
            return jsonify({
                **token_data,
                'fallback_available': twilio_available if provider_used == 'agora' else agora_available
            }), 200
        else:
            return jsonify({
                'error': 'No voice providers available',
                'agora_available': agora_available,
                'twilio_available': twilio_available
            }), 503
            
    except Exception as e:
        print(f"❌ [VOICE] Error in token generation: {e}")
        return jsonify({'error': str(e)}), 500


@voice_bp.route('/providers', methods=['GET'])
def get_providers():
    """Get available voice providers and their status"""
    agora_available = bool(AGORA_APP_ID)
    twilio_available = twilio_service.is_available()
    
    return jsonify({
        'providers': {
            'agora': {
                'available': agora_available,
                'testing_mode': not bool(AGORA_APP_CERTIFICATE and AGORA_APP_CERTIFICATE.strip()) if agora_available else None
            },
            'twilio': {
                'available': twilio_available
            }
        },
        'default': 'agora' if agora_available else 'twilio' if twilio_available else None
    }), 200


@voice_bp.route('/call/status', methods=['POST'])
def call_status():
    """
    Webhook endpoint for call status updates (Twilio)
    """
    try:
        # Get Twilio status callback data
        call_sid = request.form.get('CallSid')
        call_status = request.form.get('CallStatus')
        
        print(f"📞 [VOICE] Call status update: {call_sid} -> {call_status}")
        
        # You can add database logging here
        # log_call_status(call_sid, call_status)
        
        return '', 200
        
    except Exception as e:
        print(f"❌ [VOICE] Error processing status callback: {e}")
        return '', 500


@voice_bp.route('/call/end', methods=['POST'])
def end_call():
    """End an active call (works with both providers)"""
    try:
        data = request.get_json()
        provider = data.get('provider')
        call_id = data.get('call_id')  # Can be call_sid for Twilio or channel for Agora
        
        if provider == 'twilio':
            success = twilio_service.end_call(call_id)
            return jsonify({'success': success}), 200 if success else 500
        else:
            # For Agora, ending is handled client-side
            return jsonify({'success': True, 'message': 'Agora calls end client-side'}), 200
            
    except Exception as e:
        print(f"❌ [VOICE] Error ending call: {e}")
        return jsonify({'error': str(e)}), 500