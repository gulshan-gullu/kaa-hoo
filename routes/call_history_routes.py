"""
Call History Routes - Flask Backend
===================================
Complete call history management system

Add to app.py:
    from call_history_routes import call_history_bp
    app.register_blueprint(call_history_bp)
"""

from flask import Blueprint, request, jsonify, session
from datetime import datetime, timedelta
import csv
import io

call_history_bp = Blueprint('call_history', __name__, url_prefix='/api/calls')


def get_db_connection():
    """Import from your main app"""
    from app import get_db_connection
    return get_db_connection()


@call_history_bp.route('/log', methods=['POST'])
def log_call():
    """Log a call to history"""
    try:
        data = request.get_json()
        
        call_id = data.get('call_id')
        caller_id = data.get('caller_id')
        receiver_id = data.get('receiver_id')
        call_type = data.get('call_type', 'voice')  # 'voice' or 'video'
        call_status = data.get('call_status', 'completed')  # completed, missed, rejected, failed
        duration = data.get('duration', 0)
        started_at = data.get('started_at')
        ended_at = data.get('ended_at')
        channel_name = data.get('channel_name')
        provider = data.get('provider', 'agora')
        
        if not all([call_id, caller_id, receiver_id, started_at]):
            return jsonify({'error': 'Missing required fields'}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO call_history 
            (call_id, caller_id, receiver_id, call_type, call_status, 
             duration, started_at, ended_at, channel_name, provider)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE
                call_status = VALUES(call_status),
                duration = VALUES(duration),
                ended_at = VALUES(ended_at)
        ''', (call_id, caller_id, receiver_id, call_type, call_status,
              duration, started_at, ended_at, channel_name, provider))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        print(f'✅ [CALL HISTORY] Logged call: {call_id} ({call_status})')
        
        return jsonify({
            'success': True,
            'call_id': call_id
        }), 201
        
    except Exception as e:
        print(f'❌ [CALL HISTORY] Error logging call: {e}')
        return jsonify({'error': str(e)}), 500


@call_history_bp.route('/history', methods=['GET'])
def get_call_history():
    """Get call history for current user"""
    try:
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'error': 'Not authenticated'}), 401
        
        # Query parameters
        call_type = request.args.get('type')  # 'all', 'missed', 'received', 'dialed'
        limit = int(request.args.get('limit', 50))
        offset = int(request.args.get('offset', 0))
        
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Build query based on type
        base_query = '''
            SELECT 
                ch.*,
                CASE 
                    WHEN ch.caller_id = %s THEN receiver.name
                    ELSE caller.name
                END as contact_name,
                CASE 
                    WHEN ch.caller_id = %s THEN receiver.profile_picture
                    ELSE caller.profile_picture
                END as contact_picture,
                CASE 
                    WHEN ch.caller_id = %s THEN 'outgoing'
                    ELSE 'incoming'
                END as direction
            FROM call_history ch
            LEFT JOIN users caller ON ch.caller_id = caller.id
            LEFT JOIN users receiver ON ch.receiver_id = receiver.id
            WHERE (ch.caller_id = %s OR ch.receiver_id = %s)
        '''
        
        params = [user_id, user_id, user_id, user_id, user_id]
        
        # Add filters
        if call_type == 'missed':
            base_query += " AND ch.call_status = 'missed' AND ch.receiver_id = %s"
            params.append(user_id)
        elif call_type == 'received':
            base_query += " AND ch.receiver_id = %s AND ch.call_status IN ('completed', 'rejected')"
            params.append(user_id)
        elif call_type == 'dialed':
            base_query += " AND ch.caller_id = %s"
            params.append(user_id)
        
        base_query += " ORDER BY ch.started_at DESC LIMIT %s OFFSET %s"
        params.extend([limit, offset])
        
        cursor.execute(base_query, params)
        calls = cursor.fetchall()
        
        # Get total count
        count_query = '''
            SELECT COUNT(*) as total
            FROM call_history ch
            WHERE (ch.caller_id = %s OR ch.receiver_id = %s)
        '''
        count_params = [user_id, user_id]
        
        if call_type == 'missed':
            count_query += " AND ch.call_status = 'missed' AND ch.receiver_id = %s"
            count_params.append(user_id)
        elif call_type == 'received':
            count_query += " AND ch.receiver_id = %s AND ch.call_status IN ('completed', 'rejected')"
            count_params.append(user_id)
        elif call_type == 'dialed':
            count_query += " AND ch.caller_id = %s"
            count_params.append(user_id)
        
        cursor.execute(count_query, count_params)
        total = cursor.fetchone()['total']
        
        cursor.close()
        conn.close()
        
        # Format dates
        for call in calls:
            if call['started_at']:
                call['started_at'] = call['started_at'].isoformat()
            if call['ended_at']:
                call['ended_at'] = call['ended_at'].isoformat()
        
        return jsonify({
            'calls': calls,
            'total': total,
            'limit': limit,
            'offset': offset
        }), 200
        
    except Exception as e:
        print(f'❌ [CALL HISTORY] Error fetching history: {e}')
        return jsonify({'error': str(e)}), 500


@call_history_bp.route('/stats', methods=['GET'])
def get_call_stats():
    """Get call statistics for current user"""
    try:
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'error': 'Not authenticated'}), 401
        
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Total calls
        cursor.execute('''
            SELECT 
                COUNT(*) as total_calls,
                SUM(CASE WHEN call_status = 'completed' THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN call_status = 'missed' AND receiver_id = %s THEN 1 ELSE 0 END) as missed,
                SUM(CASE WHEN call_status = 'rejected' THEN 1 ELSE 0 END) as rejected,
                SUM(CASE WHEN caller_id = %s THEN 1 ELSE 0 END) as outgoing,
                SUM(CASE WHEN receiver_id = %s THEN 1 ELSE 0 END) as incoming,
                SUM(CASE WHEN call_type = 'video' THEN 1 ELSE 0 END) as video_calls,
                SUM(CASE WHEN call_type = 'voice' THEN 1 ELSE 0 END) as voice_calls,
                SUM(duration) as total_duration,
                AVG(duration) as avg_duration
            FROM call_history
            WHERE caller_id = %s OR receiver_id = %s
        ''', (user_id, user_id, user_id, user_id, user_id))
        
        stats = cursor.fetchone()
        
        # Today's calls
        cursor.execute('''
            SELECT COUNT(*) as today_calls
            FROM call_history
            WHERE (caller_id = %s OR receiver_id = %s)
            AND DATE(started_at) = CURDATE()
        ''', (user_id, user_id))
        
        today = cursor.fetchone()
        stats['today_calls'] = today['today_calls']
        
        # This week's calls
        cursor.execute('''
            SELECT COUNT(*) as week_calls
            FROM call_history
            WHERE (caller_id = %s OR receiver_id = %s)
            AND started_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        ''', (user_id, user_id))
        
        week = cursor.fetchone()
        stats['week_calls'] = week['week_calls']
        
        cursor.close()
        conn.close()
        
        return jsonify(stats), 200
        
    except Exception as e:
        print(f'❌ [CALL HISTORY] Error fetching stats: {e}')
        return jsonify({'error': str(e)}), 500


@call_history_bp.route('/export', methods=['GET'])
def export_call_history():
    """Export call history to CSV"""
    try:
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'error': 'Not authenticated'}), 401
        
        # Date range filters
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        query = '''
            SELECT 
                ch.started_at as 'Date/Time',
                CASE 
                    WHEN ch.caller_id = %s THEN receiver.name
                    ELSE caller.name
                END as 'Contact',
                CASE 
                    WHEN ch.caller_id = %s THEN 'Outgoing'
                    ELSE 'Incoming'
                END as 'Direction',
                ch.call_type as 'Type',
                ch.call_status as 'Status',
                ch.duration as 'Duration (seconds)',
                ch.provider as 'Provider'
            FROM call_history ch
            LEFT JOIN users caller ON ch.caller_id = caller.id
            LEFT JOIN users receiver ON ch.receiver_id = receiver.id
            WHERE (ch.caller_id = %s OR ch.receiver_id = %s)
        '''
        
        params = [user_id, user_id, user_id, user_id]
        
        if start_date:
            query += " AND ch.started_at >= %s"
            params.append(start_date)
        if end_date:
            query += " AND ch.started_at <= %s"
            params.append(end_date)
        
        query += " ORDER BY ch.started_at DESC"
        
        cursor.execute(query, params)
        calls = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        # Create CSV
        output = io.StringIO()
        if calls:
            writer = csv.DictWriter(output, fieldnames=calls[0].keys())
            writer.writeheader()
            writer.writerows(calls)
        
        csv_data = output.getvalue()
        output.close()
        
        return csv_data, 200, {
            'Content-Type': 'text/csv',
            'Content-Disposition': f'attachment; filename=call_history_{user_id}_{datetime.now().strftime("%Y%m%d")}.csv'
        }
        
    except Exception as e:
        print(f'❌ [CALL HISTORY] Error exporting: {e}')
        return jsonify({'error': str(e)}), 500


@call_history_bp.route('/delete/<int:call_id>', methods=['DELETE'])
def delete_call_history(call_id):
    """Delete a specific call from history"""
    try:
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'error': 'Not authenticated'}), 401
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Only allow deleting own calls
        cursor.execute('''
            DELETE FROM call_history
            WHERE id = %s AND (caller_id = %s OR receiver_id = %s)
        ''', (call_id, user_id, user_id))
        
        conn.commit()
        affected = cursor.rowcount
        
        cursor.close()
        conn.close()
        
        if affected > 0:
            return jsonify({'success': True}), 200
        else:
            return jsonify({'error': 'Call not found or unauthorized'}), 404
        
    except Exception as e:
        print(f'❌ [CALL HISTORY] Error deleting call: {e}')
        return jsonify({'error': str(e)}), 500


@call_history_bp.route('/clear', methods=['DELETE'])
def clear_call_history():
    """Clear all call history for current user"""
    try:
        user_id = session.get('user_id')
        if not user_id:
            return jsonify({'error': 'Not authenticated'}), 401
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('''
            DELETE FROM call_history
            WHERE caller_id = %s OR receiver_id = %s
        ''', (user_id, user_id))
        
        conn.commit()
        deleted = cursor.rowcount
        
        cursor.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'deleted': deleted
        }), 200
        
    except Exception as e:
        print(f'❌ [CALL HISTORY] Error clearing history: {e}')
        return jsonify({'error': str(e)}), 500
