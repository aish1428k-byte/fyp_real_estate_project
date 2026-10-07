from django.db import models
from users.models import User


class Property(models.Model):

    TYPE_CHOICES = [
        ('house', 'House'),
        ('plot', 'Plot'),
        ('commercial', 'Commercial'),
        ('apartment', 'Apartment'),
    ]

    STATUS_CHOICES = [
        ('available', 'Available'),
        ('sold', 'Sold'),
    ]

    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name="properties")

    assigned_agent = models.ForeignKey(
    User,
    on_delete=models.SET_NULL,
    null=True,
    blank=True,
    related_name="assigned_properties")


    title = models.CharField(max_length=200)

    type = models.CharField(max_length=50, choices=TYPE_CHOICES)

    price = models.DecimalField(max_digits=12, decimal_places=2)
    city = models.CharField(max_length=100)

    area = models.CharField(max_length=100, blank=True, null=True)          # DHA, Bahria, Gulshan
    phase = models.CharField(max_length=50, blank=True, null=True)
    street = models.CharField(max_length=50, blank=True, null=True)
    house_number = models.CharField(max_length=50, blank=True, null=True)

    # 🔹 Full address (Google Maps + display)
    full_address = models.TextField(
        help_text="Complete address e.g. House 12, Street 5, Phase 2, DHA, Lahore", blank=True, null=True
    )

    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)

    area_size = models.CharField(max_length=50)
    bedrooms = models.IntegerField(blank=True, null=True)
    bathrooms = models.IntegerField(blank=True, null=True)

    description = models.TextField()

    main_image = models.ImageField(upload_to='property_image/', null=True, blank=True)
    gallery_images = models.JSONField(null=True,default = list, blank=True)

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='available')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(null=True)

    def __str__(self):
        return self.title

