# """
# Audit utilities for session management and blockchain anchoring.

# This module provides functions for:
# - Managing login sessions
# - Anchoring session logs to blockchain
# - Building Merkle trees per module
# """

# import logging
# from django.utils import timezone
# from django.db import transaction

# from common.blockchain_utils import BlockchainService
# from .models import LoginSession, AuditLog, AuditLogAnchor

# logger = logging.getLogger(__name__)


# def create_login_session(user, request=None):
#     """
#     Create a new login session for the user.

#     Args:
#         user: User instance
#         request: HTTP request object (optional)

#     Returns:
#         LoginSession instance
#     """
#     import uuid

#     session_id = str(uuid.uuid4())

#     session_data = {
#         'user': user,
#         'session_id': session_id,
#     }

#     if request:
#         session_data.update({
#             'ip_address': _get_client_ip(request),
#             'user_agent': request.META.get('HTTP_USER_AGENT', ''),
#         })

#     session = LoginSession.objects.create(**session_data)

#     # Log the login action
#     log_user_activity(
#         session=session,
#         module='users',
#         action='LOGIN',
#         user=user,
#         details={
#             'login_method': 'standard',
#             'ip_address': session.ip_address,
#             'user_agent': session.user_agent,
#         }
#     )

#     return session


# def end_login_session(session_id, user=None):
#     """
#     End a login session and anchor logs to blockchain.

#     Args:
#         session_id: Session ID to end
#         user: User instance (for verification)

#     Returns:
#         dict: Summary of anchoring results
#     """
#     try:
#         session = LoginSession.objects.get(session_id=session_id)

#         # Verify user owns the session
#         if user and session.user != user:
#             raise ValueError("Session does not belong to user")

#         # Mark session as ended
#         session.logout_time = timezone.now()
#         session.save()

#         # Log the logout action
#         log_user_activity(
#             session=session,
#             module='users',
#             action='LOGOUT',
#             user=session.user,
#             details={
#                 'session_duration': session.duration,
#                 'logout_method': 'standard',
#             }
#         )

#         # Anchor logs to blockchain
#         anchoring_results = anchor_session_logs(session)

#         return {
#             'session_ended': True,
#             'anchoring_results': anchoring_results,
#         }

#     except LoginSession.DoesNotExist:
#         raise ValueError("Session not found")
#     except Exception as e:
#         logger.error(f"Session end error: {str(e)}")
#         raise


# def log_user_activity(session, module, action, user, details=None):
#     """
#     Log a user activity for audit purposes.

#     Args:
#         session: LoginSession instance
#         module: Module name
#         action: Action performed
#         user: User who performed the action
#         details: Additional details (dict)
#     """
#     if details is None:
#         details = {}

#     try:
#         AuditLog.objects.create(
#             session=session,
#             module=module,
#             action=action,
#             user=user,
#             details=details
#         )
#     except Exception as e:
#         logger.error(f"Activity logging error: {str(e)}")


# def anchor_session_logs(session):
#     """
#     Anchor all logs for a session to blockchain, grouped by module.

#     Args:
#         session: LoginSession instance

#     Returns:
#         dict: Results of anchoring per module
#     """
#     results = {}

#     try:
#         # Get all modules that have logs for this session
#         modules_with_logs = AuditLog.objects.filter(
#             session=session
#         ).values_list('module', flat=True).distinct()

#         blockchain = BlockchainService()

#         for module in modules_with_logs:
#             try:
#                 # Get all log hashes for this module and session
#                 log_hashes = list(
#                     AuditLog.objects.filter(
#                         session=session,
#                         module=module
#                     ).values_list('log_hash', flat=True)
#                 )

#                 if not log_hashes:
#                     continue

#                 # Build Merkle tree
#                 merkle_root = blockchain.build_merkle_tree(log_hashes)

#                 # Check if this root already exists (avoid duplicates)
#                 if AuditLogAnchor.objects.filter(
#                     session=session,
#                     module=module,
#                     merkle_root=merkle_root
#                 ).exists():
#                     results[module] = {
#                         'status': 'skipped',
#                         'reason': 'Root already anchored',
#                         'merkle_root': merkle_root
#                     }
#                     continue

#                 # Store on blockchain
#                 tx_hash, block_timestamp = blockchain.store_merkle_root(merkle_root)

#                 # Save anchor record
#                 anchor = AuditLogAnchor.objects.create(
#                     session=session,
#                     module=module,
#                     merkle_root=merkle_root,
#                     transaction_hash=tx_hash,
#                     block_timestamp=block_timestamp
#                 )

#                 results[module] = {
#                     'status': 'success',
#                     'merkle_root': merkle_root,
#                     'transaction_hash': tx_hash,
#                     'block_timestamp': block_timestamp,
#                     'explorer_url': anchor.blockchain_explorer_url,
#                     'logs_anchored': len(log_hashes)
#                 }

#                 logger.info(f"Anchored {module} logs for session {session.session_id}: {merkle_root}")

#             except Exception as e:
#                 logger.error(f"Anchoring error for module {module}: {str(e)}")
#                 results[module] = {
#                     'status': 'error',
#                     'error': str(e)
#                 }

#     except Exception as e:
#         logger.error(f"Session anchoring error: {str(e)}")
#         results['error'] = str(e)

#     return results


# def verify_log_integrity(session_id, module, log_id=None):
#     """
#     Verify the integrity of audit logs for a session and module.

