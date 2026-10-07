import React, { useState } from 'react'
import './ManagerModals.css'

const AddAgent = ({ onClose }) => {
    const [formData, setFormData] = useState({
        user: {
            username: '',
            email: '',
            password: '',
            user_type: 'agent',
        },
        employee_code: '',
        designation: '',
        joining_date: '',
        status: true,
        profile_image: null,  // new optional field
    })

    // Handle text inputs
    const handleChange = (e) => {
        const { name, value } = e.target

        if (name.startsWith('user.')) {
            const field = name.split('.')[1]
            setFormData(prev => ({
                ...prev,
                user: {
                    ...prev.user,
                    [field]: value
                }
            }))
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }))
        }
    }

    // Handle file input
    const handleFileChange = (e) => {
        const file = e.target.files[0]
        setFormData(prev => ({
            ...prev,
            profile_image: file
        }))
    }

    // Submit form
    const handleSubmit = async (e) => {
        e.preventDefault()
        const token = localStorage.getItem('access')
        const data = new FormData()

        // Append nested user fields
        Object.keys(formData.user).forEach(key => {
            data.append(`user.${key}`, formData.user[key])
        })

        // Append agent fields
        data.append('employee_code', formData.employee_code)
        data.append('designation', formData.designation)
        data.append('joining_date', formData.joining_date)
        data.append('status', formData.status)

        // Append profile image if selected
        if (formData.profile_image) {
            data.append('profile_image', formData.profile_image)
        }

        const response = await fetch('http://127.0.0.1:8000/agents/create/', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                // DO NOT set Content-Type; FormData handles it
            },
            body: data,
        })

        const resData = await response.json()

        if (!response.ok) {
            alert(JSON.stringify(resData))
            return
        }

        alert('Agent created successfully ✅')
        onClose()
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Add New Agent</h2>
                    <button className="modal-close-button" onClick={onClose}>&times;</button>
                </div>

                <div className="modal-body">
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>USER NAME</label>
                            <input
                                type="text"
                                name="user.username"
                                value={formData.user.username}
                                onChange={handleChange}
                                placeholder="Username"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>EMAIL</label>
                            <input
                                type="email"
                                name="user.email"
                                value={formData.user.email}
                                onChange={handleChange}
                                placeholder="agent@email.com"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>PASSWORD</label>
                            <input
                                type="password"
                                name="user.password"
                                value={formData.user.password}
                                onChange={handleChange}
                                placeholder="Password"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>DESIGNATION</label>
                            <input
                                type="text"
                                name="designation"
                                value={formData.designation}
                                onChange={handleChange}
                                placeholder="Sales Agent"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>EMPLOYEE CODE</label>
                            <input
                                type="text"
                                name="employee_code"
                                value={formData.employee_code}
                                onChange={handleChange}
                                placeholder="EMP001"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>PROFILE IMAGE</label>
                            <input
                                type="file"
                                name="profile_image"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="glass-input"
                            />
                        </div>

                        <div className="form-group">
                            <input
                                type="date"
                                name="joining_date"
                                value={formData.joining_date}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="modal-actions">
                            <button type="button" onClick={onClose} className="cancel-button">
                                Cancel
                            </button>
                            <button type="submit" className="add-button">
                                Add Agent
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default AddAgent
