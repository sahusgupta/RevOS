import sys
import os
sys.path.insert(0, '.')

print("Step 1: Importing app...")
try:
    from app.app import app, db
    print("  ✓ App imported")
except Exception as e:
    print(f"  ✗ Error importing app: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

print("Step 2: Checking database file...")
db_file = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'revos.db')
print(f"  Database path: {db_file}")
print(f"  Database exists: {os.path.exists(db_file)}")
print(f"  Database size: {os.path.getsize(db_file) if os.path.exists(db_file) else 'N/A'} bytes")

# Import models through app.py's context, not directly
print("Step 3: Checking models...")
from app.models import User, Syllabus
print(f"  ✓ Models loaded")
print(f"  User columns: {[c.name for c in User.__table__.columns]}")

print("Step 4: Checking SQLite directly...")
import sqlite3
conn = sqlite3.connect(db_file)
cursor = conn.cursor()

try:
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = cursor.fetchall()
    print(f"  Tables in database: {[t[0] for t in tables]}")
    
    if any(t[0] == 'users' for t in tables):
        cursor.execute("PRAGMA table_info(users)")
        cols = cursor.fetchall()
        print(f"  Users table columns:")
        google_count = 0
        for col in cols:
            col_name = col[1]
            col_type = col[2]
            if "google_calendar" in col_name:
                print(f"    ✓ {col_name} ({col_type})")
                google_count += 1
            else:
                print(f"    • {col_name} ({col_type})")
        
        if google_count == 3:
            print(f"\n✅ SUCCESS! All 3 Google Calendar columns present!")
        else:
            print(f"\n❌ Only {google_count}/3 Google Calendar columns present!")
    else:
        print(f"\n❌ Users table not found!")
except Exception as e:
    print(f"  ✗ Error: {e}")
finally:
    conn.close()

print("\n✓ Debug complete")
