"""
Database Models for CA360 Chat Application

This file defines the database table structures used in the application.
Using MySQL database with direct SQL queries.

Tables:
1. users - User authentication and profiles
2. messages - Chat messages between users
3. contacts - User relationships
4. calls - Audio/Video call history and status
5. conversations - Conversation metadata
6. sessions - User session management
7. files - File attachments
"""

# Call Table Model Definition
# This represents the structure of the 'calls' table in MySQL database
CALL_TABLE_MODEL = {
    'table_name': 'calls',
    'fields': {
        'call_id': {
            'type': 'VARCHAR(50)',
            'primary_key': True,
            'description': 'Unique identifier for each call'
        },
        'caller_id': {
            'type': 'VARCHAR(50)',
            'foreign_key': 'users(user_id)',
            'description': 'User who initiated the call'
        },
        'receiver_id': {
            'type': 'VARCHAR(50)',
            'foreign_key': 'users(user_id)',
            'description': 'User who received the call'
        },
        'call_type': {
            'type': "ENUM('audio', 'video')",
            'default': 'audio',
            'description': 'Type of call: audio or video'
        },
        'call_status': {
            'type': "ENUM('initiated', 'ringing', 'answered', 'ended', 'rejected', 'missed', 'busy', 'failed')",
            'default': 'initiated',
            'description': 'Current status of the call'
        },
        'start_time': {
            'type': 'TIMESTAMP',
            'nullable': True,
            'description': 'When the call started'
        },
        'end_time': {
            'type': 'TIMESTAMP',
            'nullable': True,
            'description': 'When the call ended'
        },
        'duration': {
            'type': 'INT',
            'default': 0,
            'description': 'Call duration in seconds'
        },
        'failure_reason': {
            'type': 'VARCHAR(255)',
            'nullable': True,
            'description': 'Reason for call failure if applicable'
        },
        'created_at': {
            'type': 'TIMESTAMP',
            'default': 'CURRENT_TIMESTAMP',
            'description': 'Record creation timestamp'
        },
        'updated_at': {
            'type': 'TIMESTAMP',
            'default': 'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
            'description': 'Record last update timestamp'
        }
    },
    'indexes': [
        'idx_caller (caller_id)',
        'idx_receiver (receiver_id)',
        'idx_status (call_status)'
    ]
}

# SQL Schema for creating the calls table
CREATE_CALLS_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS calls (
    call_id VARCHAR(50) PRIMARY KEY,
    caller_id VARCHAR(50) NOT NULL,
    receiver_id VARCHAR(50) NOT NULL,
    call_type ENUM('audio', 'video') NOT NULL DEFAULT 'audio',
    call_status ENUM('initiated', 'ringing', 'answered', 'ended', 'rejected', 'missed', 'busy', 'failed') NOT NULL DEFAULT 'initiated',
    start_time TIMESTAMP NULL,
    end_time TIMESTAMP NULL,
    duration INT DEFAULT 0,
    failure_reason VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (caller_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_caller (caller_id),
    INDEX idx_receiver (receiver_id),
    INDEX idx_status (call_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
"""