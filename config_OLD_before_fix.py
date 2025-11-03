"""
Application Configuration
All configuration in one place for consistency and security.
Enterprise-grade with session management and security settings.
"""
import os
from datetime import timedelta

# ==================== CORE APP CONFIG ====================
# Best practice to load secrets from environment variables
SECRET_KEY = os.getenv('SECRET_KEY', 'a-very-long-and-random-secret-key-that-is-hard-to-guess')
TIMEZONE = 'Asia/Kolkata'

# ==================== SESSION CONFIGURATION ====================
# Enterprise-grade session management
SESSION_TYPE = 'filesystem'
SESSION_PERMANENT = True
SESSION_USE_SIGNER = True
SESSION_KEY_PREFIX = 'ca360_'

# Session Cookie Configuration
SESSION_COOKIE_NAME = 'ca360_session'
SESSION_LIFETIME = timedelta(hours=24)
SESSION_COOKIE_SAMESITE = 'Lax'  # 'Lax' is best for security and OAuth compatibility
SESSION_COOKIE_SECURE = False    # Set to True in production with HTTPS
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_DOMAIN = None

# ==================== DATABASE CONFIG ====================
DATABASE_HOST = os.getenv('DB_HOST', os.getenv('DATABASE_HOST', 'localhost'))
DATABASE_USER = os.getenv('DATABASE_USER', 'kaa_ho_user')
DATABASE_PASSWORD = os.getenv('DATABASE_PASSWORD', '123')
DATABASE_NAME = os.getenv('DATABASE_NAME', 'kaa_ho')

# ==================== REDIS CONFIG ====================
REDIS_URL = os.getenv('REDIS_URL', 'redis://redis:6379/0')

# ==================== FILE UPLOAD CONFIG ====================
UPLOAD_FOLDER = 'uploads'
MAX_FILE_SIZE = 3 * 1024 * 1024 * 1024  # 3GB (matching frontend limit)

# Allowed file extensions for uploads
ALLOWED_EXTENSIONS = {
    # Documents
    'txt', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'odt',
    
    # Images
    'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico',
    
    # Videos
    'mp4', 'avi', 'mov', 'webm', 'mkv', 'flv', 'wmv',
    
    # Audio
    'mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac',
    
    # Archives
    'zip', 'rar', '7z', 'tar', 'gz',
    
    # Binary & Data files (for stress testing)
    'bin', 'dat', 'iso',
    
    # Other
    'csv', 'json', 'xml', 'sql'
}

# ==================== GOOGLE OAUTH CONFIG ====================
# Recommended: Move these to environment variables in production
GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID', "132377569005-lqd026scvdggev1gsrsqi96lc8nv67.apps.googleusercontent.com")
GOOGLE_CLIENT_SECRET = os.getenv('GOOGLE_CLIENT_SECRET', "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")

# ==================== BIOMETRIC (WEBAUTHN) CONFIG ====================
RP_ID = os.getenv('RP_ID', "localhost")
RP_NAME = os.getenv('RP_NAME', "CA360 Chat")
ORIGIN = os.getenv('ORIGIN', "https://localhost")

# ==================== 🔐 WEBRTC & TURN CONFIGURATION ====================

# TURN Server Secret (for generating time-limited credentials)
TURN_SECRET = os.getenv('TURN_SECRET', 'ca360-ultra-secure-turn-secret-key-change-in-production-2025')

# Metered.ca TURN Credentials (Primary - FREE Tier)
# Sign up at: https://www.metered.ca/tools/openrelay/
METERED_API_KEY = os.getenv('METERED_API_KEY', 'f86ed57a2576a83ac43ff095')
METERED_SECRET_KEY = os.getenv('METERED_SECRET_KEY', 'TL+Ej10vunMnDAVV')
METERED_TURN_URLS = os.getenv(
    'METERED_TURN_URLS',
    'turn:a.relay.metered.ca:80,turn:a.relay.metered.ca:443,turn:a.relay.metered.ca:443?transport=tcp,turns:a.relay.metered.ca:443'
)

