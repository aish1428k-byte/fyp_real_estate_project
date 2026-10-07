import React, { useState, useEffect } from 'react'
import './ManagerModals.css'

const AgentAssignment = ({ onClose }) => {
    const [tasks, setTasks] = useState([])
    const [agents, setAgents] = useState([])
    const [selectedTask, setSelectedTask] = useState(null)
    const [selectedAgent, setSelectedAgent] = useState('')

    useEffect(() => {
        // Load Tasks
        const storedTasks = JSON.parse(localStorage.getItem('managerTasks') || '[]')
        setTasks(storedTasks)

        // Load Agents
        const storedAgents = JSON.parse(localStorage.getItem('agents') || '[]')
        if (storedAgents.length === 0) {
            const defaultAgents = [
                { id: 1, name: 'Sarah Johnson' },
                { id: 2, name: 'Michael Chen' },
                { id: 3, name: 'Emily Rodriguez' }
            ]
            setAgents(defaultAgents)
        } else {
            setAgents(storedAgents)
        }
    }, [])

    const handleAssign = (task) => {
        setSelectedTask(task)
        setSelectedAgent(task.assignedAgentId || '')
    }

    const confirmAssignment = () => {
        if (!selectedAgent) return

        const agentObj = agents.find(a => a.id.toString() === selectedAgent.toString())
        const agentName = agentObj ? agentObj.name : 'Unknown Agent'

        const updatedTasks = tasks.map(t => {
            if (t.id === selectedTask.id) {
                return { ...t, assignedAgentId: selectedAgent, assignedAgentName: agentName, status: 'In Progress' }
            }
            return t
        })

        setTasks(updatedTasks)
        localStorage.setItem('managerTasks', JSON.stringify(updatedTasks))
        setSelectedTask(null)
        setSelectedAgent('')
        alert(`Task assigned to ${agentName}`)
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Assign Agents</h2>
                    <button className="modal-close-button" onClick={onClose}>&times;</button>
                </div>

                <div className="modal-body">
                    <div style={{ overflowX: 'auto' }}>
                        <table className="meetings-table">
                            <thead>
                                <tr>
                                    <th>Task</th>
                                    <th>Property</th>
                                    <th>Priority</th>
                                    <th>Assigned To</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tasks.map((task) => (
                                    <tr key={task.id}>
                                        <td>{task.title}</td>
                                        <td>{task.propertyName}</td>
                                        <td>
                                            <span style={{
                                                color: task.priority === 'Urgent' ? '#ef4444' : task.priority === 'High' ? '#f59e0b' : '#fff',
                                                fontWeight: 'bold'
                                            }}>
                                                {task.priority}
                                            </span>
                                        </td>
                                        <td>{task.assignedAgentName || 'Unassigned'}</td>
                                        <td>
                                            <button
                                                className="btn-primary"
                                                style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                                                onClick={() => handleAssign(task)}
                                            >
                                                {task.assignedAgentId ? 'Reassign' : 'Assign'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {tasks.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="text-center p-4">No tasks available. Create a task first.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Nested Modal for Selection */}
                {selectedTask && (
                    <div className="modal-overlay" style={{ zIndex: 10002 }} onClick={() => setSelectedTask(null)}>
                        <div className="modal-content" style={{ maxWidth: '450px' }} onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>Assign Task: {selectedTask.title}</h3>
                            </div>

                            <div className="modal-body">
                                <div className="form-group">
                                    <label>Select Agent:</label>
                                    <select
                                        value={selectedAgent}
                                        onChange={(e) => setSelectedAgent(e.target.value)}
                                        style={{
                                            color: '#fff',
                                            background: '#1e293b',
                                            border: '1px solid rgba(255,255,255,0.2)',
                                            padding: '10px',
                                            borderRadius: '6px',
                                            width: '100%'
                                        }}
                                    >
                                        <option value="" style={{ color: '#cbd5e1', background: '#1e293b' }}>-- Select Agent --</option>
                                        {agents.map(agent => (
                                            <option key={agent.id} value={agent.id} style={{ color: '#fff', background: '#1e293b' }}>
                                                {agent.name} ({agent.role || 'Agent'})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="modal-actions">
                                    <button
                                        onClick={() => setSelectedTask(null)}
                                        className="cancel-button"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={confirmAssignment}
                                        className="add-button"
                                        disabled={!selectedAgent}
                                    >
                                        Confirm
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default AgentAssignment
