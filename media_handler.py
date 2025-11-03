"""
📁 MEDIA HANDLER MODULE
Handles voice messages, file uploads, and media storage
"""

import os
import uuid
import mimetypes
from datetime import datetime
from werkzeug.utils import secure_filename
from flask import Blueprint, request, jsonify, send_from_directory
from flask_socketio import emit

# Create Blueprint
media_bp = Blueprint('media', __name__)

# Configuration
UPLOAD_FOLDER = 'uploads'
MAX_FILE_SIZE = 100 * 1024 * 1024  # 100MB
ALLOWED_EXTENSIONS = {
    'image': {'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'},
    'video': {'mp4', 'webm', 'avi', 'mov', 'mkv'},
    'audio': {'mp3', 'wav', 'ogg', 'webm', 'm4a'},
    'document': {'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'zip', 'rar'}
}

# Create upload directories
UPLOAD_DIRS = {
    'voice': os.path.join(UPLOAD_FOLDER, 'voice'),
    'images': os.path.join(UPLOAD_FOLDER, 'images'),
    'videos': os.path.join(UPLOAD_FOLDER, 'videos'),
    'documents': os.path.join(UPLOAD_FOLDER, 'documents'),
    'avatars': os.path.join(UPLOAD_FOLDER, 'avatars')
}

def init_media_directories():
    """Create all necessary upload directories"""
    for directory in UPLOAD_DIRS.values():
        os.makedirs(directory, exist_ok=True)
    print("✅ [MEDIA] Upload directories initialized")

def get_file_extension(filename):
    """Get file extension"""
    return filename.rsplit('.', 1)[1].lower() if '.' in filename else ''

def allowed_file(filename, file_type='all'):
    """Check if file extension is allowed"""
    ext = get_file_extension(filename)
    
    if file_type == 'all':
        all_extensions = set()
        for extensions in ALLOWED_EXTENSIONS.values():
            all_extensions.update(extensions)
        return ext in all_extensions
    
    return ext in ALLOWED_EXTENSIONS.get(file_type, set())

def get_file_type(filename):
    """Determine file type from extension"""
    ext = get_file_extension(filename)
    
    for file_type, extensions in ALLOWED_EXTENSIONS.items():
        if ext in extensions:
            return file_type
    
    return 'document'

def generate_unique_filename(original_filename):
    """Generate unique filename with UUID"""
    ext = get_file_extension(original_filename)
    unique_id = uuid.uuid4().hex[:12]
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    return f"{timestamp}_{unique_id}.{ext}"

def format_file_size(size_bytes):
    """Format file size in human readable format"""
    for unit in ['B', 'KB', 'MB', 'GB']:
        if size_bytes < 1024.0:
            return f"{size_bytes:.1f} {unit}"
        size_bytes /= 1024.0
    return f"{size_bytes:.1f} TB"

def get_file_info(filepath):
    """Get file information"""
    if not os.path.exists(filepath):
        return None
    
    stat = os.stat(filepath)
    mime_type, _ = mimetypes.guess_type(filepath)
    
    return {
        'size': stat.st_size,
        'size_formatted': format_file_size(stat.st_size),
        'mime_type': mime_type or 'application/octet-stream',
        'created': datetime.fromtimestamp(stat.st_ctime).isoformat(),
        'modified': datetime.fromtimestamp(stat.st_mtime).isoformat()
    }


# ============================================
# 🎙️ VOICE MESSAGE ENDPOINTS
# ============================================

@media_bp.route('/api/upload-voice', methods=['POST'])
def upload_voice():
    """Upload voice message"""
    try:
        # Check if file is present
        if 'voice' not in request.files:
            return jsonify({'success': False, 'error': 'No voice file provided'}), 400
        
        file = request.files['voice']
        
        if file.filename == '':
            return jsonify({'success': False, 'error': 'Empty filename'}), 400
        
        # Get additional data
        from_user = request.form.get('from_user', 'Unknown')
        to_user = request.form.get('to_user', 'Unknown')
        duration = request.form.get('duration', '0')
        
        # Generate unique filename
        original_filename = secure_filename(file.filename)
        unique_filename = generate_unique_filename(original_filename)
        
        # Save file
        filepath = os.path.join(UPLOAD_DIRS['voice'], unique_filename)
        file.save(filepath)
        
        # Get file info
        file_info = get_file_info(filepath)
        
        # Prepare response
        voice_data = {
            'success': True,
            'filename': unique_filename,
            'url': f'/uploads/voice/{unique_filename}',
            'duration': int(duration),
            'size': file_info['size'],
            'size_formatted': file_info['size_formatted'],
            'from_user': from_user,
            'to_user': to_user,
            'timestamp': datetime.now().isoformat(),
            'type': 'voice'
        }
        
        print(f"🎙️ [VOICE] Uploaded: {unique_filename} ({file_info['size_formatted']}) from {from_user}")
        
        return jsonify(voice_data), 200
        
    except Exception as e:
        print(f"❌ [VOICE] Upload error: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


# ============================================
# 📷 IMAGE/VIDEO UPLOAD ENDPOINTS
# ============================================

@media_bp.route('/api/upload-media', methods=['POST'])
def upload_media():
    """Upload image, video, or document"""
    try:
        # Check if file is present
        if 'file' not in request.files:
            return jsonify({'success': False, 'error': 'No file provided'}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'success': False, 'error': 'Empty filename'}), 400
        
        # Get additional data
        from_user = request.form.get('from_user', 'Unknown')
        to_user = request.form.get('to_user', 'Unknown')
        caption = request.form.get('caption', '')
        
        # Determine file type
        original_filename = secure_filename(file.filename)
        file_type = get_file_type(original_filename)
        
        # Validate file type
        if not allowed_file(original_filename):
            return jsonify({'success': False, 'error': 'File type not allowed'}), 400
        
        # Check file size
        file.seek(0, os.SEEK_END)
        file_size = file.tell()
        file.seek(0)
        
        if file_size > MAX_FILE_SIZE:
            return jsonify({
                'success': False, 
                'error': f'File too large (max {format_file_size(MAX_FILE_SIZE)})'
            }), 400
        
        # Generate unique filename
        unique_filename = generate_unique_filename(original_filename)
        
        # Determine upload directory
        if file_type == 'image':
            upload_dir = UPLOAD_DIRS['images']
            url_path = 'images'
        elif file_type == 'video':
            upload_dir = UPLOAD_DIRS['videos']
            url_path = 'videos'
        else:
            upload_dir = UPLOAD_DIRS['documents']
            url_path = 'documents'
        
        # Save file
        filepath = os.path.join(upload_dir, unique_filename)
        file.save(filepath)
        
        # Get file info
        file_info = get_file_info(filepath)
        
        # Prepare response
        media_data = {
            'success': True,
            'filename': unique_filename,
            'original_filename': original_filename,
            'url': f'/uploads/{url_path}/{unique_filename}',
            'type': file_type,
            'mime_type': file_info['mime_type'],
            'size': file_info['size'],
            'size_formatted': file_info['size_formatted'],
            'caption': caption,
            'from_user': from_user,
            'to_user': to_user,
            'timestamp': datetime.now().isoformat()
        }
        
        print(f"📁 [MEDIA] Uploaded: {original_filename} ({file_info['size_formatted']}) - Type: {file_type}")
        
        return jsonify(media_data), 200
        
    except Exception as e:
        print(f"❌ [MEDIA] Upload error: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


# ============================================
# 📥 DOWNLOAD/SERVE ENDPOINTS
# ============================================

@media_bp.route('/uploads/<path:subpath>/<filename>')
def serve_upload(subpath, filename):
    """Serve uploaded files"""
    try:
        # Security: Validate subpath
        if subpath not in ['voice', 'images', 'videos', 'documents', 'avatars']:
            return jsonify({'error': 'Invalid path'}), 404
        
        directory = UPLOAD_DIRS.get(subpath)
        
        if not directory:
            return jsonify({'error': 'Invalid directory'}), 404
        
        return send_from_directory(directory, filename)
        
    except Exception as e:
        print(f"❌ [MEDIA] Serve error: {str(e)}")
        return jsonify({'error': 'File not found'}), 404


# ============================================
# 🗑️ DELETE ENDPOINTS
# ============================================

@media_bp.route('/api/delete-media/<file_type>/<filename>', methods=['DELETE'])
def delete_media(file_type, filename):
    """Delete uploaded media file"""
    try:
        # Security: Validate file type
        if file_type not in UPLOAD_DIRS:
            return jsonify({'success': False, 'error': 'Invalid file type'}), 400
        
        # Construct filepath
        filepath = os.path.join(UPLOAD_DIRS[file_type], filename)
        
        # Check if file exists
        if not os.path.exists(filepath):
            return jsonify({'success': False, 'error': 'File not found'}), 404
        
        # Delete file
        os.remove(filepath)
        
        print(f"🗑️ [MEDIA] Deleted: {filename}")
        
        return jsonify({'success': True, 'message': 'File deleted'}), 200
        
    except Exception as e:
        print(f"❌ [MEDIA] Delete error: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


# ============================================
# 📊 STATISTICS ENDPOINTS
# ============================================

@media_bp.route('/api/media-stats', methods=['GET'])
def get_media_stats():
    """Get media storage statistics"""
    try:
        stats = {}
        total_size = 0
        total_files = 0
        
        for file_type, directory in UPLOAD_DIRS.items():
            if not os.path.exists(directory):
                stats[file_type] = {'count': 0, 'size': 0, 'size_formatted': '0 B'}
                continue
            
            files = os.listdir(directory)
            type_size = sum(os.path.getsize(os.path.join(directory, f)) for f in files)
            
            stats[file_type] = {
                'count': len(files),
                'size': type_size,
                'size_formatted': format_file_size(type_size)
            }
            
            total_size += type_size
            total_files += len(files)
        
        stats['total'] = {
            'count': total_files,
            'size': total_size,
            'size_formatted': format_file_size(total_size)
        }
        
        return jsonify({'success': True, 'stats': stats}), 200
        
    except Exception as e:
        print(f"❌ [MEDIA] Stats error: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500


# ============================================
# 🧹 CLEANUP UTILITIES
# ============================================

def cleanup_old_files(days=30):
    """Delete files older than specified days"""
    try:
        cutoff_time = datetime.now().timestamp() - (days * 24 * 60 * 60)
        deleted_count = 0
        freed_space = 0
        
        for directory in UPLOAD_DIRS.values():
            if not os.path.exists(directory):
                continue
            
            for filename in os.listdir(directory):
                filepath = os.path.join(directory, filename)
                
                if os.path.isfile(filepath):
                    file_time = os.path.getmtime(filepath)
                    
                    if file_time < cutoff_time:
                        file_size = os.path.getsize(filepath)
                        os.remove(filepath)
                        deleted_count += 1
                        freed_space += file_size
        
        print(f"🧹 [CLEANUP] Deleted {deleted_count} files, freed {format_file_size(freed_space)}")
        
        return {
            'deleted_count': deleted_count,
            'freed_space': freed_space,
            'freed_space_formatted': format_file_size(freed_space)
        }
        
    except Exception as e:
        print(f"❌ [CLEANUP] Error: {str(e)}")
        return None


# ============================================
# 📋 FILE LISTING
# ============================================

@media_bp.route('/api/list-media/<file_type>', methods=['GET'])
def list_media(file_type):
    """List all files of a specific type"""
    try:
        # Validate file type
        if file_type not in UPLOAD_DIRS and file_type != 'all':
            return jsonify({'success': False, 'error': 'Invalid file type'}), 400
        
        files_list = []
        
        # Get directories to scan
        if file_type == 'all':
            directories = UPLOAD_DIRS.items()
        else:
            directories = [(file_type, UPLOAD_DIRS[file_type])]
        
        # Scan directories
        for ftype, directory in directories:
            if not os.path.exists(directory):
                continue
            
            for filename in os.listdir(directory):
                filepath = os.path.join(directory, filename)
                
                if os.path.isfile(filepath):
                    file_info = get_file_info(filepath)
                    
                    files_list.append({
                        'filename': filename,
                        'type': ftype,
                        'url': f'/uploads/{ftype}/{filename}',
                        'size': file_info['size'],
                        'size_formatted': file_info['size_formatted'],
                        'mime_type': file_info['mime_type'],
                        'created': file_info['created'],
                        'modified': file_info['modified']
                    })
        
        # Sort by modified date (newest first)
        files_list.sort(key=lambda x: x['modified'], reverse=True)
        
        return jsonify({
            'success': True,
            'count': len(files_list),
            'files': files_list
        }), 200
        
    except Exception as e:
        print(f"❌ [MEDIA] List error: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500