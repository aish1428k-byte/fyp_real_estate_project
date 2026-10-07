from django.urls import path
from .views import AgentCreateView,AgentDetailView,AgentUpdateView,AgentDeleteView,AgentStatusView,AgentListView,DocumentUploadView

urlpatterns = [
    path('create/', AgentCreateView.as_view()),
    path('view/<int:id>/', AgentDetailView.as_view()),
    path('viewstatus/<int:id>/', AgentStatusView.as_view()),
    path('list/', AgentListView.as_view()),

    path('<int:id>/update/', AgentUpdateView.as_view()),
    path('<int:id>/delete/', AgentDeleteView.as_view()),
    path('upload-document/', DocumentUploadView.as_view()),

]
 