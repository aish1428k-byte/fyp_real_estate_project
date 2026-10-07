// import React, { useState } from 'react'
// import { useNavigate } from 'react-router-dom'
// import './Login.css'

// const Login = ({ onGoToSignup, setUserRole }) => {
//     const navigate = useNavigate()

//     const [formData, setFormData] = useState({
//         username: '',
//         password: '',
//     })

//     const [errors, setErrors] = useState({})
//     const [isSubmitting, setIsSubmitting] = useState(false)

//     const handleChange = (e) => {
//         const { name, value } = e.target
//         setFormData((prev) => ({
//             ...prev,
//             [name]: value,
//         }))

//         if (errors[name]) {
//             setErrors((prev) => ({
//                 ...prev,
//                 [name]: '',
//             }))
//         }
//     }

//     const validate = () => {
//         const newErrors = {}

//         if (!formData.username.trim()) {
//             newErrors.username = 'Username is required'
//         }

//         if (!formData.password) {
//             newErrors.password = 'Password is required'
//         }

//         setErrors(newErrors)
//         return Object.keys(newErrors).length === 0
//     }

//     const handleSubmit = async (e) => {
//         e.preventDefault()

//         if (!validate()) return

//         setIsSubmitting(true)

//         try {
//             const response = await fetch('http://127.0.0.1:8000/users/login/', {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                 },
//                 body: JSON.stringify({
//                     username: formData.username,
//                     password: formData.password,
//                 }),
//             })

//             let data;
//             try {
//                 data = await response.json(); // try parse JSON
//             } catch (err) {
//                 console.error("Backend did not return JSON", err);
//                 setErrors({ api: "Backend did not return JSON" });
//                 setIsSubmitting(false);
//                 return;
//             }

//             console.log(data); // check backend response

//             if (!response.ok) {
//                 setErrors({ api: data.error || "Login failed" });
//                 setIsSubmitting(false);
//                 return;
//             }

//             // Save tokens if backend sends JWT
//             localStorage.setItem("access", data.user.access);
//             localStorage.setItem("refresh", data.user.refresh);
//             localStorage.setItem("username", data.user.username);

//             // Fix: Store userRole for Sidebar and other components
//             const userType = data.user.user_type;
//             localStorage.setItem("userRole", userType);

//             // Update app state
//             if (setUserRole) {
//                 setUserRole(userType);
//             }


//             if (userType === "manager") {
//                 navigate("/manager-dashboard");
//             } else if (userType === "agent") {
//                 navigate("/agent-dashboard");
//             } else if (userType === "admin") {
//                 navigate("/admin-dashboard");
//             } else {
//                 navigate("/dashboard"); // normal user
//             }
//         } catch (err) {
//             console.error(err);
//             setErrors({ api: "Network or server error" });
//         } finally {
//             setIsSubmitting(false);
//         }
//     };
//     return (
//         <div className="login-container flex-center">
//             <div className="login-content">
//                 <div className="welcome-section">
//                     <h1 className="welcome-title text-gradient">BrickChain</h1>
//                     <p className="welcome-text">The premium future of real estate trading.</p>
//                     <div className="welcome-decoration"></div>
//                 </div>

//                 <div className="glass-panel login-card">
//                     <div className="login-header">
//                         <h2>Sign In</h2>
//                         <p>Access your dashboard</p>
//                     </div>

//                     <form onSubmit={handleSubmit} className="login-form">
//                         <div className="role-selector-subtle">
//                             <span className="role-label-hint">Access Portal:</span>
//                             <div className="role-options-group">
//                                 <label className="role-chip">
//                                     <input type="radio" name="user_type_hint" value="user" defaultChecked />
//                                     <span>Client</span>
//                                 </label>
//                                 <label className="role-chip">
//                                     <input type="radio" name="user_type_hint" value="agent" />
//                                     <span>Agent</span>
//                                 </label>
//                                 <label className="role-chip">
//                                     <input type="radio" name="user_type_hint" value="manager" />
//                                     <span>Manager</span>
//                                 </label>
//                                 <label className="role-chip admin">
//                                     <input type="radio" name="user_type_hint" value="admin" />
//                                     <span>Admin</span>
//                                 </label>
//                             </div>
//                         </div>

//                         <div className="form-group">
//                             <label htmlFor="username">Username</label>
//                             <input
//                                 type="text"
//                                 id="username"
//                                 name="username"
//                                 value={formData.username}
//                                 onChange={handleChange}
//                                 className={`glass-input ${errors.username ? 'error' : ''}`}
//                                 placeholder="Enter your username"
//                             />
//                             {errors.username && (
//                                 <span className="error-message">{errors.username}</span>
//                             )}
//                         </div>

//                         <div className="form-group">
//                             <label htmlFor="password">Password</label>
//                             <input
//                                 type="password"
//                                 id="password"
//                                 name="password"
//                                 value={formData.password}
//                                 onChange={handleChange}
//                                 className={`glass-input ${errors.password ? 'error' : ''}`}
//                                 placeholder="Enter your password"
//                             />
//                             {errors.password && (
//                                 <span className="error-message">{errors.password}</span>
//                             )}
//                         </div>

//                         {errors.api && (
//                             <span className="error-message">{errors.api}</span>
//                         )}

//                         <button
//                             type="submit"
//                             className="btn-primary submit-button"
//                             disabled={isSubmitting}
//                         >
//                             {isSubmitting ? 'Signing In...' : 'Sign In'}
//                         </button>
//                     </form>

