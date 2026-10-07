import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './AgentDashboard.css'
import AddDocuments from './AddDocuments'
import { useThemeStore } from '../features/theme/stores/useThemeStore'


const AgentDashboard = () => {
    const { theme } = useThemeStore()
    const isLightTheme = theme === 'light'
    const navigate = useNavigate()
    const [tasks, setTasks] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [isDocModalOpen, setIsDocModalOpen] = useState(false)
    const [userInfo, setUserInfo] = useState(null)

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem("access")
                const response = await fetch("http://127.0.0.1:8000/users/profile/me/", {
                    headers: { Authorization: `Bearer ${token}` }
                })
                const data = await response.json()
                setUserInfo(data)
            } catch (err) {
                console.error(err)
            }
        }
        fetchProfile()
    }, [])



    useEffect(() => {
        const loadData = async () => {
            try {
                const token = localStorage.getItem('access') // 👈 IMPORTANT

                const response = await fetch('http://127.0.0.1:8000/tasks/agent/', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}` // 👈 THIS FIXES 401
                    }
                })

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`)
                }

                const data = await response.json()

                const mappedTasks = data.map(task => ({
                    ...task,
                    propertyName: task.property_title || '-',
                    ownerName: task.owner_name || '-',
                    customerName: task.buyer_name || '-'
                }))

                setTasks(mappedTasks)
            } catch (err) {
                console.error(err)
                setError('Unauthorized or server error')
            } finally {
                setLoading(false)
            }
        }

        loadData()
    }, [])

    return (
        <div className="manager-dashboard">
            <div className="agent-dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1 className="text-gradient" style={{ margin: 0 }}>Active Tasks</h1>

                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ background: isLightTheme ? '#C4D8E5' : 'var(--bg-card)', border: isLightTheme ? '1px solid #8EB1D1' : '1px solid var(--border-light)', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isLightTheme ? '#1C2B48' : 'var(--text-muted)' }}>
                            {userInfo?.profile_picture ? (
                                <img
                                    src={userInfo.profile_picture}
                                    alt=""
                                    style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }}
                                />
                            ) : (
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '20px', height: '20px' }}>
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                    <circle cx="12" cy="7" r="4" />
                                </svg>
                            )}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                            <span style={{ fontWeight: '600', fontSize: '14px', color: isLightTheme ? '#1C2B48' : 'white' }}>
                                {userInfo?.name || "Loading..."}
                            </span>
                            <span style={{ fontSize: '12px', color: isLightTheme ? '#1C2B48' : 'var(--text-muted)' }}>
                                {userInfo?.role}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="glass-panel" style={{ marginTop: '2rem', overflowX: 'auto' }}>
                {loading ? (
                    <p style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>Loading tasks...</p>
                ) : error ? (
                    <p style={{ textAlign: 'center', color: '#f87171', padding: '2rem' }}>{error}</p>
                ) : (
                    <table className="meetings-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                                <th style={{ padding: '1rem', textAlign: 'left', color: isLightTheme ? '#ffffff' : '#94a3b8', textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '0.05em' }}>Task ID</th>
                                <th style={{ padding: '1rem', textAlign: 'left', color: isLightTheme ? '#ffffff' : '#94a3b8', textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '0.05em' }}>Property</th>
                                <th style={{ padding: '1rem', textAlign: 'left', color: isLightTheme ? '#ffffff' : '#94a3b8', textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '0.05em' }}>Owner</th>
                                <th style={{ padding: '1rem', textAlign: 'left', color: isLightTheme ? '#ffffff' : '#94a3b8', textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '0.05em' }}>Buyer</th>
                                <th style={{ padding: '1rem', textAlign: 'left', color: isLightTheme ? '#ffffff' : '#94a3b8', textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '0.05em' }}>Status</th>
                                <th style={{ padding: '1rem', textAlign: 'left', color: isLightTheme ? '#ffffff' : '#94a3b8', textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: '0.05em' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tasks.length > 0 ? (
                                tasks.map((task, index) => (
                                    <tr key={task.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <td style={{ padding: '1rem', color: isLightTheme ? '#1C2B48' : 'white' }}>{task.id || `T00${index + 1}`}</td>
                                        <td style={{ padding: '1rem', color: isLightTheme ? '#1C2B48' : 'white' }}>{task.propertyName}</td>
                                        <td style={{ padding: '1rem', color: isLightTheme ? '#1C2B48' : 'white' }}>{task.ownerName}</td>
                                        <td style={{ padding: '1rem', color: isLightTheme ? '#1C2B48' : 'white' }}>{task.customerName}</td>
                                        <td style={{ padding: '1rem', color: isLightTheme ? '#1C2B48' : 'white' }}><span className={`status-pill ${task.status.toLowerCase().replace(' ', '-')}`}>{task.status}</span></td>

                                        <td style={{ padding: '1rem' }}>

                                            <button
                                                style={{
                                                    background: '#3b82f6',
                                                    color: 'white',
                                                    border: 'none',
                                                    padding: '0.5rem 1rem',
                                                    borderRadius: '0.5rem',
                                                    cursor: 'pointer',
                                                    fontWeight: '500',
                                                    boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.5)'
                                                }}
                                                onClick={() => navigate(`/agent-task-details/${task.id}`
                                                    , {
                                                        state: {
                                                            task: {
                                                                ...task,
                                                                taskId: task.id || `T00${index + 1}`,
                                                                buyerName: task.customerName
                                                            }
                                                        }
                                                    })}
                                            >
                                                View Details
                                            </button>
                                        </td>

                                    </tr>
                                ))
                            ) : (


                                <tr>
                                    <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: isLightTheme ? '#1C2B48' : '#94a3b8' }}>
                                        No active tasks found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    )
}

export default AgentDashboard
