// import React, { useEffect, useState } from 'react'
// import './ManagerModals.css'

// const TaskCreation = ({ onClose, prefillData }) => {
//     const [agents, setAgents] = useState([])
//     const [formData, setFormData] = useState({
//         title: '',
//         description: '',
//         assignedAgentId: '',
//         propertyId: prefillData?.propertyId || '',
//         propertyName: prefillData?.propertyName || '',
//         ownerId: prefillData?.ownerId || '',
//         ownerName: prefillData?.ownerName || '',
//         buyerId: prefillData?.buyerId || '',
//         customerName: prefillData?.customerName || ''
//     })

//     const token = localStorage.getItem('access')

//     // fetch agents
//     useEffect(() => {
//         const fetchAgents = async () => {
//             try {
//                 const response = await fetch('http://127.0.0.1:8000/agents/list/', {
//                     headers: { Authorization: `Bearer ${token}` }
//                 })
//                 const data = await response.json()
//                 setAgents(data)
//             } catch (error) {
//                 console.error('Failed to load agents', error)
//             }
//         }
//         fetchAgents()
//     }, [token])

//     const handleChange = (e) => {
//         const { name, value } = e.target
//         setFormData(prev => ({ ...prev, [name]: value }))
//     }
// const handleSubmit = async (e) => {
//     e.preventDefault()

//     // 1️⃣ Add this check at the very start of submit
//     if (!formData.ownerId || !formData.buyerId) {
//         alert('Owner or Buyer missing, cannot create task')
//         return
//     }

//     if (!formData.assignedAgentId) {
//         alert('Please select an agent')
//         return
//     }

//     try {
//         const payload = {
//             title: formData.title,
//             description: formData.description,
//             agent: parseInt(formData.assignedAgentId), // numeric
//             property: formData.propertyId,             // numeric
//             owner: formData.ownerId,                   // UUID
//             buyer: formData.buyerId                    // UUID
//         }

//         console.log('Task Payload:', payload) // debug

//         const response = await fetch('http://127.0.0.1:8000/tasks/create/', {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//                 Authorization: `Bearer ${token}`
//             },
//             body: JSON.stringify(payload)
//         })

//         const data = await response.json()

//         if (!response.ok) {
//             alert(JSON.stringify(data))
//             return
//         }

//         alert('Task created successfully ✅')
//         onClose()
//     } catch (error) {
//         console.error(error)
//         alert('Something went wrong while creating task')
//     }
// }

//     return (
//         <div className="modal-overlay" onClick={onClose}>
//             <div className="modal-content" onClick={e => e.stopPropagation()}>
//                 <div className="modal-header">
//                     <h2>Create New Task</h2>
//                     <button className="modal-close-button" onClick={onClose}>&times;</button>
//                 </div>

//                 <div className="modal-body">
//                     <form onSubmit={handleSubmit}>
//                         <div className="form-group">
//                             <label>Task Title</label>
//                             <input
//                                 type="text"
//                                 name="title"
//                                 value={formData.title}
//                                 onChange={handleChange}
//                                 required
//                                 placeholder="e.g. Schedule Viewing"
//                             />
//                         </div>

//                         <div className="form-group">
//                             <label>Assign Agent</label>
//                             <select
//                                 name="assignedAgentId"
//                                 value={formData.assignedAgentId}
//                                 onChange={handleChange}
//                                 required
//                             >
//                                 <option value="">Select an Agent</option>
//                                 {agents.map(agent => (
//                                     <option key={agent.id} value={agent.id}>{agent.name}</option>
//                                 ))}
//                             </select>
//                         </div>

//                         <div className="form-group">
//                             <label>Property</label>
//                             <input
//                                 type="text"
//                                 value={formData.propertyName}
//                                 readOnly
//                             />
//                         </div>

//                         <div className="form-group">
//                             <label>Description</label>
//                             <textarea
//                                 name="description"
//                                 value={formData.description}
//                                 onChange={handleChange}
//                                 rows="4"
//                                 placeholder="Instructions for the agent..."
//                             />
//                         </div>

