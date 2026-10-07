from rest_framework import serializers
from .models import Property
from users.models import User
from agents.models import Agent

class PropertySerializer(serializers.ModelSerializer):
    latitude = serializers.FloatField(required=False, allow_null=True)
    longitude = serializers.FloatField(required=False, allow_null=True)
    main_image = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = Property
        fields = [
            "id",
            "title",
            "city",
            "area",
            "phase",
            "street",
            "house_number",
            "full_address",
            "price",
            "type",
            "bedrooms",
            "bathrooms",
            "area_size",
            "status",
            "description",
            "latitude",
            "longitude",
            "main_image",
        ]

    def get_images(self, obj):
        images = []
        if obj.main_image:
            images.append(obj.main_image.url)
        if obj.gallery_images:
            images.extend(obj.gallery_images)
        return images


class PropertyListSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source='pk')
    main_image = serializers.ImageField(use_url=True)

    class Meta:
        model = Property
        fields = ['id','title', 'location', 'type', 'price', 'bedrooms', 'status','main_image']



class PropertyListSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source='pk', read_only=True)
    main_image = serializers.ImageField(use_url=True, required=False)
    lease_status = serializers.SerializerMethodField()


    class Meta:
        model = Property
        fields = [
            'id',
            'title',
            'full_address',
            'type',
            'price',
            'bedrooms',
            'status',
            'main_image',
            "lease_status"

        ]


    def get_lease_status(self, obj):

        try:
            return obj.lease.document.status

        except:
            return "No Lease"

class PropertySummarySerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source='pk', read_only=True)
    name = serializers.CharField(source='title', read_only=True)
    propertyType = serializers.CharField(source='type', read_only=True)

    class Meta:
        model = Property
        fields = ['id', 'name', 'propertyType', 'price', 'status']


class OwnerSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['user_id', 'username', 'full_name', 'email']

class AssignedAgentSerializer(serializers.ModelSerializer):
    profile_image = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "user_id",
            "first_name",
            "last_name",
            "email",
            "phone",
            "profile_image",
        ]

    def get_profile_image(self, obj):
        if hasattr(obj, "agent_profile") and obj.agent_profile.profile_image:
            request = self.context.get("request")
            image_url = obj.agent_profile.profile_image.url
            return request.build_absolute_uri(image_url) if request else image_url
        return None
