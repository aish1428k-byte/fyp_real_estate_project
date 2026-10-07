# chat/serializers.py
from rest_framework import serializers
from .models import ChatRoom, ChatMessage


class ChatRoomSerializer(serializers.ModelSerializer):
    buyer_name = serializers.SerializerMethodField()
    manager_name = serializers.SerializerMethodField()
    property_title = serializers.SerializerMethodField()

    class Meta:
        model = ChatRoom
        fields = [
            'id',
            'buyer_name',
            'manager_name',
            'property_title'
        ]

    def get_buyer_name(self, obj):
        return obj.buyer.get_full_name() or obj.buyer.username

    def get_manager_name(self, obj):
        return obj.manager.get_full_name() or obj.manager.username

    def get_property_title(self, obj):
        return obj.property.title



class ChatMessageSerializer(serializers.ModelSerializer):
    sender_username = serializers.CharField(source='sender.username', read_only=True)

    class Meta:
        model = ChatMessage
        fields = ['id', 'sender', 'sender_username', 'message', 'timestamp']
