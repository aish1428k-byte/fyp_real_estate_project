from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
from django.contrib.auth.hashers import make_password, check_password
import uuid
import random
from datetime import timedelta


class User(AbstractUser):
    # Primary key as UUID
    user_id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False,
        unique=True
    )

    # username & email
    username = models.CharField(max_length=150, unique=True)
    email = models.EmailField(unique=True)

    # optional phone
    phone = models.CharField(max_length=20, blank=True, null=True)

    # user type
    user_type = models.CharField(
        max_length=20,
        choices=[
            ('buyer', 'Buyer'),
            ('seller', 'Seller'),
            ('agent', 'Agent'),
            ('admin', 'Admin')

        ],
        default='buyer'
    )

    # email verification
    email_verified = models.BooleanField(default=False)

    # timestamp
    created_at = models.DateTimeField(auto_now_add=True)

    # helper property for full name
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()

    # string representation
    def __str__(self):
        # fallback to username if no full name
        return self.full_name if self.full_name else self.username


class EmailOTP(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    otp_code = models.CharField(max_length=128)  # hashed
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    attempts = models.IntegerField(default=0)

    def save(self, *args, **kwargs):
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(minutes=5)
        if not self.pk:  # Only hash on creation
            self.otp_code = make_password(self.otp_code)
        super().save(*args, **kwargs)

    @staticmethod
    def generate_otp():
        return str(random.randint(100000, 999999))  # 6-digit numeric

    def check_otp(self, otp):
        return check_password(otp, self.otp_code)

    def is_expired(self):
        return timezone.now() > self.expires_at

    def increment_attempts(self):
        self.attempts += 1
        self.save()

    def mark_used(self):
        self.is_used = True
        self.save()
