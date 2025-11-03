#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
CA360 Chat - Socket Events Handler
Handles all Socket.IO events with online user tracking
FINAL VERSION - Allows connections and handles sessions properly
"""

from flask import session, request
from flask_socketio import emit, join_room, leave_room, disconnect
from datetime import datetime

# ==================== ONLINE USERS TRACKING ====================

# Global dictionary to track online users
online_users = {}

def get_online_users():
    """Get list of currently online users"""
    return list(online_users.keys())

def is_user_online(user_id):
    """Check if a user is online"""
    return user_id in online_users

def add_online_user(user_id, username=None):
    """Add user to online users"""
    online_users[user_id] = username or user_id
    print(f"[ONLINE] User {user_id} is now online. Total: {len(online_users)}")

def remove_online_user(user_id):
    """Remove user from online users"""
    if user_id in online_users:
        online_users.pop(user_id)
        print(f"[OFFLINE] User {user_id} is now offline. Total: {len(online_users)}")

# ==================== SOCKET EVENT HANDLERS ====================

def register_socket_events(socketio):
    """Register all socket.io event handlers"""
    
    @socketio.on('connect')
    def handle_connect(auth=None):
        """Handle client connection - FIXED to allow all connections"""
        try:
            user_id = session.get('user_id')
            
            if user_id:
                join_room(user_id)
                
                # Add to online users
                username = session.get('user_name', user_id)
                add_online_user(user_id, username)
                
                # Broadcast that user is online - FIXED: use skip_sid instead of broadcast
                emit('user_online', {
                    'user_id': user_id,
                    'username': username
                }, skip_sid=request.sid, namespace='/')
                
                print(f"[CONNECT] ✅ User {user_id} authenticated and online from {request.remote_addr}")
            else:
                # Allow connection but don't mark as online yet
                print(f"[CONNECT] ⚠️ Socket connected without session from {request.remote_addr} (will authenticate via 'join' event)")
            
            return True  # Always allow connection
            
        except Exception as e:
            print(f"[ERROR] Connection error: {str(e)}")
            import traceback
            traceback.print_exc()
            return True  # Allow connection even on error
    
    @socketio.on('disconnect')
    def handle_disconnect():
        """Handle client disconnection - with online status tracking"""
        try:
            user_id = session.get('user_id')
            if user_id:
                leave_room(user_id)
                
                # Remove from online users
                remove_online_user(user_id)
                
                # Broadcast that user is offline - FIXED: use skip_sid instead of broadcast
                emit('user_offline', {
                    'user_id': user_id
                }, skip_sid=request.sid, namespace='/')
                
                print(f"[DISCONNECT] User {user_id} disconnected")
            else:
                print(f"[DISCONNECT] Unauthenticated socket disconnected")
        except Exception as e:
            print(f"[ERROR] Disconnect error: {str(e)}")
    
    @socketio.on('join')
    def handle_join(data):
        """Handle user joining a room - IMPROVED to handle authentication"""
        try:
            # Get user_id from session first
            user_id = session.get('user_id')
            
            # If not in session, try from data (for React that sends user_id explicitly)
            if not user_id and data:
                user_id = data.get('user_id')
            
            room = data.get('room', user_id) if data else user_id
            
            if user_id:
                join_room(user_id)
                
                # If this is first join after connection, add to online users
                if not is_user_online(user_id):
                    username = session.get('user_name', user_id)
                    add_online_user(user_id, username)
                    
                    # Broadcast that user is online - FIXED: use skip_sid instead of broadcast
                    emit('user_online', {
                        'user_id': user_id,
                        'username': username
                    }, skip_sid=request.sid, namespace='/')
                
                print(f"[JOIN] User {user_id} joined room {room}")
                emit('joined', {'room': room, 'user_id': user_id}, room=room)
            else:
                print(f"[JOIN] ⚠️ Join attempt without user_id")
        except Exception as e:
            print(f"[ERROR] Join error: {str(e)}")
            import traceback
            traceback.print_exc()
    
    @socketio.on('leave')
    def handle_leave(data):
        """Handle user leaving a room"""
        try:
            user_id = session.get('user_id')
            room = data.get('room', user_id)
            
            if user_id:
                leave_room(room)
                print(f"[LEAVE] User {user_id} left room {room}")
                emit('left', {'room': room, 'user_id': user_id}, room=room)
        except Exception as e:
            print(f"[ERROR] Leave error: {str(e)}")
    
    @socketio.on('send_message')
    def handle_send_message(data):
        """Handle incoming message - FIXED to match React event name"""
        try:
            from_user = session.get('user_id')
            to_user = data.get('to_user')
            message = data.get('message', '')
            message_type = data.get('message_type', 'text')
            
            if not from_user or not to_user:
                print(f"[ERROR] Invalid message data - from: {from_user}, to: {to_user}")
                emit('error', {'message': 'Invalid message data'})
                return
            
            print(f"[MESSAGE] {from_user} -> {to_user}: {message[:50] if len(message) > 50 else message}")
            
            # Prepare message data
            message_data = {
                'from_user': from_user,
                'to_user': to_user,
                'message': message,
                'message_type': message_type,
                'timestamp': datetime.now().isoformat()
            }
            
            # Send to recipient's room
            emit('new_message', message_data, room=to_user)
            print(f"[MESSAGE] 📨 Emitted to room: {to_user}")
            
            # Also send back to sender for confirmation
            emit('new_message', message_data, room=from_user)
            print(f"[MESSAGE] 📨 Emitted to room: {from_user}")
            
            print(f"[MESSAGE] ✅ Delivered to {to_user} and {from_user}")
            
        except Exception as e:
            print(f"[ERROR] Message error: {str(e)}")
            import traceback
            traceback.print_exc()
            emit('error', {'message': 'Failed to send message'})
    
    @socketio.on('typing_start')
    def handle_typing_start(data):
        """Handle typing indicator start"""
        try:
            user_id = session.get('user_id')
            target = data.get('target')
            
            if user_id and target:
                emit('typing_start', {'user_id': user_id}, room=target)
                print(f"[TYPING] {user_id} started typing to {target}")
        except Exception as e:
            print(f"[ERROR] Typing start error: {str(e)}")
    
    @socketio.on('typing_stop')
    def handle_typing_stop(data):
        """Handle typing indicator stop"""
        try:
            user_id = session.get('user_id')
            target = data.get('target')
            
            if user_id and target:
                emit('typing_stop', {'user_id': user_id}, room=target)
                print(f"[TYPING] {user_id} stopped typing to {target}")
        except Exception as e:
            print(f"[ERROR] Typing stop error: {str(e)}")
    
    @socketio.on('get_online_users')
    def handle_get_online_users():
        """Get list of online users"""
        try:
            emit('online_users_list', {
                'users': get_online_users(),
                'count': len(online_users)
            })
            print(f"[ONLINE] Sent online users list: {len(online_users)} users")
        except Exception as e:
            print(f"[ERROR] Get online users error: {str(e)}")
    
    print("[SOCKET] ✅ Socket event handlers registered with online status tracking")
    print("[SOCKET] ✅ Listening for 'send_message' events (matches React)")
    print("[SOCKET] ✅ Connection policy: Allow all, authenticate via 'join' event")
