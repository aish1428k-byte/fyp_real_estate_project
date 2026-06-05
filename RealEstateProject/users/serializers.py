from rest_framework import serializers
from .models import User, EmailOTP
import re
from django.contrib.auth.hashers import make_password


class UserCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'user_id',
            'username',
            'first_name',
            'last_name',
            'email',
            'password',
            'phone',
            'user_type'
        ]
        extra_kwargs = {'password': {'write_only': True}}

    def validate_email(self, value):
        if not re.match(r"[^@]+@[^@]+\.[^@]+", value):
            raise serializers.ValidationError("Enter a valid email address.")
        return value

    def validate_phone(self, value):
        if value and not re.match(r'^[\d+\-\s]+$', value):
            raise serializers.ValidationError("Enter a valid phone number.")
        return value

    def create(self, validated_data):
        password = validated_data.pop('password')
        validated_data['email_verified'] = False
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user



class UserViewSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'user_id',
            'username',
            'first_name',
            'last_name',
            'email',
            'phone',
            'user_type',
            'created_at'
        ]


class UserViewSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'username',
            'email',
            'phone',
        ]



class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'username',
            'first_name',
            'last_name',
            'email',
            'phone',
            'password',
            
        ]
        extra_kwargs = {
            'password': {'write_only': True, 'required': False},
            'username': {'required': False},
            'email': {'required': False},
        }

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if password:
            instance.password = password  # hashing baad main

        instance.save()
        return instance


class OTPVerifySerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(max_length=6)


class OTPResendSerializer(serializers.Serializer):
    email = serializers.EmailField()





