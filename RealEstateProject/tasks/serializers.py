from rest_framework import serializers
from .models import Task 
from django.utils import timezone
from property.serializers import PropertySerializer,PropertySummarySerializer,OwnerSummarySerializer
from agents.models import Agent
from property.models import Property
from users.models import User
from agents.serializers import AgentViewStatusSerializer


from users.serializers import UserViewSerializer,UserViewSummarySerializer
from meetings.serializers import MeetingSummarySerializer
class TaskCreateSerializer(serializers.ModelSerializer):
    description = serializers.CharField(source='details', allow_blank=True, required=False)

    agent = serializers.PrimaryKeyRelatedField(queryset=Agent.objects.all())
    property = serializers.PrimaryKeyRelatedField(queryset=Property.objects.all())
    owner = serializers.SlugRelatedField(slug_field='user_id', queryset=User.objects.all())
    buyer = serializers.SlugRelatedField(slug_field='user_id', queryset=User.objects.all())

    class Meta:
        model = Task
        fields = [
            'task_number',
            'title',
            'description',
            'agent',
            'property',
            'owner',
            'buyer',
            'status',
        ]

    def create(self, validated_data):
        task = Task.objects.create(**validated_data)

        # 🔥 GUARANTEED SYNC
        property_obj = task.property
        property_obj.assigned_agent = task.agent.user
        property_obj.save()

        return task


class TaskSerializer(serializers.ModelSerializer):
    # map frontend description -> backend 'details'
    description = serializers.CharField(source='details', allow_blank=True, required=False)

    # foreign keys
    agent = serializers.PrimaryKeyRelatedField(queryset=Agent.objects.all())
    property = serializers.PrimaryKeyRelatedField(queryset=Property.objects.all())
    owner = serializers.SlugRelatedField(slug_field='id', queryset=User.objects.all())  # UUID
    buyer = serializers.SlugRelatedField(slug_field='id', queryset=User.objects.all())  # UUID

    class Meta:
        model = Task
        fields = [
            'id',
            'task_number',
            'title',
            'description',
            'agent',
            'property',
            'owner',
            'buyer',
            'status',
            'created_at',
            'updated_at'
        ]

class AgentTaskSerializer(serializers.ModelSerializer):
    agent_name = serializers.CharField(
        source='agent.user.full_name',
        read_only=True
    )

    class Meta:
        model = Task
        fields = [
            'id',
            'title',
            'details',
            'status',
            'agent',
            'agent_name',
            'created_at'
        ]



class TaskUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = '__all__'


class TaskListSerializer(serializers.ModelSerializer):
    property_title = serializers.CharField(source='property.title', read_only=True, default='')
    owner_name = serializers.CharField(source='owner.full_name', read_only=True, default='')
    buyer_name = serializers.CharField(source='buyer.full_name', read_only=True, default='')

    class Meta:
        model = Task
        fields = [
            'id',
            'task_number',
            'property_title',
            'owner_name',
            'buyer_name',
            'status'
        ]



class ListAgentTasksSerializer(serializers.ModelSerializer):
    property_title = serializers.CharField(source='property.title', read_only=True, default='')
    owner_name = serializers.CharField(source='owner.full_name', read_only=True, default='')
    buyer_name = serializers.CharField(source='buyer.full_name', read_only=True, default='')

    class Meta:
        model = Task
        fields = [
            'id',
            'task_number',
            'property_title',
            'owner_name',
            'buyer_name',
            'status'
        ]





class TaskDetailSerializer(serializers.ModelSerializer):
    property = PropertySummarySerializer(read_only=True)
    buyer = UserViewSummarySerializer(read_only=True)
    seller = UserViewSummarySerializer(read_only=True)
    meetings = MeetingSummarySerializer(many=True, read_only=True)
    owner = OwnerSummarySerializer(read_only=True)
    agent = AgentViewStatusSerializer(read_only=True)

    class Meta:
        model = Task
        fields = '__all__'



