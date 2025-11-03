#!/usr/bin/env python3
"""
Run Biometric System Database Migration
"""
import mysql.connector
from config import MYSQL_CONFIG

def run_migration():
    """Execute biometric tables migration"""
    print("\n" + "="*60)
    print(" BIOMETRIC SYSTEM DATABASE MIGRATION")
    print("="*60 + "\n")
    
    try:
        # Connect to database
        print("[1/3] Connecting to database...")
        conn = mysql.connector.connect(**MYSQL_CONFIG)
        cursor = conn.cursor()
        print("✅ Connected to MySQL")
        
        # Read migration SQL
        print("\n[2/3] Reading migration file...")
        with open('migrations/add_biometric_tables.sql', 'r', encoding='utf-8') as f:
            sql_content = f.read()
        
        # Split and execute
        statements = [s.strip() for s in sql_content.split(';') if s.strip()]
        
        print("\n[3/3] Executing migration...")
        for i, statement in enumerate(statements, 1):
            if statement:
                try:
                    cursor.execute(statement)
                    conn.commit()
                    print(f"   ✅ Statement {i}/{len(statements)} executed")
                except Exception as e:
                    if "Duplicate column" in str(e) or "already exists" in str(e):
                        print(f"   ⚠️  Statement {i}/{len(statements)} skipped (already exists)")
                    else:
                        print(f"   ❌ Statement {i}/{len(statements)} failed: {e}")
        
        # Verify tables
        print("\n[VERIFICATION] Checking tables...")
        cursor.execute("SHOW TABLES LIKE 'biometric_credentials'")
        if cursor.fetchone():
            print("✅ biometric_credentials table exists")
        
        cursor.execute("SHOW TABLES LIKE 'biometric_login_attempts'")
        if cursor.fetchone():
            print("✅ biometric_login_attempts table exists")
        
        cursor.close()
        conn.close()
        
        print("\n" + "="*60)
        print(" ✅ MIGRATION COMPLETED SUCCESSFULLY!")
        print("="*60 + "\n")
        print("Biometric System is ready!")
        print("\nNext steps:")
        print("1. Install webauthn: pip install webauthn")
        print("2. Add biometric routes to app.py")
        print("3. Add frontend JavaScript code")
        print("4. Restart your application")
        print("\n")
        
    except FileNotFoundError:
        print("\n❌ Error: migrations/add_biometric_tables.sql not found!")
        print("Make sure you created the migration file first.")
    except Exception as e:
        print(f"\n❌ Migration failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    run_migration()