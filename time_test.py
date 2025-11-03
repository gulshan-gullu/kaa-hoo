#!/usr/bin/env python3
"""
Python Time Test Script
Tests various time functions to diagnose timestamp issues
"""

import datetime
import time
import os
import sqlite3

def test_all_time_functions():
    """Test all time-related functions to identify discrepancies"""
    
    print("="*60)
    print(" PYTHON TIME DIAGNOSTIC TEST")
    print("="*60)
    
    # Test 1: Basic Python datetime
    print("\n1. PYTHON DATETIME:")
    now = datetime.datetime.now()
    print(f"   datetime.now():           {now}")
    print(f"   datetime.now().time():    {now.time()}")
    print(f"   datetime.now().strftime(): {now.strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Test 2: Time module
    print("\n2. TIME MODULE:")
    print(f"   time.time():              {time.time()}")
    print(f"   time.ctime():             {time.ctime()}")
    print(f"   time.localtime():         {time.localtime()}")
    print(f"   time.strftime():          {time.strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Test 3: Timezone information
    print("\n3. TIMEZONE INFO:")
    print(f"   os.environ.get('TZ'):     {os.environ.get('TZ', 'Not set')}")
    print(f"   time.tzname:              {time.tzname}")
    print(f"   time.timezone:            {time.timezone}")
    print(f"   time.daylight:            {time.daylight}")
    
    # Test 4: UTC vs Local
    print("\n4. UTC vs LOCAL:")
    utc_now = datetime.datetime.utcnow()
    local_now = datetime.datetime.now()
    print(f"   datetime.utcnow():        {utc_now}")
    print(f"   datetime.now():           {local_now}")
    print(f"   Difference (hours):       {(local_now - utc_now).total_seconds() / 3600:.1f}")
    
    # Test 5: SQLite timestamp test
    print("\n5. SQLITE TIMESTAMP TEST:")
    test_sqlite_timestamps()
    
    # Test 6: System vs Python time comparison
    print("\n6. EXPECTED vs ACTUAL:")
    print(f"   Expected IST time:        ~13:30 (1:30 PM)")
    print(f"   Python shows:             {now.strftime('%H:%M')} ({now.strftime('%I:%M %p')})")
    
    difference_hours = (13.5 - now.hour - now.minute/60)
    print(f"   Difference:               {difference_hours:.1f} hours")
    
    if abs(difference_hours) > 0.5:
        print(f"   STATUS:                   ❌ TIME IS INCORRECT")
        print(f"   ISSUE:                    Hardware clock needs BIOS fix")
    else:
        print(f"   STATUS:                   ✅ TIME IS CORRECT")

def test_sqlite_timestamps():
    """Test how SQLite handles timestamps"""
    
    # Create temporary database
    conn = sqlite3.connect(':memory:')
    cursor = conn.cursor()
    
    # Create test table
    cursor.execute('''
        CREATE TABLE time_test (
            id INTEGER PRIMARY KEY,
            timestamp_default TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            timestamp_localtime TIMESTAMP DEFAULT (datetime('now', 'localtime')),
            timestamp_python TEXT
        )
    ''')
    
    # Insert test record
    python_time = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    cursor.execute('''
        INSERT INTO time_test (timestamp_python) VALUES (?)
    ''', (python_time,))
    
    # Retrieve and display
    cursor.execute('SELECT * FROM time_test')
    row = cursor.fetchone()
    
    print(f"   SQLite CURRENT_TIMESTAMP: {row[1]}")
    print(f"   SQLite localtime:         {row[2]}")
    print(f"   Python timestamp:         {row[3]}")
    
    conn.close()

def suggest_fixes():
    """Suggest solutions based on time test results"""
    
    print("\n" + "="*60)
    print(" SOLUTIONS:")
    print("="*60)
    
    now = datetime.datetime.now()
    expected_hour = 13  # 1 PM IST
    
    if now.hour < expected_hour - 2:
        print("\n🔧 HARDWARE CLOCK IS WRONG - Need BIOS Fix:")
        print("   1. Restart computer")
        print("   2. Press F2/Del during startup to enter BIOS")
        print("   3. Find 'Date & Time' settings")
        print("   4. Set time to correct IST (1:30 PM)")
        print("   5. Save and exit BIOS")
        
        print("\n🔄 ALTERNATIVE - Temporary Python Fix:")
        print("   Add this to your backend.py:")
        print("   import datetime")
        print("   def get_ist_time():")
        print("       return datetime.datetime.now() + datetime.timedelta(hours=5)")
        
    else:
        print("\n✅ TIME APPEARS CORRECT")
        print("   Your timestamp issue may be elsewhere")

if __name__ == "__main__":
    test_all_time_functions()
    suggest_fixes()
    
    print("\n" + "="*60)
    print(" Run this script and share the output to diagnose the issue")
    print("="*60)