from django.db import models



from django.contrib.auth import get_user_model

from property.models import Property

User = get_user_model()

class BankAccount(models.Model):


    user = models.OneToOneField(
    User,
    on_delete=models.CASCADE)

    account_number = models.CharField(max_length=50)

    balance = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0
    )

    is_active = models.BooleanField(default=True)


class Escrow(models.Model):

    property = models.OneToOneField(
        Property,
        on_delete=models.CASCADE
    )

    buyer = models.ForeignKey(
        User,
        related_name='buyer_escrows',
        on_delete=models.CASCADE
    )

    seller = models.ForeignKey(
        User,
        related_name='seller_escrows',
        on_delete=models.CASCADE
    )

    property_price = models.DecimalField(
        max_digits=15,
        decimal_places=2
    )

    total_received = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0
    )

    total_released = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0
    )

    commission_amount = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0
    )
    commission_required = models.DecimalField(
    max_digits=15,
    decimal_places=2,
    default=0
    )

    total_payable = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0
    )
    

    commission_completed = models.BooleanField(
        default=False
    )

    status = models.CharField(
        max_length=30,
        default='active'
    )

class InstallmentPlan(models.Model):

    escrow = models.ForeignKey(
        Escrow,
        on_delete=models.CASCADE
    )

    total_amount = models.DecimalField(
        max_digits=15,
        decimal_places=2
    )

    total_installments = models.IntegerField()

    installment_amount = models.DecimalField(
        max_digits=15,
        decimal_places=2
    )

class PaymentTransaction(models.Model):

    escrow = models.ForeignKey(
        Escrow,
        on_delete=models.CASCADE
    )

    buyer = models.ForeignKey(
        User,
        related_name='payments_made',
        on_delete=models.CASCADE
    )

    buyer_account = models.ForeignKey(
    BankAccount,
    on_delete=models.PROTECT,
    null=True,
    blank=True
    )

    amount = models.DecimalField(
        max_digits=15,
        decimal_places=2
    )

    installment_no = models.IntegerField()

    transaction_type = models.CharField(
        max_length=30
    )

    status = models.CharField(
        max_length=30
    )

    blockchain_tx_hash = models.CharField(
        max_length=255,
        blank=True,
        null=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

class ReleaseRequest(models.Model):

    escrow = models.ForeignKey(
        Escrow,
        on_delete=models.CASCADE
    )

    seller = models.ForeignKey(
        User,
        on_delete=models.CASCADE
    )

    bank_account = models.ForeignKey(
        BankAccount,
        on_delete=models.PROTECT,
         null=True,
        blank=True
    )

    requested_amount = models.DecimalField(
        max_digits=15,
        decimal_places=2
    )

    status = models.CharField(
        max_length=20,
        default="pending"
    )


class PlatformWallet(models.Model):

    total_commission = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=0
    )