// import React, { useState, useRef, useEffect } from 'react';
// import { useNavigate, useLocation } from 'react-router-dom';
// import './OTPVerification.css';

// const OTPVerification = () => {
//     const navigate = useNavigate();
//     const location = useLocation();

//     // Get email from previous step (SignUp) or fallback
//     const [email, setEmail] = useState(location.state?.email || '');
//     const [otp, setOtp] = useState(['', '', '', '', '', '']);
//     const [isSubmitting, setIsSubmitting] = useState(false);
//     const [isResending, setIsResending] = useState(false);
//     const [error, setError] = useState(null);
//     const [message, setMessage] = useState(null);

//     const inputRefs = [
//         useRef(null),
//         useRef(null),
//         useRef(null),
//         useRef(null),
//         useRef(null),
//         useRef(null),
//     ];

//     useEffect(() => {
//         // Auto-focus first box on load
//         if (inputRefs[0].current) {
//             inputRefs[0].current.focus();
//         }
//     }, []);

//     const handleChange = (index, value) => {
//         // Allow alphanumeric characters as per requirement
//         if (!/^[a-zA-Z0-9]?$/.test(value)) return;

//         const newOtp = [...otp];
//         newOtp[index] = value;
//         setOtp(newOtp);
//         setError(null);

//         // Move to next input if value is entered
//         if (value !== '' && index < 5) {
//             inputRefs[index + 1].current.focus();
//         }
//     };

//     const handleKeyDown = (index, e) => {
//         // Move to previous input on backspace if current is empty
//         if (e.key === 'Backspace' && otp[index] === '' && index > 0) {
//             inputRefs[index - 1].current.focus();
//         }
//     };

//     const handlePaste = (e) => {
//         e.preventDefault();
//         const pastedData = e.clipboardData.getData('text').slice(0, 6).split('');
//         const newOtp = [...otp];
//         pastedData.forEach((char, index) => {
//             if (index < 6 && /^[a-zA-Z0-9]$/.test(char)) {
//                 newOtp[index] = char;
//             }
//         });
//         setOtp(newOtp);
//         // Focus the last filled box or the next empty box
//         const nextIndex = Math.min(pastedData.length, 5);
//         inputRefs[nextIndex].current.focus();
//     };

//     const handleVerify = async (e) => {
//         e.preventDefault();
//         const fullOtp = otp.join('');
//         if (fullOtp.length < 6) {
//             setError('Please enter all 6 characters');
//             return;
//         }

//         setIsSubmitting(true);
//         setError(null);
//         setMessage(null);

//         try {
//             const response = await fetch('http://127.0.0.1:8000/users/verify-otp/', {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify({ email, otp: fullOtp }),
//             });

//             const data = await response.json();

//             if (!response.ok) {
//                 setError(data.message || 'Verification failed. Please check your OTP.');
//                 setIsSubmitting(false);
//                 return;
//             }

//             alert('Email verified successfully! You can now log in.');
//             navigate('/login');
//         } catch (err) {
//             console.error('Error:', err);
//             setError('Server error. Please try again.');
//         } finally {
//             setIsSubmitting(false);
//         }
//     };

//     const handleResend = async () => {
//         if (!email) {
//             setError('Email is required to resend OTP');
//             return;
//         }

//         setIsResending(true);
//         setError(null);
//         setMessage(null);

//         try {
//             const response = await fetch('http://127.0.0.1:8000/users/resend-otp/', {
//                 method: 'POST',
//                 headers: { 'Content-Type': 'application/json' },
//                 body: JSON.stringify({ email }),
//             });

//             const data = await response.json();

//             if (!response.ok) {
//                 setError(data.message || 'Failed to resend OTP.');
//                 return;
//             }

//             setMessage('A new OTP has been sent to your email.');
//             // Clear OTP fields
//             setOtp(['', '', '', '', '', '']);
//             inputRefs[0].current.focus();
//         } catch (err) {
//             console.error('Error:', err);
//             setError('Server error. Please try again.');
//         } finally {
//             setIsResending(false);
//         }
//     };

//     return (
//         <div className="signup-container flex-center">
//             <div className="signup-content">
//                 <div className="welcome-section">
//                     <h1 className="welcome-title text-gradient">Verify Your Identity</h1>
//                     <p className="welcome-text">We've sent a 6-digit alphanumeric code to your email. Please enter it below to complete your registration.</p>
//                     <div className="welcome-decoration"></div>
//                 </div>

//                 <div className="glass-panel signup-card">
//                     <div className="signup-header">
//                         <h2>Email Verification</h2>
//                         <p>Complete the step to access BrickChain</p>
//                     </div>

//                     <form onSubmit={handleVerify} className="signup-form">
//                         <div className="form-group">
//                             <label htmlFor="email">Email Address</label>
//                             <input
//                                 type="email"
//                                 id="email"
//                                 value={email}
//                                 onChange={(e) => setEmail(e.target.value)}
//                                 className={`glass-input ${error && !email ? 'error' : ''}`}
//                                 placeholder="Enter your email"
//                                 required
//                             />
//                         </div>

