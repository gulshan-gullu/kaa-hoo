#!/usr/bin/env python3
"""
Custom Metrics for KAA HO Chat - Track Specific Features
Add business-specific and feature-specific metrics
"""

from prometheus_client import Counter, Histogram, Gauge, Summary
from functools import wraps
import time

# ==================== CHAT FEATURE METRICS ====================

# Message Types
text_messages_total = Counter(
    'text_messages_total',
    'Total text messages sent'
)

voice_messages_total = Counter(
    'voice_messages_total',
    'Total voice messages sent'
)

image_messages_total = Counter(
    'image_messages_total',
    'Total images sent'
)

video_messages_total = Counter(
    'video_messages_total',
    'Total videos sent'
)

# Message Length Distribution
message_length_bytes = Histogram(
    'message_length_bytes',
    'Message length distribution',
    buckets=[10, 50, 100, 500, 1000, 5000, 10000]
)

# ==================== USER ENGAGEMENT METRICS ====================

# Active user sessions
user_session_duration_seconds = Histogram(
    'user_session_duration_seconds',
    'User session duration',
    buckets=[60, 300, 900, 1800, 3600, 7200, 14400]  # 1min to 4hours
)

# Messages per user
messages_per_user = Histogram(
    'messages_per_user',
    'Messages sent per user per session',
    buckets=[1, 5, 10, 20, 50, 100, 200]
)

# User activity by hour
active_users_by_hour = Gauge(
    'active_users_by_hour',
    'Active users in the past hour'
)

# Daily active users
daily_active_users = Gauge(
    'daily_active_users',
    'Unique active users today'
)

# Weekly active users
weekly_active_users = Gauge(
    'weekly_active_users',
    'Unique active users this week'
)

# ==================== CALL METRICS ====================

# Voice/Video calls
calls_initiated_total = Counter(
    'calls_initiated_total',
    'Total calls initiated',
    ['call_type']  # audio or video
)

calls_completed_total = Counter(
    'calls_completed_total',
    'Total calls completed successfully',
    ['call_type']
)

calls_failed_total = Counter(
    'calls_failed_total',
    'Total calls that failed',
    ['call_type', 'failure_reason']
)

call_duration_seconds = Histogram(
    'call_duration_seconds',
    'Call duration distribution',
    ['call_type'],
    buckets=[30, 60, 180, 300, 600, 1800, 3600]  # 30s to 1hour
)

# ==================== LOCATION SHARING METRICS ====================

locations_shared_total = Counter(
    'locations_shared_total',
    'Total locations shared'
)

live_locations_active = Gauge(
    'live_locations_active',
    'Number of active live location shares'
)

# ==================== GOOGLE OAUTH METRICS ====================

google_logins_total = Counter(
    'google_logins_total',
    'Total Google OAuth logins',
    ['status']  # success, failure
)

google_account_creations_total = Counter(
    'google_account_creations_total',
    'Total new accounts created via Google'
)

# ==================== ADMIN ACTIONS METRICS ====================

admin_actions_total = Counter(
    'admin_actions_total',
    'Total admin actions performed',
    ['action']  # add_user, delete_user, ban_user, etc.
)

users_banned_total = Counter(
    'users_banned_total',
    'Total users banned'
)

# ==================== SEARCH METRICS ====================

searches_performed_total = Counter(
    'searches_performed_total',
    'Total message searches performed'
)

search_response_time_seconds = Histogram(
    'search_response_time_seconds',
    'Search query response time',
    buckets=[0.1, 0.5, 1.0, 2.0, 5.0]
)

# ==================== EXPORT METRICS ====================

message_exports_total = Counter(
    'message_exports_total',
    'Total message exports (CSV downloads)'
)

export_size_bytes = Histogram(
    'export_size_bytes',
    'Size of exported files',
    buckets=[1000, 10000, 100000, 1000000, 10000000]
)

# ==================== USER ROLE METRICS ====================

users_by_role = Gauge(
    'users_by_role',
    'Number of users by role',
    ['role']  # admin, staff, client
)

# ==================== BUSINESS METRICS ====================

# Revenue tracking (if you have paid features)
revenue_generated = Counter(
    'revenue_generated',
    'Total revenue generated',
    ['currency']
)

# Feature usage
feature_usage_total = Counter(
    'feature_usage_total',
    'Feature usage counter',
    ['feature_name']  # voice_call, video_call, file_share, location, etc.
)

# User retention (still active after X days)
user_retention_rate = Gauge(
    'user_retention_rate',
    'Percentage of users still active after registration',
    ['days_since_registration']  # 1, 7, 30, 90
)

