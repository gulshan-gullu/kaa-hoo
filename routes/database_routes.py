from flask import Blueprint, jsonify, session, render_template, request
from database import get_db

database_bp = Blueprint('database_admin', __name__)

@database_bp.route('/database-manager')
def database_manager_page():
    # Only superadmin can access
    if not session.get('user_authenticated') or session.get('user_role') != 'superadmin':
        return "Access Denied - Superadmin Only", 403
    return render_template('database_manager.html')

@database_bp.route('/api/database/tables')
def get_tables():
    # Only superadmin can access
    if not session.get('user_authenticated') or session.get('user_role') != 'superadmin':
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SHOW TABLES")
        tables = [t[0] for t in cursor.fetchall()]
        cursor.close()
        conn.close()
        return jsonify({'success': True, 'tables': tables})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@database_bp.route('/api/database/table/<table_name>')
def get_table_data(table_name):
    # Only superadmin can access
    if not session.get('user_authenticated') or session.get('user_role') != 'superadmin':
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(f"DESCRIBE `{table_name}`")
        columns = [c['Field'] for c in cursor.fetchall()]
        cursor.execute(f"SELECT * FROM `{table_name}`")
        rows = cursor.fetchall()
        for row in rows:
            for k, v in row.items():
                if hasattr(v, 'isoformat'):
                    row[k] = v.isoformat()
        cursor.close()
        conn.close()
        return jsonify({'success': True, 'columns': columns, 'rows': rows})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@database_bp.route('/api/database/update', methods=['POST'])
def update_cell():
    # Only superadmin can access
    if not session.get('user_authenticated') or session.get('user_role') != 'superadmin':
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
    try:
        data = request.get_json()
        conn = get_db()
        cursor = conn.cursor()
        query = f"UPDATE `{data['table']}` SET `{data['column']}` = %s WHERE `{data['where_column']}` = %s"
        cursor.execute(query, (data['value'], data['where_value']))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@database_bp.route('/api/database/delete', methods=['POST'])
def delete_row():
    # Only superadmin can access
    if not session.get('user_authenticated') or session.get('user_role') != 'superadmin':
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
    try:
        data = request.get_json()
        conn = get_db()
        cursor = conn.cursor()
        query = f"DELETE FROM `{data['table']}` WHERE `{data['column']}` = %s"
        cursor.execute(query, (data['value'],))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@database_bp.route('/api/database/insert', methods=['POST'])
def insert_row():
    # Only superadmin can access
    if not session.get('user_authenticated') or session.get('user_role') != 'superadmin':
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
    try:
        request_data = request.get_json()
        table = request_data['table']
        data = request_data['data']
        conn = get_db()
        cursor = conn.cursor()
        columns = ', '.join([f"`{col}`" for col in data.keys()])
        placeholders = ', '.join(['%s'] * len(data))
        values = tuple(data.values())
        query = f"INSERT INTO `{table}` ({columns}) VALUES ({placeholders})"
        cursor.execute(query, values)
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@database_bp.route('/api/database/query', methods=['POST'])
def execute_query():
    # Only superadmin can access
    if not session.get('user_authenticated') or session.get('user_role') != 'superadmin':
        return jsonify({'success': False, 'message': 'Unauthorized'}), 403
    try:
        data = request.get_json()
        query = data.get('query', '').strip()
        dangerous = ['DROP', 'TRUNCATE', 'ALTER TABLE']
        if any(keyword in query.upper() for keyword in dangerous):
            return jsonify({'success': False, 'message': 'Dangerous operation blocked'}), 403
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(query)
        if query.upper().strip().startswith('SELECT'):
            results = cursor.fetchall()
            for row in results:
                for key, value in row.items():
                    if hasattr(value, 'isoformat'):
                        row[key] = value.isoformat()
            cursor.close()
            conn.close()
            return jsonify({'success': True, 'results': results})
        else:
            conn.commit()
            rows_affected = cursor.rowcount
            cursor.close()
            conn.close()
            return jsonify({'success': True, 'rows_affected': rows_affected})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
