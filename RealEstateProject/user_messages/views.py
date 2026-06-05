from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from .models import UserMessage
from .serializers import (
    UserMessageCreateSerializer,
    UserMessageListSerializer,
    ManagerReplySerializer,
    UserMessageSummarySerializer
)

from common.permissions import IsManager   # tumhari custom permission



class UserSendMessageAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = UserMessageCreateSerializer(
            data=request.data,
            context={'request': request}
        )

        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "Message sent successfully"},
                status=status.HTTP_201_CREATED
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



class UserMyMessagesAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        messages = UserMessage.objects.filter(user=request.user)
        serializer = UserMessageListSerializer(messages, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ManagerAllMessagesAPIView(APIView):
    permission_classes = [IsManager]

    def get(self, request):
        #messages = UserMessage.objects.select_related('property', 'property__owner').order_by('-created_at')
        messages = UserMessage.objects.select_related('property','property__owner','user' ).order_by('-created_at')
        serializer = UserMessageListSerializer(messages, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)



class ManagerReplyAPIView(APIView):
    permission_classes = [IsManager]

    def put(self, request, pk):
        try:
            message = UserMessage.objects.get(pk=pk)
        except UserMessage.DoesNotExist:
            return Response(
                {"error": "Message not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = ManagerReplySerializer(
            message,
            data=request.data,
            partial=True
        )

        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "Reply sent successfully"},
                status=status.HTTP_200_OK
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ManagerMessageSummaryAPIView(APIView):
    permission_classes = [IsManager]

    def get(self, request):
        messages = UserMessage.objects.select_related(
            'property',
            'property__owner',
            'user'
        ).order_by('-created_at')

        serializer = UserMessageSummarySerializer(messages, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
