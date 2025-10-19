#!/usr/bin/env python
"""Recreate the database with all tables and columns."""
import os
import sys

# Ensure we can import app modules
sys.path.insert(0, os.path.dirname(__file__))

from app.app import app, db

print("🔄 Recreating database...")

# First, delete the old database file if it exists
import os.path
db_file = os.path.join(os.path.dirname(__file__), '..', 'revos.db')
if os.path.exists(db_file):
    try:
        os.remove(db_file)
        print(f"  ✓ Deleted old database file")
    except Exception as e:
        print(f"  ✗ Could not delete old database: {e}")

with app.app_context():
    # Create all tables fresh
    db.create_all()
    print("  ✓ Created all tables")

# Verify the database
import sqlite3

conn = sqlite3.connect(db_file)
cursor = conn.cursor()

# Check users table
cursor.execute("PRAGMA table_info(users)")
cols = cursor.fetchall()

print("\n📋 User table columns created in database:")
google_cols_found = 0
all_cols = []
for col in cols:
    col_name = col[1]
    col_type = col[2]
    all_cols.append(col_name)
    if "google_calendar" in col_name:
        print(f"  ✓ {col_name} ({col_type})")
        google_cols_found += 1
    else:
        print(f"  • {col_name} ({col_type})")

conn.close()

print(f"\nAll columns: {all_cols}")

if google_cols_found == 3:
    print("\n✅ SUCCESS! All Google Calendar columns are present!")
    sys.exit(0)
else:
    print(f"\n❌ FAILED: Only found {google_cols_found}/3 Google Calendar columns")
    sys.exit(1)
