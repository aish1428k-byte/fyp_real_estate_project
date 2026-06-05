# from rest_framework.decorators import api_view, permission_classes
# from rest_framework.permissions import IsAuthenticated
# from rest_framework.response import Response
# from rest_framework import status
# from django.utils import timezone
# from .models import AuditLog, AuditLogAnchor, LoginSession
# from common.blockchain_utils import BlockchainService, convert_unix_timestamp
# import logging

# logger = logging.getLogger(__name__)


# @api_view(['POST'])
# @permission_classes([IsAuthenticated])
# def anchor_audit_logs(request):
#     """
#     Anchor audit logs to blockchain for a specific session and module.

#     POST /audit/anchor-logs/
#     Body: {
#         "session_id": "uuid",
#         "module": "users|manager|agents|property"
#     }

#     Returns: {
#         "anchored": true/false,
#         "transaction_hash": "...",
#         "merkle_root": "...",
#         "explorer_url": "..."
#     }
#     """
#     try:
#         session_id = request.data.get('session_id')
#         module = request.data.get('module')

#         if not session_id or not module:
#             return Response(
#                 {"error": "session_id and module are required"},
#                 status=status.HTTP_400_BAD_REQUEST
#             )

#         # Get the session
#         session = LoginSession.objects.get(session_id=session_id)

#         # Get all logs for this session and module
#         logs = AuditLog.objects.filter(
#             session=session,
#             module=module
#         ).order_by('timestamp')

#         if not logs.exists():
#             return Response({
#                 "anchored": False,
#                 "reason": "No logs found for this session and module"
#             }, status=status.HTTP_200_OK)

#         # Build Merkle tree from log hashes
#         blockchain = BlockchainService()


#         # generate logs hash
#         log_hashes = [log.log_hash for log in logs]
#         merkle_root = blockchain.build_merkle_tree(log_hashes)

#         # Store Merkle root on blockchain
#         tx_hash, block_timestamp = blockchain.store_merkle_root(merkle_root)

#         # Save anchor record
#         anchor = AuditLogAnchor.objects.create(
#             session=session,
#             module=module,
#             merkle_root=merkle_root,
#             transaction_hash=tx_hash,
#             block_timestamp=block_timestamp
#         )

#         return Response({
#             "anchored": True,
#             "session_id": str(session.session_id),
#             "module": module,
#             "merkle_root": merkle_root,
#             "transaction_hash": tx_hash,
#             "block_timestamp": block_timestamp,
#             "explorer_url": anchor.blockchain_explorer_url,
#             "logs_anchored": len(logs)
#         }, status=status.HTTP_200_OK)

#     except LoginSession.DoesNotExist:
#         return Response(
#             {"error": "Session not found"},
#             status=status.HTTP_404_NOT_FOUND
#         )
#     except Exception as e:
#         logger.error(f"Anchoring error: {str(e)}")
#         return Response(
#             {"error": f"Anchoring failed: {str(e)}"},
#             status=status.HTTP_500_INTERNAL_SERVER_ERROR
#         )


# @api_view(['POST'])
# @permission_classes([IsAuthenticated])
# def verify_log_integrity(request):
#     """
#     Verify the integrity of a specific audit log entry.

#     POST /audit/verify-log/
#     Body: {
#         "session_id": "uuid",
#         "module": "users|manager|agents|property",
#         "log_id": "uuid"  // optional, if not provided, verify all logs in session
#     }

#     Returns: {
#         "verified": true/false,
#         "details": {...}
#     }
#     """
#     try:
#         session_id = request.data.get('session_id')
#         module = request.data.get('module')
#         log_id = request.data.get('log_id')

#         if not session_id or not module:
#             return Response(
#                 {"error": "session_id and module are required"},
#                 status=status.HTTP_400_BAD_REQUEST
#             )

#         # Get the session
#         session = LoginSession.objects.get(session_id=session_id)

#         # Get anchor for this module
#         anchor = AuditLogAnchor.objects.filter(
#             session=session,
#             module=module
#         ).first()

#         if not anchor:
#             return Response({
#                 "verified": False,
#                 "reason": "No blockchain anchor found for this session and module"
#             }, status=status.HTTP_200_OK)

#         # Get logs for verification
#         if log_id:
#             # Verify specific log
#             logs = AuditLog.objects.filter(
#                 session=session,
#                 module=module,
#                 id=log_id
#             )
#         else:
#             # Verify all logs in session for this module
#             logs = AuditLog.objects.filter(
#                 session=session,
#                 module=module
#             ).order_by('timestamp')