# ==================== CUSTOM DECORATORS ====================

def track_message_type(message_type='text'):
    """Decorator to track message type"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            result = f(*args, **kwargs)
            
            # Track message type
            if message_type == 'text':
                text_messages_total.inc()
            elif message_type == 'voice':
                voice_messages_total.inc()
            elif message_type == 'image':
                image_messages_total.inc()
            elif message_type == 'video':
                video_messages_total.inc()
            
            # Track feature usage
            feature_usage_total.labels(feature_name=f'{message_type}_message').inc()
            
            return result
        return decorated_function
    return decorator


def track_call(call_type='audio'):
    """Decorator to track call metrics"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            calls_initiated_total.labels(call_type=call_type).inc()
            feature_usage_total.labels(feature_name=f'{call_type}_call').inc()
            
            start_time = time.time()
            try:
                result = f(*args, **kwargs)
                
                # Track successful call
                calls_completed_total.labels(call_type=call_type).inc()
                duration = time.time() - start_time
                call_duration_seconds.labels(call_type=call_type).observe(duration)
                
                return result
            except Exception as e:
                # Track failed call
                calls_failed_total.labels(
                    call_type=call_type,
                    failure_reason=type(e).__name__
                ).inc()
                raise
        return decorated_function
    return decorator


def track_user_session():
    """Decorator to track user session metrics"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            from flask import session
            
            # Track session start
            if 'session_start' not in session:
                session['session_start'] = time.time()
                session['messages_in_session'] = 0
            
            result = f(*args, **kwargs)
            
            # Track session metrics on logout/disconnect
            if 'session_end' in session:
                duration = time.time() - session['session_start']
                user_session_duration_seconds.observe(duration)
                messages_per_user.observe(session.get('messages_in_session', 0))
            
            return result
        return decorated_function
    return decorator


def track_admin_action(action_name):
    """Decorator to track admin actions"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            result = f(*args, **kwargs)
            admin_actions_total.labels(action=action_name).inc()
            return result
        return decorated_function
    return decorator


# ==================== HELPER FUNCTIONS ====================

def record_text_message(message_text):
    """Record text message with length"""
    text_messages_total.inc()
    message_length_bytes.observe(len(message_text.encode('utf-8')))
    feature_usage_total.labels(feature_name='text_message').inc()


def record_voice_message(duration_seconds=None):
    """Record voice message"""
    voice_messages_total.inc()
    feature_usage_total.labels(feature_name='voice_message').inc()


def record_location_share(is_live=False):
    """Record location sharing"""
    locations_shared_total.inc()
    feature_usage_total.labels(feature_name='location_share').inc()
    
    if is_live:
        feature_usage_total.labels(feature_name='live_location').inc()


def record_google_login(success=True):
    """Record Google OAuth login attempt"""
    status = 'success' if success else 'failure'
    google_logins_total.labels(status=status).inc()


def record_google_signup():
    """Record new account via Google"""
    google_account_creations_total.inc()


def record_search(query, response_time_seconds):
    """Record search metrics"""
    searches_performed_total.inc()
    search_response_time_seconds.observe(response_time_seconds)


def record_export(file_size_bytes):
    """Record message export"""
    message_exports_total.inc()
    export_size_bytes.observe(file_size_bytes)


def update_user_counts_by_role(role_counts):
    """Update user counts by role
    
    Args:
        role_counts: dict like {'admin': 2, 'staff': 5, 'client': 100}
    """
    for role, count in role_counts.items():
        users_by_role.labels(role=role).set(count)


def update_active_user_metrics(hourly, daily, weekly):
    """Update active user metrics
    
    Args:
        hourly: Number of users active in past hour
        daily: Number of unique users today
        weekly: Number of unique users this week
    """
    active_users_by_hour.set(hourly)
    daily_active_users.set(daily)
    weekly_active_users.set(weekly)


# ==================== BUSINESS INTELLIGENCE ====================

def calculate_user_engagement_score(user_id):
    """
    Calculate engagement score for a user
    Based on: messages sent, calls made, features used
    Returns: Score 0-100
    """
    # This would query your database for user activity
    # Return a score that gets exposed as a metric
    pass


def get_feature_adoption_rate(feature_name):
    """
    Calculate what % of users use a specific feature
    """
    pass


# ==================== INITIALIZATION ====================

def setup_custom_metrics():
    """Initialize custom metrics"""
    print("✅ [CUSTOM METRICS] Custom feature metrics initialized")
    
    # Set initial values
    users_by_role.labels(role='admin').set(0)
    users_by_role.labels(role='staff').set(0)
    users_by_role.labels(role='client').set(0)
    live_locations_active.set(0)