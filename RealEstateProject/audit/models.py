# """
# Models for audit log anchoring.

# This model stores the results of anchoring audit logs to the blockchain.
# Each record represents a Merkle root stored on-chain with its transaction details.

# Why Store Merkle Roots Instead of Full Logs?
# - Gas Costs: Storing full logs on-chain would be extremely expensive
# - Privacy: Logs may contain sensitive user data
# - Efficiency: Merkle roots allow verification without revealing all data
# - Scalability: One root can represent thousands of logs
# """

# import uuid
# from django.db import models
# from django.utils import timezone
# from django.contrib.auth import get_user_model

# User = get_user_model()


# class LoginSession(models.Model):
#     """
#     Represents a user login session for audit logging.

#     Fields:
#     - user: User who logged in
#     - session_id: Unique session identifier
#     - login_time: When the session started
#     - logout_time: When the session ended (null if active)
#     - ip_address: IP address of the login
#     - user_agent: Browser/client information
#     """

#     user = models.ForeignKey(
#         User,
#         on_delete=models.CASCADE,
#         related_name='login_sessions'
#     )

#     session_id = models.UUIDField(
#         default=uuid.uuid4,
#         unique=True,
#         editable=False,
#         help_text="Unique session identifier"
#     )

#     login_time = models.DateTimeField(
#         default=timezone.now,
#         help_text="When the session started"
#     )

#     logout_time = models.DateTimeField(
#         null=True,
#         blank=True,
#         help_text="When the session ended"
#     )

#     ip_address = models.GenericIPAddressField(
#         null=True,
#         blank=True,
#         help_text="IP address of the login"
#     )

#     user_agent = models.TextField(
#         blank=True,
#         help_text="Browser/client user agent"
#     )

#     class Meta:
#         ordering = ['-login_time']
#         verbose_name = "Login Session"
#         verbose_name_plural = "Login Sessions"

#     def __str__(self):
#         return f"Session {self.session_id} for {self.user.username}"

#     @property
#     def is_active(self):
#         """Check if session is still active"""
#         return self.logout_time is None

#     @property
#     def duration(self):
#         """Calculate session duration in seconds"""
#         if self.logout_time and self.login_time:
#             return (self.logout_time - self.login_time).total_seconds()
#         return None


# class AuditLog(models.Model):
#     """
#     Individual audit log entry for user activities.

#     Fields:
#     - session: Login session this log belongs to
#     - module: Module where the activity occurred
#     - action: Type of action performed
#     - user: User who performed the action
#     - timestamp: When the action occurred
#     - details: Additional action details
#     - log_hash: SHA-256 hash of the log entry
#     """

#     session = models.ForeignKey(
#         LoginSession,
#         on_delete=models.CASCADE,
#         related_name='audit_logs'
#     )

#     module = models.CharField(
#         max_length=20,
#         choices=[
#             ('users', 'Users Module'),
#             ('manager', 'Manager Module'),
#             ('agents', 'Agents Module'),
#             ('property', 'Property Module'),
#         ],
#         help_text="Module where the activity occurred"
#     )

#     action = models.CharField(
#         max_length=50,
#         help_text="Type of action performed (CREATE, UPDATE, DELETE, VIEW, etc.)"
#     )

#     user = models.ForeignKey(
#         User,
#         on_delete=models.CASCADE,
#         related_name='audit_logs'
#     )

#     timestamp = models.DateTimeField(
#         default=timezone.now,
#         help_text="When the action occurred"
#     )

#     details = models.JSONField(
#         help_text="Additional action details as JSON"
#     )

#     log_hash = models.CharField(
#         max_length=64,
#         help_text="SHA-256 hash of the log entry"
#     )

#     class Meta:
#         ordering = ['timestamp']
#         verbose_name = "Audit Log"
#         verbose_name_plural = "Audit Logs"
#         indexes = [
#             models.Index(fields=['session', 'module']),
#             models.Index(fields=['timestamp']),
#         ]

#     def __str__(self):
#         return f"{self.module} - {self.action} by {self.user.username} at {self.timestamp}"

