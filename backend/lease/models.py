from django.db import models
from django.contrib.auth import get_user_model

from property.models import Property
from documents.models import PropertyDocument


User = get_user_model()


class Lease(models.Model):

    property = models.OneToOneField(
        Property,
        on_delete=models.CASCADE,
        related_name="lease"
    )

    document = models.OneToOneField(
        PropertyDocument,
        on_delete=models.CASCADE,
        related_name="lease"
    )

    located_at = models.TextField()

    landlord = models.CharField(
        max_length=255
    )

    tenant = models.CharField(
        max_length=255
    )

    beginning_on = models.DateField()

    ending_on = models.DateField()

    lease_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2
    )

    created_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )