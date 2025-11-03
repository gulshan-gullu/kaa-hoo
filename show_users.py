from database import get_db

conn = get_db()
cursor = conn.cursor(dictionary=True)
cursor.execute('SELECT user_id, name, email, mobile, role FROM users')
users = cursor.fetchall()

print('')
print('='*80)
print('ALL USERS IN DATABASE')
print('='*80)

for i, user in enumerate(users, 1):
    user_id = str(user.get('user_id', 'N/A'))
    name = str(user.get('name', 'N/A'))
    email = str(user.get('email', 'N/A'))
    mobile = str(user.get('mobile', 'N/A'))
    role = str(user.get('role', 'N/A'))
    
    print(str(i) + '. User ID: ' + user_id)
    print('   Name: ' + name)
    print('   Email: ' + email)
    print('   Mobile: ' + mobile)
    print('   Role: ' + role)
    print('-'*80)

print('Total Users: ' + str(len(users)))
cursor.close()
conn.close()
