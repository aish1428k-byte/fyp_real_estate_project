import React, { useEffect, useState } from 'react'
import './ManagerModals.css'
import TaskCreation from './TaskCreation'
import { useThemeStore } from '../features/theme/stores/useThemeStore'

const ManagerMessages = ({ onClose }) => {
    const { theme } = useThemeStore()
    const isLightTheme = theme === 'light'
    const [chats, setChats] = useState([])
    const [selectedChatId, setSelectedChatId] = useState(null)
    const [replyText, setReplyText] = useState('')
    const [showCreateTask, setShowCreateTask] = useState(false)

    const token = localStorage.getItem('access')

    /* ================= FETCH ALL USER MESSAGES ================= */
    useEffect(() => {
        fetch('http://127.0.0.1:8000/messages/manager/all/', {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => {
            console.log('RAW BACKEND DATA:', data)

            const groupedChats = {}

            data.forEach(msg => {
                const chatKey = `${msg.user_id}_${msg.property}`

                if (!groupedChats[chatKey]) {
                    groupedChats[chatKey] = {
                        id: chatKey,
                        user_id: msg.user_id,        // UUID
                        userName: msg.user,
                        propertyId: msg.property,   // numeric
                        propertyTitle: msg.property_title,
                        owner_id: msg.owner_id,      // UUID
                        ownerName: msg.owner_name,
                        lastUpdated: msg.created_at,
                        messages: []
                    }
                }

                // Add user message
                groupedChats[chatKey].messages.push({
                    id: `u-${msg.id}`,
                    sender: 'user',
                    text: msg.message,
                    timestamp: msg.created_at
                })

                // Add manager reply if exists
                if (msg.reply) {
                    groupedChats[chatKey].messages.push({
                        id: `m-${msg.id}`,
                        sender: 'manager',
                        text: msg.reply,
                        timestamp: msg.replied_at
                    })
                }

                // Update lastUpdated
                groupedChats[chatKey].lastUpdated = msg.replied_at || msg.created_at
            })

            setChats(Object.values(groupedChats))
        })
    }, [token])

    const selectedChat = chats.find(c => c.id === selectedChatId)
            
    const handleSendReply = (e) => {
        e.preventDefault()
        if (!replyText.trim() || !selectedChat) return

        const lastUserMessage = selectedChat.messages
            .filter(m => m.sender === 'user')
            .slice(-1)[0]
        if (!lastUserMessage) return

        fetch(`http://127.0.0.1:8000/messages/manager/reply/${lastUserMessage.id.replace('u-', '')}/`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ reply: replyText })
        })
        .then(res => res.json())
        .then(() => {
            setChats(prev =>
                prev.map(chat =>
                    chat.id === selectedChat.id
                        ? {
                            ...chat,
                            messages: [
                                ...chat.messages,
                                {
                                    id: Date.now(),
                                    sender: 'manager',
                                    text: replyText,
                                    timestamp: new Date().toISOString()
                                }
                            ]
                        }
                        : chat
                )
            )
            setReplyText('')
        })
    }

    return (
        <>
            <div className="modal-overlay" onClick={onClose}>
                <div className="modal-content" onClick={e => e.stopPropagation()}
                    style={{ maxWidth: '1200px', height: '85vh', display: 'flex', flexDirection: 'column', padding: 0 }}>

                    <div className="modal-header" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between' }}>
                        <h2>Messages</h2>
                        {selectedChat && (
                            <button
                                className="btn-primary"
                                onClick={() => setShowCreateTask(true)}
                            >
                                Create Task
                            </button>
                        )}
                        <button className="modal-close-button" onClick={onClose}>&times;</button>
                    </div>

                    <div className="modal-body" style={{ flex: 1, display: 'flex', padding: 0 }}>

                        {/* CHAT LIST */}
                        <div style={{ width: '300px', borderRight: '1px solid rgba(255,255,255,0.1)', overflowY: 'auto' }}>
                            {chats.map(chat => (
                                <div
                                    key={chat.id}
                                    onClick={() => setSelectedChatId(chat.id)}
                                    style={{
                                        padding: '15px',
                                        cursor: 'pointer',
                                        background: selectedChatId === chat.id ? 'rgba(59,130,246,0.1)' : 'transparent'
                                    }}
                                >
                                    <strong style={{ color: isLightTheme ? '#1C2B48' : '#fff' }}>{chat.userName}</strong>
                                    <div style={{ fontSize: '0.8rem' }}>{chat.propertyTitle}</div>
                                </div>
                            ))}
                        </div>

                        {/* MESSAGE AREA */}
                        {selectedChat ? (
                            <>
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', padding: '20px' }}>
                                    <div style={{ flex: 1, overflowY: 'auto', marginBottom: '20px' }}>
                                        {selectedChat.messages.map((msg, index) => (
                                            <div
                                                key={index}
                                                style={{
                                                    marginBottom: '15px',
                                                    textAlign: msg.sender_role === 'manager' ? 'right' : 'left'
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        display: 'inline-block',
                                                        padding: '10px 15px',
                                                        borderRadius: '12px',
                                                        background: msg.sender_role === 'manager' ? '#3b82f6' : (isLightTheme ? '#1C2B48' : 'rgba(255,255,255,0.1)'),
                                                        color: '#fff',
                                                        maxWidth: '70%',
                                                        textAlign: 'left'
                                                    }}
                                                >
                                                    <div>{msg.text}</div>
                                                    <small style={{ fontSize: '0.7rem', opacity: 0.6 }}>
                                                        {new Date(msg.timestamp).toLocaleTimeString()}
                                                    </small>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <form onSubmit={handleSendReply} style={{ display: 'flex', gap: '10px' }}>
                                        <input
                                            type="text"
                                            value={replyText}
                                            onChange={e => setReplyText(e.target.value)}
                                            placeholder="Type a reply..."
                                            style={{
                                                flex: 1,
                                                padding: '10px',
                                                borderRadius: '8px',
                                                border: isLightTheme ? '1px solid #ccc' : '1px solid rgba(255,255,255,0.2)',
                                                background: isLightTheme ? '#fff' : 'rgba(0,0,0,0.2)',
                                                color: isLightTheme ? '#1C2B48' : '#fff'
                                            }}
                                        />
                                        <button type="submit" className="btn-primary">Send</button>
                                    </form>
                                </div>
                            </>
                        ) : (
                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                Select a conversation
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {showCreateTask && selectedChat && (
                <TaskCreation
                    onClose={() => setShowCreateTask(false)}
                    prefillData={{
                        propertyId: selectedChat.propertyId,
                        propertyName: selectedChat.propertyTitle,
                        customerName: selectedChat.userName,
                        buyerId: selectedChat.user_id,   // UUID
                        ownerId: selectedChat.owner_id,   // UUID
                        ownerName: selectedChat.ownerName
                    }}
                />
            )}
        </>
    )
}

export default ManagerMessages
