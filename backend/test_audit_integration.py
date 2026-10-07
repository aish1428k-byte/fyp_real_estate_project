#!/usr/bin/env python3
"""
Test script to simulate user actions and verify audit logging and blockchain integration.

This script:
1. Creates a test user if needed
2. Logs in to create a session
3. Simulates API calls to generate audit logs
4. Logs out to trigger blockchain anchoring
5. Verifies the results
"""

import os
import sys
import django
import requests
from pathlib import Path

# Add project root to Python path
BASE_DIR = Path(__file__).resolve().parent
sys.path.append(str(BASE_DIR))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from django.test import Client
from audit.models import LoginSession, AuditLog, AuditLogAnchor
from common.blockchain_utils import BlockchainService

User = get_user_model()

class AuditIntegrationTester:
    """Test class for audit logging and blockchain integration."""

    def __init__(self):
        self.client = Client()
        self.test_user = None
        self.session_id = None
        self.access_token = None

    def setup_test_user(self):
        """Create or get test user."""
        print("🔧 Setting up test user...")

        self.test_user, created = User.objects.get_or_create(
            email='test@example.com',
            defaults={
                'username': 'testuser',
                'first_name': 'Test',
                'last_name': 'User',
                'user_type': 'agent',
                'email_verified': True
            }
        )

        if created:
            self.test_user.set_password('testpass123')
            self.test_user.save()
            print("   ✅ Created test user")
        else:
            print("   ✅ Using existing test user")

        return True

    def login_user(self):
        """Login the test user."""
        print("🔐 Logging in test user...")

        login_data = {
            'username': 'test@example.com',
            'password': 'testpass123'
        }

        response = self.client.post('/api/users/login/', login_data, content_type='application/json')

        if response.status_code == 200:
            data = response.json()
            self.session_id = data.get('session_id')
            self.access_token = data['user']['access']
            print(f"   ✅ Login successful, session: {self.session_id}")
            return True
        else:
            print(f"   ❌ Login failed: {response.status_code} - {response.content}")
            return False

    def simulate_user_actions(self):
        """Simulate various user actions to generate audit logs."""
        print("🎯 Simulating user actions...")

        headers = {
            'Authorization': f'Bearer {self.access_token}',
            'Content-Type': 'application/json'
        }

        actions = [
            ('GET', '/api/users/profile/', 'View profile'),
            ('GET', '/api/property/list/', 'List properties'),
            ('GET', '/api/agents/list/', 'List agents'),
            ('GET', '/api/manager/dashboard/', 'View manager dashboard'),
        ]

        for method, url, description in actions:
            try:
                if method == 'GET':
                    response = self.client.get(url, headers=headers)
                elif method == 'POST':
                    response = self.client.post(url, {}, headers=headers)

                print(f"   ✅ {description}: {response.status_code}")

            except Exception as e:
                print(f"   ⚠️  {description} failed: {e}")

    def logout_user(self):
        """Logout the user to trigger blockchain anchoring."""
        print("🚪 Logging out user...")

        headers = {
            'Authorization': f'Bearer {self.access_token}',
            'Content-Type': 'application/json'
        }

        logout_data = {'session_id': self.session_id}

        response = self.client.post('/api/users/logout/', logout_data, headers=headers, content_type='application/json')

        if response.status_code == 200:
            data = response.json()
            print("   ✅ Logout successful")
            print(f"   📊 Anchoring results: {data.get('blockchain_anchors', {})}")
            return True
        else:
            print(f"   ❌ Logout failed: {response.status_code} - {response.content}")
            return False

    def verify_results(self):
        """Verify the audit logs and blockchain anchors."""
        print("🔍 Verifying results...")

        # Check audit logs
        logs = AuditLog.objects.filter(session__session_id=self.session_id)
        print(f"   📝 Audit logs created: {logs.count()}")

        for log in logs:
            print(f"      - {log.module}: {log.action}")

        # Check blockchain anchors
        anchors = AuditLogAnchor.objects.filter(session__session_id=self.session_id)
        print(f"   ⛓️  Blockchain anchors created: {anchors.count()}")

        for anchor in anchors:
            print(f"      - {anchor.module}: {anchor.transaction_hash[:10]}...")

            # Verify transaction on blockchain
            try:
                blockchain = BlockchainService()
                if blockchain.verify_transaction(anchor.transaction_hash):
                    print("         ✅ Transaction verified on Sepolia")
                else:
                    print("         ❌ Transaction not found on Sepolia")
            except Exception as e:
                print(f"         ⚠️  Verification error: {e}")

        return logs.count() > 0 and anchors.count() > 0

    def run_test(self):
        """Run the complete integration test."""
        print("🚀 Starting audit integration test\n")

        steps = [
            ("Setup Test User", self.setup_test_user),
            ("Login User", self.login_user),
            ("Simulate Actions", self.simulate_user_actions),
            ("Logout User", self.logout_user),
            ("Verify Results", self.verify_results),
        ]

        success = True
        for step_name, step_func in steps:
            try:
                if not step_func():
                    print(f"❌ {step_name} failed")
                    success = False
                    break
            except Exception as e:
                print(f"❌ {step_name} failed with exception: {e}")
                success = False
                break

        print("\n" + "="*50)
        if success:
            print("🎉 AUDIT INTEGRATION TEST PASSED!")
            print("Audit logging and blockchain anchoring are working correctly.")
        else:
            print("❌ AUDIT INTEGRATION TEST FAILED!")
            print("There are issues with audit logging or blockchain integration.")

        return success

def main():
    """Main test runner."""
    tester = AuditIntegrationTester()
    success = tester.run_test()
    return success

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
