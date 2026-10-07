# Authentication Flow Implementation TODO

## 1. Update users/models.py
- [x] Change generate_otp to return 6-digit numeric OTP
- [x] Modify save() to hash otp_code using make_password
- [x] Add check_otp method to verify hashed OTP

## 2. Update users/serializers.py
- [x] Add OTPVerifySerializer for email and otp_code
- [x] Add OTPResendSerializer for email

## 3. Update users/views.py
- [x] Add send_otp_email utility function
- [x] Update SignupView to generate and send OTP after user creation
- [x] Implement VerifyEmailOTPView with validation, expiry check, attempt limit (3), OTP verification
- [x] Implement ResendSignupOTPView with checks for unverified users
- [x] Update LoginView to require email_verified=True

## 4. Followup
- [ ] Run migrations if needed
- [ ] Test signup, OTP verify, resend, login flows
- [ ] Ensure email sending works
