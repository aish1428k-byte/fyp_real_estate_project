
import uuid
import json
import hashlib
from django.db import models
from django.utils import timezone
from django.contrib.auth import get_user_model

User = get_user_model()


class LoginSession(models.Model):
    """Represents a user login session for audit logging."""

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='login_sessions'
    )
    session_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    login_time = models.DateTimeField(default=timezone.now)
    logout_time = models.DateTimeField(null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)

    class Meta:
        ordering = ['-login_time']
        verbose_name = "Login Session"
        verbose_name_plural = "Login Sessions"

    def __str__(self):
        return f"Session {self.session_id} for {self.user.username}"

    @property
    def is_active(self):
        return self.logout_time is None

    @property
    def duration(self):
        if self.logout_time and self.login_time:
            return (self.logout_time - self.login_time).total_seconds()
        return None

class AuditLog(models.Model):
    """Individual audit log entry for user activities."""

    MODULE_CHOICES = [
        ('users', 'Users Module'),
        ('manager', 'Manager Module'),
        ('agents', 'Agents Module'),
        ('property', 'Property Module'),
        ('meetings', 'Meetings Module'),
        ('tasks', 'Tasks Module'),
        ('chat', 'Chat Module'),
        ('contactMessage', 'Contact Message Module'),
        ('user_messages', 'User Messages Module'),
        ('documents', 'Documents Module'),
        ('finance', 'Finance Module'),
        ('lease', 'Lease Module'),
        ('ownership', 'Ownership Module'),
        ('audit', 'Audit Module'),
    ]

    session = models.ForeignKey(
        LoginSession,
        on_delete=models.CASCADE,
        related_name='audit_logs'
    )
    module = models.CharField(max_length=20, choices=MODULE_CHOICES)
    action = models.CharField(max_length=50)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='audit_logs')
    timestamp = models.DateTimeField(default=timezone.now)
    details = models.JSONField()
    log_hash = models.CharField(max_length=66, blank=True)

    class Meta:
        ordering = ['timestamp']
        verbose_name = "Audit Log"
        verbose_name_plural = "Audit Logs"
        indexes = [
            models.Index(fields=['session', 'module']),
            models.Index(fields=['timestamp']),
        ]

    def save(self, *args, **kwargs):
        if not self.log_hash:
            self.log_hash = self.compute_hash()

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.module} - {self.action} by {self.user.username} at {self.timestamp}"

    def hash_payload(self):
        return (
            f"{self.timestamp.isoformat()}|"
            f"{self.action}|"
            f"{self.user.user_id}|"
            f"{self.module}|"
            f"{json.dumps(self.details, sort_keys=True, default=str)}"
        )

    def compute_hash(self):
        return "0x" + hashlib.sha256(self.hash_payload().encode("utf-8")).hexdigest()

class AuditLogAnchor(models.Model):
    """Represents a Merkle root anchored to the blockchain."""

    MODULE_CHOICES = [
        ('users', 'Users Module'),
        ('manager', 'Manager Module'),
        ('agents', 'Agents Module'),
        ('property', 'Property Module'),
        ('meetings', 'Meetings Module'),
        ('tasks', 'Tasks Module'),
        ('chat', 'Chat Module'),
        ('contactMessage', 'Contact Message Module'),
        ('user_messages', 'User Messages Module'),
        ('documents', 'Documents Module'),
        ('finance', 'Finance Module'),
        ('lease', 'Lease Module'),
        ('ownership', 'Ownership Module'),
        ('audit', 'Audit Module'),
    ]

    session = models.ForeignKey(LoginSession, on_delete=models.CASCADE, related_name='anchors')
    module = models.CharField(max_length=20, choices=MODULE_CHOICES, default='users')
    merkle_root = models.CharField(max_length=66)  # 0x + 64 hex chars
    transaction_hash = models.CharField(max_length=66)  # 0x + 64 hex chars
    block_timestamp = models.PositiveBigIntegerField()
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        unique_together = ['session', 'module']
        ordering = ['-created_at']
        verbose_name = "Audit Log Anchor"
        verbose_name_plural = "Audit Log Anchors"

    def __str__(self):
        return f"Anchor {self.merkle_root[:10]}... at {self.created_at}"

    @property
    def blockchain_explorer_url(self):
        return f"https://sepolia.etherscan.io/tx/{self.transaction_hash}"

    @property
    def formatted_block_timestamp(self):
        return timezone.localtime(
            timezone.datetime.fromtimestamp(self.block_timestamp, tz=timezone.utc)
        )