# OpenRelay TURN Credentials (Backup - FREE Public)
OPENRELAY_USERNAME = os.getenv('OPENRELAY_USERNAME', 'openrelayproject')
OPENRELAY_CREDENTIAL = os.getenv('OPENRELAY_CREDENTIAL', 'openrelayproject')
OPENRELAY_TURN_URLS = os.getenv(
    'OPENRELAY_TURN_URLS',
    'turn:openrelay.metered.ca:80,turn:openrelay.metered.ca:443,turn:openrelay.metered.ca:443?transport=tcp'
)

# STUN Servers Configuration
GOOGLE_STUN_SERVERS = [
    'stun:stun.l.google.com:19302',
    'stun:stun1.l.google.com:19302',
    'stun:stun2.l.google.com:19302',
    'stun:stun3.l.google.com:19302',
    'stun:stun4.l.google.com:19302'
]

CLOUDFLARE_STUN = 'stun:stun.cloudflare.com:3478'

# WebRTC Configuration
ICE_GATHERING_TIMEOUT = int(os.getenv('ICE_GATHERING_TIMEOUT', 10))  # seconds
CONNECTION_TIMEOUT = int(os.getenv('CONNECTION_TIMEOUT', 30))  # seconds
CONTINUAL_ICE_GATHERING = os.getenv('CONTINUAL_ICE_GATHERING', 'true').lower() == 'true'
MAX_CALL_DURATION = int(os.getenv('MAX_CALL_DURATION', 0))  # 0 = unlimited
CALL_RINGING_TIMEOUT = int(os.getenv('CALL_RINGING_TIMEOUT', 60))  # seconds

# Quality Settings
AUDIO_BITRATE_MIN = int(os.getenv('AUDIO_BITRATE_MIN', 16))  # kbps
AUDIO_BITRATE_MAX = int(os.getenv('AUDIO_BITRATE_MAX', 128))  # kbps
VIDEO_BITRATE_MIN = int(os.getenv('VIDEO_BITRATE_MIN', 150))  # kbps
VIDEO_BITRATE_MAX = int(os.getenv('VIDEO_BITRATE_MAX', 2500))  # kbps
DEFAULT_QUALITY_PRESET = os.getenv('DEFAULT_QUALITY_PRESET', 'balanced')  # performance | balanced | quality
AUTO_ADJUST_BITRATE = os.getenv('AUTO_ADJUST_BITRATE', 'true').lower() == 'true'

# ==================== SECURITY CONFIG ====================
# CORS settings
CORS_ORIGINS = os.getenv('CORS_ORIGINS', '*').split(',')

# Rate limiting
RATE_LIMIT_ENABLED = os.getenv('RATE_LIMIT_ENABLED', 'True').lower() == 'true'
RATE_LIMIT_DEFAULT = os.getenv('RATE_LIMIT_DEFAULT', '100 per hour')

# ==================== LOGGING CONFIG ====================
LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
LOG_FILE = os.getenv('LOG_FILE', 'logs/app.log')
LOG_MAX_BYTES = int(os.getenv('LOG_MAX_BYTES', 10485760))  # 10MB
LOG_BACKUP_COUNT = int(os.getenv('LOG_BACKUP_COUNT', 5))

