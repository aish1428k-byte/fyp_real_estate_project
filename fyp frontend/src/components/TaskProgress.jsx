import React, { useState, useEffect } from 'react'
import './ManagerModals.css'

const TaskProgress = ({ onClose }) => {
    const [tasks, setTasks] = useState([])

    useEffect(() => {
        const storedTasks = JSON.parse(localStorage.getItem('managerTasks') || '[]')
        setTasks(storedTasks)
    }, [])

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Task Progress</h2>
                    <button className="modal-close-button" onClick={onClose}>&times;</button>
                </div>

                <div className="modal-body">
                    <div className="dashboard-grid">
                        {tasks.length === 0 ? (
                            <div className="glass-panel p-8 text-center" style={{ padding: '32px', textAlign: 'center' }}>
                                <p style={{ color: '#94a3b8' }}>No tasks found. Go to "Create Task" to get started.</p>
                            </div>
                        ) : (
                            tasks.map(task => (
                                <div key={task.id} style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    padding: '20px',
                                    borderRadius: '12px',
                                    border: '1px solid rgba(255,255,255,0.1)'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                        <div>
                                            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: '0 0 4px 0' }}>{task.title}</h3>
                                            <p style={{ color: '#94a3b8', fontSize: '0.875rem', margin: 0 }}>{task.propertyName}</p>
                                        </div>
                                        <span style={{
                                            padding: '4px 12px',
                                            borderRadius: '20px',
                                            fontSize: '0.8rem',
                                            fontWeight: '600',
                                            background: task.status === 'Completed' ? 'rgba(16, 185, 129, 0.2)' :
                                                task.status === 'In Progress' ? 'rgba(59, 130, 246, 0.2)' :
                                                    'rgba(148, 163, 184, 0.2)',
                                            color: task.status === 'Completed' ? '#10b981' :
                                                task.status === 'In Progress' ? '#60a5fa' :
                                                    '#cbd5e1'
                                        }}>
                                            {task.status}
                                        </span>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '0.9rem', marginBottom: '16px' }}>
                                        <div>
                                            <span style={{ color: '#94a3b8', display: 'block', marginBottom: '2px' }}>Assigned To:</span>
                                            <span style={{ color: 'white' }}>{task.assignedAgentName}</span>
                                        </div>
                                        <div>
                                            <span style={{ color: '#94a3b8', display: 'block', marginBottom: '2px' }}>Deadline:</span>
                                            <span style={{ color: 'white' }}>{task.deadline || 'No deadline'}</span>
                                        </div>
                                    </div>

                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                                            <span style={{ color: '#94a3b8' }}>Completion</span>
                                            <span style={{ color: 'white' }}>{task.progress}%</span>
                                        </div>
                                        <div style={{ width: '100%', background: 'rgba(255,255,255,0.1)', borderRadius: '999px', height: '8px' }}>
                                            <div
                                                style={{
                                                    width: `${task.progress}%`,
                                                    background: '#3b82f6',
                                                    height: '100%',
                                                    borderRadius: '999px',
                                                    transition: 'width 0.5s ease'
                                                }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default TaskProgress
