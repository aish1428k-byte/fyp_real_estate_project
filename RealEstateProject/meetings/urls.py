from django.urls import path
from .views import MeetingCreateView,MeetingDetailView

urlpatterns = [
    path('create/', MeetingCreateView.as_view()),
    path('view/<int:id>/', MeetingDetailView.as_view()),

]
