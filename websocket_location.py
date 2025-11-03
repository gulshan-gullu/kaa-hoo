"""
🔌 WEBSOCKET LOCATION HANDLER
Handles real-time location broadcasting via WebSocket
"""

from flask_socketio import emit
from datetime import datetime

class LocationWebSocketHandler:
    def __init__(self, socketio):
        self.socketio = socketio
        self.active_location_rooms = {}  # Track users sharing location
        
        # Register event handlers
        self.register_handlers()
        print("✅ [WS-LOCATION] WebSocket location handler initialized")
    
    def register_handlers(self):
        """Register all WebSocket event handlers for location"""
        
        @self.socketio.on('send_location')
        def handle_send_location(data):
            """Broadcast location to target user"""
            from flask import session
            sender_id = session.get('user_id')
            target_user = data.get('target_user')
            
            if not sender_id or not target_user:
                print("⚠️ [WS-LOCATION] Missing sender or target")
                return
            
            print(f"📍 [WS-LOCATION] Broadcasting location from {sender_id} to {target_user}")
            
            location_data = {
                'from_user': sender_id,
                'location': data.get('location'),
                'is_live': data.get('is_live', False),
                'duration': data.get('duration'),
                'session_id': data.get('session_id'),
                'timestamp': datetime.now().isoformat()
            }
            
            # Send to target user
            emit('new_location', location_data, room=target_user)
        
        @self.socketio.on('update_live_location')
        def handle_update_live_location(data):
            """Broadcast live location update"""
            from flask import session
            sender_id = session.get('user_id')
            target_user = data.get('target_user')
            
            if not sender_id or not target_user:
                return
            
            print(f"📡 [WS-LOCATION] Live location update: {sender_id} -> {target_user}")
            
            emit('live_location_update', {
                'from_user': sender_id,
                'location': data.get('location'),
                'session_id': data.get('session_id'),
                'timestamp': datetime.now().isoformat()
            }, room=target_user)
        
        @self.socketio.on('stop_live_location')
        def handle_stop_live_location_socket(data):
            """Broadcast live location stopped"""
            from flask import session
            sender_id = session.get('user_id')
            target_user = data.get('target_user')
            
            if not sender_id or not target_user:
                return
            
            print(f"🛑 [WS-LOCATION] Live location stopped: {sender_id}")
            
            emit('live_location_stopped', {
                'user_id': sender_id,
                'session_id': data.get('session_id'),
                'timestamp': datetime.now().isoformat()
            }, room=target_user)
        
        @self.socketio.on('join_location_room')
        def handle_join_location_room(data):
            """User joins a location sharing room"""
            from flask import session, request
            from flask_socketio import join_room
            
            user_id = session.get('user_id')
            room = data.get('room')
            
            if user_id and room:
                join_room(room)
                
                if room not in self.active_location_rooms:
                    self.active_location_rooms[room] = []
                
                if user_id not in self.active_location_rooms[room]:
                    self.active_location_rooms[room].append(user_id)
                
                print(f"📍 [WS-LOCATION] {user_id} joined location room: {room}")
        
        @self.socketio.on('leave_location_room')
        def handle_leave_location_room(data):
            """User leaves a location sharing room"""
            from flask import session
            from flask_socketio import leave_room
            
            user_id = session.get('user_id')
            room = data.get('room')
            
            if user_id and room:
                leave_room(room)
                
                if room in self.active_location_rooms and user_id in self.active_location_rooms[room]:
                    self.active_location_rooms[room].remove(user_id)
                
                print(f"📍 [WS-LOCATION] {user_id} left location room: {room}")
        
        @self.socketio.on('request_location')
        def handle_request_location(data):
            """Request location from another user"""
            from flask import session
            
            requester_id = session.get('user_id')
            target_user = data.get('target_user')
            
            if not requester_id or not target_user:
                return
            
            print(f"📍 [WS-LOCATION] {requester_id} requesting location from {target_user}")
            
            emit('location_requested', {
                'from_user': requester_id,
                'timestamp': datetime.now().isoformat()
            }, room=target_user)
    
    def get_active_rooms(self):
        """Get list of active location rooms"""
        return self.active_location_rooms
    
    def get_room_users(self, room):
        """Get users in a specific location room"""
        return self.active_location_rooms.get(room, [])