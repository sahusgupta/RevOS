#!/usr/bin/env python
import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), '..', 'revos.db')
print(f"Checking database at: {db_path}")
print(f"Database exists: {os.path.exists(db_path)}")

if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Get users table columns
    cursor.execute("PRAGMA table_info(users);")
    cols = cursor.fetchall()
    
    print("\n✅ Users table columns:")
    for col in cols:
        col_name = col[1]
        col_type = col[2]
        has_google = "✓ GOOGLE CALENDAR FIELD" if "google" in col_name else ""
        print(f"  {col_name:40} {col_type:15} {has_google}")
    
    # Check for the critical columns
    col_names = [col[1] for col in cols]
    required_cols = ['google_calendar_token', 'google_calendar_refresh_token', 'google_calendar_token_expiry']
    
    print(f"\n✅ Required columns present:")
    for col in required_cols:
        status = "✓" if col in col_names else "✗"
        print(f"  {status} {col}")
    
    conn.close()
else:
    print("❌ Database not found!")
