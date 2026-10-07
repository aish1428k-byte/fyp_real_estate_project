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
    path('user-logs/', views.get_user_logs, name='user_logs'),
    path('agent-logs/', views.get_agent_logs, name='agent_logs'),
    path('manager-logs/', views.get_manager_logs, name='manager_logs'),
    path('finance-manager-logs/', views.get_finance_manager_logs, name='finance_manager_logs'),
    path('lease-manager-logs/', views.get_lease_manager_logs, name='lease_manager_logs'),
    path('login/', views.user_login, name='user_login'),
    path('logout/', views.user_logout, name='user_logout'),
]
