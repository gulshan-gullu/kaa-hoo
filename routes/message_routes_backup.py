"""
Message Routes
"""
from flask import Blueprint, request, jsonify, session, send_file
from database import save_message, get_messages, mark_message_as_read, get_file_info, get_statistics
from utils import save_file
import os
from config import UPLOAD_FOLDER

message_bp = Blueprint('messages', __name__)

# Will be set by app.py
socketio = None

def init_socketio(sio):
    """Initialize socketio instance for this blueprint"""
    global socketio
    socketio = sio
    print(f"[INIT] Message routes socketio initialized: {socketio is not None}")

@message_bp.route('/api/send', methods=['POST'])
def send_message():
    """Send text message"""
    if not session.get('user_authenticated'):
        return jsonify({'success': False}), 401
    
    data = request.get_json()
    sender_id = session.get('user_id')
    text = (data.get('text') or '').strip()
    target_user = (data.get('target_user') or '').strip()
    
    if not text or not target_user:
        return jsonify({'success': False}), 400
    
    message = save_message(sender_id, target_user, text)
    
    # Emit via WebSocket
    if socketio:
        socket_message = {
            'id': message['id'],
            'sender_id': message['sender_id'],
            'receiver_id': message['receiver_id'],
            'target_user': message['receiver_id'],
            'text': message['text'],
            'message_type': 'text',
            'timestamp': message['timestamp']
        }
        socketio.emit('new_message', socket_message, to=sender_id)
        if sender_id != target_user:
            socketio.emit('new_message', socket_message, to=target_user)
        print(f"[SOCKET] Emitted new_message to {sender_id} and {target_user}")
    else:
        print("[ERROR] Socketio is None!")
    
    print(f"[MESSAGE] {sender_id} -> {target_user}: {text[:50]}...")
    
    return jsonify({'success': True, 'message': message})

@message_bp.route('/api/messages/<target_user>')
def get_messages_route(target_user):
    """Get messages with a user"""
    if not session.get('user_authenticated'):
        return jsonify({'success': False}), 401
    
    sender_id = session.get('user_id')
    messages = get_messages(sender_id, target_user)
    
    return jsonify({'success': True, 'messages': messages})

@message_bp.route('/api/mark-read', methods=['POST'])
def mark_read():
    """Mark messages as read"""
    if not session.get('user_authenticated'):
        return jsonify({'success': False}), 401
    
    data = request.get_json()
    message_ids = data.get('message_ids', [])
    user_id = session.get('user_id')
    sender_id = data.get('sender_id')
    
    for msg_id in message_ids:
        mark_message_as_read(msg_id, user_id)
    
    # Emit read receipt
    if socketio and sender_id:
        socketio.emit('read_receipt', {
            'message_ids': message_ids,
            'reader_id': user_id
        }, to=sender_id)
    
    return jsonify({'success': True})

@message_bp.route('/api/send-file', methods=['POST'])
def send_file_message():
    """Send file message"""
    if not session.get('user_authenticated'):
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401
    
    if 'file' not in request.files:
        return jsonify({'success': False, 'message': 'No file provided'}), 400
    
    file = request.files['file']
    target_user = request.form.get('target_user')
    caption = request.form.get('caption', '')
    sender_id = session.get('user_id')
    
    if not target_user:
        return jsonify({'success': False, 'message': 'No target user'}), 400
    
    file_info = save_file(file, sender_id)
    if not file_info:
        return jsonify({'success': False, 'message': 'File upload failed'}), 400
    
    message_text = f"[FILE] {file_info['original_name']}"
    if caption:
        message_text += f"\n{caption}"
    
    message = save_message(sender_id, target_user, message_text, 'file', file_info['file_id'])
    
    # Emit via WebSocket
    if socketio:
        socket_message = {
            'id': message['id'],
            'sender_id': message['sender_id'],
            'receiver_id': message['receiver_id'],
            'target_user': message['receiver_id'],
            'text': message['text'],
            'message_type': 'file',
            'file_info': file_info,
            'timestamp': message['timestamp']
        }
        socketio.emit('new_message', socket_message, to=sender_id)
        if sender_id != target_user:
            socketio.emit('new_message', socket_message, to=target_user)
    
    print(f"[FILE] {sender_id} -> {target_user}: {file_info['original_name']}")
    
    return jsonify({'success': True, 'file_info': file_info, 'message': message})

