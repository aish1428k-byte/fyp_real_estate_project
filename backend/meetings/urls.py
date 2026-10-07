from django.urls import path
from .views import MeetingCreateView,MeetingByTaskAPIView

urlpatterns = [
    path('create/', MeetingCreateView.as_view()),
    path(
        "view/<int:task_id>/",
        MeetingByTaskAPIView.as_view(),
    ),
]
