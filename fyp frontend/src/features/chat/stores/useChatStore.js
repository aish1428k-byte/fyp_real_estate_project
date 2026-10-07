import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useChatStore = create(
    persist(
        (set, get) => ({
            chats: [],

            initiateChat: (property, userDetails, initialMessage) => {
                const chats = get().chats
                const existingChat = chats.find(c =>
                    c.propertyId === (property.id || property.propertyId) && c.userEmail === userDetails.email
                )

                if (existingChat) {
                    get().sendMessage(existingChat.id, 'user', initialMessage)
                    return existingChat.id
                }

                const newChat = {
                    id: `chat_${Date.now()}`,
                    propertyId: property.id || property.propertyId,
                    propertyTitle: property.title || property.name || 'Unknown Property',
                    userEmail: userDetails.email,
                    userName: userDetails.name,
                    managerId: 'manager_1',
                    messages: [
                        {
                            id: `msg_${Date.now()}`,
                            sender: 'user',
                            text: initialMessage,
                            timestamp: new Date().toISOString(),
                            read: false
                        }
                    ],
                    lastUpdated: new Date().toISOString(),
                    unreadCountManager: 1,
                    unreadCountUser: 0
                }

                set({ chats: [...chats, newChat] })
                return newChat.id
            },

            sendMessage: (chatId, sender, text) => {
                const chats = get().chats
                const updatedChats = chats.map(chat => {
                    if (chat.id === chatId) {
                        return {
                            ...chat,
                            messages: [
                                ...chat.messages,
                                {
                                    id: `msg_${Date.now()}_${Math.random()}`,
                                    sender,
                                    text,
                                    timestamp: new Date().toISOString(),
                                    read: false
                                }
                            ],
                            lastUpdated: new Date().toISOString(),
                            unreadCountManager: sender === 'user' ? (chat.unreadCountManager || 0) + 1 : (chat.unreadCountManager || 0),
                            unreadCountUser: sender === 'manager' ? (chat.unreadCountUser || 0) + 1 : (chat.unreadCountUser || 0)
                        }
                    }
                    return chat
                })
                set({ chats: updatedChats })

                // Trigger generic storage event for cross-component updates if needed
                window.dispatchEvent(new Event('storage'))
            },

            markAsRead: (chatId, reader) => {
                const chats = get().chats
                const updatedChats = chats.map(chat => {
                    if (chat.id === chatId) {
                        return {
                            ...chat,
                            unreadCountManager: reader === 'manager' ? 0 : chat.unreadCountManager,
                            unreadCountUser: reader === 'user' ? 0 : chat.unreadCountUser
                        }
                    }
                    return chat
                })
                set({ chats: updatedChats })
                window.dispatchEvent(new Event('storage'))
            }
        }),
        {
            name: 'real-estate-chat-storage',
            getStorage: () => localStorage,
        }
    )
)
