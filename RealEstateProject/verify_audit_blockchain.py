#!/usr/bin/env python3
"""
Verification script for audit logging and blockchain integration.

This script verifies:
1. Login sessions are created correctly
2. User actions are logged module-wise
3. Logout triggers Merkle tree creation and blockchain anchoring
4. Transaction hashes are valid on Sepolia
5. Reports detailed results per module
"""

import os
import sys
import django
from pathlib import Path
from collections import defaultdict

# Add project root to Python path
BASE_DIR = Path(__file__).resolve().parent
sys.path.append(str(BASE_DIR))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from audit.models import LoginSession, AuditLog, AuditLogAnchor
from common.blockchain_utils import BlockchainService
import logging

logger = logging.getLogger(__name__)

class AuditBlockchainVerifier:
    """Verifier for audit logging and blockchain integration."""

    def __init__(self):
        self.blockchain = None
        self.modules = ['users', 'manager', 'agents', 'property']
        self.results = defaultdict(dict)

    def initialize_blockchain(self):
        """Initialize blockchain service."""
        try:
            self.blockchain = BlockchainService()
            return True
        except Exception as e:
            logger.error(f"Failed to initialize blockchain: {e}")
            return False

    def verify_login_sessions(self):
        """Verify login sessions exist and are properly structured."""
        print("🔍 Verifying login sessions...")

        sessions = LoginSession.objects.all().order_by('-login_time')
        total_sessions = sessions.count()

        print(f"   Found {total_sessions} login sessions")

        if total_sessions == 0:
            print("   ❌ No login sessions found")
            return False

        # Check session structure
        active_sessions = sessions.filter(logout_time__isnull=True).count()
        completed_sessions = sessions.filter(logout_time__isnull=False).count()

        print(f"   ✅ Active sessions: {active_sessions}")
        print(f"   ✅ Completed sessions: {completed_sessions}")

        return True

    def verify_module_logs(self, module):
        """Verify audit logs for a specific module."""
        print(f"🔍 Verifying {module} module logs...")

        logs = AuditLog.objects.filter(module=module)
        log_count = logs.count()

        print(f"   Found {log_count} audit logs for {module}")

        if log_count == 0:
            self.results[module]['logs'] = {
                'count': 0,
                'status': 'no_logs',
                'error': f'No audit logs found for {module} module'
            }
            return False

        # Check log structure
        sessions_with_logs = logs.values_list('session', flat=True).distinct().count()
        unique_users = logs.values_list('user', flat=True).distinct().count()

        print(f"   ✅ Sessions with logs: {sessions_with_logs}")
        print(f"   ✅ Unique users: {unique_users}")

        self.results[module]['logs'] = {
            'count': log_count,
            'sessions': sessions_with_logs,
            'users': unique_users,
            'status': 'ok'
        }

        return True

    def verify_module_anchors(self, module):
        """Verify blockchain anchors for a specific module."""
        print(f"🔍 Verifying {module} module blockchain anchors...")

        anchors = AuditLogAnchor.objects.filter(module=module)
        anchor_count = anchors.count()

        print(f"   Found {anchor_count} blockchain anchors for {module}")

        if anchor_count == 0:
            self.results[module]['anchors'] = {
                'count': 0,
                'status': 'no_anchors',
                'error': f'No blockchain anchors found for {module} module'
            }
            return False

        # Verify each anchor
        verified_anchors = 0
        failed_verifications = []

        for anchor in anchors:
            try:
                # Check if transaction exists on blockchain
                if self.verify_transaction(anchor.transaction_hash):
                    verified_anchors += 1
                else:
                    failed_verifications.append({
                        'session_id': str(anchor.session.session_id),
                        'merkle_root': anchor.merkle_root,
                        'tx_hash': anchor.transaction_hash,
                        'error': 'Transaction not found on blockchain'
                    })
            except Exception as e:
                failed_verifications.append({
                    'session_id': str(anchor.session.session_id),
                    'merkle_root': anchor.merkle_root,
                    'tx_hash': anchor.transaction_hash,
                    'error': str(e)
                })

        print(f"   ✅ Verified anchors: {verified_anchors}/{anchor_count}")

        if failed_verifications:
            print(f"   ❌ Failed verifications: {len(failed_verifications)}")

        self.results[module]['anchors'] = {
            'count': anchor_count,
            'verified': verified_anchors,
            'failed': len(failed_verifications),
            'failures': failed_verifications,
            'status': 'ok' if verified_anchors == anchor_count else 'partial'
        }

        return verified_anchors == anchor_count

    def verify_transaction(self, tx_hash):
        """Verify a transaction exists on Sepolia."""
        try:
            # Get transaction receipt
            receipt = self.blockchain.w3.eth.get_transaction_receipt(tx_hash)
            return receipt is not None and receipt.status == 1
        except Exception as e:
            logger.error(f"Transaction verification failed for {tx_hash}: {e}")
            return False

    def verify_session_workflow(self, session):
        """Verify complete workflow for a session."""
        session_data = {
            'session_id': str(session.session_id),
            'user': str(session.user.username),
            'login_time': session.login_time.isoformat(),
            'logout_time': session.logout_time.isoformat() if session.logout_time else None,
            'modules': {}
        }

        for module in self.modules:
            # Check logs for this session and module
            logs = AuditLog.objects.filter(session=session, module=module)
            log_count = logs.count()

            # Check anchor for this session and module
            anchor = AuditLogAnchor.objects.filter(session=session, module=module).first()

            module_status = {
                'logs_count': log_count,
                'has_anchor': anchor is not None,
                'merkle_root': anchor.merkle_root if anchor else None,
                'tx_hash': anchor.transaction_hash if anchor else None,
                'tx_verified': self.verify_transaction(anchor.transaction_hash) if anchor else False
            }

            session_data['modules'][module] = module_status

        return session_data

    def run_verification(self):
        """Run complete verification."""
        print("🚀 Starting audit and blockchain verification\n")

        # Initialize blockchain
        if not self.initialize_blockchain():
            print("❌ Blockchain initialization failed")
            return False

        # Verify login sessions
        if not self.verify_login_sessions():
            print("❌ Login session verification failed")
            return False

        # Verify each module
        module_results = {}
        all_modules_ok = True

        for module in self.modules:
            print(f"\n📋 Verifying module: {module}")

            logs_ok = self.verify_module_logs(module)
            anchors_ok = self.verify_module_anchors(module)

            module_status = 'PASS' if logs_ok and anchors_ok else 'FAIL'
            module_results[module] = module_status

            if not (logs_ok and anchors_ok):
                all_modules_ok = False

        # Detailed session verification
        print("\n🔍 Detailed session verification...")
        sessions = LoginSession.objects.filter(logout_time__isnull=False)
        session_details = []

        for session in sessions[:5]:  # Limit to first 5 for brevity
            session_detail = self.verify_session_workflow(session)
            session_details.append(session_detail)

        # Generate report
        self.generate_report(module_results, session_details)

        return all_modules_ok

    def generate_report(self, module_results, session_details):
        """Generate detailed verification report."""
        print("\n" + "="*80)
        print("📊 AUDIT LOGGING & BLOCKCHAIN VERIFICATION REPORT")
        print("="*80)

        print("\n📈 MODULE SUMMARY:")
        print("-"*50)

        for module, status in module_results.items():
            result = self.results[module]
            logs = result.get('logs', {})
            anchors = result.get('anchors', {})

            print(f"\n{module.upper()} MODULE: {status}")
            print(f"  Logs: {logs.get('count', 0)} entries")
            print(f"  Anchors: {anchors.get('count', 0)} blockchain entries")
            if 'verified' in anchors:
                print(f"  Verified TX: {anchors['verified']}/{anchors['count']}")

            if status == 'FAIL':
                if 'error' in logs:
                    print(f"  ❌ {logs['error']}")
                if 'error' in anchors:
                    print(f"  ❌ {anchors['error']}")
                if 'failures' in anchors and anchors['failures']:
                    print(f"  ❌ {len(anchors['failures'])} transaction verification failures")

        print("\n🔗 SAMPLE SESSION WORKFLOWS:")
        print("-"*50)

        for i, session in enumerate(session_details[:3], 1):
            print(f"\nSession {i}: {session['session_id']} ({session['user']})")
            print(f"  Login: {session['login_time']}")
            print(f"  Logout: {session['logout_time']}")

            for module, data in session['modules'].items():
                status = "✅" if data['has_anchor'] and data['tx_verified'] else "❌"
                print(f"    {module}: {data['logs_count']} logs, anchor: {status}")

        print("\n" + "="*80)
        print("🎯 FINAL RESULT:")
        all_pass = all(status == 'PASS' for status in module_results.values())
        print(f"Overall Status: {'✅ ALL MODULES PASS' if all_pass else '❌ SOME MODULES FAILED'}")
        print("="*80)

def main():
    """Main verification runner."""
    verifier = AuditBlockchainVerifier()
    success = verifier.run_verification()

    return success

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
