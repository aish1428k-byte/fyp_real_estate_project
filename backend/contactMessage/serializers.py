from rest_framework import serializers
from .models import Inquiry
from django.contrib.auth import get_user_model



class InquiryCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Inquiry
        fields = ['message']

class InquiryListSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = Inquiry
        fields = [
            'id',
            'user_name',
            'user_email',
            'message',
            'reply',
            'created_at',
            'replied_at'
        ]


class InquiryReplySerializer(serializers.Serializer):
    reply = serializers.CharField()



