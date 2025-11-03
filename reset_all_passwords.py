from database import get_db, hash_password

conn = get_db()
cursor = conn.cursor()

new_password = '123'
hashed = hash_password(new_password)

cursor.execute('UPDATE users SET password = %s', (hashed,))
conn.commit()

print(f'Updated {cursor.rowcount} users')
print(f'All passwords set to: {new_password}')

cursor.close()
conn.close()
