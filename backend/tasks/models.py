from django.db import models
from users.models import User
from agents.models import Agent
from property.models import Property
from django.utils import timezone

class Task(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    )

    # 🔹 Auto generated task number
    task_number = models.CharField(
        max_length=30,
        unique=True,
        editable=False
    )

    # 🔹 NEW field
    title = models.CharField(max_length=255)

    agent = models.ForeignKey(
        Agent,
        on_delete=models.CASCADE,
        related_name='tasks'
    )

    property = models.ForeignKey(
        Property,
        on_delete=models.CASCADE,
        related_name='tasks'
    )

    owner = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='owner_tasks'
    )

    buyer = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='buyer_tasks'
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )

    details = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


    #  AUTO TASK NUMBER LOGIC
    def save(self, *args, **kwargs):
        is_new = self.pk is None

        if not self.task_number:
            year = timezone.now().year
            last_task = Task.objects.filter(
                task_number__startswith=f"TASK-{year}"
            ).order_by('-id').first()

            if last_task:
                last_number = int(last_task.task_number.split('-')[-1])
                new_number = last_number + 1
            else:
                new_number = 1

            self.task_number = f"TASK-{year}-{str(new_number).zfill(4)}"

        super().save(*args, **kwargs)

        #  MAIN FIX: sync agent to property
        if is_new:
            self.property.assigned_agent = self.agent.user
            self.property.save()

    def __str__(self):
            return f"{self.task_number} - {self.title}"
