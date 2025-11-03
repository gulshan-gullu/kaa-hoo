"""
Twilio Voice Call Service - Backup Provider for Agora
=====================================================
This service provides Twilio-based voice calling as a backup
when Agora is unavailable or fails.

Installation:
pip install twilio --break-system-packages

.env Configuration:
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
"""

from twilio.rest import Client
from twilio.jwt.access_token import AccessToken
from twilio.jwt.access_token.grants import VoiceGrant
import os
from datetime import datetime, timedelta

class TwilioService:
    def __init__(self):
        self.account_sid = os.getenv('TWILIO_ACCOUNT_SID')
        self.auth_token = os.getenv('TWILIO_AUTH_TOKEN')
        self.phone_number = os.getenv('TWILIO_PHONE_NUMBER')
        self.api_key = os.getenv('TWILIO_API_KEY')
        self.api_secret = os.getenv('TWILIO_API_SECRET')
        
        # Initialize Twilio client if credentials exist
        if self.account_sid and self.auth_token:
            self.client = Client(self.account_sid, self.auth_token)
            self.enabled = True
            print("✅ Twilio Service initialized")
        else:
            self.client = None
            self.enabled = False
            print("⚠️ Twilio Service not configured")
    
    def is_available(self):
        """Check if Twilio is configured and available"""
        return self.enabled and self.client is not None
    
    def generate_access_token(self, identity, room_name=None):
        """
        Generate Twilio Access Token for Voice SDK
        
        Args:
            identity (str): User identifier
            room_name (str): Optional room name for the call
            
        Returns:
            dict: Token and connection info
        """
        if not self.is_available():
            return None
        
        try:
            # Create access token
            token = AccessToken(
                self.account_sid,
                self.api_key,
                self.api_secret,
                identity=str(identity),
                ttl=3600  # 1 hour
            )
            
            # Create voice grant
            voice_grant = VoiceGrant(
                outgoing_application_sid=os.getenv('TWILIO_TWIML_APP_SID'),
                incoming_allow=True
            )
            
            token.add_grant(voice_grant)
            
            print(f"✅ [TWILIO] Generated token for user {identity}")
            
            return {
                'token': token.to_jwt(),
                'identity': str(identity),
                'room_name': room_name or f'call_{identity}_{int(datetime.now().timestamp())}',
                'provider': 'twilio'
            }
            
        except Exception as e:
            print(f"❌ [TWILIO] Error generating token: {e}")
            return None
    
    def create_room(self, room_name, user_ids):
        """
        Create a Twilio Programmable Voice room
        
        Args:
            room_name (str): Unique room identifier
            user_ids (list): List of user IDs to invite
            
        Returns:
            dict: Room information
        """
        if not self.is_available():
            return None
        
        try:
            # For Twilio Voice, we don't create rooms explicitly
            # Instead, we manage connections via TwiML
            print(f"✅ [TWILIO] Room prepared: {room_name}")
            
            return {
                'room_name': room_name,
                'participants': user_ids,
                'created_at': datetime.now().isoformat(),
                'provider': 'twilio'
            }
            
        except Exception as e:
            print(f"❌ [TWILIO] Error creating room: {e}")
            return None
    
    def make_call(self, from_number, to_number, callback_url):
        """
        Initiate a voice call using Twilio
        
        Args:
            from_number (str): Twilio phone number
            to_number (str): Recipient phone number
            callback_url (str): TwiML URL for call handling
            
        Returns:
            dict: Call information
        """
        if not self.is_available():
            return None
        
        try:
            call = self.client.calls.create(
                to=to_number,
                from_=from_number or self.phone_number,
                url=callback_url,
                status_callback=f"{callback_url}/status",
                status_callback_event=['initiated', 'ringing', 'answered', 'completed']
            )
            
            print(f"✅ [TWILIO] Call initiated: {call.sid}")
            
            return {
                'call_sid': call.sid,
                'from': from_number,
                'to': to_number,
                'status': call.status,
                'provider': 'twilio'
            }
            
        except Exception as e:
            print(f"❌ [TWILIO] Error making call: {e}")
            return None
    
    def get_call_status(self, call_sid):
        """
        Get the status of a Twilio call
        
        Args:
            call_sid (str): Twilio call SID
            
        Returns:
            dict: Call status information
        """
        if not self.is_available():
            return None
        
        try:
            call = self.client.calls(call_sid).fetch()
            
            return {
                'call_sid': call.sid,
                'status': call.status,
                'duration': call.duration,
                'direction': call.direction,
                'provider': 'twilio'
            }
            
        except Exception as e:
            print(f"❌ [TWILIO] Error fetching call status: {e}")
            return None
    
    def end_call(self, call_sid):
        """
        End an active Twilio call
        
        Args:
            call_sid (str): Twilio call SID
            
        Returns:
            bool: Success status
        """
        if not self.is_available():
            return False
        
        try:
            self.client.calls(call_sid).update(status='completed')
            print(f"✅ [TWILIO] Call ended: {call_sid}")
            return True
            
        except Exception as e:
            print(f"❌ [TWILIO] Error ending call: {e}")
            return False

# Global Twilio service instance
twilio_service = TwilioService()
