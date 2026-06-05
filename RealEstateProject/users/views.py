from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.core.mail import send_mail
from django.conf import settings
from .models import User, EmailOTP
from audit.models import LoginSession
from audit.utils import end_login_session
# for view document
from property.models import Property
from documents.models import PropertyDocument



# def send_otp_email(user, otp):
#     """Send OTP to user's email."""
#     subject = 'Your OTP for Email Verification'
#     message = f'Hello {user.username},\n\nYour OTP for email verification is: {otp}\n\nThis OTP will expire in 5 minutes.\n\nRegards,\nReal Estate Management System'
#     from_email = settings.DEFAULT_FROM_EMAIL if hasattr(settings, 'DEFAULT_FROM_EMAIL') else 'noreply@example.com'
#     send_mail(subject, message, from_email, [user.email])


from django.conf import settings
from django.core.mail import send_mail
import logging

logger = logging.getLogger(__name__)

def send_otp_email(user, otp):
    """
    Send OTP email to user with proper error handling.
    """
    subject = "Email Verification OTP - Real Estate System"
    message = f"""
Hello {user.username},

Your OTP for email verification is: {otp}

This OTP will expire in 5 minutes.
Do not share this OTP with anyone.

If you didn't request this, please ignore this email.

Regards,
Real Estate Management System Team
    """.strip()

    try:
        result = send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False
        )
        logger.info(f"OTP email sent successfully to {user.email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send OTP email to {user.email}: {str(e)}")
        raise e



