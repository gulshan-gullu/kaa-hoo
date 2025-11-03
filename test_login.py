"""
Fix verify_user to work without mobile column
"""
from database import get_db, hash_password

def verify_user_fixed(login_input, password):
    conn = None
    cursor = None
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        
        # Fixed query without mobile
        cursor.execute('''
            SELECT * FROM users 
            WHERE user_id = %s OR email = %s
        ''', (login_input, login_input))
        
        user = cursor.fetchone()
        
        if user and user.get('password') and user['password'] == hash_password(password):
            cursor.execute('UPDATE users SET last_seen = NOW() WHERE user_id = %s', (user['user_id'],))
            conn.commit()
            return user
        
        return None
        
    except Exception as e:
        print(f'[DB ERROR] verify_user failed: {e}')
        return None
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

# Test it
result = verify_user_fixed('CA001', '123')
print('Login result:', result)
