import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './SignUp.css'

const SignUp = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
  })
  const [selectedRole, setSelectedRole] = useState(null)
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const handleRoleSelect = (role) => {
    setSelectedRole(role)
    if (errors.role) setErrors((prev) => ({ ...prev, role: '' }))
  }

  const validate = () => {
    const newErrors = {}
    if (!selectedRole) newErrors.role = 'Please select a role'
    if (!formData.username.trim()) newErrors.username = 'Username required'
    if (!formData.email.trim()) newErrors.email = 'Email required'
    if (!formData.firstName.trim()) newErrors.firstName = 'First Name required'
    if (!formData.lastName.trim()) newErrors.lastName = 'Last Name required'
    if (!formData.phoneNumber.trim()) newErrors.phoneNumber = 'Phone Number required'
    if (!formData.password || formData.password.length < 8)
      newErrors.password = 'Password must be at least 8 characters'
    if (!formData.confirmPassword || formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = 'Passwords do not match'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setIsSubmitting(true)

    try {
      const response = await fetch('http://127.0.0.1:8000/users/signup/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_type: selectedRole,
          username: formData.username,
          email: formData.email,
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone: formData.phoneNumber,
          password: formData.password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.message || 'Signup failed')
        setIsSubmitting(false)
        return
      }

      alert('Account created successfully! Please verify your email.')
      const email = formData.email;
      setFormData({
        username: '',
        email: '',
        firstName: '',
        lastName: '',
        phoneNumber: '',
        password: '',
        confirmPassword: '',
      })
      setSelectedRole(null)
      navigate('/verify-otp', { state: { email: email } })
    } catch (error) {
      console.error('Error:', error)
      alert('Server error. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="signup-container flex-center">
      <div className="signup-content">
        <div className="welcome-section">
          <h1 className="welcome-title text-gradient">Join BrickChain</h1>
          <p className="welcome-text">Start your journey in premium real estate.</p>
          <div className="welcome-decoration"></div>
        </div>

        <div className="glass-panel signup-card">
          <div className="signup-header">
            <h2>Create Account</h2>
            <p>Fill in your details</p>
          </div>

          <form onSubmit={handleSubmit} className="signup-form">
            {/* Role Selection */}
            <div className="role-selection">
              <label className="input-label">Select Role</label>
              <div className="role-buttons">
                {['buyer', 'seller'].map((role) => (
                  <button
                    key={role}
                    type="button"
                    className={`role-button ${selectedRole === role ? 'active' : ''}`}
                    onClick={() => handleRoleSelect(role)}
                  >
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </button>
                ))}
              </div>
              {errors.role && <span className="error-message">{errors.role}</span>}
            </div>

            {/* Row 1: Username & Email */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="username">Username</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className={`glass-input ${errors.username ? 'error' : ''}`}
                  placeholder="Username"
                />
                {errors.username && <span className="error-message">{errors.username}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`glass-input ${errors.email ? 'error' : ''}`}
                  placeholder="Email"
                />
                {errors.email && <span className="error-message">{errors.email}</span>}
              </div>
            </div>

            {/* Row 2: First Name & Last Name */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">First Name</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className={`glass-input ${errors.firstName ? 'error' : ''}`}
                  placeholder="First Name"
                />
                {errors.firstName && <span className="error-message">{errors.firstName}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="lastName">Last Name</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className={`glass-input ${errors.lastName ? 'error' : ''}`}
                  placeholder="Last Name"
                />
                {errors.lastName && <span className="error-message">{errors.lastName}</span>}
              </div>
            </div>

            {/* Row 3: Phone Number & Password */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="phoneNumber">Phone Number</label>
                <input
                  type="tel"
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  className={`glass-input ${errors.phoneNumber ? 'error' : ''}`}
                  placeholder="Phone Number"
                />
                {errors.phoneNumber && <span className="error-message">{errors.phoneNumber}</span>}
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
                  placeholder="Password"
                />
                {errors.password && <span className="error-message">{errors.password}</span>}
              </div>
            </div>

            {/* Row 4: Confirm Password */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`glass-input ${errors.confirmPassword ? 'error' : ''}`}
                  placeholder="Confirm Password"
                />
                {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
              </div>
            </div>

            <button type="submit" className="btn-primary submit-button" disabled={isSubmitting}>
              {isSubmitting ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>

          <div className="signup-footer">
            <p>
              Already have an account?{' '}
              <a
                href="#login"
                onClick={(e) => {
                  e.preventDefault()
                  navigate('/login')
                }}
              >
                Sign in
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SignUp
