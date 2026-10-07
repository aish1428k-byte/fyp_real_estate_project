
import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import './AgentTaskDetails.css'

const UserMeetingDetails = () => {
    const navigate = useNavigate()
    const { taskId } = useParams()   // ✅ FIX HERE

    const [meetings, setMeetings] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        if (!taskId) return

        const access = localStorage.getItem('access')
        if (!access) {
            setError('Unauthorized')
            setLoading(false)
            return
        }

        const fetchMeetings = async () => {
            try {
                const res = await fetch(
                    `http://127.0.0.1:8000/meetings/view/${taskId}/`,
                    {
                        headers: {
                            Authorization: `Bearer ${access}`,
                        },
                    }
                )

                if (!res.ok) {
                    throw new Error('Failed to fetch meetings')
                }

                const data = await res.json()
                setMeetings(data)
            } catch (err) {
                console.error(err)
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }

        fetchMeetings()
    }, [taskId])

    if (loading) return <p>Loading meetings...</p>
    if (error) return <p style={{ color: 'red' }}>{error}</p>

    return (
        <div className="agent-task-details">
            <div className="task-details-container">
                <div className="task-details-header">
                    <h1 className="text-gradient">My Meeting Details</h1>
                    <p>Track your scheduled meetings and interaction history.</p>
                </div>

                <div className="meetings-section" style={{ marginTop: '20px' }}>
                    <div className="glass-panel meetings-table-container">
                        <table className="meetings-table">
                            <thead>
                                <tr>
                                    <th>Meeting Date</th>
                                    <th>Details</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {meetings.map((meeting) => (
                                    <tr key={meeting.id}>
                                        <td>
                                            {new Date(meeting.meeting_date).toLocaleString()}
                                        </td>
                                         <td
  style={{
    minWidth: '500px',
    maxWidth: '700px',
    whiteSpace: 'normal',
    wordBreak: 'break-word',
    overflowWrap: 'break-word',
    lineHeight: '1.5',
    padding: '12px',
  }}
>{meeting.details || '—'}</td>
                                        <td>
                                            <span
                                                className="status-badge"
                                                style={{
                                                    background: 'rgba(16, 185, 129, 0.2)',
                                                    color: '#10b981',
                                                    padding: '4px 8px',
                                                    borderRadius: '4px',
                                                    fontSize: '0.9rem',
                                                }}
                                            >
                                                {meeting.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}

                                {meetings.length === 0 && (
                                    <tr>
                                        <td colSpan="3" style={{ textAlign: 'center', padding: '20px' }}>
                                            No meetings scheduled.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default UserMeetingDetails
