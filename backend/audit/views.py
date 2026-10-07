import logging
import hashlib
from datetime import datetime, time

from django.db.models import Q
from django.utils import timezone
from django.utils.dateparse import parse_date, parse_datetime
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from common.blockchain_utils import convert_unix_timestamp
from .models import AuditLog, AuditLogAnchor, LoginSession
from .utils import anchor_session_logs, create_login_session, end_login_session

logger = logging.getLogger(__name__)

USER_TYPE_GROUPS = {
    'users': ['buyer', 'seller'],
    'agents': ['agent'],
    'managers': ['manager'],
    'finance_managers': ['finance manager', 'finance_manager'],
    'lease_managers': ['lease manager', 'lease_manager'],
}


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def user_login(request):
    try:
        session = create_login_session(request.user, request)
        return Response({
            'session_id': str(session.session_id),
            'login_time': _format_dt(session.login_time),
            'message': 'Login session recorded',
        }, status=status.HTTP_201_CREATED)
    except Exception as exc:
        logger.error("Login recording error: %s", exc)
        return Response(
            {'error': f'Login failed: {exc}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def user_logout(request):
    session_id = request.data.get('session_id') or request.headers.get('X-Session-ID')
    if not session_id:
        return Response({'error': 'session_id is required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        result = end_login_session(session_id, request.user)
        session = LoginSession.objects.get(session_id=session_id, user=request.user)
        result.update({
            'logout_time': _format_dt(session.logout_time),
            'message': 'Logout recorded and audit logs anchored',
        })
        return Response(result, status=status.HTTP_200_OK)
    except ValueError as exc:
        return Response({'error': str(exc)}, status=status.HTTP_404_NOT_FOUND)
    except Exception as exc:
        logger.error("Logout error: %s", exc)
        return Response(
            {'error': f'Logout failed: {exc}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def anchor_audit_logs(request):
    session_id = request.data.get('session_id')
    if not session_id:
        return Response({'error': 'session_id is required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        session = LoginSession.objects.get(session_id=session_id)
        results = anchor_session_logs(session)
        return Response({
            'anchored': True,
            'session_id': str(session.session_id),
            'anchoring_results': results,
        }, status=status.HTTP_200_OK)
    except LoginSession.DoesNotExist:
        return Response({'error': 'Session not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as exc:
        logger.error("Anchoring error: %s", exc)
        return Response(
            {'error': f'Anchoring failed: {exc}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_log_integrity(request):
    session_id = request.data.get('session_id')
    module = request.data.get('module') or 'audit'
    log_id = request.data.get('log_id')

    if not session_id:
        return Response(
            {'error': 'session_id is required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        session = LoginSession.objects.get(session_id=session_id)
        anchor = AuditLogAnchor.objects.filter(session=session, module=module).first()
        if not anchor:
            return Response(
                {'verified': False, 'reason': 'No blockchain anchor found'},
                status=status.HTTP_200_OK
            )

        logs = AuditLog.objects.filter(session=session).order_by('timestamp', 'id')
        if module != 'audit':
            logs = logs.filter(module=module)
        if not logs.exists():
            return Response(
                {'verified': False, 'reason': 'No logs found'},
                status=status.HTTP_200_OK
            )

        mismatches = [
            log.id for log in logs
            if log.log_hash != log.compute_hash()
        ]

        computed_root = _build_merkle_root([log.log_hash for log in logs])
        verified = not mismatches and computed_root == anchor.merkle_root

        response = {
            'verified': verified,
            'session_id': str(session.session_id),
            'module': module,
            'blockchain_root': anchor.merkle_root,
            'computed_root': computed_root,
            'logs_verified': logs.count(),
            'hash_mismatches': mismatches,
            'explorer_url': anchor.blockchain_explorer_url,
            'reason': 'Roots match' if verified else 'Log hash or Merkle root mismatch',
        }

        if log_id:
            selected = logs.filter(id=log_id).first()
            response['specific_log_id'] = log_id
            response['specific_log_hash_verified'] = bool(
                selected and selected.log_hash == selected.compute_hash()
            )

        return Response(response, status=status.HTTP_200_OK)
    except LoginSession.DoesNotExist:
        return Response({'error': 'Session not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as exc:
        logger.error("Verification error: %s", exc)
        return Response(
            {'error': f'Verification failed: {exc}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_session_logs(request):
    session_id = request.query_params.get('session_id')
    module = request.query_params.get('module')
    if not session_id:
        return Response({'error': 'session_id is required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        session = LoginSession.objects.get(session_id=session_id)
        logs = AuditLog.objects.filter(session=session).order_by('timestamp', 'id')
        if module:
            logs = logs.filter(module=module)

        response = {
            'session_id': str(session.session_id),
            'login_time': _format_dt(session.login_time),
            'logout_time': _format_dt(session.logout_time),
            'module': module,
            'logs': [_serialize_log(log) for log in logs],
            'total_logs': logs.count(),
        }

        anchors = AuditLogAnchor.objects.filter(session=session)
        if module:
            anchors = anchors.filter(module=module)
        response['blockchain_anchors'] = [_serialize_anchor(anchor) for anchor in anchors]

        return Response(response, status=status.HTTP_200_OK)
    except LoginSession.DoesNotExist:
        return Response({'error': 'Session not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as exc:
        logger.error("Error retrieving session logs: %s", exc)
        return Response(
            {'error': f'Failed to retrieve logs: {exc}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_all_logs(request):
    return _logs_response(request)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_logs(request):
    return _logs_response(request, user_types=USER_TYPE_GROUPS['users'])


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_agent_logs(request):
    
    return _logs_response(request, user_types=USER_TYPE_GROUPS['agents'])


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_manager_logs(request):
    return _logs_response(request, user_types=USER_TYPE_GROUPS['managers'])


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_finance_manager_logs(request):
    return _logs_response(request, user_types=USER_TYPE_GROUPS['finance_managers'])


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_lease_manager_logs(request):
    return _logs_response(request, user_types=USER_TYPE_GROUPS['lease_managers'])


def _logs_response(request, user_types=None):
    try:
        logs = _filter_logs(request, user_types=user_types)
        log_list = [_serialize_log(log) for log in logs]
        return Response({'total_logs': len(log_list), 'logs': log_list}, status=status.HTTP_200_OK)
    except ValueError as exc:
        return Response({'error': str(exc)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as exc:
        logger.error("Error retrieving audit logs: %s", exc)
        return Response(
            {'error': f'Failed to retrieve logs: {exc}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


def _filter_logs(request, user_types=None):
    logs = AuditLog.objects.select_related('user', 'session').all().order_by('-timestamp', '-id')
    params = request.query_params

    group = params.get('user_group') or params.get('role_group')
    if group:
        user_types = USER_TYPE_GROUPS.get(group)
        if user_types is None:
            raise ValueError('Invalid user_group')

    user_type = params.get('user_type')
    if user_type:
        user_types = [user_type]

    if user_types:
        logs = logs.filter(user__user_type__in=user_types)

    username = params.get('username') or params.get('search')
    if username:
        logs = logs.filter(
            Q(user__username__icontains=username)
            | Q(user__first_name__icontains=username)
            | Q(user__last_name__icontains=username)
            | Q(user__email__icontains=username)
        )

    session_id = params.get('session_id') or params.get('session')
    if session_id:
        logs = logs.filter(session__session_id=session_id)

    module = params.get('module')
    if module:
        logs = logs.filter(module=module)

    action = params.get('action')
    if action:
        logs = logs.filter(action__icontains=action)

    date_value = params.get('date')
    date_from = params.get('date_from') or params.get('from')
    date_to = params.get('date_to') or params.get('to')

    if date_value:
        start, end = _parse_local_date_bounds(date_value, date_value)
        logs = logs.filter(timestamp__gte=start, timestamp__lte=end)
    else:
        if date_from:
            logs = logs.filter(timestamp__gte=_parse_local_datetime(date_from, start_of_day=True))
        if date_to:
            logs = logs.filter(timestamp__lte=_parse_local_datetime(date_to, end_of_day=True))

    return logs


def _serialize_log(log):
    return {
        'id': log.id,
        'session_id': str(log.session.session_id),
        'module': log.module,
        'action': log.action,
        'user': log.user.username,
        'user_id': str(log.user.user_id),
        'user_type': log.user.user_type,
        'timestamp': _format_dt(log.timestamp),
        'timestamp_timezone': timezone.get_current_timezone_name(),
        'details': log.details,
        'log_hash': log.log_hash,
    }


def _serialize_anchor(anchor):
    return {
        'module': anchor.module,
        'merkle_root': anchor.merkle_root,
        'transaction_hash': anchor.transaction_hash,
        'block_timestamp': anchor.block_timestamp,
        'block_timestamp_readable': convert_unix_timestamp(anchor.block_timestamp, 'PKT'),
        'created_at': _format_dt(anchor.created_at),
        'explorer_url': anchor.blockchain_explorer_url,
    }


def _format_dt(value):
    if value is None:
        return None
    return timezone.localtime(value).isoformat()


def _parse_local_date_bounds(date_from, date_to):
    return (
        _parse_local_datetime(date_from, start_of_day=True),
        _parse_local_datetime(date_to, end_of_day=True),
    )


def _parse_local_datetime(value, start_of_day=False, end_of_day=False):
    parsed_dt = parse_datetime(value)
    if parsed_dt is not None:
        if timezone.is_naive(parsed_dt):
            return timezone.make_aware(parsed_dt, timezone.get_current_timezone())
        return parsed_dt

    parsed_date = parse_date(value)
    if parsed_date is None:
        raise ValueError('Dates must use YYYY-MM-DD or ISO datetime format')

    parsed_time = time.min
    if end_of_day:
        parsed_time = time.max
    elif not start_of_day:
        parsed_time = time.min

    local_dt = datetime.combine(parsed_date, parsed_time)
    return timezone.make_aware(local_dt, timezone.get_current_timezone())


def _build_merkle_root(log_hashes):
    if not log_hashes:
        raise ValueError('Cannot build Merkle tree from empty log list')

    hashes = [bytes.fromhex(log_hash.lstrip('0x')) for log_hash in log_hashes]
    if len(hashes) == 1:
        return '0x' + hashes[0].hex()

    current_level = hashes
    while len(current_level) > 1:
        next_level = []
        for index in range(0, len(current_level), 2):
            left = current_level[index]
            right = current_level[index + 1] if index + 1 < len(current_level) else left
            next_level.append(hashlib.sha256(left + right).digest())
        current_level = next_level

    return '0x' + current_level[0].hex()