# ==================== FEATURE FLAGS ====================
ENABLE_BIOMETRIC = os.getenv('ENABLE_BIOMETRIC', 'True').lower() == 'true'
ENABLE_LOCATION_SHARING = os.getenv('ENABLE_LOCATION_SHARING', 'True').lower() == 'true'
ENABLE_VOICE_CALLS = os.getenv('ENABLE_VOICE_CALLS', 'True').lower() == 'true'
ENABLE_VIDEO_CALLS = os.getenv('ENABLE_VIDEO_CALLS', 'True').lower() == 'true'
ENABLE_SCREEN_SHARING = os.getenv('ENABLE_SCREEN_SHARING', 'True').lower() == 'true'
ENABLE_FILE_SHARING = os.getenv('ENABLE_FILE_SHARING', 'True').lower() == 'true'
ENABLE_VOICE_MESSAGES = os.getenv('ENABLE_VOICE_MESSAGES', 'True').lower() == 'true'
ENABLE_ENCRYPTION = os.getenv('ENABLE_ENCRYPTION', 'True').lower() == 'true'

# ==================== MOBILE PWA CONFIG ====================
PWA_ENABLED = os.getenv('PWA_ENABLED', 'true').lower() == 'true'
PWA_NAME = os.getenv('PWA_NAME', 'CA360 Chat')
PWA_SHORT_NAME = os.getenv('PWA_SHORT_NAME', 'CA360')
PWA_THEME_COLOR = os.getenv('PWA_THEME_COLOR', '#075e54')
PWA_BACKGROUND_COLOR = os.getenv('PWA_BACKGROUND_COLOR', '#075e54')

# ==================== PERFORMANCE CONFIG ====================
# Database connection pool
DB_POOL_SIZE = int(os.getenv('DB_POOL_SIZE', 10))
DB_MAX_OVERFLOW = int(os.getenv('DB_MAX_OVERFLOW', 20))
DB_POOL_TIMEOUT = int(os.getenv('DB_POOL_TIMEOUT', 30))
DB_POOL_RECYCLE = int(os.getenv('DB_POOL_RECYCLE', 3600))

# Redis connection pool
REDIS_MAX_CONNECTIONS = int(os.getenv('REDIS_MAX_CONNECTIONS', 50))

# ==================== WEBSOCKET CONFIG ====================
SOCKETIO_MESSAGE_QUEUE = os.getenv('SOCKETIO_MESSAGE_QUEUE', REDIS_URL)
SOCKETIO_ASYNC_MODE = 'eventlet'
SOCKETIO_CORS_ALLOWED_ORIGINS = '*'
SOCKETIO_MAX_HTTP_BUFFER_SIZE = 10 * 1024 * 1024  # 10MB

# ==================== ENVIRONMENT ====================
FLASK_ENV = os.getenv('FLASK_ENV', 'production')
DEBUG = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'

# ==================== HELPER FUNCTIONS ====================

def is_production():
    """Check if running in production environment"""
    return FLASK_ENV == 'production'

def is_development():
    """Check if running in development environment"""
    return FLASK_ENV == 'development'

def get_database_uri():
    """Get complete database URI"""
    return f"mysql+pymysql://{DATABASE_USER}:{DATABASE_PASSWORD}@{DATABASE_HOST}/{DATABASE_NAME}"

def get_redis_config():
    """Get Redis configuration dictionary"""
    return {
        'url': REDIS_URL,
        'max_connections': REDIS_MAX_CONNECTIONS,
        'decode_responses': True
    }

def get_ice_servers():
    """Get complete ICE servers configuration for WebRTC"""
    ice_servers = []
    
    # Add STUN servers
    for stun_url in GOOGLE_STUN_SERVERS:
        ice_servers.append({'urls': stun_url})
    
    ice_servers.append({'urls': CLOUDFLARE_STUN})
    
    # Add Metered.ca TURN servers
    metered_urls = [url.strip() for url in METERED_TURN_URLS.split(',')]
    ice_servers.append({
        'urls': metered_urls,
        'username': METERED_API_KEY,
        'credential': METERED_SECRET_KEY
    })
    
    # Add OpenRelay TURN servers
    openrelay_urls = [url.strip() for url in OPENRELAY_TURN_URLS.split(',')]
    ice_servers.append({
        'urls': openrelay_urls,
        'username': OPENRELAY_USERNAME,
        'credential': OPENRELAY_CREDENTIAL
    })
    
    return ice_servers

