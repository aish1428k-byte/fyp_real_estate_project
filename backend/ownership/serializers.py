from rest_framework import serializers
from .models import (
    OwnershipTransfer,
    BlockchainPropertyTransaction
)


class OwnershipTransferSerializer(serializers.ModelSerializer):

    previous_owner_name = serializers.CharField(
        source="previous_owner.username",
        read_only=True
    )

    new_owner_name = serializers.CharField(
        source="new_owner.username",
        read_only=True
    )

    property_title = serializers.CharField(
        source="property.title",
        read_only=True
    )

    class Meta:
        model = OwnershipTransfer
        fields = "__all__"

class BlockchainPropertyTransactionSerializer(
    serializers.ModelSerializer
):

    previous_owner_name = serializers.CharField(
        source="previous_owner.username",
        read_only=True
    )

    new_owner_name = serializers.CharField(
        source="new_owner.username",
        read_only=True
    )

    previous_owner_email = serializers.EmailField(
        source="previous_owner.email",
        read_only=True
    )

    new_owner_email = serializers.EmailField(
        source="new_owner.email",
        read_only=True
    )

    previous_owner_phone = serializers.CharField(
        source="previous_owner.phone",
        read_only=True
    )

    new_owner_phone = serializers.CharField(
        source="new_owner.phone",
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

    property_price = serializers.DecimalField(
        source="property.price",
        max_digits=12,
        decimal_places=2,
        read_only=True
    )

    property_city = serializers.CharField(
        source="property.city",
        read_only=True
    )

    property_address = serializers.CharField(
        source="property.full_address",
        read_only=True
    )

    property_image = serializers.ImageField(
        source="property.main_image",
        read_only=True
    )

    class Meta:
        model = BlockchainPropertyTransaction
        fields = "__all__"
