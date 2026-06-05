from django.urls import path
from .views import TaskCreateView,TaskListView,TaskDetailView,AgentTasksView,AgentTaskDetailView

urlpatterns = [
    path('create/', TaskCreateView.as_view()),
    path('detail/<int:taskId>/', AgentTaskDetailView.as_view()),
    path('viewall/', TaskListView.as_view()),
    path('agent/', AgentTasksView.as_view()),

    

]