#     def save(self, *args, **kwargs):
#         """Generate hash before saving"""
#         if not self.log_hash:
#             from common.blockchain_utils import BlockchainService
#             blockchain = BlockchainService()
#             log_data = f"{self.timestamp.isoformat()}|{self.action}|{self.user.user_id}|{self.module}|{str(self.details)}"
#             self.log_hash = blockchain.hash_log_entry(log_data)
#         super().save(*args, **kwargs)


# class AuditLogAnchor(models.Model):
#     """
#     Represents a Merkle root anchored to the blockchain.
#     Each anchor is specific to a module and login session.

#     Fields:
#     - session: Login session this anchor belongs to
#     - module: Module this anchor represents
#     - merkle_root: SHA-256 Merkle root of audit logs (bytes32)
#     - transaction_hash: Ethereum transaction hash
#     - block_timestamp: Timestamp from blockchain block
#     - created_at: When this record was created in our DB
#     """

#     session = models.ForeignKey(
#         LoginSession,
#         on_delete=models.CASCADE,
#         related_name='anchors'
#     )

#     module = models.CharField(
#         max_length=20,
#         choices=[
#             ('users', 'Users Module'),
#             ('manager', 'Manager Module'),
#             ('agents', 'Agents Module'),
#             ('property', 'Property Module'),
#         ],
#         default='users',
#         help_text="Module this Merkle root represents"
#     )

#     # Merkle root as hex string (0x prefixed, 64 chars)
#     merkle_root = models.CharField(
#         max_length=66,  # 0x + 64 hex chars
#         help_text="SHA-256 Merkle root of audit logs"
#     )

#     # Transaction hash (0x prefixed, 64 chars)
#     transaction_hash = models.CharField(
#         max_length=66,  # 0x + 64 hex chars
#         help_text="Ethereum transaction hash"
#     )

#     # Timestamp from blockchain (Unix timestamp)
#     block_timestamp = models.PositiveBigIntegerField(
#         help_text="Block timestamp from blockchain"
#     )

#     # When this was stored in our database
#     created_at = models.DateTimeField(
#         default=timezone.now,
#         help_text="When this anchor was created"
#     )

#     class Meta:
#         unique_together = ['session', 'module']
#         ordering = ['-created_at']
#         verbose_name = "Audit Log Anchor"
#         verbose_name_plural = "Audit Log Anchors"

#     def __str__(self):
#         return f"Anchor {self.merkle_root[:10]}... at {self.created_at}"

#     @property
#     def blockchain_explorer_url(self):
#         """
#         Returns the Etherscan URL for this transaction on Sepolia.
#         """
#         return f"https://sepolia.etherscan.io/tx/{self.transaction_hash}"

#     @property
#     def formatted_block_timestamp(self):
#         """
#         Returns the block timestamp as a readable datetime.
#         """
#         return timezone.datetime.fromtimestamp(self.block_timestamp, tz=timezone.utc)



"""
Models for audit log anchoring.

This model stores the results of anchoring audit logs to the blockchain.
Each record represents a Merkle root stored on-chain with its transaction details.

Why Store Merkle Roots Instead of Full Logs?
- Gas Costs: Storing full logs on-chain would be extremely expensive
- Privacy: Logs may contain sensitive user data
- Efficiency: Merkle roots allow verification without revealing all data
- Scalability: One root can represent thousands of logs
"""

import uuid
import json
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
    log_hash = models.CharField(max_length=64, blank=True)

    class Meta:
        ordering = ['timestamp']
        verbose_name = "Audit Log"
        verbose_name_plural = "Audit Logs"
        indexes = [
            models.Index(fields=['session', 'module']),
            models.Index(fields=['timestamp']),
        ]

    def __str__(self):
        return f"{self.module} - {self.action} by {self.user.username} at {self.timestamp}"

    def save(self, *args, **kwargs):
        """Generate hash before saving"""
        if not self.log_hash:
            from common.blockchain_utils import BlockchainService
            blockchain = BlockchainService()
            log_data = f"{self.timestamp.isoformat()}|{self.action}|{self.user.user_id}|{self.module}|{json.dumps(self.details, sort_keys=True)}"
            self.log_hash = blockchain.hash_log_entry(log_data)
        super().save(*args, **kwargs)


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
        return timezone.datetime.fromtimestamp(self.block_timestamp, tz=timezone.utc)