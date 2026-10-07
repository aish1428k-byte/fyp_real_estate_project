from rest_framework import serializers
from .models import ManagerProfile

from users.serializers import (
    UserCreateSerializer,
    UserViewSerializer,
    UserUpdateSerializer
)
class ManagerSerializer(serializers.ModelSerializer):
    user = UserCreateSerializer()   # nested user

    class Meta:
        model = ManagerProfile
        fields = [
            "user",
            "department",
            "office_location",
            "is_verified",
        ]

    def create(self, validated_data):
        user_data = validated_data.pop("user")

        # create user (from users app serializer)
        user = UserCreateSerializer().create(user_data)

        # create manager profile
        manager = ManagerProfile.objects.create(
            user=user,
            **validated_data
        )
        return manager


class ManagerViewSerializer(serializers.ModelSerializer):
    user = UserViewSerializer(read_only=True)

    class Meta:
        model = ManagerProfile
        fields = [
            "id",
            "user",
            "department",
            "office_location",
            "is_verified",
            "created_at"
        ]


class ManagerUpdateSerializer(serializers.ModelSerializer):
    user = UserUpdateSerializer(required=False)

    class Meta:
        model = ManagerProfile
        fields = [
            "user",
            "department",
            "office_location",
            "is_verified"
        ]

    def update(self, instance, validated_data):
        user_data = validated_data.pop("user", None)

        # manager fields update (DRF default)
        instance = super().update(instance, validated_data)

        # linked user update
        if user_data:
            serializer = UserUpdateSerializer(
                instance.user,
                data=user_data,
                partial=True
            )
            serializer.is_valid(raise_exception=True)
            serializer.save()

        return instance
