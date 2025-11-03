import mysql.connector
from collections import defaultdict

# MySQL Configuration
MYSQL_CONFIG = {
    'host': 'localhost',
    'database': 'ca360_chat',
    'user': 'ca360_user',
    'password': '123',
    'port': 3306
}

def cleanup_duplicate_users():
    print("🧹 KAA HO CHAT - DUPLICATE USER CLEANUP")
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
        # Get all users
        print("📋 Fetching all users...")
        cursor.execute("SELECT user_id, name, role, created_at FROM users ORDER BY name, created_at")
        users = cursor.fetchall()
        
        print(f"   Found {len(users)} total users\n")
        
        # Group users by normalized name (case-insensitive)
        name_groups = defaultdict(list)
        for user in users:
            # Normalize name: lowercase and remove extra spaces
            normalized_name = user['name'].lower().strip()
            # Also remove any "(2)", "(3)" suffixes for grouping
            base_name = normalized_name.replace(' (2)', '').replace(' (3)', '').replace(' (4)', '')
            name_groups[base_name].append(user)
        
        # Find duplicates
        duplicates_found = False
        users_to_delete = []
        
        print("🔍 Checking for duplicates...")
        print()
        
        for base_name, group in name_groups.items():
            if len(group) > 1:
                duplicates_found = True
                print(f"⚠️  Found {len(group)} users with similar names:")
                
                # Sort by created_at to keep the oldest
                group.sort(key=lambda x: x['created_at'] if x['created_at'] else '9999-12-31')
                
                # Keep the first one (oldest)
                keep_user = group[0]
                print(f"   ✅ KEEP: {keep_user['name']} (ID: {keep_user['user_id']}, Created: {keep_user['created_at']})")
                
                # Mark others for deletion
                for user in group[1:]:
                    print(f"   ❌ DELETE: {user['name']} (ID: {user['user_id']}, Created: {user['created_at']})")
                    users_to_delete.append(user)
                
                print()
        
        if not duplicates_found:
            print("✨ No duplicates found! Database is clean.")
            cursor.close()
            conn.close()
            return
        
        # Show summary
        print("=" * 60)
        print(f"📊 SUMMARY:")
        print(f"   Total users to delete: {len(users_to_delete)}")
        print("=" * 60)
        print()
        
        # Ask for confirmation
        print("⚠️  WARNING: This will permanently delete duplicate users!")
        print("   Messages and files from deleted users will also be affected.")
        print()
        response = input("Type 'DELETE' to confirm deletion: ")
        
        if response != 'DELETE':
            print("\n❌ Cleanup cancelled. No changes made.")
            cursor.close()
            conn.close()
            return
        
        print()
        print("🗑️  Deleting duplicate users...")
        
        deleted_count = 0
        for user in users_to_delete:
            try:
                cursor.execute("DELETE FROM users WHERE user_id = %s", (user['user_id'],))
                deleted_count += 1
                print(f"   ✅ Deleted: {user['name']} (ID: {user['user_id']})")
            except Exception as e:
                print(f"   ❌ Failed to delete {user['name']}: {e}")
        
        conn.commit()
        
        print()
        print("=" * 60)
        print("✅ CLEANUP COMPLETED!")
        print("=" * 60)
        print(f"   Deleted: {deleted_count} duplicate users")
        print()
        
        # Show remaining users
        print("👥 Remaining users:")
        cursor.execute("SELECT user_id, name, role FROM users ORDER BY name")
        remaining = cursor.fetchall()
        for user in remaining:
            print(f"   • {user['name']} (ID: {user['user_id']}, Role: {user['role']})")
        
        print()
        print("🎉 Your contacts sidebar should now be duplicate-free!")
        print("   Refresh your browser (Ctrl+Shift+R) to see the changes.")
        print()
        
    except Exception as e:
        print(f"\n❌ Error during cleanup: {e}")
        import traceback
        traceback.print_exc()
        conn.rollback()
    
    finally:
        cursor.close()
        conn.close()
        print("🔒 Connection closed.")

if __name__ == '__main__':
    print()
    cleanup_duplicate_users()