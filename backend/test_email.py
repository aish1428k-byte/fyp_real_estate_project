import os
import django
from django.conf import settings

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.core.mail import send_mail

def test_email():
    try:
        send_mail(
            'Test OTP Email',
            'This is a test OTP: 123456',
            settings.DEFAULT_FROM_EMAIL,
            ['aish1428k@gmail.com'],  # Send to yourself for testing
            fail_silently=False
        )
        print("Email sent successfully!")
    except Exception as e:
        print(f"Email failed: {e}")

if __name__ == "__main__":
    test_email()
