from django.db import models

from django.contrib.auth import get_user_model

from property.models import Property
from finance.models import Escrow

User = get_user_model()

class OwnershipTransfer(models.Model):

    property = models.OneToOneField(
        Property,
        on_delete=models.CASCADE
    )

    previous_owner = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="previous_owned_properties",
         null=True,
        blank=True
    )

    new_owner = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="new_owned_properties",
         null=True,
        blank=True
    )

    escrow = models.ForeignKey(
        Escrow,
        on_delete=models.CASCADE
    )

    status = models.CharField(
        max_length=30,
        default="completed"
    )

    blockchain_tx_hash = models.CharField(
        max_length=255,
        blank=True,
        null=True
    )

    transferred_at = models.DateTimeField(
        auto_now_add=True
    )


class BlockchainPropertyTransaction(models.Model):
    property = models.OneToOneField(
        Property,
        on_delete=models.CASCADE
    )

    previous_owner = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name="previous_owner_transactions"
    )

    new_owner = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name="new_owner_transactions"
    )

    total_paid = models.IntegerField()

    commission = models.IntegerField()

    blockchain_tx_hash = models.CharField(
        max_length=255
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )
