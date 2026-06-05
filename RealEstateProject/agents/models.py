from django.db import models

from django.conf import settings

User = settings.AUTH_USER_MODEL

class Agent(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="agent_profile"
    )

    employee_code = models.CharField(
        max_length=50,
        unique=True
    )

    designation = models.CharField(
        max_length=100
    )

    joining_date = models.DateField()

    status = models.BooleanField(default=True)  # active / inactive
    profile_image = models.ImageField(
        upload_to='agent_profiles/',  # folder where images will be stored
        blank=True,                   # optional in forms
        null=True                     # optional in database
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Agent: {self.user.username}"