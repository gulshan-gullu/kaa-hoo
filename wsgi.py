#!/usr/bin/env python3
"""
WSGI Entry Point for KAA HO Chat Application
This file is used by Gunicorn to run the application
"""
import os
import sys

# Add the current directory to Python path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

# Import the Flask app and SocketIO
from app import app, socketio

# For Gunicorn to find the application
# Gunicorn will use: socketio.run(app) automatically with gevent worker
application = app

if __name__ == "__main__":
    # Run with SocketIO when executed directly
    socketio.run(app, debug=True, host='0.0.0.0', port=5000)