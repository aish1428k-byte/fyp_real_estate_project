# Django basic
from django.utils import timezone
from django.conf import settings
from django.core.mail import send_mail

# Django REST Framework
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

# Models
from .models import Inquiry
from django.contrib.auth import get_user_model

# Serializers
from .serializers import (
    InquiryCreateSerializer,
    InquiryListSerializer,
    InquiryReplySerializer
)

# Custom permissions
from .permissions import IsManager

# Create your views here.



class SendInquiryAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        manager = User.objects.get(role="manager")

        inquiry = Inquiry.objects.create(
            user=user,
            manager=manager,
            message=request.data["message"]
        )

        send_mail(
            subject="New Property Inquiry",
            message=f"""
User Name: {user.username}
User Email: {user.email}

Message:
{inquiry.message}
""",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[manager.email],
        )

        return Response(
            {"message": "Inquiry sent successfully"},
            status=status.HTTP_201_CREATED
        )


# view emails on manager dashboard

class ManagerInquiryListAPIView(APIView):
    permission_classes = [IsManager]

    def get(self, request):
        inquiries = Inquiry.objects.filter(manager=request.user)
        serializer = InquirySerializer(inquiries, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


#(Manager reply karta hai – email user ko chali jati hai)

class ReplyInquiryAPIView(APIView):
    permission_classes = [IsManager]

    def post(self, request, id):
        inquiry = Inquiry.objects.get(id=id)

        inquiry.reply = request.data["reply"]
        inquiry.replied_at = timezone.now()
        inquiry.save()

        send_mail(
            subject="Reply from Manager",
            message=f"""
Hello {inquiry.user.username},

{inquiry.reply}
""",
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[inquiry.user.email],
        )

        return Response(
            {"message": "Reply sent successfully"},
            status=status.HTTP_200_OK
        )




#(User apni sent mails & replies dekhta hai)

class UserInquiryListAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        inquiries = Inquiry.objects.filter(user=request.user)
        serializer = InquirySerializer(inquiries, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


