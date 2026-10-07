from django.urls import path

from user_messages.views import (
    UserSendMessageAPIView,
    UserMyMessagesAPIView,
    ManagerMessageSummaryAPIView,
    ManagerAllMessagesAPIView,
    ManagerReplyAPIView
)



urlpatterns = [

    # ================= USER APIs =================

    # User → Property page se message send
    path(
        'send/',
        UserSendMessageAPIView.as_view(),
        name='user-send-message'
    ),

    # User → Apne messages + replies dekhna
    path(
        'my/',
        UserMyMessagesAPIView.as_view(),
        name='user-my-messages'
    ),

    # ================= MANAGER APIs =================

    # Manager → Messages summary list (cards / table view)
    path(
        'manager/summary/',
        ManagerMessageSummaryAPIView.as_view(),
        name='manager-message-summary'
    ),

    # Manager → All messages (full list)
    path(
        'manager/all/',
        ManagerAllMessagesAPIView.as_view(),
        name='manager-all-messages'
    ),

    # Manager → Single message detail
    

    # Manager → Reply to message
    path('manager/reply/<int:pk>/', ManagerReplyAPIView.as_view(), name='manager-reply-message'),
]
