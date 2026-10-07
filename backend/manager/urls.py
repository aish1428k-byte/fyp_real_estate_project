from django.urls import path
from .views import ManagerCreateView,ManagerDetailView,ManagerUpdateView,ManagerDeleteView

urlpatterns = [
    path('create/', ManagerCreateView.as_view()),
    path('view/<int:id>/', ManagerDetailView.as_view()),
    path('<int:id>/update/', ManagerUpdateView.as_view()),
    path('<int:id>/delete/', ManagerDeleteView.as_view()),

]
