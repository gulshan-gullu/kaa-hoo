"""
CA360 Chat - Voicemail Module
Handle voicemail recording and playback
"""

from flask import Blueprint, request, session, jsonify, send_file
import os
import uuid
from datetime import datetime

voicemail_bp = Blueprint('voicemail', __name__)

VOICEMAIL_FOLDER = 'voicemails'

# Create voicemail folder if it doesn't exist
if not os.path.exists(VOICEMAIL_FOLDER):
    os.makedirs(VOICEMAIL_FOLDER)

# In-memory voicemail storage (in production, use database)
voicemails = []

@voicemail_bp.route('/api/voicemail/leave', methods=['POST'])
def leave_voicemail():
    """Leave a voicemail for a user"""
    if not session.get('user_authenticated'):
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401
    
    if 'voicemail' not in request.files:
        return jsonify({'success': False, 'message': 'No voicemail file'}), 400
    
    voicemail_file = request.files['voicemail']
    recipient_id = request.form.get('recipient_id')
    
    if not recipient_id:
        return jsonify({'success': False, 'message': 'No recipient specified'}), 400
    
    # Save voicemail file
    voicemail_id = str(uuid.uuid4())
    filename = f"{voicemail_id}.webm"
    filepath = os.path.join(VOICEMAIL_FOLDER, filename)
    voicemail_file.save(filepath)
    
    # Store voicemail info
    voicemail_data = {
        'id': voicemail_id,
        'from_id': session.get('user_id'),
        'from_name': session.get('user_name'),
        'to_id': recipient_id,
        'filename': filename,
        'timestamp': datetime.now().isoformat(),
        'is_played': False
    }
    
    voicemails.append(voicemail_data)
    
    print(f"[VOICEMAIL] {session.get('user_id')} left voicemail for {recipient_id}")
    
    return jsonify({
        'success': True,
        'voicemail_id': voicemail_id
    })

@voicemail_bp.route('/api/voicemail/list', methods=['GET'])
def list_voicemails():
    """Get voicemails for current user"""
    if not session.get('user_authenticated'):
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401
    
    user_id = session.get('user_id')
    
    # Get voicemails for this user
    user_voicemails = [
        vm for vm in voicemails 
        if vm['to_id'] == user_id
    ]
    
    return jsonify({
        'success': True,
        'voicemails': user_voicemails
    })

@voicemail_bp.route('/api/voicemail/play/<voicemail_id>', methods=['GET'])
def play_voicemail(voicemail_id):
    """Play a voicemail"""
    if not session.get('user_authenticated'):
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401
    
    # Find voicemail
    voicemail = next((vm for vm in voicemails if vm['id'] == voicemail_id), None)
    
    if not voicemail:
        return jsonify({'success': False, 'message': 'Voicemail not found'}), 404
    
    # Check if user is authorized
    if voicemail['to_id'] != session.get('user_id'):
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
    
    # Mark as played
    voicemail['is_played'] = True
    
    filepath = os.path.join(VOICEMAIL_FOLDER, voicemail['filename'])
    
    if not os.path.exists(filepath):
        return jsonify({'success': False, 'message': 'Voicemail file not found'}), 404
    
    return send_file(filepath, mimetype='audio/webm')

@voicemail_bp.route('/api/voicemail/delete/<voicemail_id>', methods=['DELETE'])
def delete_voicemail(voicemail_id):
    """Delete a voicemail"""
    if not session.get('user_authenticated'):
        return jsonify({'success': False, 'message': 'Not authenticated'}), 401
    
    # Find voicemail
    voicemail = next((vm for vm in voicemails if vm['id'] == voicemail_id), None)
    
    if not voicemail:
        return jsonify({'success': False, 'message': 'Voicemail not found'}), 404
    
    # Check if user is authorized
    if voicemail['to_id'] != session.get('user_id'):
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
    
    # Delete file
    filepath = os.path.join(VOICEMAIL_FOLDER, voicemail['filename'])
    if os.path.exists(filepath):
        os.remove(filepath)
    
    # Remove from list
    voicemails.remove(voicemail)
    
    return jsonify({'success': True})