def get_webrtc_config():
    """Get complete WebRTC configuration dictionary"""
    return {
        'ice_servers': get_ice_servers(),
        'ice_gathering_timeout': ICE_GATHERING_TIMEOUT,
        'connection_timeout': CONNECTION_TIMEOUT,
        'continual_ice_gathering': CONTINUAL_ICE_GATHERING,
        'max_call_duration': MAX_CALL_DURATION,
        'call_ringing_timeout': CALL_RINGING_TIMEOUT,
        'audio': {
            'min_bitrate': AUDIO_BITRATE_MIN,
            'max_bitrate': AUDIO_BITRATE_MAX
        },
        'video': {
            'min_bitrate': VIDEO_BITRATE_MIN,
            'max_bitrate': VIDEO_BITRATE_MAX
        },
        'quality_preset': DEFAULT_QUALITY_PRESET,
        'auto_adjust_bitrate': AUTO_ADJUST_BITRATE
    }

# ==================== VALIDATION ====================

def validate_config():
    """Validate critical configuration settings"""
    errors = []
    warnings = []
    
    # Check secret key strength
    if len(SECRET_KEY) < 32:
        errors.append("SECRET_KEY should be at least 32 characters long")
    
    # Check database credentials
    if DATABASE_PASSWORD == '123' and is_production():
        warnings.append("Database password is insecure for production")
    
    # Check session security
    if SESSION_COOKIE_SECURE is False and is_production():
        warnings.append("SESSION_COOKIE_SECURE should be True in production")
    
    # Check Google OAuth credentials
    if is_production() and (not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET):
        warnings.append("Google OAuth credentials not configured")
    
    # Check TURN configuration
    if not TURN_SECRET or len(TURN_SECRET) < 32:
        warnings.append("TURN_SECRET should be at least 32 characters long")
    
    if not METERED_API_KEY or not METERED_SECRET_KEY:
        warnings.append("Metered.ca TURN credentials not configured")
    
    # Check WebRTC settings
    if CALL_RINGING_TIMEOUT < 30:
        warnings.append("CALL_RINGING_TIMEOUT is very short (< 30s)")
    
    if AUDIO_BITRATE_MAX < 64:
        warnings.append("AUDIO_BITRATE_MAX is low for good quality calls")
    
    return {
        'errors': errors,
        'warnings': warnings,
        'valid': len(errors) == 0
    }

# ==================== CONFIGURATION SUMMARY ====================

