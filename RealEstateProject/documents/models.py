# documents/models.py
from django.db import models
from property.models import Property
from users.models import User



# class PropertyDocument(models.Model):
#     property = models.ForeignKey(Property, on_delete=models.CASCADE)
#     uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE)

#     document_type = models.CharField(max_length=50)
#     file = models.FileField(upload_to="temp_docs/")  # optional
#     ipfs_hash = models.CharField(max_length=255)

#     status = models.CharField(
#         max_length=20,
#         choices=[
#             ("pending", "Pending"),
#             ("verified", "Verified"),
#             ("rejected", "Rejected")
#         ],
#         default="pending"
#     )

#     remarks = models.TextField(blank=True, null=True)
#     uploaded_at = models.DateTimeField(auto_now_add=True)

# #_________________________ module 2
# class PropertyDocument(models.Model):
#     property = models.ForeignKey(Property, on_delete=models.CASCADE)
#     uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE)

#     document_type = models.CharField(max_length=50)
#     ipfs_hash = models.CharField(max_length=255)
#     ocr_result = models.JSONField(default=dict)

#     status = models.CharField(
#         max_length=20,
#         choices=[
#             ("pending", "Pending"),
#             ("verified", "Verified"),
#             ("rejected", "Rejected")
#         ],
#         default="pending"
#     )

#     uploaded_at = models.DateTimeField(auto_now_add=True)


# documents/models.py

from django.db import models
from django.contrib.auth import get_user_model

from property.models import Property

User = get_user_model()


class PropertyDocument(models.Model):

    DOCUMENT_TYPE_CHOICES = [
        ("cnic_front",      "CNIC Front"),
        ("cnic_back",       "CNIC Back"),
        ("lease_sale",      "Lease / Sale Deed"),
        ("kbc",             "KBC"),
        ("transfer_letter", "Transfer Letter"),
        ("site_plan",       "Site Plan"),
        ("demarcation",     "Demarcation Letter"),
        ("allotment",       "Allotment Letter"),
        ("possession",      "Possession Letter"),
    ]

    STATUS_CHOICES = [
        ("pending",  "Pending"),
        ("verified", "Verified"),
        ("rejected", "Rejected"),
    ]

    property     = models.ForeignKey(Property, on_delete=models.CASCADE, related_name="documents")
    uploaded_by  = models.ForeignKey(User,     on_delete=models.CASCADE, related_name="uploaded_documents")

    document_type = models.CharField(max_length=50, choices=DOCUMENT_TYPE_CHOICES)

    # IPFS
    ipfs_hash        = models.CharField(max_length=255, blank=True, default="")
    ipfs_gateway_url = models.URLField(max_length=512,  blank=True, default="")

    # Blockchain
    tx_hash              = models.CharField(max_length=255, blank=True, default="")
    on_chain_document_id = models.PositiveIntegerField(null=True, blank=True)
    block_number         = models.PositiveIntegerField(null=True, blank=True)

    # OCR & validation
    ocr_result       = models.JSONField(default=dict)
    rejection_reason = models.TextField(blank=True, default="")

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="pending",
    )

    uploaded_at = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-uploaded_at"]
        verbose_name        = "Property Document"
        verbose_name_plural = "Property Documents"

    def __str__(self) -> str:
        return (
            f"{self.get_document_type_display()} — "
            f"Property #{self.property_id} — {self.status}"
        )
