from django.urls import path
from .views import ChatRoomCreateView, SendMessageView, ChatMessageListView

urlpatterns = [
    path('room/create/', ChatRoomCreateView.as_view()),
    path('message/send/', SendMessageView.as_view()),
    path('messages/<int:room_id>/', ChatMessageListView.as_view()),
]
