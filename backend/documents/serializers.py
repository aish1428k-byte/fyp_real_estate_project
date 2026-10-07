# # documents/serializers.py
# from rest_framework import serializers
# from .models import PropertyDocument

# class PropertyDocumentSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = PropertyDocument
#         fields = "__all__"
#         read_only_fields = ["ipfs_hash", "status"]
# ______________________________________ module 2 ended

# documents/serializers.py

from rest_framework import serializers

from .models import PropertyDocument


class PropertyDocumentSerializer(serializers.ModelSerializer):
    """Full read serializer — used for list/retrieve responses."""

    uploaded_by_username = serializers.CharField(
        source="uploaded_by.username", read_only=True
    )
    property_name = serializers.CharField(
        source="property.name", read_only=True
    )
    document_type_display = serializers.CharField(
        source="get_document_type_display", read_only=True
    )
    status_display = serializers.CharField(
        source="get_status_display", read_only=True
    )

    class Meta:
        model  = PropertyDocument
        fields = [
            "id",
            "property",
            "property_name",
            "uploaded_by",
            "uploaded_by_username",
            "document_type",
            "document_type_display",
            "ipfs_hash",
            "ipfs_gateway_url",
            "tx_hash",
            "on_chain_document_id",
            "block_number",
            "ocr_result",
            "rejection_reason",
            "status",
            "status_display",
            "uploaded_at",
            "updated_at",
        ]
        read_only_fields = fields  # all fields are read-only from client


class DocumentUploadResponseSerializer(serializers.Serializer):
    """Shape of the POST /documents/upload/ success response."""

    message              = serializers.CharField()
    status               = serializers.ChoiceField(choices=["verified", "rejected", "pending"])
    document_id          = serializers.IntegerField()
    document_type        = serializers.CharField()
    ipfs_hash            = serializers.CharField(allow_blank=True)
    ipfs_gateway_url     = serializers.CharField(allow_blank=True)
    tx_hash              = serializers.CharField(allow_blank=True)
    on_chain_document_id = serializers.IntegerField(allow_null=True)
    rejection_reason     = serializers.CharField(allow_blank=True)
    ocr_result           = serializers.DictField()
