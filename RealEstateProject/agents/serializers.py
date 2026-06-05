from rest_framework import serializers
from .models import Agent
# from property.models import PropertyDocument

from users.serializers import (
    UserCreateSerializer,
    UserViewSerializer,
    UserViewSummarySerializer,
    UserUpdateSerializer
)

class AgentSerializer(serializers.ModelSerializer):
    user = UserCreateSerializer()   # nested user

    class Meta:
        model = Agent
        fields = [
            "user",
            "employee_code",
            "designation",
            "joining_date",
            "status",
            "profile_image"
        ]

    def create(self, validated_data):
        user_data = validated_data.pop("user")

        # create user using users app serializer
        user = UserCreateSerializer().create(user_data)

        # create agent profile
        agent = Agent.objects.create(
            user=user,
            **validated_data
        )
        return agent


class AgentViewSerializer(serializers.ModelSerializer):
    user = UserViewSerializer(read_only=True)

    class Meta:
        model = Agent
        fields = [
            "id",
            "user",
            "employee_code",
            "designation",
            "joining_date",
            "status",
            "profile_image"
        ]



class AgentSelectSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = Agent
        fields = ['id', 'name']


class AgentViewStatusSerializer(serializers.ModelSerializer):
    user = UserViewSummarySerializer(read_only=True)

    class Meta:
        model = Agent
        fields = [
            "id",
            "user",
            "designation",
            "status"
        ]



class AgentUpdateSerializer(serializers.ModelSerializer):
    user = UserUpdateSerializer(required=False)

    class Meta:
        model = Agent
        fields = [
            "user",
            "employee_code",
            "designation",
            "joining_date",
            "status"
        ]

    def update(self, instance, validated_data):
        user_data = validated_data.pop("user", None)

        # 1️⃣ update agent fields using DRF default
        instance = super().update(instance, validated_data)

        # 2️⃣ update related user if provided
        if user_data:
            user_serializer = UserUpdateSerializer(
                instance.user,
                data=user_data,
                partial=True
            )
            user_serializer.is_valid(raise_exception=True)
            user_serializer.save()

        return instance


class DocumentUploadSerializer(serializers.Serializer):
    document = serializers.FileField()
    property_id = serializers.IntegerField(required=False, allow_null=True)
