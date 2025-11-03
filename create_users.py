from database import get_db, hash_password

users_data = [
    ('Admin One', 'admin01@ca360.com', 'password', 'admin'),
    ('Admin Two', 'admin02@ca360.com', 'password', 'admin'),
    ('Staff Member 1', 'staff01@ca360.com', 'password', 'staff'),
    ('Client User', 'client01@ca360.com', 'password', 'client'),
    ('Gulshan Singh', 'gulshangullu@gmail.com', 'password', 'client'),
    ('Gulshan Singh', 'iamgulshangullu@gmail.com', 'password', 'client'),
    ('GULSHAN GULLU', 'cagullugulshan@gmail.com', 'password', 'client'),
    ('Gulshan Gullu', 'gulshan@ca360co.in', 'password', 'client'),
]

conn = get_db()
cursor = conn.cursor()

print('Creating users...')
for name, email, pwd, role in users_data:
    hashed = hash_password(pwd)
    try:
        cursor.execute(
            'INSERT INTO users (name, email, password, role) VALUES (%s, %s, %s, %s)',
            (name, email, hashed, role)
        )
        print(f'Created: {name} ({email})')
    except Exception as e:
        print(f'Error creating {email}: {e}')

conn.commit()
cursor.close()
conn.close()
print('Done!')
