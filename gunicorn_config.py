# Gunicorn configuration for CA360 Chat
import eventlet
eventlet.monkey_patch(all=True, thread=True, time=True, socket=True, select=True, os=True)

bind = "0.0.0.0:5000"
workers = 1
worker_class = "eventlet"
worker_connections = 1000
timeout = 120
graceful_timeout = 30
keepalive = 5
loglevel = "info"
accesslog = "-"
errorlog = "-"
preload_app = False