from django.urls import path
from .views import PropertyDestroyView,PropertyUpdateView,PropertyCreateView,UserPropertyListView,PropertyidView,PropertyListView,PropertyDetailView,PropertySingleView,IPFSUploadView,UserAssignedAgentView,PropertyTaskAPIView

urlpatterns = [
    path('create/', PropertyCreateView.as_view()),
    path('view/', UserPropertyListView.as_view()),
    
    path('view/<int:pk>/', PropertyidView.as_view()),
    
    path('singleview/<int:pk>/', PropertySingleView.as_view()),


    path('search/', PropertyListView.as_view()),
    path('properties-details/<int:pk>/', PropertyDetailView.as_view()),



    path('delete/<int:pk>/', PropertyDestroyView.as_view(), name='property-update'),
    path("update/<int:pk>/", PropertyUpdateView.as_view()),
    path('my-property-agent/<int:property_id>/',UserAssignedAgentView.as_view()),

    path(
        'property-task/<int:property_id>/',
        PropertyTaskAPIView.as_view(),
        name='property-task'
    )



]