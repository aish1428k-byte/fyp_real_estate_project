# chat/views.py
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.conf import settings

from .models import ChatRoom
from .serializers import ChatRoomSerializer
from users.models import User
from property.models import Property



# for 2nd class
from .models import ChatMessage
from .serializers import ChatMessageSerializer


class ChatRoomCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        buyer = request.user
        property_id = request.data.get('property_id')

        manager = User.objects.get(id=settings.PROPERTY_MANAGER_ID)
        property_obj = Property.objects.get(id=property_id)

        chatroom, created = ChatRoom.objects.get_or_create(
            buyer=buyer,
            manager=manager,
            property=property_obj
        )

        serializer = ChatRoomSerializer(chatroom)

        return Response({
            "created": created,
            "chatroom": serializer.data
        })


class SendMessageView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        room_id = request.data.get('room_id')
        message_text = request.data.get('message')

        chatroom = ChatRoom.objects.get(id=room_id)

        # Security check
        if request.user not in [chatroom.buyer, chatroom.manager]:
            return Response({"error": "Not allowed"}, status=403)

        message = ChatMessage.objects.create(
            room=chatroom,
            sender=request.user,
            message=message_text
        )

        serializer = ChatMessageSerializer(message)
        return Response(serializer.data)


class ChatMessageListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, room_id):
        chatroom = ChatRoom.objects.get(id=room_id)

        if request.user not in [chatroom.buyer, chatroom.manager]:
            return Response({"error": "Not allowed"}, status=403)

        messages = chatroom.messages.all().order_by('timestamp')
        serializer = ChatMessageSerializer(messages, many=True)

        return Response(serializer.data)

