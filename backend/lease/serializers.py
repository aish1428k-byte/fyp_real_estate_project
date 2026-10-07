from rest_framework import serializers


class LeaseUploadSerializer(serializers.Serializer):

    property_id = serializers.IntegerField()

    located_at = serializers.CharField()

    landlord = serializers.CharField()

    tenant = serializers.CharField()

    beginning_on = serializers.DateField()

    ending_on = serializers.DateField()

    lease_amount = serializers.DecimalField(
        max_digits=12,
        decimal_places=2
    )

    file = serializers.FileField()


from rest_framework import serializers
from .models import Lease

from datetime import date

class LeaseListSerializer(serializers.ModelSerializer):
    
    property_title = serializers.CharField(
        source='property.title',
        read_only=True
    )

    property_city = serializers.CharField(
        source='property.city',
        read_only=True
    )

    property_price = serializers.DecimalField(
        source='property.price',
        max_digits=12,
        decimal_places=2,
        read_only=True
    )

    owner_name = serializers.SerializerMethodField()
    owner_email = serializers.CharField(
        source='property.owner.email',
        read_only=True
    )
    owner_phone = serializers.CharField(
        source='property.owner.phone',
        read_only=True
    )

    owner_id = serializers.CharField(
        source='property.owner.user_id',
        read_only=True
    )

    document_id = serializers.IntegerField(
        source='document.id',
        read_only=True
    )
    status = serializers.SerializerMethodField()
    document_url = serializers.CharField(
    source='document.ipfs_gateway_url',
    read_only=True
    )

    class Meta:
        model = Lease
        fields = [
        'id',
        'located_at',
        'landlord',
        'tenant',
        'beginning_on',
        'ending_on',
        'lease_amount',

        'property_title',
        'property_city',
        'property_price',

        'owner_name',
        'owner_email',
        'owner_phone',
        'owner_id',

        'document_id',
        'document_url',
        'status'
        ]
    def get_status(self, obj):
        if obj.ending_on < date.today():
            return "Expired"
        return "Active"

    def get_owner_name(self, obj):
        owner = obj.property.owner
        if owner.full_name:
            return owner.full_name
        return owner.username