from rest_framework import serializers

from .models import (
    BankAccount,
    Escrow,
    InstallmentPlan,
    PaymentTransaction,
    ReleaseRequest,
    PlatformWallet
)


class BankAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = BankAccount
        fields = "__all__"




class EscrowSerializer(serializers.ModelSerializer):

    property_id = serializers.IntegerField(
    source="property.id",
    read_only=True
    )

    property_title = serializers.CharField(
        source="property.title",
        read_only=True
    )

    property_type = serializers.CharField(
        source="property.type",
        read_only=True
    )

    buyer_name = serializers.CharField(
        source="buyer.username",
        read_only=True
    )

    buyer_email = serializers.EmailField(
        source="buyer.email",
        read_only=True
    )

    seller_name = serializers.CharField(
        source="seller.username",
        read_only=True
    )

    seller_email = serializers.EmailField(
        source="seller.email",
        read_only=True
    )
    property_image = serializers.ImageField(
    source="property.main_image",
    read_only=True)


    full_address = serializers.ReadOnlyField(
    source="property.full_address",
    read_only=True)

    property_bedrooms = serializers.IntegerField(
    source="property.bedrooms",
    read_only=True
    )

    property_status = serializers.CharField(
        source="property.status",
        read_only=True
    )

    property_city = serializers.CharField(
        source="property.city",
        read_only=True
    )
    seller_name = serializers.CharField(
        source='seller.username',
        read_only=True
    )
    owner_name = serializers.CharField(
        source='property.owner.username',
        read_only=True
    )

    class Meta:
        model = Escrow
        fields = "__all__"

    total_installments = serializers.SerializerMethodField()

    def get_total_installments(self, obj):

        plan = InstallmentPlan.objects.filter(
            escrow=obj
        ).first()

        if plan:
            return plan.total_installments

        return 0


class InstallmentPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = InstallmentPlan
        fields = "__all__"


class PaymentTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentTransaction
        fields = "__all__"

# class ReleaseRequestSerializer(serializers.ModelSerializer):

#     account_number = serializers.CharField(write_only=True)

#     class Meta:
#         model = ReleaseRequest
#         fields = [
#             "id",
#             "escrow",
#             "requested_amount",
#             "account_number",
#             "status"
#         ]



class ReleaseRequestSerializer(serializers.ModelSerializer):

    account_number =serializers.CharField(
        source="bank_account.account_number",
        read_only=True
    )

    class Meta:

        model = ReleaseRequest

        fields = [
            "id",
            "requested_amount",
            "account_number",
            "status"
        ]


class PlatformWalletSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlatformWallet
        fields = "__all__"