class SignupView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        from .serializers import UserCreateSerializer

        serializer = UserCreateSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()

            # Generate and send OTP
            otp = EmailOTP.generate_otp()
            otp_obj = EmailOTP.objects.create(user=user, otp_code=otp)

            try:
                send_otp_email(user, otp)
            except Exception as e:
                # If email fails, still create user but inform
                return Response(
                    {
                        "message": "User created successfully, but failed to send OTP email. Please try resending OTP.",
                        "user": {
                            "user_id": user.user_id,
                            "username": user.username,
                            "email": user.email,
                            "user_type": user.user_type,
                        }
                    },
                    status=status.HTTP_201_CREATED
                )

            return Response(
                {
                    "message": "OTP sent to your email. Please verify your account."
                },
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class VerifyEmailOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        otp = request.data.get('otp')

        if not email or not otp:
            return Response(
                {"error": "Email and OTP are required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {"error": "User not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        if user.email_verified:
            return Response(
                {"error": "Email already verified"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get the latest unused OTP for the user
        try:
            otp_obj = EmailOTP.objects.filter(
                user=user,
                is_used=False
            ).latest('created_at')
        except EmailOTP.DoesNotExist:
            return Response(
                {"error": "No OTP found. Please request a new one."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if otp_obj.attempts >= 3:
            return Response(
                {"error": "Too many failed attempts. Please request a new OTP."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if otp_obj.is_expired():
            return Response(
                {"error": "OTP has expired. Please request a new one."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not otp_obj.check_otp(otp):
            otp_obj.increment_attempts()
            return Response(
                {"error": "Invalid OTP"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # OTP is valid
        otp_obj.mark_used()
        user.email_verified = True
        user.save()

        return Response(
            {"message": "Email verified successfully. You can now login."},
            status=status.HTTP_200_OK
        )


class ResendSignupOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')

        if not email:
            return Response(
                {"error": "Email is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {"error": "User not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        if user.email_verified:
            return Response(
                {"error": "Email already verified"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Invalidate previous unused OTPs
        EmailOTP.objects.filter(user=user, is_used=False).update(is_used=True)

        # Generate new OTP
        otp = EmailOTP.generate_otp()
        otp_obj = EmailOTP.objects.create(user=user, otp_code=otp)

        try:
            send_otp_email(user, otp)
        except Exception as e:
            return Response(
                {"error": "Failed to send OTP email. Please try again."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        return Response(
            {"message": "OTP sent successfully. Please check your email."},
            status=status.HTTP_200_OK

        )

# users/views.py


# class LoginView(APIView):
#     permission_classes = [AllowAny]

#     def post(self, request):
#         username = request.data.get('username')
#         password = request.data.get('password')

#         # ---- authentication same rakho ---- #

#         user = authenticate(username=username, password=password)

#         # (email logic same rakho)

#         if user is None:
#             return Response({"error": "Invalid credentials"}, status=401)

#         if not user.email_verified:
#             return Response({"error": "Email not verified"}, status=403)

#         # ✅ CREATE SESSION (ONLY HERE)
#         session = LoginSession.objects.create(
#             user=user,
#             login_time=timezone.now(),
#             ip_address=get_client_ip(request),
#             user_agent=get_user_agent(request)
#         )

        

#         # ✅ OPTIONAL: Blockchain log call
#         log_user_activity(
#             user=user,
#             action="LOGIN",
#             ip=session.ip_address
#         )

#         request.session['audit_session_id'] = str(session.session_id)

#         refresh = RefreshToken.for_user(user)

#         return Response({
#             "message": "Login successful",
#             "session_id": str(session.session_id),
#             "access": str(refresh.access_token),
#             "refresh": str(refresh),
#         })

# # users/views.py

# class LogoutView(APIView):
#     permission_classes = [IsAuthenticated]

#     def post(self, request):

#         session_id = request.data.get('session_id')

#         if not session_id:
#             return Response({"error": "Session ID required"}, status=400)

#         try:
#             session = LoginSession.objects.get(
#                 session_id=session_id,
#                 user=request.user
#             )

#             session.logout_time = timezone.now()
#             session.save()

#             # ✅ Blockchain log
#             log_user_activity(
#                 user=request.user,
#                 action="LOGOUT",
#                 ip=session.ip_address
#             )

#             return Response({
#                 "message": "Logout successful"
#             })

#         except LoginSession.DoesNotExist:
#             return Response({"error": "Session not found"}, status=404)


from audit.utils import log_user_activity

class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')

        if not username or not password:
            return Response(
                {"error": "Username and password are required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = authenticate(username=username, password=password)

        if user is None:
            # Try to authenticate with email if username failed
            try:
                user = User.objects.get(email=username)
                if not user.check_password(password) or not user.is_active:
                    user = None
            except User.DoesNotExist:
                user = None

        if user is None:
            return Response(
                {"error": "Invalid credentials"},
                status=status.HTTP_401_UNAUTHORIZED
            )

        if not user.email_verified:
            return Response(
                {"error": "Email not verified. Please verify your email before logging in."},
                status=status.HTTP_403_FORBIDDEN
            )

        # Create login session
        session = LoginSession.objects.create(
            user=user,
            ip_address=get_client_ip(request),
            user_agent=get_user_agent(request)
        )

        # Store session_id in Django session for middleware
        request.session['audit_session_id'] = str(session.session_id)
        request.session.save()

         

        # Issue JWT tokens
        refresh = RefreshToken.for_user(user)

        # after creating session and logging activity
        tx_hash = log_user_activity(
            session=session,
            module='users',
            action='LOGIN',
            user=user,
            details={
                'login_method': 'standard',
                'ip_address': session.ip_address,
                'user_agent': session.user_agent,
            }
        )

# Return tx_hash in response to frontend
        return Response(
            
            {
                "message": "Login successful",
                "session_id": str(session.session_id),
                "tx_hash": tx_hash,  # <-- frontend can see it now
                "user": {
                    "user_id": user.user_id,
                    "username": user.username,
                    "user_type": user.user_type,
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                }
            },
            status=status.HTTP_200_OK
            
        )

        # return Response(
        #     {
        #         "message": "Login successful",
        #         "session_id": str(session.session_id),
        #         "user": {
        #             "user_id": user.user_id,
        #             "username": user.username,
        #             "user_type": user.user_type,
        #             "access": str(refresh.access_token),
        #             "refresh": str(refresh),
        #         }
        #     },
        #     status=status.HTTP_200_OK
        # )


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            # Get session_id from request data or headers
            session_id = request.data.get('session_id') or request.headers.get('X-Session-ID')

            if not session_id:
                return Response(
                    {"error": "Session ID is required for logout"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # End the session and anchor logs
            session = LoginSession.objects.get(session_id=session_id, user=request.user)

            result = end_login_session(session_id, request.user)
            
            session.logout_time = timezone.now()
            session.save()

            log_user_activity(
                user=request.user,
                action="LOGOUT",
                ip=session.ip_address
            )

            return Response({
                "message": "Logout successful",
                "session_ended": session_id,
                "blockchain_anchors": result.get('anchoring_results', {})
            }, status=status.HTTP_200_OK)

        except ValueError as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {"error": f"Logout failed: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


def get_client_ip(request):
    """Get client IP address from request."""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def get_user_agent(request):
    """Get user agent from request."""
    return request.META.get('HTTP_USER_AGENT', '')



# user can view his own property document 
# view all

# class MyPropertiesWithDocumentsView(APIView):

#     permission_classes = [IsAuthenticated]

#     def get(self, request):

#         properties = Property.objects.filter(owner=request.user)

#         response_data = []

#         for property_obj in properties:

#             documents = PropertyDocument.objects.filter(
#                 property=property_obj
#             ).order_by("-uploaded_at")

#             docs_data = []

#             for doc in documents:

#                 docs_data.append({
#                     "document_id": doc.id,
#                     "document_type": doc.document_type,
#                     "status": doc.status,
#                     "ipfs_hash": doc.ipfs_hash,
#                     "ipfs_gateway_url": doc.ipfs_gateway_url,
#                     "tx_hash": doc.tx_hash,
#                     "uploaded_at": doc.uploaded_at,
#                 })

#             response_data.append({
#                 "property_id": property_obj.id,
#                 "property_title": property_obj.title,
#                 "documents": docs_data
#             })

#         return Response({
#             "success": True,
#             "properties": response_data
#         })



# user can view his own property documents
# view documents by id

class PropertyDocumentsByIdView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request, property_id):

        try:
            property_obj = Property.objects.get(
                id=property_id,
                owner=request.user
            )

        except Property.DoesNotExist:

            return Response({
                "success": False,
                "message": "Property not found"
            }, status=404)

        documents = PropertyDocument.objects.filter(
            property=property_obj
        ).order_by("-uploaded_at")

        docs_data = []

        for doc in documents:

            docs_data.append({
                "document_id": doc.id,
                "document_type": doc.document_type,
                "status": doc.status,
                "ipfs_hash": doc.ipfs_hash,
                "ipfs_gateway_url": doc.ipfs_gateway_url,
                "tx_hash": doc.tx_hash,
                "uploaded_at": doc.uploaded_at,
            })

        return Response({
            "success": True,
            "property_id": property_obj.id,
            "property_title": property_obj.title,
            "documents": docs_data
        })