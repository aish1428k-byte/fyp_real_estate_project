#!/usr/bin/env python3
"""
Fix invalid UUIDs in LoginSession table.
"""

import os
import sys
import django
import uuid
from pathlib import Path

# Add project root to Python path
BASE_DIR = Path(__file__).resolve().parent
sys.path.append(str(BASE_DIR))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from audit.models import LoginSession
from django.db import connection

def fix_invalid_sessions():
    """Fix invalid UUIDs in LoginSession table."""
    print("🔧 Fixing invalid session UUIDs...")

    cursor = connection.cursor()

    try:
        # Get all sessions
        cursor.execute("SELECT id, session_id, user_id FROM audit_loginsession")
        rows = cursor.fetchall()

        print(f"Found {len(rows)} sessions to check")

        fixed_count = 0
        for row in rows:
            session_id = row[1]
            try:
                # Try to parse as UUID
                uuid.UUID(session_id)
                print(f"✅ Session {row[0]}: {session_id} is valid")
            except ValueError:
                # Generate new valid UUID
                new_uuid = str(uuid.uuid4())
                cursor.execute(
                    "UPDATE audit_loginsession SET session_id = %s WHERE id = %s",
                    [new_uuid, row[0]]
                )
                print(f"🔄 Fixed session {row[0]}: {session_id} -> {new_uuid}")
                fixed_count += 1

        if fixed_count > 0:
            print(f"\n✅ Fixed {fixed_count} invalid UUIDs")
        else:
            print("\n✅ All UUIDs were already valid")

    except Exception as e:
        print(f"❌ Error fixing sessions: {e}")
        connection.rollback()
        return False

    connection.commit()
    return True

def verify_fix():
    """Verify that all sessions now have valid UUIDs."""
    print("\n🔍 Verifying fixes...")

    try:
        sessions = LoginSession.objects.all()
        count = sessions.count()
        print(f"✅ Successfully loaded {count} sessions with Django ORM")

        # Test a few sessions
        for session in sessions[:3]:
            print(f"   Session: {session.session_id} for user {session.user.username}")

        return True

    except Exception as e:
        print(f"❌ Verification failed: {e}")
        return False

if __name__ == "__main__":
    success = fix_invalid_sessions()
    if success:
        verify_fix()
    else:
        print("❌ Failed to fix sessions")
