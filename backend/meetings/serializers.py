from rest_framework import serializers
from .models import Meeting
from tasks.models import Task
from django.utils import timezone
from rest_framework import serializers
from .models import Meeting
from tasks.models import Task
from users.models import User   # <-- Add this line
from django.utils import timezone

class MeetingSerializer(serializers.ModelSerializer):
    canceled_by = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        required=False,
        allow_null=True
    )

    class Meta:
        model = Meeting
        fields = '__all__'

    def validate(self, data):
        status = data.get('status')
        canceled_by = data.get('canceled_by')
        canceled_at = data.get('canceled_at')
        cancellation_reason = data.get('cancellation_reason')

        if status == 'cancelled':
            if not canceled_by:
                raise serializers.ValidationError({
                    'canceled_by': 'This field is required when meeting is cancelled.'
                })
            if not cancellation_reason:
                raise serializers.ValidationError({
                    'cancellation_reason': 'This field is required when meeting is cancelled.'
                })
            if not canceled_at:
                data['canceled_at'] = timezone.now()  # auto set
        else:
            data['canceled_by'] = None
            data['cancellation_reason'] = None
            data['canceled_at'] = None

        return data

    def create(self, validated_data):
        meeting = super().create(validated_data)
        task = meeting.task
        task.status = meeting.status
        task.save()
        return meeting

    def update(self, instance, validated_data):
        meeting = super().update(instance, validated_data)
        task = meeting.task
        last_meeting = task.meetings.order_by('-meeting_date').first()
        task.status = last_meeting.status
        task.save()
        return meeting

class MeetingSummarySerializer(serializers.ModelSerializer):
    short_details = serializers.SerializerMethodField()

    class Meta:
        model = Meeting
        fields = [
            'id',
            'status',
            'short_details'
        ]

    def get_short_details(self, obj):
        if obj.details:
            return ' '.join(obj.details.split()[:20])
        return ''


class MeetingDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model= Meeting
        fields = '__all__'