from django.urls import path
from .views import SignupView, LoginView, LogoutView, VerifyEmailOTPView, ResendSignupOTPView, PropertyDocumentsByIdView,MyProfileView
app_name = 'users'

urlpatterns = [
    path('signup/', SignupView.as_view(), name='signup'),
    path('verify-email-otp/', VerifyEmailOTPView.as_view(), name='verify_email'),
    path('resend-signup-otp/', ResendSignupOTPView.as_view(), name='resend_otp'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path("property-documents/<int:property_id>/",PropertyDocumentsByIdView.as_view(),name="property-documents-by-id"),
    # path("my-properties-documents/",MyPropertiesWithDocumentsView.as_view(),name="my-properties-documents"),
    path("profile/me/", MyProfileView.as_view()),

]