//                         <div className="form-group">
//                             <label>One-Time Password</label>
//                             <div className="otp-input-container">
//                                 {otp.map((digit, index) => (
//                                     <input
//                                         key={index}
//                                         ref={inputRefs[index]}
//                                         type="text"
//                                         maxLength="1"
//                                         value={digit}
//                                         onChange={(e) => handleChange(index, e.target.value)}
//                                         onKeyDown={(e) => handleKeyDown(index, e)}
//                                         onPaste={index === 0 ? handlePaste : undefined}
//                                         className={`otp-box ${error && digit === '' ? 'error' : ''}`}
//                                         autoComplete="off"
//                                     />
//                                 ))}
//                             </div>
//                         </div>

//                         {error && <span className="error-message centered">{error}</span>}
//                         {message && <span className="success-message centered">{message}</span>}

//                         <button type="submit" className="btn-primary submit-button" disabled={isSubmitting}>
//                             {isSubmitting ? 'Verifying...' : 'Verify OTP'}
//                         </button>
//                     </form>

//                     <div className="signup-footer otp-footer">
//                         <p>
//                             Didn't receive the code?{' '}
//                             <button
//                                 className="resend-btn"
//                                 onClick={handleResend}
//                                 disabled={isResending}
//                                 type="button"
//                             >
//                                 {isResending ? 'Sending...' : 'Resend OTP'}
//                             </button>
//                         </p>
//                         <p style={{ marginTop: '15px' }}>
//                             <a href="/login" onClick={(e) => { e.preventDefault(); navigate('/login'); }}>
//                                 Back to Sign In
//                             </a>
//                         </p>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default OTPVerification;
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './OTPVerification.css';

const OTPVerification = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Email from signup page
    const [email, setEmail] = useState(location.state?.email || '');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState(null);

    const inputRefs = Array.from({ length: 6 }, () => useRef(null));

    useEffect(() => {
        inputRefs[0].current?.focus();
    }, []);

    const handleChange = (index, value) => {
        if (!/^[a-zA-Z0-9]?$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        setError(null);

        if (value && index < 5) {
            inputRefs[index + 1].current.focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && otp[index] === '' && index > 0) {
            inputRefs[index - 1].current.focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').slice(0, 6).split('');
        const newOtp = [...otp];

        pasted.forEach((char, i) => {
            if (/^[a-zA-Z0-9]$/.test(char)) {
                newOtp[i] = char;
            }
        });

        setOtp(newOtp);
        inputRefs[Math.min(pasted.length, 5)].current.focus();
    };

    // ✅ VERIFY OTP (CORRECT API)
    const handleVerify = async (e) => {
        e.preventDefault();
        const fullOtp = otp.join('');

        if (fullOtp.length !== 6) {
            setError('Please enter all 6 characters');
            return;
        }

        setIsSubmitting(true);
        setError(null);
        setMessage(null);

        try {
            const response = await fetch(
                'http://127.0.0.1:8000/users/verify-email-otp/',
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, otp: fullOtp }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'Invalid OTP');
                return;
            }

            alert('Email verified successfully! You can now log in.');
            navigate('/login');

        } catch (err) {
            setError('Server error. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // ✅ RESEND OTP (CORRECT API)
    const handleResend = async () => {
        if (!email) {
            setError('Email is required');
            return;
        }

        setIsResending(true);
        setError(null);
        setMessage(null);

        try {
            const response = await fetch(
                'http://127.0.0.1:8000/users/resend-signup-otp/',
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'Failed to resend OTP');
                return;
            }

            setMessage('A new OTP has been sent to your email.');
            setOtp(['', '', '', '', '', '']);
            inputRefs[0].current.focus();

        } catch (err) {
            setError('Server error. Please try again.');
        } finally {
            setIsResending(false);
        }
    };

    return (
        <div className="signup-container flex-center">
            <div className="signup-content">
                <div className="welcome-section">
                    <h1 className="welcome-title text-gradient">Verify Your Identity</h1>
                    <p className="welcome-text">
                        We've sent a 6-digit code to your email. Please enter it below.
                    </p>
                    <div className="welcome-decoration"></div>
                </div>

                <div className="glass-panel signup-card">
                    <div className="signup-header">
                        <h2>Email Verification</h2>
                        <p>Complete the step to access BrickChain</p>
                    </div>

                    <form onSubmit={handleVerify} className="signup-form">
                        <div className="form-group">
                            <label>Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="glass-input"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>One-Time Password</label>
                            <div className="otp-input-container">
                                {otp.map((digit, index) => (
                                    <input
                                        key={index}
                                        ref={inputRefs[index]}
                                        type="text"
                                        maxLength="1"
                                        value={digit}
                                        onChange={(e) => handleChange(index, e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(index, e)}
                                        onPaste={index === 0 ? handlePaste : undefined}
                                        className="otp-box"
                                    />
                                ))}
                            </div>
                        </div>

                        {error && <span className="error-message centered">{error}</span>}
                        {message && <span className="success-message centered">{message}</span>}

                        <button type="submit" className="btn-primary submit-button" disabled={isSubmitting}>
                            {isSubmitting ? 'Verifying...' : 'Verify OTP'}
                        </button>
                    </form>

                    <div className="signup-footer otp-footer">
                        <p>
                            Didn't receive the code?{' '}
                            <button
                                className="resend-btn"
                                onClick={handleResend}
                                disabled={isResending}
                                type="button"
                            >
                                {isResending ? 'Sending...' : 'Resend OTP'}
                            </button>
                        </p>

                        <p style={{ marginTop: '15px' }}>
                            <a href="/login" onClick={(e) => { e.preventDefault(); navigate('/login'); }}>
                                Back to Sign In
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OTPVerification;
