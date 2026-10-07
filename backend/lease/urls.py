from django.urls import path

from .views import UploadLeaseView,LeaseListView

urlpatterns = [

    path(
        "upload/",
        UploadLeaseView.as_view(),
        name="upload-lease"
    ),

    path(
        "list/",
        LeaseListView.as_view(),
        name="lease-list"
    ),
]