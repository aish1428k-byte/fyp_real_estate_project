import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './ManagerDashboard.css'
import AddAgent from './AddAgent'
import TaskCreation from './TaskCreation'
import ManagerMeetingDetails from './ManagerMeetingDetails'
import ManagerMessages from './ManagerMessages'
import { useThemeStore } from '../features/theme/stores/useThemeStore'

import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts'

const ManagerDashboard = () => {
    const { theme } = useThemeStore()
    const isLightTheme = theme === 'light'
    const navigate = useNavigate()
    const [activeModal, setActiveModal] = useState(null)
    const [analytics, setAnalytics] = useState({
        loading: true,
        totalProperties: 0,
        activeProperties: 0,
        soldProperties: 0,
        cityStats: {},
        agentStats: {}
    })
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

    const closeModal = () => setActiveModal(null)

    useEffect(() => {
        const fetchAnalyticsData = async () => {
            try {
                const token = localStorage.getItem('access')
                const headers = { Authorization: `Bearer ${token}` }

                // 1. Fetch Properties
                const propsRes = await fetch('http://127.0.0.1:8000/property/search/', { headers })
                const propsData = await propsRes.json()
                const properties = Array.isArray(propsData) ? propsData : (propsData.results || [])

                // 2. Fetch Tasks (for Sales/Agent info)
                const tasksRes = await fetch('http://127.0.0.1:8000/tasks/viewall/', { headers })
                const tasksData = await tasksRes.json()
                const tasks = Array.isArray(tasksData) ? tasksData : []

                // --- COMPUTATIONS ---

                // KPI 1: Property Stats
                const total = properties.length
                const active = properties.filter(p => p.status === 'available').length
                const sold = properties.filter(p => p.status === 'sold').length

                // KPI 2: Location Stats
                const cityCounts = {}
                properties.forEach(p => {
                    const city = p.city || 'Unknown'
                    cityCounts[city] = (cityCounts[city] || 0) + 1
                })

                // KPI 3: Agent Performance
                const agentPerf = {}

                // Count Listed by Agent
                properties.forEach(p => {
                    const agentName = p.agent?.username || p.agent_name || (p.owner?.user_type === 'agent' ? p.owner.username : null)
                    if (agentName) {
                        if (!agentPerf[agentName]) agentPerf[agentName] = { listed: 0, sold: 0 }
                        agentPerf[agentName].listed += 1
                    }
                })

                // Count Sold by Agent (from Tasks)
                tasks.forEach(t => {
                    if (t.status === 'Completed' || t.status === 'Sold') {
                        const agentName = t.agent?.username || t.agent_name || t.agent
                        if (agentName) {
                            if (!agentPerf[agentName]) agentPerf[agentName] = { listed: 0, sold: 0 }
                            agentPerf[agentName].sold += 1
                        }
                    }
                })

                setAnalytics({
                    loading: false,
                    totalProperties: total,
                    activeProperties: active,
                    soldProperties: sold,
                    cityStats: cityCounts,
                    agentStats: agentPerf
                })

            } catch (err) {
                console.error("Analytics Load Error", err)
                setAnalytics(prev => ({ ...prev, loading: false }))
            }
        }

        fetchAnalyticsData()
    }, [])

    // Prepare data for Recharts
    const cityChartData = Object.entries(analytics.cityStats).map(([name, value]) => ({ name, value }))
    const statusChartData = [
        { name: 'Available', value: analytics.activeProperties },
        { name: 'Sold', value: analytics.soldProperties }
    ]
    const agentChartData = Object.entries(analytics.agentStats).map(([name, stats]) => ({
        name,
        listed: stats.listed,
        sold: stats.sold
    }))

    const STATUS_COLORS = isLightTheme ? ['#8EB1D1', '#A7C7E7'] : ['#10b981', '#ef4444']

    return (
        <div className="manager-dashboard">
            <div className="dashboard-header-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                <div style={{ textAlign: 'left' }}>
                    <h1 className="text-gradient" style={{ margin: 0 }}>Manager Dashboard</h1>
                    <p style={{ margin: '5px 0 0 0', color: isLightTheme ? '#1C2B48' : '#94a3b8' }}>Overview and Administration</p>
                </div>
                
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ background: isLightTheme ? '#C4D8E5' : 'var(--bg-card)', border: isLightTheme ? '1px solid #8EB1D1' : '1px solid var(--border-light)', borderRadius:'50%', width:'40px', height:'40px', display:'flex', alignItems:'center', justifyContent:'center', color: isLightTheme ? '#1C2B48' : 'var(--text-muted)' }}>
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

            {/* --- ANALYTICS SECTION --- */}
            <div className="analytics-section" style={{ marginBottom: '40px' }}>

                {/* 1. KPIs */}
                <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                    <div className="glass-panel text-center" style={{ padding: '20px' }}>
                        <h3 style={{ fontSize: '2.5rem', margin: '0 0 10px 0', color: isLightTheme ? '#ffffff' : '#3b82f6' }}>{analytics.totalProperties}</h3>
                        <p style={{ color: isLightTheme ? 'rgba(255, 255, 255, 0.7)' : '#94a3b8', margin: 0 }}>Total Properties</p>
                    </div>
                    <div className="glass-panel text-center" style={{ padding: '20px' }}>
                        <h3 style={{ fontSize: '2.5rem', margin: '0 0 10px 0', color: isLightTheme ? '#ffffff' : '#10b981' }}>{analytics.activeProperties}</h3>
                        <p style={{ color: isLightTheme ? 'rgba(255, 255, 255, 0.7)' : '#94a3b8', margin: 0 }}>Active Listings</p>
                    </div>
                    <div className="glass-panel text-center" style={{ padding: '20px' }}>
                        <h3 style={{ fontSize: '2.5rem', margin: '0 0 10px 0', color: isLightTheme ? '#ffffff' : '#ef4444' }}>{analytics.soldProperties}</h3>
                        <p style={{ color: isLightTheme ? 'rgba(255, 255, 255, 0.7)' : '#94a3b8', margin: 0 }}>Sold Properties</p>
                    </div>
                </div>

                <div className="charts-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>

                    {/* 1. Properties by Location (Bar Chart) */}
                    <div className="glass-panel" style={{ padding: '24px', minHeight: '350px' }}>
                        <h3 style={{ marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>Properties by Location</h3>
                        <div style={{ width: '100%', height: 250 }}>
                            <ResponsiveContainer>
                                <BarChart data={cityChartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={isLightTheme ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.1)'} vertical={false} />
                                    <XAxis dataKey="name" stroke={isLightTheme ? '#ffffff' : '#94a3b8'} fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke={isLightTheme ? '#ffffff' : '#94a3b8'} fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        itemStyle={{ color: '#e2e8f0' }}
                                    />
                                    <Bar dataKey="value" fill={isLightTheme ? '#8EB1D1' : '#8b5cf6'} radius={[4, 4, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* 2. Property Status Distribution (Pie Chart) */}
                    <div className="glass-panel" style={{ padding: '24px', minHeight: '350px' }}>
                        <h3 style={{ marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>Property Status Distribution</h3>
                        <div style={{ width: '100%', height: 250 }}>
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie
                                        data={statusChartData}
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {statusChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        itemStyle={{ color: '#e2e8f0' }}
                                    />
                                    <Legend iconType="circle" />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* 3. Agent Performance Chart (Grouped Bar Chart) */}
                                    </div>
            </div>

            <div className="dashboard-grid">


                <div className="dashboard-card glass-panel" onClick={() => setActiveModal('addAgent')}>
                    <div className="card-icon-wrapper add-agent-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="8.5" cy="7" r="4" />
                            <line x1="20" y1="8" x2="20" y2="14" />
                            <line x1="23" y1="11" x2="17" y2="11" />
                        </svg>
                    </div>
                    <h3>Add Agent</h3>
                    <p>Register new agents to the system.</p>
                </div>

                <div className="dashboard-card glass-panel" onClick={() => navigate('/manager-active-tasks')}>
                    <div className="card-icon-wrapper meetings-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                            <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                    </div>
                    <h3>Task Details</h3>
                    <p>View active tasks and their status.</p>
                </div>

                <div className="dashboard-card glass-panel" onClick={() => setActiveModal('messages')}>
                    <div className="card-icon-wrapper text-pink-500 bg-pink-500/10" style={{ color: '#ec4899', background: 'rgba(236, 72, 153, 0.1)' }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                        </svg>
                    </div>
                    <h3>Messages</h3>
                    <p>Chat with potential buyers.</p>
                </div>

            </div>

            {/* Modals */}
            {activeModal === 'createTask' && <TaskCreation onClose={closeModal} />}
            {activeModal === 'addAgent' && <AddAgent onClose={closeModal} />}
            {activeModal === 'meetingDetails' && <ManagerMeetingDetails onClose={closeModal} />}
            {activeModal === 'messages' && <ManagerMessages onClose={closeModal} />}
        </div>
    )
}

export default ManagerDashboard