def print_config_summary():
    """Print configuration summary for debugging"""
    print("\n" + "="*70)
    print(" 🚀 CA360 CHAT - CONFIGURATION SUMMARY")
    print("="*70)
    print(f"Environment: {FLASK_ENV}")
    print(f"Debug Mode: {DEBUG}")
    print(f"Timezone: {TIMEZONE}")
    print(f"Database: {DATABASE_HOST}:{DATABASE_NAME}")
    print(f"Redis: {REDIS_URL}")
    print(f"Max File Size: {MAX_FILE_SIZE / (1024**3):.1f}GB")
    print(f"Session Lifetime: {SESSION_LIFETIME}")
    print(f"Session Cookie: {SESSION_COOKIE_NAME}")
    
    print("\n" + "-"*70)
    print(" 📞 WebRTC & Calling Configuration")
    print("-"*70)
    print(f"Voice Calls: {'✅ Enabled' if ENABLE_VOICE_CALLS else '❌ Disabled'}")
    print(f"Video Calls: {'✅ Enabled' if ENABLE_VIDEO_CALLS else '❌ Disabled'}")
    print(f"Screen Sharing: {'✅ Enabled' if ENABLE_SCREEN_SHARING else '❌ Disabled'}")
    print(f"TURN Secret: {'✅ Configured' if len(TURN_SECRET) >= 32 else '⚠️ Weak'}")
    print(f"Metered.ca: {'✅ ' + METERED_API_KEY[:10] + '...' if METERED_API_KEY else '❌ Not configured'}")
    print(f"OpenRelay: {'✅ Configured' if OPENRELAY_USERNAME else '❌ Not configured'}")
    print(f"ICE Servers: {len(get_ice_servers())} configured")
    print(f"Call Timeout: {CALL_RINGING_TIMEOUT}s")
    print(f"Audio Bitrate: {AUDIO_BITRATE_MIN}-{AUDIO_BITRATE_MAX} kbps")
    print(f"Video Bitrate: {VIDEO_BITRATE_MIN}-{VIDEO_BITRATE_MAX} kbps")
    print(f"Quality Preset: {DEFAULT_QUALITY_PRESET}")
    print(f"Auto Adjust: {'✅ Enabled' if AUTO_ADJUST_BITRATE else '❌ Disabled'}")
    
    print("\n" + "-"*70)
    print(" 📱 Mobile & PWA Configuration")
    print("-"*70)
    print(f"PWA Enabled: {'✅ Yes' if PWA_ENABLED else '❌ No'}")
    print(f"PWA Name: {PWA_NAME}")
    print(f"Theme Color: {PWA_THEME_COLOR}")
    
    print("\n" + "-"*70)
    print(" 🎯 Feature Flags")
    print("-"*70)
    print(f"Biometric: {'✅' if ENABLE_BIOMETRIC else '❌'}")
    print(f"Location Sharing: {'✅' if ENABLE_LOCATION_SHARING else '❌'}")
    print(f"File Sharing: {'✅' if ENABLE_FILE_SHARING else '❌'}")
    print(f"Voice Messages: {'✅' if ENABLE_VOICE_MESSAGES else '❌'}")
    print(f"Encryption: {'✅' if ENABLE_ENCRYPTION else '❌'}")
    
    # Validation
    validation = validate_config()
    
    if validation['errors']:
        print("\n" + "="*70)
        print(" ❌ CONFIGURATION ERRORS:")
        print("="*70)
        for error in validation['errors']:
            print(f"  ❌ {error}")
    
    if validation['warnings']:
        print("\n" + "="*70)
        print(" ⚠️  CONFIGURATION WARNINGS:")
        print("="*70)
        for warning in validation['warnings']:
            print(f"  ⚠️  {warning}")
    
    if validation['valid'] and not validation['warnings']:
        print("\n✅ Configuration validated successfully - No issues found!")
    
    print("\n" + "="*70 + "\n")

# ==================== EXPORT CONFIGURATION ====================

def get_client_config():
    """Get configuration safe to send to client"""
    return {
        'features': {
            'voice_calls': ENABLE_VOICE_CALLS,
            'video_calls': ENABLE_VIDEO_CALLS,
            'screen_sharing': ENABLE_SCREEN_SHARING,
            'file_sharing': ENABLE_FILE_SHARING,
            'location_sharing': ENABLE_LOCATION_SHARING,
            'voice_messages': ENABLE_VOICE_MESSAGES,
            'biometric': ENABLE_BIOMETRIC,
            'encryption': ENABLE_ENCRYPTION,
        },
        'webrtc': {
            'call_timeout': CALL_RINGING_TIMEOUT,
            'quality_preset': DEFAULT_QUALITY_PRESET,
            'auto_adjust': AUTO_ADJUST_BITRATE,
        },
        'upload': {
            'max_size': MAX_FILE_SIZE,
            'allowed_extensions': list(ALLOWED_EXTENSIONS)
        },
        'pwa': {
            'enabled': PWA_ENABLED,
            'name': PWA_NAME,
            'short_name': PWA_SHORT_NAME,
            'theme_color': PWA_THEME_COLOR,
            'background_color': PWA_BACKGROUND_COLOR
        }
    }

# Auto-validate on import in development
if is_development():
    print_config_summary()