@message_bp.route('/api/send-voice', methods=['POST'])
def send_voice_message():
    """Send voice message"""
    if not session.get('user_authenticated'):
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401
    
    if 'file' not in request.files:
        return jsonify({'success': False, 'message': 'No voice file'}), 400
    
    file = request.files['file']
    target_user = request.form.get('target_user')
    caption = request.form.get('caption', '[VOICE] Voice message')
    sender_id = session.get('user_id')
    
    if not target_user:
        return jsonify({'success': False, 'message': 'No target user'}), 400
    
    if file.filename == '':
        file.filename = 'voice_message.webm'
    
    file_info = save_file(file, sender_id)
    if not file_info:
        return jsonify({'success': False, 'message': 'Voice upload failed'}), 400
    
    message = save_message(sender_id, target_user, caption, 'voice', file_info['file_id'])
    
    # Emit via WebSocket
    if socketio:
        socket_message = {
            'id': message['id'],
            'sender_id': message['sender_id'],
            'receiver_id': message['receiver_id'],
            'target_user': message['receiver_id'],
            'text': message['text'],
            'message_type': 'voice',
            'file_info': file_info,
            'timestamp': message['timestamp']
        }
        socketio.emit('new_message', socket_message, to=sender_id)
        if sender_id != target_user:
            socketio.emit('new_message', socket_message, to=target_user)
    
    print(f"[VOICE] {sender_id} -> {target_user}: Voice message")
    
    return jsonify({'success': True, 'message': message})

@message_bp.route('/api/download/<file_id>')
def download_file(file_id):
    """Download file"""
    if not session.get('user_authenticated'):
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401
    
    file_info = get_file_info(file_id)
    if not file_info:
        return jsonify({'success': False, 'message': 'File not found'}), 404
    
    file_path = os.path.join(UPLOAD_FOLDER, file_info['file_path'])
    
    if not os.path.exists(file_path):
        return jsonify({'success': False, 'message': 'File not found on disk'}), 404
    
    return send_file(file_path, 
                     download_name=file_info['original_name'],
                     as_attachment=True)

@message_bp.route('/api/statistics')
def get_statistics_route():
    """Get statistics (admin only)"""
    if not session.get('user_authenticated'):
        return jsonify({'success': False}), 401
    
    if session.get('user_role') != 'admin':
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
    
    from socket_events import get_online_users
    online_users = get_online_users()
    
    stats = get_statistics()
    stats['online_users'] = len(online_users)
    
    return jsonify({'success': True, 'stats': stats})

@message_bp.route('/api/search/<query>')
def search_messages_route(query):
    """Search messages"""
    if not session.get('user_authenticated'):
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401
    
    from database import search_messages
    user_id = session.get('user_id')
    results = search_messages(query, user_id)
    
    return jsonify({
        'success': True,
        'query': query,
        'count': len(results),
        'results': results
    })

@message_bp.route('/api/turn-credentials', methods=['GET'])
def get_turn_credentials():
    """Get TURN server credentials"""
    if not session.get('user_authenticated'):
        return jsonify({'success': False}), 401
    
    return jsonify({
        'success': True,
        'ice_servers': [
            {'urls': 'stun:stun.l.google.com:19302'},
            {'urls': 'stun:stun1.l.google.com:19302'},
            {
                'urls': 'turn:openrelay.metered.ca:80',
                'username': 'openrelayproject',
                'credential': 'openrelayproject'
            },
            {
                'urls': 'turn:openrelay.metered.ca:443',
                'username': 'openrelayproject',
                'credential': 'openrelayproject'
            },
            {
                'urls': 'turn:openrelay.metered.ca:443?transport=tcp',
                'username': 'openrelayproject',
                'credential': 'openrelayproject'
            }
        ]
    })