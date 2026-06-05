# # documents/urls.py
# from django.urls import path
# from .views import UploadPropertyDocument

# urlpatterns = [
#     path("upload/", UploadPropertyDocument.as_view()),
# ]
#  __________module2 ended

# documents/urls.py

from django.urls import path

from .views import (
    PropertyDocumentDetailView,
    PropertyDocumentListView,
    UploadPropertyDocumentView,
)

urlpatterns = [
    path("upload/",  UploadPropertyDocumentView.as_view(),  name="document-upload"),
    path("",         PropertyDocumentListView.as_view(),    name="document-list"),
    path("<int:pk>/",PropertyDocumentDetailView.as_view(),  name="document-detail"),
]