//                         <div className="form-row">
//                             <div className="form-group">
//                                 <label>Customer</label>
//                                 <input type="text" value={formData.customerName} readOnly />
//                             </div>

//                             <div className="form-group">
//                                 <label>Owner</label>
//                                 <input type="text" value={formData.ownerName} readOnly />
//                             </div>
//                         </div>

//                         <div className="modal-actions">
//                             <button type="button" onClick={onClose} className="cancel-button">
//                                 Cancel
//                             </button>
//                             <button type="submit" className="add-button">
//                                 Create Task
//                             </button>
//                         </div>
//                     </form>
//                 </div>
//             </div>
//         </div>
//     )
// }

// export default TaskCreation
import React, { useEffect, useState } from 'react'
import './ManagerModals.css'

const TaskCreation = ({ onClose, prefillData }) => {
    const [agents, setAgents] = useState([])
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        assignedAgentId: '',
        propertyId: prefillData?.propertyId || '',
        propertyName: prefillData?.propertyName || '',
        ownerId: prefillData?.ownerId || '',
        ownerName: prefillData?.ownerName || '',
        buyerId: prefillData?.buyerId || '',
        customerName: prefillData?.customerName || ''
    })

    const token = localStorage.getItem('access')

    // fetch agents
    useEffect(() => {
        const fetchAgents = async () => {
            try {
                const response = await fetch('http://127.0.0.1:8000/agents/list/', {
                    headers: { Authorization: `Bearer ${token}` }
                })
                const data = await response.json()
                setAgents(data)
            } catch (error) {
                console.error('Failed to load agents', error)
            }
        }
        fetchAgents()
    }, [token])

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }
const handleSubmit = async (e) => {
    e.preventDefault()

    // 1️⃣ Add this check at the very start of submit
    if (!formData.ownerId || !formData.buyerId) {
        alert('Owner or Buyer missing, cannot create task')
        return
    }

    if (!formData.assignedAgentId) {
        alert('Please select an agent')
        return
    }

    try {
        const payload = {
            title: formData.title,
            description: formData.description,
            agent: parseInt(formData.assignedAgentId), // numeric
            property: formData.propertyId,             // numeric
            owner: formData.ownerId,                   // UUID
            buyer: formData.buyerId                    // UUID
        }

        console.log('Task Payload:', payload) // debug

        const response = await fetch('http://127.0.0.1:8000/tasks/create/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        })

        const data = await response.json()

        if (!response.ok) {
            alert(JSON.stringify(data))
            return
        }

        alert('Task created successfully ✅')
        onClose()
    } catch (error) {
        console.error(error)
        alert('Something went wrong while creating task')
    }
}

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '900px', maxHeight: '90vh' }}>
                <div className="modal-header">
                    <h2>Create New Task</h2>
                    <button className="modal-close-button" onClick={onClose}>&times;</button>
                </div>

                <div className="modal-body">
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Task Title</label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                required
                                placeholder="e.g. Schedule Viewing"
                            />
                        </div>

                        <div className="form-group">
                            <label>Assign Agent</label>
                            <select
                                name="assignedAgentId"
                                value={formData.assignedAgentId}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select an Agent</option>
                                {agents.map(agent => (
                                    <option key={agent.id} value={agent.id}>{agent.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Property</label>
                            <input
                                type="text"
                                value={formData.propertyName}
                                readOnly
                            />
                        </div>

                        <div className="form-group">
                            <label>Description</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows="4"
                                placeholder="Instructions for the agent..."
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Customer</label>
                                <input type="text" value={formData.customerName} readOnly />
                            </div>

                            <div className="form-group">
                                <label>Owner</label>
                                <input type="text" value={formData.ownerName} readOnly />
                            </div>
                        </div>

                        <div className="modal-actions">
                            <button type="button" onClick={onClose} className="cancel-button">
                                Cancel
                            </button>
                            <button type="submit" className="add-button">
                                Create Task
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default TaskCreation