#         if not logs.exists():
#             return Response({
#                 "verified": False,
#                 "reason": "No logs found for verification"
#             }, status=status.HTTP_200_OK)

#         # Recompute hashes and Merkle tree
#         blockchain = BlockchainService()
#         log_hashes = []

#         for log in logs:
#             # Recompute log hash
#             log_data = f"{log.timestamp.isoformat()}|{log.module}|{log.action}|{log.user.user_id}|{log.details}"
#             computed_hash = blockchain.hash_log_entry(log_data)
#             log_hashes.append(computed_hash)

#             # Check individual log hash if verifying specific log
#             if log_id and log.log_hash != computed_hash:
#                 return Response({
#                     "verified": False,
#                     "reason": f"Log hash mismatch for log {log_id}",
#                     "stored_hash": log.log_hash,
#                     "computed_hash": computed_hash
#                 }, status=status.HTTP_200_OK)

#         # Rebuild Merkle tree
#         computed_root = blockchain.build_merkle_tree(log_hashes)

#         # Compare with blockchain root
#         verified = computed_root == anchor.merkle_root

#         return Response({
#             "verified": verified,
#             "session_id": str(session.session_id),
#             "module": module,
#             "blockchain_root": anchor.merkle_root,
#             "computed_root": computed_root,
#             "logs_verified": len(log_hashes),
#             "explorer_url": anchor.blockchain_explorer_url,
#             "reason": "Roots match" if verified else "Merkle root mismatch"
#         }, status=status.HTTP_200_OK)

#     except LoginSession.DoesNotExist:
#         return Response(
#             {"error": "Session not found"},
#             status=status.HTTP_404_NOT_FOUND
#         )
#     except Exception as e:
#         logger.error(f"Verification error: {str(e)}")
#         return Response(
#             {"error": f"Verification failed: {str(e)}"},
#             status=status.HTTP_500_INTERNAL_SERVER_ERROR
#         )


# @api_view(['GET'])
# @permission_classes([IsAuthenticated])
# def get_session_logs(request):
#     """
#     Get audit logs for a specific session and module.

#     GET /audit/session-logs/?session_id=uuid&module=users
#     """
#     try:
#         session_id = request.query_params.get('session_id')
#         module = request.query_params.get('module')

#         if not session_id or not module:
#             return Response(
#                 {"error": "session_id and module are required"},
#                 status=status.HTTP_400_BAD_REQUEST
#             )

#         session = LoginSession.objects.get(session_id=session_id)

#         logs = AuditLog.objects.filter(
#             session=session,
#             module=module
#         ).order_by('timestamp')

#         # Get anchor info
#         anchor = AuditLogAnchor.objects.filter(
#             session=session,
#             module=module
#         ).first()

#         log_data = []
#         for log in logs:
#             log_data.append({
#                 "id": log.id,
#                 "timestamp": log.timestamp.isoformat(),
#                 "action": log.action,
#                 "user": str(log.user.username),
#                 "details": log.details,
#                 "log_hash": log.log_hash
#             })

#         response_data = {
#             "session_id": str(session.session_id),
#             "module": module,
#             "logs": log_data,
#             "total_logs": len(log_data)
#         }

#         if anchor:
#             response_data["blockchain_anchor"] = {
#                 "merkle_root": anchor.merkle_root,
#                 "transaction_hash": anchor.transaction_hash,
#                 "block_timestamp": anchor.block_timestamp,
#                 "block_timestamp_readable": convert_unix_timestamp(anchor.block_timestamp, "PKT"),
#                 "explorer_url": anchor.blockchain_explorer_url
#             }

#         return Response(response_data, status=status.HTTP_200_OK)

#     except LoginSession.DoesNotExist:
#         return Response(
#             {"error": "Session not found"},
#             status=status.HTTP_404_NOT_FOUND
#         )
#     except Exception as e:
#         logger.error(f"Error retrieving session logs: {str(e)}")
#         return Response(
#             {"error": f"Failed to retrieve logs: {str(e)}"},
#             status=status.HTTP_500_INTERNAL_SERVER_ERROR
#         )





