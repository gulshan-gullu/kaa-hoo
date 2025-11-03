"""
Utility Helper Functions
"""
import os
import uuid
from werkzeug.utils import secure_filename
from config import UPLOAD_FOLDER, MAX_FILE_SIZE, ALLOWED_EXTENSIONS
from database import save_file_info

def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def save_file(file, uploader_id):
    """Save uploaded file"""
    if not file:
        return None
    
    if file.filename == '' or file.filename is None:
        if hasattr(file, 'content_type') and file.content_type and 'audio' in file.content_type:
            file.filename = 'voice_message.webm'
        else:
            return None
    
    if not allowed_file(file.filename):
        return None
    
    file.seek(0, os.SEEK_END)
    file_size = file.tell()
    file.seek(0)
    
    if file_size > MAX_FILE_SIZE:
        return None
    
    file_id = str(uuid.uuid4())
    original_name = secure_filename(file.filename)
    file_extension = original_name.rsplit('.', 1)[1].lower()
    stored_name = f"{file_id}.{file_extension}"
    file_path = os.path.join(UPLOAD_FOLDER, stored_name)
    
    file.save(file_path)
    
    save_file_info(file_id, original_name, file_extension, file_size, stored_name, uploader_id)
    
    return {
        'file_id': file_id,
        'original_name': original_name,
        'file_size': file_size,
        'file_type': file_extension
    }

def format_user_for_response(user, is_online=False, unread_count=0):
    """Format user data for API response"""
    return {
        'id': user['user_id'],
        'name': user.get('display_name') or user['name'],
        'email': user.get('email'),
        'mobile': user.get('mobile'),
        'role': user['role'],
        'profile_picture': user.get('profile_picture'),
        'online': is_online,
        'unread_count': unread_count
    }