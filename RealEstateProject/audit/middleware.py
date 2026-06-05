# import logging
# from django.utils.deprecation import MiddlewareMixin
# from django.contrib.auth import get_user_model
# from .models import LoginSession
# from .utils import log_user_activity

# User = get_user_model()
# logger = logging.getLogger(__name__)


# class AuditLoggingMiddleware(MiddlewareMixin):
#     """
#     Middleware to log user activities for audit purposes.
#     Logs API requests for authenticated users.
#     """

#     def process_view(self, request, view_func, view_args, view_kwargs):
#         """
#         Log the request after authentication but before view processing.
#         """
#         if not hasattr(request, 'user') or request.user.is_anonymous:
#             return

#         # Get the current session from header (since we use JWT, not Django sessions)
#         session_id = request.headers.get('X-Session-ID') or request.META.get('HTTP_X_SESSION_ID')
#         if not session_id:
#             return

#         try:
#             session = LoginSession.objects.get(session_id=session_id, user=request.user)
#         except LoginSession.DoesNotExist:
#             return

#         # Determine module from URL
#         path = request.path
#         module = self._get_module_from_path(path)

#         if module:
#             # Log the activity
#             details = {
#                 'method': request.method,
#                 'path': path,
#                 'user_agent': request.META.get('HTTP_USER_AGENT', ''),
#                 'ip_address': self._get_client_ip(request),
#             }

#             log_user_activity(
#                 session=session,
#                 module=module,
#                 action=f'{request.method}_REQUEST',
#                 user=request.user,
#                 details=details
#             )

#     def _get_module_from_path(self, path):
#         """
#         Determine the module from the request path.
#         """
#         if path.startswith('/api/users/'):
#             return 'users'
#         elif path.startswith('/api/agents/'):
#             return 'agents'
#         elif path.startswith('/api/property/'):
#             return 'property'
#         elif path.startswith('/api/manager/'):
#             return 'manager'
#         elif path.startswith('/api/meetings/'):
#             return 'meetings'
#         elif path.startswith('/api/tasks/'):
#             return 'tasks'
#         elif path.startswith('/api/chat/'):
#             return 'chat'
#         elif path.startswith('/api/contact/'):
#             return 'contactMessage'
#         elif path.startswith('/api/messages/'):
#             return 'user_messages'
#         return None

#     def _get_client_ip(self, request):
#         """Get the client IP address from request"""
#         x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
#         if x_forwarded_for:
#             ip = x_forwarded_for.split(',')[0]
#         else:
#             ip = request.META.get('REMOTE_ADDR')
#         return ip


# audit/middleware.py

import logging
from django.utils.deprecation import MiddlewareMixin
from django.contrib.auth import get_user_model
from .models import LoginSession
from .utils import log_user_activity

User = get_user_model()
logger = logging.getLogger(__name__)

class AuditLoggingMiddleware(MiddlewareMixin):
    """
    Middleware to log user activities for audit purposes.
    Logs API requests for authenticated users.
    """

    def process_view(self, request, view_func, view_args, view_kwargs):
        """
        Log the request after authentication but before view processing.
        """
        # Only log authenticated users
        if not hasattr(request, 'user') or request.user.is_anonymous:
            return

        # Get session from header (X-Session-ID) for JWT auth
        session_id = request.headers.get('X-Session-ID') or request.META.get('HTTP_X_SESSION_ID')
        if not session_id:
            return

        try:
            session = LoginSession.objects.get(session_id=session_id, user=request.user)
        except LoginSession.DoesNotExist:
            return

        # Determine module from request path
        module = self._get_module_from_path(request.path)
        if not module:
            return  # Skip logging if module not recognized

        # Build log details
        details = {
            'method': request.method,
            'path': request.path,
            'user_agent': request.META.get('HTTP_USER_AGENT', ''),
            'ip_address': self._get_client_ip(request),
        }

        # Call your utility function to create log entry
        log_user_activity(
            session=session,
            module=module,
            action=f'{request.method}_REQUEST',
            user=request.user,
            details=details
        )

    def _get_module_from_path(self, path):
        """
        Map request paths to module names for logs.
        """
        if path.startswith('/api/users/'):
            return 'users'
        elif path.startswith('/api/agents/'):
            return 'agents'
        elif path.startswith('/api/property/'):
            return 'property'
        elif path.startswith('/api/manager/'):
            return 'manager'
        elif path.startswith('/api/meetings/'):
            return 'meetings'
        elif path.startswith('/api/tasks/'):
            return 'tasks'
        elif path.startswith('/api/chat/'):
            return 'chat'
        elif path.startswith('/api/contact/'):
            return 'contactMessage'
        elif path.startswith('/api/messages/'):
            return 'user_messages'
        return None  # Unknown module

    def _get_client_ip(self, request):
        """Return the client's IP address from request"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            return x_forwarded_for.split(',')[0]
        return request.META.get('REMOTE_ADDR')