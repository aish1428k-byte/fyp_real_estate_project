import React, { useState, useEffect } from 'react'
import './ManagerModals.css'

const ManagerMeetingDetails = ({ onClose }) => {
    const loadTasks = () => {
        const storedTasks = JSON.parse(localStorage.getItem('managerTasks') || '[]')
        return storedTasks
    }

    const [tasks, setTasks] = useState(loadTasks())
    const [selectedTask, setSelectedTask] = useState(null)
    const [taskMeetings, setTaskMeetings] = useState([])

    useEffect(() => {
        const handleStorageChange = () => {
            setTasks(loadTasks())
        }
        window.addEventListener('storage', handleStorageChange)
        // Also listen for custom event if in same window
        window.addEventListener('taskCreated', handleStorageChange)

        return () => {
            window.removeEventListener('storage', handleStorageChange)
            window.removeEventListener('taskCreated', handleStorageChange)
        }
    }, [])

    const handleViewTask = (task) => {
        setSelectedTask(task)
        // Load all meetings and filter for this task
        const allMeetings = JSON.parse(localStorage.getItem('agentMeetings') || '[]')
        // Ensure to match taskId (assuming string comparison)
        const relevantMeetings = allMeetings.filter(m => m.taskId === task.id)
        setTaskMeetings(relevantMeetings)
    }

    const handleBackToList = () => {
        setSelectedTask(null)
        setTaskMeetings([])
    }

    if (selectedTask) {
        return (
            <div className="modal-overlay" onClick={onClose}>
                <div className="modal-content" onClick={e => e.stopPropagation()}>
                    <div className="modal-header">
                        <h2>Task Details: {selectedTask.title}</h2>
                        <button className="modal-close-button" onClick={onClose}>&times;</button>
                    </div>
                    <div className="modal-body" style={{ color: '#fff' }}>
                        <div style={{ marginBottom: '20px' }}>
                            <button onClick={handleBackToList} className="cancel-button" style={{ marginBottom: '15px' }}>
                                &larr; Back to List
                            </button>
                        </div>
                        <div className="details-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div>
                                <h4 style={{ color: '#00BFA5' }}>Property Info</h4>
                                <p><strong>Property:</strong> {selectedTask.propertyName}</p>
                                <p><strong>Address:</strong> {selectedTask.propertyAddress || 'N/A'}</p>
                            </div>
                            <div>
                                <h4 style={{ color: '#00BFA5' }}>People Involved</h4>
                                <p><strong>Agent:</strong> {selectedTask.assignedAgentName}</p>
                                <p><strong>Customer:</strong> {selectedTask.customerName || 'N/A'}</p>
                                <p><strong>Owner:</strong> {selectedTask.ownerName || 'N/A'}</p>
                            </div>
                        </div>
                        <div style={{ marginTop: '20px' }}>
                            <h4 style={{ color: '#00BFA5' }}>Task Description</h4>
                            <div className="glass-panel" style={{ padding: '15px', marginTop: '10px' }}>
                                {selectedTask.description}
                            </div>
                        </div>

                        <div style={{ marginTop: '30px' }}>
                            <h4 style={{ color: '#00BFA5', marginBottom: '10px' }}>Meeting History</h4>
                            <div className="glass-panel" style={{ overflowX: 'auto' }}>
                                <table className="meetings-table" style={{ width: '100%' }}>
                                    <thead>
                                        <tr>
                                            <th>Meeting ID</th>
                                            <th>Date & Time</th>
                                            <th>Details</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {taskMeetings.length > 0 ? (
                                            taskMeetings.map(meeting => (
                                                <tr key={meeting.meetingId}>
                                                    <td>{meeting.meetingId}</td>
                                                    <td>{meeting.dateTime || 'Not set'}</td>
                                                    <td>{meeting.details}</td>
                                                    <td>
                                                        <span style={{
                                                            background: meeting.status === 'Completed' ? 'rgba(16, 185, 129, 0.2)' :
                                                                meeting.status === 'Cancelled' ? 'rgba(239, 68, 68, 0.2)' :
                                                                    'rgba(59, 130, 246, 0.2)',
                                                            color: meeting.status === 'Completed' ? '#10b981' :
                                                                meeting.status === 'Cancelled' ? '#ef4444' :
                                                                    '#3b82f6',
                                                            padding: '4px 10px',
                                                            borderRadius: '20px',
                                                            fontSize: '0.85rem'
                                                        }}>
                                                            {meeting.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: '#9ca3af' }}>
                                                    No meetings recorded for this task yet.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div style={{ marginTop: '30px' }}>
                            <h4 style={{ color: '#00BFA5', marginBottom: '10px' }}>Task Progress</h4>
                            <div className="glass-panel" style={{ padding: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '8px' }}>
                                    <span style={{ color: '#94a3b8' }}>Completion</span>
                                    <span style={{ color: 'white' }}>{selectedTask.progress || 0}%</span>
                                </div>
                                <div style={{ width: '100%', background: 'rgba(255,255,255,0.1)', borderRadius: '999px', height: '10px' }}>
                                    <div
                                        style={{
                                            width: `${selectedTask.progress || 0}%`,
                                            background: '#3b82f6',
                                            height: '100%',
                                            borderRadius: '999px',
                                            transition: 'width 0.5s ease'
                                        }}
                                    ></div>
                                </div>
                            </div>
                        </div>

                        <div style={{ marginTop: '20px' }}>
                            <h4 style={{ color: '#00BFA5' }}>Task Status</h4>
                            <p>{selectedTask.status} (Priority: {selectedTask.priority})</p>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '900px' }}>
                <div className="modal-header">
                    <h2>Scheduled Tasks & Meetings</h2>
                    <button className="modal-close-button" onClick={onClose}>&times;</button>
                </div>

                <div className="modal-body">
                    <div style={{ overflowX: 'auto' }}>
                        <table className="meetings-table">
                            <thead>
                                <tr>
                                    <th>Property Title</th>
                                    <th>Agent Name</th>
                                    <th>Customer Name</th>
                                    <th>Property Owner</th>
                                    <th>Address</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tasks.map((task) => (
                                    <tr key={task.id}>
                                        <td>{task.propertyName}</td>
                                        <td>{task.assignedAgentName}</td>
                                        <td>{task.customerName || '-'}</td>
                                        <td>{task.ownerName || '-'}</td>
                                        <td>{task.propertyAddress || '-'}</td>
                                        <td>
                                            <button
                                                className="add-button"
                                                style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                                                onClick={() => handleViewTask(task)}
                                            >
                                                View Task
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {tasks.length === 0 && (
                                    <tr>
                                        <td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                                            No tasks scheduled.
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

export default ManagerMeetingDetails