# @api_view(['GET'])
# @permission_classes([IsAuthenticated])
# def get_all_logs(request):
#     """
#     Get all audit logs across all sessions and modules.
#     Optional query params:
#         module=users|manager|agents
#         date_from=YYYY-MM-DD
#         date_to=YYYY-MM-DD
#     """
#     try:
#         logs = AuditLog.objects.all().order_by('timestamp')

#         module = request.query_params.get('module')
#         if module:
#             logs = logs.filter(module=module)

#         date_from = request.query_params.get('date_from')
#         date_to = request.query_params.get('date_to')
#         if date_from:
#             logs = logs.filter(timestamp__gte=date_from)
#         if date_to:
#             logs = logs.filter(timestamp__lte=date_to)

#         log_list = []
#         for log in logs:
#             log_list.append({
#                 "id": log.id,
#                 "timestamp": log.timestamp.isoformat(),
#                 "action": log.action,
#                 "user": str(log.user.username),
#                 "details": log.details,
#                 "module": log.module,
#                 "log_hash": log.log_hash
#             })

#         return Response({
#             "total_logs": len(log_list),
#             "logs": log_list
#         }, status=status.HTTP_200_OK)

#     except Exception as e:
#         logger.error(f"Error retrieving all logs: {str(e)}")
#         return Response({"error": f"Failed to retrieve all logs: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



import logging
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import AuditLog, AuditLogAnchor, LoginSession
from common.blockchain_utils import BlockchainService, convert_unix_timestamp

logger = logging.getLogger(__name__)


