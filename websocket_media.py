"""
🔌 WEBSOCKET MEDIA HANDLER
Handles real-time media broadcasting via WebSocket
"""

from flask_socketio import emit, join_room, leave_room
from datetime import datetime

class MediaWebSocketHandler:
    def __init__(self, socketio):
        self.socketio = socketio
        self.active_rooms = {}  # Track active chat rooms
        
        # Register event handlers
        self.register_handlers()
        print("✅ [WS-MEDIA] WebSocket media handler initialized")
    
    def register_handlers(self):
        """Register all WebSocket event handlers"""
        
        @self.socketio.on('join_chat')
        def handle_join_chat(data):
            """User joins a chat room"""
            room = data.get('room')
            username = data.get('username', 'Anonymous')
            
            if room:
                join_room(room)
                
                if room not in self.active_rooms:
                    self.active_rooms[room] = []
                
                if username not in self.active_rooms[room]:
                    self.active_rooms[room].append(username)
                
                print(f"👤 [WS] {username} joined room: {room}")
                
                # Notify others in room
                emit('user_joined', {
                    'username': username,
                    'timestamp': datetime.now().isoformat()
                }, room=room, skip_sid=True)
        
        @self.socketio.on('leave_chat')
        def handle_leave_chat(data):
            """User leaves a chat room"""
            room = data.get('room')
            username = data.get('username', 'Anonymous')
            
            if room:
                leave_room(room)
                
                if room in self.active_rooms and username in self.active_rooms[room]:
                    self.active_rooms[room].remove(username)
                
                print(f"👤 [WS] {username} left room: {room}")
                
                # Notify others in room
                emit('user_left', {
                    'username': username,
                    'timestamp': datetime.now().isoformat()
                }, room=room)
        
        @self.socketio.on('send_voice_message')
        def handle_send_voice(data):
            """Broadcast voice message to room"""
            room = data.get('room')
            
            if room:
                print(f"🎙️ [WS] Broadcasting voice message to room: {room}")
                
                message_data = {
                    'type': 'voice',
                    'from_user': data.get('from_user'),
                    'filename': data.get('filename'),
                    'url': data.get('url'),
                    'duration': data.get('duration'),
                    'size': data.get('size'),
                    'timestamp': datetime.now().isoformat()
                }
                
                # Broadcast to all in room except sender
                emit('new_voice_message', message_data, room=room, skip_sid=True)
        
        @self.socketio.on('send_media_message')
        def handle_send_media(data):
            """Broadcast media message to room"""
            room = data.get('room')
            
            if room:
                print(f"📁 [WS] Broadcasting media message to room: {room}")
                
                message_data = {
                    'type': data.get('media_type', 'image'),
                    'from_user': data.get('from_user'),
                    'filename': data.get('filename'),
                    'original_filename': data.get('original_filename'),
                    'url': data.get('url'),
                    'caption': data.get('caption', ''),
                    'size': data.get('size'),
                    'mime_type': data.get('mime_type'),
                    'timestamp': datetime.now().isoformat()
                }
                
                # Broadcast to all in room except sender
                emit('new_media_message', message_data, room=room, skip_sid=True)
        
        @self.socketio.on('typing_voice')
        def handle_typing_voice(data):
            """Broadcast voice recording status"""
            room = data.get('room')
            
            if room:
                emit('user_recording_voice', {
                    'username': data.get('username'),
                    'is_recording': data.get('is_recording', False),
                    'timestamp': datetime.now().isoformat()
                }, room=room, skip_sid=True)
        
        @self.socketio.on('upload_progress')
        def handle_upload_progress(data):
            """Broadcast file upload progress"""
            room = data.get('room')
            
            if room:
                emit('file_upload_progress', {
                    'username': data.get('username'),
                    'filename': data.get('filename'),
                    'progress': data.get('progress', 0),
                    'timestamp': datetime.now().isoformat()
                }, room=room, skip_sid=True)
    
    def get_active_rooms(self):
        """Get list of active rooms"""
        return self.active_rooms
    
    def get_room_users(self, room):
        """Get users in a specific room"""
        return self.active_rooms.get(room, [])