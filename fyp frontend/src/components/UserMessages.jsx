import  { useState,useEffect } from 'react'
import '../components/ManagerModals.css' // Reusing styles for consistency
import { useNavigate } from 'react-router-dom'
import MyProfile from './MyProfile'
import { useThemeStore } from '../features/theme/stores/useThemeStore'

const UserMessages = () => {
    const { theme } = useThemeStore()
    const isLightTheme = theme === 'light'
    const [chats, setChats] = useState([])
    const [selectedChatId, setSelectedChatId] = useState(null)
    const [replyText, setReplyText] = useState('')
    const navigate = useNavigate()

    useEffect(() => {
        fetch('http://127.0.0.1:8000/messages/my/', {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('access')}`
            }
        })
        .then(res => res.json())
        .then(data => {
            const grouped = {}

            data.forEach(msg => {
                const key = msg.property

                if (!grouped[key]) {
                    grouped[key] = {
                        id: key,
                        propertyTitle: msg.property_title,
                        lastUpdated: msg.created_at,
                        unreadCountUser: 0,
                        messages: []
                    }
                }

                grouped[key].messages.push({
                    id: msg.id,
                    sender: 'user',
                    text: msg.message,
                    timestamp: msg.created_at
                })

                if (msg.reply) {
                    grouped[key].messages.push({
                        id: msg.id + '-reply',
                        sender: 'manager',
                        text: msg.reply,
                        timestamp: msg.replied_at
                    })
                }
            })

            setChats(Object.values(grouped))
        })
    }, [])

    // sort chats
const sortedChats = [...chats].sort(
    (a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated)
)

// selected chat
const selectedChat = chats.find(c => c.id === selectedChatId)

// click handler
const handleChatSelect = (chatId) => {
    setSelectedChatId(chatId)
}

// send reply (frontend only for now)
const handleSendReply = (e) => {
    e.preventDefault()
    if (!replyText.trim() || !selectedChatId) return

    // FRONTEND UI update
    setChats(prev =>
        prev.map(chat =>
            chat.id === selectedChatId
                ? {
                    ...chat,
                    messages: [
                        ...chat.messages,
                        {
                            id: Date.now(), // temporary id
                            sender: 'user',
                            text: replyText,
                            timestamp: new Date().toISOString()
                        }
                    ]
                }
                : chat
        )
    )

    // BACKEND API call
    fetch(`http://127.0.0.1:8000/messages/send/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('access')}`
        },
        body: JSON.stringify({
            property: selectedChatId,   // property id
            message: replyText
        })
    })
    .then(res => res.json())
    .then(data => {
        console.log('Message sent:', data)
        // optionally update chat with server response if it has msg id etc.
    })
    .catch(err => {
        console.error('Error sending message:', err)
    })

    setReplyText('') // clear input
}


    return (
        <div className="dashboard-container" style={{ padding: '20px', height: '100vh', boxSizing: 'border-box', display: 'flex', flexDirection: 'column' }}>
           
<div
  className="dashboard-header mb-6"
  style={{
    position: 'relative'
  }}
>
  {/* PROFILE - RIGHT SIDE */}
  <div
    style={{
      position: 'absolute',
      top: '0',
      right: '0',
      zIndex: 10
    }}
  >
    <MyProfile />
  </div>

  {/* PAGE CONTENT */}
  <h1 className="text-gradient">
    My Messages
  </h1>


</div>
            <div className="glass-panel" style={{ flex: 1, display: 'flex', overflow: 'hidden', padding: 0 }}>
                {/* Chat List Sidebar */}
                <div style={{ width: '300px', borderRight: '1px solid rgba(255,255,255,0.1)', overflowY: 'auto', background: 'rgba(0,0,0,0.2)' }}>
                    {sortedChats.length === 0 ? (
                        <div style={{ padding: '20px', color: '#9ca3af', textAlign: 'center' }}>
                            <p>No messages yet.</p>
                        </div>
                    ) : (
                        sortedChats.map(chat => (
                            <div
                                key={chat.id}
                                onClick={() => handleChatSelect(chat.id)}
                                style={{
                                    padding: '15px',
                                    cursor: 'pointer',
                                    background: selectedChatId === chat.id ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                                    borderLeft: selectedChatId === chat.id ? '3px solid #3b82f6' : '3px solid transparent'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                    <span style={{ fontWeight: 'bold', color: isLightTheme ? '#1C2B48' : (chat.unreadCountUser > 0 ? '#fff' : '#cbd5e1') }}>Manager</span>
                                    {chat.unreadCountUser > 0 && (
                                        <span style={{ background: '#ef4444', color: 'white', borderRadius: '999px', padding: '0 6px', fontSize: '0.75rem' }}>
                                            {chat.unreadCountUser}
                                        </span>
                                    )}
                                </div>
                                <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {chat.propertyTitle}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                                    {new Date(chat.lastUpdated).toLocaleDateString()}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Chat Area */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'rgba(0,0,0,0.1)' }}>
                    {selectedChat ? (
                        <>
                            <div style={{ padding: '15px', borderBottom: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)' }}>
                                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{selectedChat.propertyTitle}</h3>
                                <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Conversation with Manager</span>
                            </div>

                            <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                {selectedChat.messages.map(msg => (
                                    <div
                                        key={msg.id}
                                        style={{
                                            alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                                            maxWidth: '70%',
                                            marginBottom: '5px'
                                        }}
                                    >
                                        <div style={{
                                            background: msg.sender === 'user' ? '#3b82f6' : (isLightTheme ? '#1C2B48' : 'rgba(255,255,255,0.1)'),
                                            color: 'white',
                                            padding: '10px 15px',
                                            borderRadius: msg.sender === 'user' ? '15px 15px 0 15px' : '15px 15px 15px 0'
                                        }}>
                                            {msg.text}
                                        </div>
                                        <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px', textAlign: msg.sender === 'user' ? 'right' : 'left' }}>
                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <form onSubmit={handleSendReply} style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.2)', display: 'flex', gap: '10px' }}>
                                <input
                                    type="text"
                                    value={replyText}
                                    onChange={e => setReplyText(e.target.value)}
                                    placeholder="Type your reply..."
                                    style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.3)', color: 'white' }}
                                />
                                <button type="submit" className="btn-primary" style={{ padding: '0 25px' }}>Send</button>
                            </form>
                        </>
                    ) : (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', flexDirection: 'column' }}>
                            <svg style={{ width: '64px', height: '64px', opacity: 0.5, marginBottom: '20px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                            </svg>
                            <p>Select a conversation to view messages</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default UserMessages
