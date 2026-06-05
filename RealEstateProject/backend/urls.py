"""
URL configuration for backend project.

For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('users/', include('users.urls')),
    path('property/', include('property.urls')),
    path('chat/', include('chat.urls')),
    path('agents/', include('agents.urls')),
    path('tasks/', include('tasks.urls')),
    path('meetings/', include('meetings.urls')),
    path('manager/', include('manager.urls')),
    path('messages/', include('user_messages.urls')),
    path('audit/', include('audit.urls')),  # New audit endpoints
    path('documents/',include('documents.urls')),

]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
