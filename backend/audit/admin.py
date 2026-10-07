from django.contrib import admin
from django.utils import timezone

from .models import AuditLog, AuditLogAnchor, LoginSession


@admin.register(LoginSession)
class LoginSessionAdmin(admin.ModelAdmin):
    list_display = ('session_id', 'user', 'login_time_pkt', 'logout_time_pkt', 'ip_address', 'is_active')
    list_filter = ('login_time', 'logout_time', 'user__user_type')
    search_fields = ('session_id', 'user__username', 'user__email', 'ip_address')
    readonly_fields = ('session_id', 'login_time', 'logout_time')

    @admin.display(description='Login time PKT', ordering='login_time')
    def login_time_pkt(self, obj):
        return timezone.localtime(obj.login_time).strftime('%Y-%m-%d %H:%M:%S PKT')

    @admin.display(description='Logout time PKT', ordering='logout_time')
    def logout_time_pkt(self, obj):
        if obj.logout_time is None:
            return None
        return timezone.localtime(obj.logout_time).strftime('%Y-%m-%d %H:%M:%S PKT')


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('id', 'timestamp_pkt', 'user', 'user_type', 'module', 'action', 'session')
    list_filter = ('module', 'action', 'timestamp', 'user__user_type')
    search_fields = ('user__username', 'user__email', 'module', 'action', 'session__session_id')
    readonly_fields = ('timestamp', 'log_hash')

    @admin.display(description='Timestamp PKT', ordering='timestamp')
    def timestamp_pkt(self, obj):
        return timezone.localtime(obj.timestamp).strftime('%Y-%m-%d %H:%M:%S PKT')

    @admin.display(description='User type', ordering='user__user_type')
    def user_type(self, obj):
        return obj.user.user_type


@admin.register(AuditLogAnchor)
class AuditLogAnchorAdmin(admin.ModelAdmin):
    list_display = ('id', 'session', 'module', 'created_at_pkt', 'transaction_hash')
    list_filter = ('module', 'created_at')
    search_fields = ('session__session_id', 'merkle_root', 'transaction_hash')
    readonly_fields = ('created_at', 'merkle_root', 'transaction_hash', 'block_timestamp')

    @admin.display(description='Created at PKT', ordering='created_at')
    def created_at_pkt(self, obj):
        return timezone.localtime(obj.created_at).strftime('%Y-%m-%d %H:%M:%S PKT')
