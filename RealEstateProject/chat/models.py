from django.db import models

# Create your models here.

from django.db import models
from users.models import User
from property.models import Property
from django.utils import timezone


class ChatRoom(models.Model):
    property = models.ForeignKey(Property, on_delete=models.CASCADE)
    manager = models.ForeignKey(User, related_name='managed_chatrooms', on_delete=models.CASCADE)
    buyer = models.ForeignKey(User, related_name='bought_chatrooms', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Chat Room {self.id} for {self.property.title}"


class ChatMessage(models.Model):
    room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(User, on_delete=models.CASCADE)
    message = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Chat Message {self.id} for {self.property.title}"
