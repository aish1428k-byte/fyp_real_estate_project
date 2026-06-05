from django.db import models
from django.conf import settings
from property.models import Property   # apni property app ka model


class UserMessage(models.Model):

    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('replied', 'Replied'),
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='messages'
    )

    property = models.ForeignKey(
        Property,
        on_delete=models.CASCADE,
        related_name='messages'
    )

    message = models.TextField()

    reply = models.TextField(blank=True, null=True)

    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default='pending'
    )

    created_at = models.DateTimeField(auto_now_add=True)
    replied_at = models.DateTimeField(blank=True, null=True)

    def __str__(self):
        return f"{self.user} - {self.property.title}"
