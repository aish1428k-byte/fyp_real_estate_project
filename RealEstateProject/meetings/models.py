from django.db import models
from tasks.models import Task
from users.models import User

class Meeting(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    )

    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='meetings')
    meeting_date = models.DateTimeField()
    details = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    canceled_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='canceled_meetings')
    canceled_at = models.DateTimeField(blank=True, null=True)
    cancellation_reason = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Meeting for Task {self.task.task_number} on {self.meeting_date}"