#     Args:
#         session_id: Session ID
#         module: Module name
#         log_id: Specific log ID to verify (optional)

#     Returns:
#         dict: Verification results
#     """
#     try:
#         session = LoginSession.objects.get(session_id=session_id)

#         # Get anchor for this session and module
#         anchor = AuditLogAnchor.objects.filter(
#             session=session,
#             module=module
#         ).first()

#         if not anchor:
#             return {
#                 'verified': False,
#                 'error': 'No blockchain anchor found for this session and module'
#             }

#         # Get logs for verification
#         if log_id:
#             logs = AuditLog.objects.filter(id=log_id, session=session, module=module)
#         else:
#             logs = AuditLog.objects.filter(session=session, module=module)

#         if not logs.exists():
#             return {
#                 'verified': False,
#                 'error': 'No logs found for verification'
#             }

#         blockchain = BlockchainService()

#         # Rebuild Merkle tree from current logs
#         log_hashes = list(logs.values_list('log_hash', flat=True))
#         computed_root = blockchain.build_merkle_tree(log_hashes)

#         # Compare with blockchain root
#         is_integrity_maintained = (computed_root == anchor.merkle_root)

#         result = {
#             'verified': is_integrity_maintained,
#             'session_id': session_id,
#             'module': module,
#             'computed_root': computed_root,
#             'blockchain_root': anchor.merkle_root,
#             'logs_verified': len(log_hashes),
#             'blockchain_explorer': anchor.blockchain_explorer_url,
#             'verification_timestamp': timezone.now().isoformat(),
#         }

#         if log_id:
#             result['specific_log_id'] = log_id

#         return result

#     except Exception as e:
#         logger.error(f"Verification error: {str(e)}")
#         return {
#             'verified': False,
#             'error': str(e)
#         }


# def _get_client_ip(request):
#     """Get the client IP address from request"""
#     x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
#     if x_forwarded_for:
#         ip = x_forwarded_for.split(',')[0]
#     else:
#         ip = request.META.get('REMOTE_ADDR')
#     return ip
# ________________________module 2 working_________
import logging
from django.utils import timezone
from django.db import transaction

from common.blockchain_utils import BlockchainService
from .models import LoginSession, AuditLog

logger = logging.getLogger(__name__)


def create_login_session(user, request=None):
    import uuid

    session_id = str(uuid.uuid4())

    session_data = {
        'user': user,
        'session_id': session_id,
    }

    if request:
        session_data.update({
            'ip_address': _get_client_ip(request),
            'user_agent': request.META.get('HTTP_USER_AGENT', ''),
        })

    session = LoginSession.objects.create(**session_data)

    # ✅ Log login
    log_user_activity(
        session=session,
        module='users',
        action='LOGIN',
        user=user,
        details={
            'login_method': 'standard',
            'ip_address': session.ip_address,
            'user_agent': session.user_agent,
        }
    )

    return session


def end_login_session(session_id, user=None):
    try:
        session = LoginSession.objects.get(session_id=session_id)

        if user and session.user != user:
            raise ValueError("Session does not belong to user")

        session.logout_time = timezone.now()
        session.save()

        # ✅ Log logout
        log_user_activity(
            session=session,
            module='users',
            action='LOGOUT',
            user=session.user,
            details={
                'session_duration': session.duration,
                'logout_method': 'standard',
            }
        )

        return {
            'session_ended': True
        }

    except LoginSession.DoesNotExist:
        raise ValueError("Session not found")
    except Exception as e:
        logger.error(f"Session end error: {str(e)}")
        raise

# ---- module 2 comint work -----

# def log_user_activity(session, module, action, user, details=None):
#     if details is None:
#         details = {}

#     try:
#         # ✅ 1. Save in DB
#         log = AuditLog.objects.create(
#             session=session,
#             module=module,
#             action=action,
#             user=user,
#             details=details
#         )

#         # ✅ 2. Send to blockchain
#         try:
#             blockchain = BlockchainService()

#             tx_hash = blockchain.add_log(
#                 user_type=user.user_type,
#                 username=user.username,
#                 action=action
#             )

#             logger.info(f"Blockchain log success: {tx_hash}")

#         except Exception as e:
#             logger.error(f"Blockchain logging failed: {str(e)}")

#         return log

#     except Exception as e:
#         logger.error(f"Activity logging error: {str(e)}")


#  module 2 comint work ends here



def log_user_activity(session, module, action, user, details=None):
    """
    Log a user activity for audit purposes.
    Stores both in Django DB and blockchain.
    Returns the blockchain tx_hash.
    """
    if details is None:
        details = {}

    tx_hash = None
    try:
        # 1️⃣ Store in Django DB
        AuditLog.objects.create(
            session=session,
            module=module,
            action=action,
            user=user,
            details=details
        )

        # 2️⃣ Store on blockchain
        blockchain = BlockchainService()
        tx_hash = blockchain.add_log(user.user_type, user.username, action)
        print("TX HASH FROM BLOCKCHAIN:", tx_hash)

    except Exception as e:
        # Backend should not crash if blockchain fails
        print(f"Audit logging error: {str(e)}")  # can also use logging.error

    return tx_hash
# ❌ REMOVED: anchor_session_logs (not needed now)
# ❌ REMOVED: verify_log_integrity (Merkle-based)


def _get_client_ip(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip
