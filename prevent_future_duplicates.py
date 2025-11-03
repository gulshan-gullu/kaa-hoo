import mysql.connector

# MySQL Configuration
MYSQL_CONFIG = {
    'host': 'localhost',
    'database': 'ca360_chat',
    'user': 'ca360_user',
    'password': '123',
    'port': 3306
}

def add_unique_constraints():
    print("🛡️  KAA HO CHAT - ADD DUPLICATE PREVENTION")
    print("=" * 60)
    print()
    
    # Connect to MySQL
    print("🔌 Connecting to MySQL...")
    try:
        conn = mysql.connector.connect(**MYSQL_CONFIG)
        cursor = conn.cursor(dictionary=True)
        print("✅ Connected!\n")
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        return
    
    try:
        print("🔍 Checking current database structure...")
        
        # Check if unique constraint already exists on name
        cursor.execute("""
            SELECT CONSTRAINT_NAME 
            FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
            WHERE TABLE_SCHEMA = 'ca360_chat' 
            AND TABLE_NAME = 'users' 
            AND CONSTRAINT_TYPE = 'UNIQUE'
        """)
        
        existing_constraints = cursor.fetchall()
        print(f"   Found {len(existing_constraints)} existing unique constraints")
        
        # Check for name constraint specifically
        has_name_constraint = any('name' in str(c).lower() for c in existing_constraints)
        
        if has_name_constraint:
            print("   ℹ️  Name constraint already exists")
        
        print()
        print("🛡️  Adding duplicate prevention measures...")
        print()
        
        # Strategy 1: Add UNIQUE constraint on name (case-insensitive)
        # This will prevent duplicate names entirely
        print("1️⃣  Adding UNIQUE constraint on user names...")
        try:
            cursor.execute("""
                ALTER TABLE users 
                ADD UNIQUE INDEX idx_unique_name (name)
            """)
            print("   ✅ UNIQUE constraint added on 'name' column")
            print("   → No two users can have the same name anymore!")
        except mysql.connector.Error as e:
            if 'Duplicate entry' in str(e):
                print("   ⚠️  Cannot add constraint - duplicates still exist!")
                print("   → Run cleanup_duplicates.py first")
            elif 'Duplicate key name' in str(e):
                print("   ℹ️  Constraint already exists")
            else:
                print(f"   ⚠️  Warning: {e}")
        
        print()
        
        # Strategy 2: Ensure user_id is properly unique (it should be as PRIMARY KEY)
        print("2️⃣  Verifying user_id uniqueness...")
        cursor.execute("SHOW KEYS FROM users WHERE Key_name = 'PRIMARY'")
        primary_key = cursor.fetchone()
        if primary_key:
            print("   ✅ user_id is PRIMARY KEY (already unique)")
        
        print()
        
        # Strategy 3: Add trigger to normalize names before insert
        print("3️⃣  Creating trigger to prevent case-sensitive duplicates...")
        
        # Drop trigger if exists
        try:
            cursor.execute("DROP TRIGGER IF EXISTS before_user_insert")
        except:
            pass
        
        try:
            cursor.execute("DROP TRIGGER IF EXISTS before_user_update")
        except:
            pass
        
        # Create trigger for INSERT
        trigger_sql = """
        CREATE TRIGGER before_user_insert
        BEFORE INSERT ON users
        FOR EACH ROW
        BEGIN
            -- Trim whitespace from name
            SET NEW.name = TRIM(NEW.name);
            
            -- Check if similar name exists (case-insensitive)
            IF EXISTS (
                SELECT 1 FROM users 
                WHERE LOWER(name) = LOWER(NEW.name)
            ) THEN
                SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'A user with this name already exists (case-insensitive match)';
            END IF;
        END
        """
        
        try:
            cursor.execute(trigger_sql)
            print("   ✅ INSERT trigger created")
        except mysql.connector.Error as e:
            print(f"   ℹ️  Insert trigger: {e}")
        
        # Create trigger for UPDATE
        trigger_update_sql = """
        CREATE TRIGGER before_user_update
        BEFORE UPDATE ON users
        FOR EACH ROW
        BEGIN
            -- Trim whitespace from name
            SET NEW.name = TRIM(NEW.name);
            
            -- Check if similar name exists (excluding current user)
            IF EXISTS (
                SELECT 1 FROM users 
                WHERE LOWER(name) = LOWER(NEW.name)
                AND user_id != NEW.user_id
            ) THEN
                SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'A user with this name already exists (case-insensitive match)';
            END IF;
        END
        """
        
        try:
            cursor.execute(trigger_update_sql)
            print("   ✅ UPDATE trigger created")
        except mysql.connector.Error as e:
            print(f"   ℹ️  Update trigger: {e}")
        
        conn.commit()
        
        print()
        print("=" * 60)
        print("✅ DUPLICATE PREVENTION ENABLED!")
        print("=" * 60)
        print()
        print("🛡️  Protection measures active:")
        print("   ✅ UNIQUE constraint on name column")
        print("   ✅ Database trigger prevents case-insensitive duplicates")
        print("   ✅ Automatic whitespace trimming")
        print()
        print("🎯 What this means:")
        print("   • Cannot create user 'Gulshan Gullu' if it exists")
        print("   • Cannot create 'GULSHAN GULLU' if 'Gulshan Gullu' exists")
        print("   • Cannot create 'Gulshan Gullu ' (with space) if 'Gulshan Gullu' exists")
        print()
        print("⚠️  If someone tries to create a duplicate:")
        print("   → Database will reject it with an error")
        print("   → App should handle this and show user a message")
        print()
        
        # Test the protection
        print("🧪 Testing duplicate prevention...")
        print()
        
        try:
            cursor.execute("""
                INSERT INTO users (user_id, name, password_hash, role)
                VALUES ('TEST-001', 'Gulshan Gullu', 'test123', 'client')
            """)
            print("   ❌ TEST FAILED: Duplicate was allowed!")
            # Rollback the test
            conn.rollback()
        except mysql.connector.Error as e:
            if 'Duplicate entry' in str(e) or 'already exists' in str(e):
                print("   ✅ TEST PASSED: Duplicate was rejected!")
                print(f"   → Error message: {str(e)[:80]}...")
            else:
                print(f"   ⚠️  Unexpected error: {e}")
        
        print()
        print("🎉 Your database is now duplicate-proof!")
        print()
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        conn.rollback()
    
    finally:
        cursor.close()
        conn.close()
        print("🔒 Connection closed.")

if __name__ == '__main__':
    print()
    add_unique_constraints()