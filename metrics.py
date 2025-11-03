#!/usr/bin/env python3
"""
Prometheus Metrics for KAA HO Chat Application
Exports metrics that Grafana can visualize
"""

from prometheus_client import Counter, Histogram, Gauge, generate_latest, REGISTRY
from flask import Response
from functools import wraps
import time

# ==================== METRICS DEFINITIONS ====================

# Request Counters
http_requests_total = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status']
)

# Response Time
http_request_duration_seconds = Histogram(
    'http_request_duration_seconds',
    'HTTP request latency',
    ['method', 'endpoint']
)

# Active Users
active_users_gauge = Gauge(
    'active_users',
    'Number of currently active users'
)

# Online Users (WebSocket)
online_users_gauge = Gauge(
    'online_users',
    'Number of users connected via WebSocket'
)

# Messages
messages_sent_total = Counter(
    'messages_sent_total',
    'Total messages sent',
    ['message_type']
)

messages_per_second = Gauge(
    'messages_per_second',
    'Current messages per second rate'
)

# Database
db_query_duration_seconds = Histogram(
    'db_query_duration_seconds',
    'Database query duration',
    ['query_type']
)

db_connections_active = Gauge(
    'db_connections_active',
    'Number of active database connections'
)

# Files
files_uploaded_total = Counter(
    'files_uploaded_total',
    'Total files uploaded',
    ['file_type']
)

file_upload_size_bytes = Histogram(
    'file_upload_size_bytes',
    'File upload sizes',
    ['file_type']
)

# Errors
errors_total = Counter(
    'errors_total',
    'Total errors',
    ['error_type', 'endpoint']
)

# Authentication
login_attempts_total = Counter(
    'login_attempts_total',
    'Total login attempts',
    ['status']  # success, failure
)

# Rate Limiting
rate_limit_exceeded_total = Counter(
    'rate_limit_exceeded_total',
    'Total rate limit violations',
    ['endpoint']
)

# Cache
cache_hits_total = Counter(
    'cache_hits_total',
    'Total cache hits'
)

cache_misses_total = Counter(
    'cache_misses_total',
    'Total cache misses'
)

# System Resources
memory_usage_bytes = Gauge(
    'memory_usage_bytes',
    'Memory usage in bytes'
)

cpu_usage_percent = Gauge(
    'cpu_usage_percent',
    'CPU usage percentage'
)

# ==================== MIDDLEWARE & DECORATORS ====================

def track_request_metrics(f):
    """Decorator to track request metrics"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        start_time = time.time()
        
        try:
            response = f(*args, **kwargs)
            status_code = getattr(response, 'status_code', 200)
            
            # Record metrics
            from flask import request
            http_requests_total.labels(
                method=request.method,
                endpoint=request.endpoint or 'unknown',
                status=status_code
            ).inc()
            
            duration = time.time() - start_time
            http_request_duration_seconds.labels(
                method=request.method,
                endpoint=request.endpoint or 'unknown'
            ).observe(duration)
            
            return response
            
        except Exception as e:
            # Record error
            from flask import request
            errors_total.labels(
                error_type=type(e).__name__,
                endpoint=request.endpoint or 'unknown'
            ).inc()
            raise
    
    return decorated_function


def track_db_query(query_type):
    """Decorator to track database query metrics"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            start_time = time.time()
            
            try:
                result = f(*args, **kwargs)
                duration = time.time() - start_time
                db_query_duration_seconds.labels(
                    query_type=query_type
                ).observe(duration)
                return result
                
            except Exception as e:
                errors_total.labels(
                    error_type='database_error',
                    endpoint=query_type
                ).inc()
                raise
        
        return decorated_function
    return decorator


# ==================== METRIC UPDATERS ====================

def update_online_users(count):
    """Update online users gauge"""
    online_users_gauge.set(count)


def update_active_users(count):
    """Update active users gauge"""
    active_users_gauge.set(count)


def record_message_sent(message_type='text'):
    """Record a message sent"""
    messages_sent_total.labels(message_type=message_type).inc()


def record_file_upload(file_type, file_size):
    """Record a file upload"""
    files_uploaded_total.labels(file_type=file_type).inc()
    file_upload_size_bytes.labels(file_type=file_type).observe(file_size)


def record_login_attempt(success=True):
    """Record a login attempt"""
    status = 'success' if success else 'failure'
    login_attempts_total.labels(status=status).inc()


def record_rate_limit_exceeded(endpoint):
    """Record rate limit violation"""
    rate_limit_exceeded_total.labels(endpoint=endpoint).inc()


def record_cache_hit():
    """Record cache hit"""
    cache_hits_total.inc()


def record_cache_miss():
    """Record cache miss"""
    cache_misses_total.inc()


def update_system_metrics():
    """Update system resource metrics"""
    try:
        import psutil
        
        # Memory
        memory = psutil.virtual_memory()
        memory_usage_bytes.set(memory.used)
        
        # CPU
        cpu_percent = psutil.cpu_percent(interval=1)
        cpu_usage_percent.set(cpu_percent)
        
    except ImportError:
        pass  # psutil not installed


# ==================== FLASK INTEGRATION ====================

def setup_metrics(app):
    """Setup metrics endpoint for Flask app"""
    
    @app.route('/metrics')
    def metrics():
        """Prometheus metrics endpoint"""
        # Update system metrics before serving
        update_system_metrics()
        
        return Response(
            generate_latest(REGISTRY),
            mimetype='text/plain'
        )
    
    @app.before_request
    def before_request_metrics():
        """Track request start time"""
        from flask import g
        g.start_time = time.time()
    
    @app.after_request
    def after_request_metrics(response):
        """Track request completion"""
        from flask import request, g
        
        if hasattr(g, 'start_time'):
            duration = time.time() - g.start_time
            
            http_requests_total.labels(
                method=request.method,
                endpoint=request.endpoint or 'unknown',
                status=response.status_code
            ).inc()
            
            http_request_duration_seconds.labels(
                method=request.method,
                endpoint=request.endpoint or 'unknown'
            ).observe(duration)
        
        return response
    
    print("✅ [METRICS] Prometheus metrics enabled at /metrics")


# ==================== HELPER FUNCTIONS ====================

def get_current_metrics():
    """Get current metric values (for debugging)"""
    return {
        'http_requests_total': http_requests_total._value.get(),
        'online_users': online_users_gauge._value.get(),
        'messages_sent_total': messages_sent_total._value.get(),
        'errors_total': errors_total._value.get()
    }