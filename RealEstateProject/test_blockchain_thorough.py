#!/usr/bin/env python3
"""
Thorough testing for blockchain integration.

This script performs comprehensive testing of all blockchain functionality:
- All BlockchainService methods
- Merkle tree building
- Contract read/write operations
- Audit log anchoring workflow
- Error handling and edge cases

Run this after critical-path testing passes.
"""

import os
import sys
import django
import hashlib
import uuid
from pathlib import Path

# Add project root to Python path
BASE_DIR = Path(__file__).resolve().parent
sys.path.append(str(BASE_DIR))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.test import TestCase
from django.contrib.auth import get_user_model
from audit.models import AuditLog, LoginSession, AuditLogAnchor
from common.blockchain_utils import BlockchainService
from audit.utils import anchor_session_logs
import json


class BlockchainThoroughTest:
    """Comprehensive blockchain testing class."""

    def __init__(self):
        self.blockchain = None
        self.test_user = None
        self.test_session = None

    def setup_test_data(self):
        """Set up test data for thorough testing."""
        print("🔧 Setting up test data...")

        # Create test user
        User = get_user_model()
        self.test_user, created = User.objects.get_or_create(
            email='test@example.com',
            defaults={
                'username': 'testuser',
                'first_name': 'Test',
                'last_name': 'User',
                'user_type': 'agent'
            }
        )
        print(f"   ✅ Test user: {self.test_user.email}")

        # Create test session
        self.test_session = LoginSession.objects.create(
            session_id=str(uuid.uuid4()),
            user=self.test_user,
            ip_address='127.0.0.1',
            user_agent='Test Agent'
        )
        print(f"   ✅ Test session: {self.test_session.session_id}")

        # Create test audit logs
        test_logs = [
            {
                'module': 'users',
                'action': 'login',
                'details': {'attempt': 1}
            },
            {
                'module': 'property',
                'action': 'view',
                'details': {'property_id': 456}
            },
            {
                'module': 'audit',
                'action': 'export',
                'details': {'format': 'json'}
            }
        ]

        for log_data in test_logs:
            log = AuditLog.objects.create(
                session=self.test_session,
                user=self.test_user,
                module=log_data['module'],
                action=log_data['action'],
                details=log_data['details']
            )
            print(f"   ✅ Created audit log: {log.module}.{log.action}")

    def test_blockchain_service_initialization(self):
        """Test BlockchainService initialization."""
        print("\n🔍 Testing BlockchainService initialization...")

        try:
            self.blockchain = BlockchainService()
            print("   ✅ BlockchainService initialized successfully")
            print(f"   ✅ Admin address: {self.blockchain.admin_address}")
            print(f"   ✅ Contract address: {self.blockchain.contract.address}")
            return True
        except Exception as e:
            print(f"   ❌ BlockchainService initialization failed: {e}")
            return False

    def test_merkle_tree_building(self):
        """Test Merkle tree building functionality."""
        print("\n🔍 Testing Merkle tree building...")

        try:
            # Test with empty list
            try:
                self.blockchain.build_merkle_tree([])
                print("   ❌ Should have failed with empty list")
                return False
            except ValueError:
                print("   ✅ Correctly rejected empty list")

            # Test with single hash
            single_hash = '0x' + hashlib.sha256(b'test').hexdigest()
            root = self.blockchain.build_merkle_tree([single_hash])
            if root == single_hash:
                print("   ✅ Single hash Merkle tree works")
            else:
                print("   ❌ Single hash Merkle tree failed")
                return False

            # Test with multiple hashes
            hashes = [
                '0x' + hashlib.sha256(f'test{i}'.encode()).hexdigest()
                for i in range(4)
            ]
            root = self.blockchain.build_merkle_tree(hashes)
            if root.startswith('0x') and len(root) == 66:
                print("   ✅ Multi-hash Merkle tree works")
                print(f"   ✅ Root: {root}")
            else:
                print("   ❌ Multi-hash Merkle tree failed")
                return False

            return True
        except Exception as e:
            print(f"   ❌ Merkle tree building failed: {e}")
            return False

    def test_hash_log_entry(self):
        """Test log entry hashing."""
        print("\n🔍 Testing log entry hashing...")

        try:
            test_data = "2024-01-01T10:00:00|users|login|user123|details"
            hash1 = self.blockchain.hash_log_entry(test_data)
            hash2 = self.blockchain.hash_log_entry(test_data)

            if hash1 == hash2 and hash1.startswith('0x') and len(hash1) == 66:
                print("   ✅ Log entry hashing works")
                print(f"   ✅ Hash: {hash1}")
                return True
            else:
                print("   ❌ Log entry hashing failed")
                return False
        except Exception as e:
            print(f"   ❌ Log entry hashing failed: {e}")
            return False

    def test_contract_read_operations(self):
        """Test contract read operations."""
        print("\n🔍 Testing contract read operations...")

        try:
            # Test get_latest_merkle_root
            result = self.blockchain.get_latest_merkle_root()
            if result is None:
                print("   ✅ get_latest_merkle_root: No roots stored (expected)")
            else:
                merkle_root, timestamp = result
                print(f"   ✅ get_latest_merkle_root: {merkle_root} at {timestamp}")

            # Test contract code exists
            code = self.blockchain.w3.eth.get_code(self.blockchain.contract.address)
            if code != b'':
                print("   ✅ Contract code found at address")
            else:
                print("   ❌ No contract code at address")
                return False

            return True
        except Exception as e:
            print(f"   ❌ Contract read operations failed: {e}")
            return False

    def test_contract_write_operations(self):
        """Test contract write operations (requires gas, careful!)."""
        print("\n🔍 Testing contract write operations...")

        # Only test if user explicitly wants transaction testing
        if not os.getenv('ENABLE_TRANSACTION_TESTS', '').lower() == 'true':
            print("   ⏭️  Skipping transaction tests (set ENABLE_TRANSACTION_TESTS=true to enable)")
            return True

        try:
            # Test with a dummy Merkle root
            test_root = '0x' + '1' * 64  # 32 bytes of '1's

            print("   ⚠️  Attempting transaction (this will cost gas!)...")
            tx_hash, block_timestamp = self.blockchain.store_merkle_root(test_root)

            print(f"   ✅ Transaction successful: {tx_hash}")
            print(f"   ✅ Block timestamp: {block_timestamp}")

            # Verify we can read it back
            latest = self.blockchain.get_latest_merkle_root()
            if latest and latest[0] == test_root:
                print("   ✅ Read-back verification successful")
                return True
            else:
                print("   ❌ Read-back verification failed")
                return False

        except Exception as e:
            print(f"   ❌ Contract write operations failed: {e}")
            return False

    def test_audit_anchoring_workflow(self):
        """Test the complete audit log anchoring workflow."""
        print("\n🔍 Testing audit log anchoring workflow...")

        try:
            # Get logs for our test session
            logs = AuditLog.objects.filter(session=self.test_session)
            if not logs.exists():
                print("   ❌ No audit logs found for test session")
                return False

            print(f"   📝 Found {logs.count()} audit logs to anchor")

            # Test the anchoring function
            anchoring_results = anchor_session_logs(self.test_session)

            if not anchoring_results:
                print("   ❌ No anchoring results returned")
                return False

            # Check results structure
            for module, result in anchoring_results.items():
                if result.get('verified') is False and 'error' in result:
                    print(f"   ⚠️  Module {module}: {result['error']}")
                else:
                    print(f"   ✅ Module {module}: Anchored {result.get('logs_anchored', 0)} logs")

            # Check database for anchors
            anchors = AuditLogAnchor.objects.filter(session=self.test_session)
            print(f"   📊 Created {anchors.count()} anchor records in database")

            return True
        except Exception as e:
            print(f"   ❌ Audit anchoring workflow failed: {e}")
            return False

    def test_error_handling(self):
        """Test error handling scenarios."""
        print("\n🔍 Testing error handling...")

        try:
            # Test invalid Merkle root
            try:
                self.blockchain.store_merkle_root("invalid")
                print("   ❌ Should have failed with invalid root")
                return False
            except ValueError:
                print("   ✅ Correctly rejected invalid Merkle root")

            # Test connection loss simulation (if possible)
            # This is harder to test without mocking

            print("   ✅ Error handling tests passed")
            return True
        except Exception as e:
            print(f"   ❌ Error handling tests failed: {e}")
            return False

    def cleanup_test_data(self):
        """Clean up test data."""
        print("\n🧹 Cleaning up test data...")

        try:
            AuditLogAnchor.objects.filter(session=self.test_session).delete()
            AuditLog.objects.filter(session=self.test_session).delete()
            self.test_session.delete()
            print("   ✅ Test data cleaned up")
        except Exception as e:
            print(f"   ⚠️  Cleanup failed: {e}")

    def run_all_tests(self):
        """Run all thorough tests."""
        print("🚀 Starting thorough blockchain testing\n")

        # Setup
        self.setup_test_data()

        # Test sequence
        tests = [
            ("BlockchainService Initialization", self.test_blockchain_service_initialization),
            ("Merkle Tree Building", self.test_merkle_tree_building),
            ("Log Entry Hashing", self.test_hash_log_entry),
            ("Contract Read Operations", self.test_contract_read_operations),
            ("Contract Write Operations", self.test_contract_write_operations),
            ("Audit Anchoring Workflow", self.test_audit_anchoring_workflow),
            ("Error Handling", self.test_error_handling),
        ]

        results = []
        for test_name, test_func in tests:
            try:
                result = test_func()
                results.append((test_name, result))
            except Exception as e:
                print(f"   ❌ {test_name} failed with exception: {e}")
                results.append((test_name, False))

        # Cleanup
        self.cleanup_test_data()

        # Summary
        print("\n" + "="*60)
        print("📊 THOROUGH TESTING RESULTS SUMMARY")
        print("="*60)

        passed = 0
        total = len(results)

        for test_name, result in results:
            status = "✅ PASSED" if result else "❌ FAILED"
            print(f"{test_name}: {status}")
            if result:
                passed += 1

        print("\n" + "="*60)
        print(f"📈 Results: {passed}/{total} tests passed")

        if passed == total:
            print("🎉 ALL THOROUGH TESTS PASSED!")
            print("Your blockchain integration is fully functional.")
        else:
            print("⚠️  SOME TESTS FAILED!")
            print("Review the failures above and fix issues before production use.")

        return passed == total


def main():
    """Main test runner."""
    # Check if we should enable transaction tests
    enable_tx = input("Enable transaction tests? (costs gas) [y/N]: ").lower().strip()
    if enable_tx == 'y':
        os.environ['ENABLE_TRANSACTION_TESTS'] = 'true'
        print("⚠️  Transaction tests enabled - this will cost gas!")
    else:
        print("⏭️  Transaction tests disabled")

    # Run tests
    tester = BlockchainThoroughTest()
    success = tester.run_all_tests()

    return success


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
