import logging

from django.utils import timezone

from common.blockchain_utils import BlockchainService
from .models import AuditLog, AuditLogAnchor, LoginSession

logger = logging.getLogger(__name__)


def create_login_session(user, request=None):
    session_data = {'user': user}

    if request:
        session_data.update({
            'ip_address': _get_client_ip(request),
            'user_agent': request.META.get('HTTP_USER_AGENT', ''),
        })

    session = LoginSession.objects.create(**session_data)

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

        if session.logout_time is None:
            session.logout_time = timezone.now()
            session.save(update_fields=['logout_time'])

        if not AuditLog.objects.filter(session=session, action='LOGOUT').exists():
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
            'session_ended': True,
            'session_id': str(session.session_id),
            'anchoring_results': anchor_session_logs(session),
        }

    except LoginSession.DoesNotExist as exc:
        raise ValueError("Session not found") from exc
    except Exception as exc:
        logger.error("Session end error: %s", exc)
        raise


def log_user_activity(session, module, action, user, details=None):
    if details is None:
        details = {}

    try:
        return AuditLog.objects.create(
            session=session,
            module=module,
            action=action,
            user=user,
            details=details
        )
    except Exception as exc:
        logger.error("Audit logging error: %s", exc)
        return None


def anchor_session_logs(session):
    logs = (
        AuditLog.objects
        .filter(session=session)
        .order_by('timestamp', 'id')
    )

    if not logs.exists():
        return {
            'audit': {
                'status': 'skipped',
                'reason': 'No logs found for this session',
                'logs_anchored': 0,
            }
        }

    existing_anchor = AuditLogAnchor.objects.filter(
        session=session,
        module='audit'
    ).first()

    if existing_anchor:
        return {
            'audit': {
                'status': 'already_anchored',
                'merkle_root': existing_anchor.merkle_root,
                'transaction_hash': existing_anchor.transaction_hash,
                'block_timestamp': existing_anchor.block_timestamp,
                'logs_anchored': logs.count(),
                'explorer_url': existing_anchor.blockchain_explorer_url,
            }
        }

    blockchain = BlockchainService()
    log_hashes = [log.log_hash for log in logs]
    merkle_root = blockchain.build_merkle_tree(log_hashes)
    tx_hash, block_timestamp = blockchain.store_merkle_root(merkle_root)

    anchor = AuditLogAnchor.objects.create(
        session=session,
        module='audit',
        merkle_root=merkle_root,
        transaction_hash=tx_hash,
        block_timestamp=block_timestamp
    )

    return {
        'audit': {
            'status': 'anchored',
            'merkle_root': anchor.merkle_root,
            'transaction_hash': anchor.transaction_hash,
            'block_timestamp': anchor.block_timestamp,
            'logs_anchored': logs.count(),
            'explorer_url': anchor.blockchain_explorer_url,
        }
    }


def _get_client_ip(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')
