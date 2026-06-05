#!/usr/bin/env python3
"""
Debug script to investigate LoginSession UUID issues.
"""

import os
import sys
import django
from pathlib import Path

# Add project root to Python path
BASE_DIR = Path(__file__).resolve().parent
sys.path.append(str(BASE_DIR))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from audit.models import LoginSession, AuditLog, AuditLogAnchor
import uuid

def debug_sessions():
    """Debug LoginSession objects."""
    print("🔍 Debugging LoginSession objects...")

    # Get raw data from database
    from django.db import connection
    cursor = connection.cursor()

    try:
        cursor.execute("SELECT id, session_id, user_id, login_time, logout_time FROM audit_loginsession")
        rows = cursor.fetchall()

        print(f"Found {len(rows)} rows in database")

        valid_sessions = []
        invalid_sessions = []

        for row in rows:
            session_id = row[1]
            try:
                # Try to parse as UUID
                parsed_uuid = uuid.UUID(session_id)
                valid_sessions.append((row[0], session_id, row[2]))
                print(f"✅ Valid session: ID={row[0]}, Session={session_id}, User={row[2]}")
            except ValueError as e:
                invalid_sessions.append((row[0], session_id, row[2]))
                print(f"❌ Invalid session: ID={row[0]}, Session={session_id}, User={row[2]} - Error: {e}")

        print(f"\nSummary: {len(valid_sessions)} valid, {len(invalid_sessions)} invalid")

        if invalid_sessions:
            print("\nInvalid sessions found - these need to be fixed or removed")

    except Exception as e:
        print(f"Error querying database: {e}")

    # Try Django ORM with error handling
    print("\n🔍 Testing Django ORM...")
    try:
        sessions = list(LoginSession.objects.all())
        print(f"Django ORM found {len(sessions)} sessions")
    except Exception as e:
        print(f"Django ORM error: {e}")

if __name__ == "__main__":
    debug_sessions()
