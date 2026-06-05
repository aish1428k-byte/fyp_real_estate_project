from django.db import models
from users.models import User

class Inquiry(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    manager = models.ForeignKey(User, on_delete=models.CASCADE, related_name="manager_messages")

    subject = models.CharField(max_length=200, blank=True)
    message = models.TextField()

    reply = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    replied_at = models.DateTimeField(blank=True, null=True)
