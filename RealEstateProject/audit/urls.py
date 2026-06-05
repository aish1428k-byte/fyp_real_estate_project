# """
# URL configuration for audit app.
# """

# from django.urls import path
# from . import views

# app_name = 'audit'

# urlpatterns = [
#     path('anchor-logs/', views.anchor_audit_logs, name='anchor_audit_logs'),
#      path('verify-log/', views.verify_log_integrity, name='verify_log_integrity'),
#     path('session-logs/', views.get_session_logs, name='get_session_logs'),
#         path('all-logs/', views.get_all_logs, name='get_all_logs'),  # new API


# ]


from django.urls import path
from . import views

app_name = 'audit'

urlpatterns = [
    path('anchor-logs/', views.anchor_audit_logs, name='anchor_audit_logs'),
    path('verify-log/', views.verify_log_integrity, name='verify_log'),
    path('session-logs/', views.get_session_logs, name='session_logs'),
    path('all-logs/', views.get_all_logs, name='all_logs'),
    path('login/', views.user_login, name='user_login'),
    path('logout/', views.user_logout, name='user_logout'),
]
