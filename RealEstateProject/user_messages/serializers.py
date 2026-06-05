from rest_framework import serializers
from django.utils import timezone
from .models import UserMessage



class UserMessageCreateSerializer(serializers.ModelSerializer):

    class Meta:
        model = UserMessage
        fields = ['id', 'property', 'message']

    def create(self, validated_data):
        user = self.context['request'].user
        return UserMessage.objects.create(
            user=user,
            property=validated_data['property'],
            message=validated_data['message']
        )


class ManagerReplySerializer(serializers.ModelSerializer):

    class Meta:
        model = UserMessage
        fields = ['id', 'reply']

    def update(self, instance, validated_data):
        instance.reply = validated_data['reply']
        instance.status = 'replied'
        instance.replied_at = timezone.now()
        instance.save()
        return instance

class UserMessageListSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField()
    user_id = serializers.SerializerMethodField()
    property_title = serializers.CharField(source='property.title', read_only=True)
    owner_name = serializers.CharField(source='property.owner.username', read_only=True)
    owner_id = serializers.SerializerMethodField()

    class Meta:
        model = UserMessage
        fields = [
            'id',
            'user',
            'user_id',
            'message',
            'status',
            'created_at',
            'property',
            'property_title',
            'owner_name',
            'owner_id',
            'reply',
            'replied_at',
        ]

    def get_user_id(self, obj):
        return obj.user.user_id if obj.user else None

    def get_owner_id(self, obj):
        return obj.property.owner_id if obj.property and obj.property.owner_id else None
class UserMessageSummarySerializer(serializers.ModelSerializer):

    user = serializers.StringRelatedField()

    property_title = serializers.CharField(
        source='property.title',
        read_only=True
    )

    property_address = serializers.CharField(
        source='property.address',
        read_only=True
    )

    owner_name = serializers.CharField(
        source='property.owner.username',
        read_only=True
    )

    short_message = serializers.SerializerMethodField()

    class Meta:
        model = UserMessage
        fields = [
            'id',
            'user',
            'property_title',
            'property_address',
            'owner_name',
            'short_message',
            'status',
            'created_at',
        ]

    def get_short_message(self, obj):
        words = obj.message.split()
        return " ".join(words[:20]) + ("..." if len(words) > 20 else "")