//                     <div className="login-footer">
//                         <p>
//                             New to BrickChain?{' '}
//                             <a
//                                 href="#signup"
//                                 onClick={(e) => {
//                                     e.preventDefault()
//                                     if (onGoToSignup) onGoToSignup();
//                                     else navigate('/signup')
//                                 }}
//                             >
//                                 Create Account
//                             </a>
//                         </p>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     )
// }

// export default Login


import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Login.css'

const Login = ({ onGoToSignup, setUserRole }) => {
    const navigate = useNavigate()

    const [formData, setFormData] = useState({
        username: '',
        password: '',
    })

    const [errors, setErrors] = useState({})
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }))

        if (errors[name]) {
            setErrors((prev) => ({
                ...prev,
                [name]: '',
            }))
        }
    }

    const validate = () => {
        const newErrors = {}

        if (!formData.username.trim()) {
            newErrors.username = 'Username is required'
        }

        if (!formData.password) {
            newErrors.password = 'Password is required'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!validate()) return

        setIsSubmitting(true)

        try {
            // ✅ STEP 1: NORMAL LOGIN
            const response = await fetch('http://127.0.0.1:8000/users/login/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: formData.username,
                    password: formData.password,
                }),
            })

            let data;
            try {
                data = await response.json();
            } catch (err) {
                console.error("Backend did not return JSON", err);
                setErrors({ api: "Backend did not return JSON" });
                setIsSubmitting(false);
                return;
            }

            if (!response.ok) {
                setErrors({ api: data.error || "Login failed" });
                setIsSubmitting(false);
                return;
            }

            // ✅ STORE JWT + USER DATA
            localStorage.setItem("access", data.user.access);
            localStorage.setItem("refresh", data.user.refresh);
            localStorage.setItem("username", data.user.username);
            localStorage.setItem("session_id", data.session_id);

            window.dispatchEvent(new Event("authChanged"));

        // ✅ STORE TX HASH (IMPORTANT)
        localStorage.setItem("tx_hash", data.tx_hash);

        // ✅ DEBUG
        //console.log("TX HASH:", data.tx_hash);

            const userType = data.user.user_type;
            localStorage.setItem("userRole", userType);

            if (setUserRole) {
                setUserRole(userType);
            }

            // ✅ STEP 2: CALL AUDIT LOGIN API
            // try {
            //     const auditResponse = await fetch('http://127.0.0.1:8000/audit/login/', {
            //         method: 'POST',
            //         headers: {
            //             'Content-Type': 'application/json',
            //             Authorization: `Bearer ${data.user.access}`
            //         }
            //     });

            //     const auditData = await auditResponse.json();

            //     // ✅ STORE SESSION ID
            //     if (auditData.session_id) {
            //         localStorage.setItem("session_id", auditData.session_id);
            //     }

            // } catch (auditErr) {
            //     console.error("Audit login failed:", auditErr);
            // }

            // ✅ NAVIGATION (UNCHANGED)
            if (userType === "manager") {
                navigate("/manager-dashboard");
            } else if (userType === "agent") {
                navigate("/agent-dashboard");
            } else if (userType === "admin") {
                navigate("/admin-dashboard");
            } else if (userType === "finance manager") {
                navigate("/finance");
            } 
            else if (userType === "lease manager") {
                navigate("/lease");
            }else {
                navigate("/dashboard");
            }


        } catch (err) {
            console.error(err);
            setErrors({ api: "Network or server error" });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="login-container flex-center">
            <div className="login-content">
                <div className="welcome-section">
                    <h1 className="welcome-title text-gradient">BrickChain</h1>
                    <p className="welcome-text">The premium future of real estate trading.</p>
                    <div className="welcome-decoration"></div>
                </div>

                <div className="glass-panel login-card">
                    <div className="login-header">
                        <h2>Sign In</h2>
                        <p>Access your dashboard</p>
                    </div>

                    <form onSubmit={handleSubmit} className="login-form">
                       

                        <div className="form-group">
                            <label htmlFor="username">Username</label>
                            <input
                                type="text"
                                id="username"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                className={`glass-input ${errors.username ? 'error' : ''}`}
                                placeholder="Enter your username"
                            />
                            {errors.username && (
                                <span className="error-message">{errors.username}</span>
                            )}
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">Password</label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className={`glass-input ${errors.password ? 'error' : ''}`}
                                placeholder="Enter your password"
                            />
                            {errors.password && (
                                <span className="error-message">{errors.password}</span>
                            )}
                        </div>

                        {errors.api && (
                            <span className="error-message">{errors.api}</span>
                        )}

                        <button
                            type="submit"
                            className="btn-primary submit-button"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Signing In...' : 'Sign In'}
                        </button>
                    </form>

                    <div className="login-footer">
                        <p style={{ marginBottom: '8px' }}>
                            New to BrickChain?{' '}
                            <a
                                href="#signup"
                                onClick={(e) => {
                                    e.preventDefault()
                                    if (onGoToSignup) onGoToSignup();
                                    navigate('/signup')
                                }}
                            >
                                Create Account
                            </a>
                        </p>
                        <p>
                            Need to verify your email?{' '}
                            <a
                                href="#verify-otp"
                                onClick={(e) => {
                                    e.preventDefault()
                                    navigate('/verify-otp')
                                }}
                            >
                                Verify Email
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Login