# -----------------------
# Session Login/Logout APIs
# -----------------------

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def user_login(request):
    """
    Record login session for a user.
    POST /audit/login/
    Body: {
        "ip_address": "user_ip",
        "user_agent": "browser info"
    }
    """
    try:
        session = LoginSession.objects.create(
            user=request.user,
            login_time=timezone.now(),
            ip_address=request.data.get('ip_address', ''),
            user_agent=request.data.get('user_agent', '')
        )

        return Response({
            "session_id": str(session.session_id),
            "login_time": session.login_time,
            "message": "Login session recorded"
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        logger.error(f"Login recording error: {str(e)}")
        return Response({"error": f"Login failed: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def user_logout(request):
    """
    Record logout for a session.
    POST /audit/logout/
    Body: {
        "session_id": "uuid"
    }
    """
    try:
        session_id = request.data.get('session_id')
        if not session_id:
            return Response({"error": "session_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        session = LoginSession.objects.get(session_id=session_id, user=request.user)
        session.logout_time = timezone.now()
        session.save()

        return Response({
            "session_id": str(session.session_id),
            "logout_time": session.logout_time,
            "message": "Logout recorded"
        }, status=status.HTTP_200_OK)

    except LoginSession.DoesNotExist:
        return Response({"error": "Session not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Logout error: {str(e)}")
        return Response({"error": f"Logout failed: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# -----------------------
# Anchor Logs to Blockchain
# -----------------------

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def anchor_audit_logs(request):
    try:
        session_id = request.data.get('session_id')
        module = request.data.get('module')

        if not session_id or not module:
            return Response({"error": "session_id and module are required"}, status=status.HTTP_400_BAD_REQUEST)

        session = LoginSession.objects.get(session_id=session_id)
        logs = AuditLog.objects.filter(session=session, module=module).order_by('timestamp')

        if not logs.exists():
            return Response({"anchored": False, "reason": "No logs found"}, status=status.HTTP_200_OK)

        blockchain = BlockchainService()
        log_hashes = [log.log_hash for log in logs]
        merkle_root = blockchain.build_merkle_tree(log_hashes)
        tx_hash, block_timestamp = blockchain.store_merkle_root(merkle_root)

        anchor = AuditLogAnchor.objects.create(
            session=session,
            module=module,
            merkle_root=merkle_root,
            transaction_hash=tx_hash,
            block_timestamp=block_timestamp
        )

        return Response({
            "anchored": True,
            "session_id": str(session.session_id),
            "module": module,
            "merkle_root": merkle_root,
            "transaction_hash": tx_hash,
            "block_timestamp": block_timestamp,
            "explorer_url": anchor.blockchain_explorer_url,
            "logs_anchored": len(logs)
        }, status=status.HTTP_200_OK)

    except LoginSession.DoesNotExist:
        return Response({"error": "Session not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Anchoring error: {str(e)}")
        return Response({"error": f"Anchoring failed: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# -----------------------
# Verify Logs
# -----------------------

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_log_integrity(request):
    try:
        session_id = request.data.get('session_id')
        module = request.data.get('module')
        log_id = request.data.get('log_id')

        if not session_id or not module:
            return Response({"error": "session_id and module are required"}, status=status.HTTP_400_BAD_REQUEST)

        session = LoginSession.objects.get(session_id=session_id)
        anchor = AuditLogAnchor.objects.filter(session=session, module=module).first()

        if not anchor:
            return Response({"verified": False, "reason": "No blockchain anchor found"}, status=status.HTTP_200_OK)

        logs = AuditLog.objects.filter(session=session, module=module)
        if log_id:
            logs = logs.filter(id=log_id)
        logs = logs.order_by('timestamp')

        if not logs.exists():
            return Response({"verified": False, "reason": "No logs found"}, status=status.HTTP_200_OK)

        blockchain = BlockchainService()
        log_hashes = []
        for log in logs:
            log_data = f"{log.timestamp.isoformat()}|{log.module}|{log.action}|{log.user.user_id}|{log.details}"
            computed_hash = blockchain.hash_log_entry(log_data)
            log_hashes.append(computed_hash)

            if log_id and log.log_hash != computed_hash:
                return Response({
                    "verified": False,
                    "reason": f"Log hash mismatch for log {log_id}",
                    "stored_hash": log.log_hash,
                    "computed_hash": computed_hash
                }, status=status.HTTP_200_OK)

        computed_root = blockchain.build_merkle_tree(log_hashes)
        verified = computed_root == anchor.merkle_root

        return Response({
            "verified": verified,
            "session_id": str(session.session_id),
            "module": module,
            "blockchain_root": anchor.merkle_root,
            "computed_root": computed_root,
            "logs_verified": len(log_hashes),
            "explorer_url": anchor.blockchain_explorer_url,
            "reason": "Roots match" if verified else "Merkle root mismatch"
        }, status=status.HTTP_200_OK)

    except LoginSession.DoesNotExist:
        return Response({"error": "Session not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Verification error: {str(e)}")
        return Response({"error": f"Verification failed: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# -----------------------
# Get Logs
# -----------------------

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_session_logs(request):
    try:
        session_id = request.query_params.get('session_id')
        module = request.query_params.get('module')
        if not session_id or not module:
            return Response({"error": "session_id and module are required"}, status=status.HTTP_400_BAD_REQUEST)

        session = LoginSession.objects.get(session_id=session_id)
        logs = AuditLog.objects.filter(session=session, module=module).order_by('timestamp')
        anchor = AuditLogAnchor.objects.filter(session=session, module=module).first()

        log_list = []
        for log in logs:
            log_list.append({
                "id": log.id,
                "timestamp": log.timestamp.isoformat(),
                "action": log.action,
                "user": log.user.username,
                "details": log.details,
                "log_hash": log.log_hash
            })

        response = {"session_id": str(session.session_id), "module": module, "logs": log_list, "total_logs": len(log_list)}
        if anchor:
            response["blockchain_anchor"] = {
                "merkle_root": anchor.merkle_root,
                "transaction_hash": anchor.transaction_hash,
                "block_timestamp": anchor.block_timestamp,
                "block_timestamp_readable": convert_unix_timestamp(anchor.block_timestamp, "PKT"),
                "explorer_url": anchor.blockchain_explorer_url
            }
        return Response(response, status=status.HTTP_200_OK)

    except LoginSession.DoesNotExist:
        return Response({"error": "Session not found"}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error retrieving session logs: {str(e)}")
        return Response({"error": f"Failed to retrieve logs: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_all_logs(request):
    try:
        logs = AuditLog.objects.all().order_by('timestamp')
        module = request.query_params.get('module')
        if module:
            logs = logs.filter(module=module)
        date_from = request.query_params.get('date_from')
        date_to = request.query_params.get('date_to')
        if date_from:
            logs = logs.filter(timestamp__gte=date_from)
        if date_to:
            logs = logs.filter(timestamp__lte=date_to)

        log_list = []
        for log in logs:
            log_list.append({
                "id": log.id,
                "timestamp": log.timestamp.isoformat(),
                "action": log.action,
                "user": log.user.username,
                "details": log.details,
                "module": log.module,
                "log_hash": log.log_hash
            })
        return Response({"total_logs": len(log_list), "logs": log_list}, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"Error retrieving all logs: {str(e)}")
        return Response({"error": f"Failed to retrieve all logs: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)