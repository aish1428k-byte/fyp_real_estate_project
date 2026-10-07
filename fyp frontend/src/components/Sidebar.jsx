import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useThemeStore } from '../features/theme/stores/useThemeStore'
import './Sidebar.css'

const Sidebar = ({ role }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { theme, toggleTheme } = useThemeStore()

  // Use prop role, fallback to localStorage if prop is missing (e.g. strict mode remount), fallback to 'user'
  let activeRole = role || localStorage.getItem('userRole') || 'user'

  // FAILSAFE: If we are on role-specific pages, enforce that role.
  if (location.pathname === '/manager-dashboard') {
    activeRole = 'manager'
    localStorage.setItem('userRole', 'manager') // Healing self-correction
  } else if (location.pathname === '/agent-dashboard' || location.pathname === '/add-documents') {
    activeRole = 'agent'
    localStorage.setItem('userRole', 'agent')
  }

  const regularMenuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { path: '/buy', label: 'View Properties', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
    { path: '/sell', label: 'Sell Property', icon: 'M12 6v6m0 0v6m0-6h6m-6 0H6' },
    { path: '/agent-description', label: 'Agents', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' }
  ]

  const baseAgentMenuItems = [
    {
      path: '/agent-dashboard',
      label: 'Dashboard',
      icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
      action: null
    }
  ]

  const taskSpecificItems = [
    {
      path: null,
      label: 'Transaction',
      icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      action: 'transaction'
    }
  ]

  const managerMenuItems = [
    { path: '/manager-dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { path: '/buy', label: 'All Properties', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' }
  ]

  const financeMenuItems = [
    { path: '/finance', label: 'Finance Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { path: '/ownership-transfer', label: 'Ownership Transfer', icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4' },
    { path: '/payment-transfer', label: 'Payment Transfer', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' }
  ]

  // Determine which menu to show based on ROLE, not path
  let menuItems = regularMenuItems
  const isFinanceRoute = location.pathname.startsWith('/finance') || location.pathname.startsWith('/ownership-transfer') || location.pathname.startsWith('/payment-transfer')
  const isLeaseRoute = location.pathname.startsWith('/lease')

  if (isLeaseRoute) {
    menuItems = [regularMenuItems[0]] // Just the Dashboard option
  } else if (isFinanceRoute) {
    menuItems = financeMenuItems
  } else if (activeRole === 'manager') {
    menuItems = managerMenuItems
  } else if (activeRole === 'agent') {
    menuItems = baseAgentMenuItems
  }

  const handleMenuItemClick = (item) => {
    if (item.action) {
      if (item.action === 'add-documents') {
        alert('Add Documents feature coming soon!')
      } else if (item.action === 'transaction') {
        alert('Transaction feature coming soon!')
      }
    } else if (item.path) {
      navigate(item.path)
    }
  }

  // const handleLogout = () => {
  //   localStorage.removeItem('userRole')
  //   navigate('/login')
  // }
const handleLogout = async () => {
  try {
    const token = localStorage.getItem("access")
    const sessionId = localStorage.getItem("session_id")

    // ✅ Only logout API call (this already logs to blockchain)
    await fetch('http://127.0.0.1:8000/users/logout/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-Session-ID': sessionId
      }
    })

  } catch (err) {

    console.error("Logout error:", err)
  }

  // ✅ Clear local storage
  localStorage.removeItem('userRole')
  localStorage.removeItem('access')
  localStorage.removeItem('refresh')
  localStorage.removeItem('session_id')
  window.dispatchEvent(new Event("authChanged"));
  navigate('/login')
}
  return (
    <div className="sidebar glass-panel">
      <div className="sidebar-header">
        <div className="logo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" strokeWidth="2" />
            <polyline points="9 22 9 12 15 12 15 22" strokeWidth="2" />
          </svg>
          <span className="text-gradient">BrickChain</span>
        </div>
      </div>
      <nav className="sidebar-nav">
        {menuItems.map((item, index) => (
          <button
            key={item.path || item.label || index}
            className={`nav-item ${item.path && location.pathname === item.path ? 'active' : ''}`}
            onClick={() => handleMenuItemClick(item)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d={item.icon} />
            </svg>
            <span>{item.label}</span>
          </button>
        ))}
        {/* Static links added based on user instruction */}
        {!isFinanceRoute && !isLeaseRoute && activeRole !== 'manager' && activeRole !== 'agent' && (
          <Link to="/sell" className={`nav-item ${location.pathname.includes('/sell') ? 'active' : ''}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /> {/* Icon for properties */}
            </svg>
            <span>My Properties</span>
          </Link>
        )}
        {!isFinanceRoute && !isLeaseRoute && activeRole !== 'manager' && activeRole !== 'agent' && (
          <Link to="/manage-property" className={`nav-item ${location.pathname.includes('/manage-property') ? 'active' : ''}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M9 17v-5h6v5" />
              <path d="M9 7h6" />
            </svg>
            <span>Manage property</span>
          </Link>
        )}
        {!isFinanceRoute && !isLeaseRoute && activeRole !== 'agent' && activeRole !== 'manager' && (
          <Link to="/messages" className={`nav-item ${location.pathname.includes('/messages') ? 'active' : ''}`}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /> {/* Icon for messages */}
            </svg>
            <span>Messages</span>
          </Link>
        )}
      </nav>
      <div className="sidebar-footer">
        <button className="theme-toggle-button" onClick={toggleTheme} title="Toggle Theme" style={{ marginBottom: '10px', background: 'transparent', border: '1px solid var(--border-light)', padding: '8px', borderRadius: '8px', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
          {theme === 'dark' ? (
            <>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '20px', height: '20px', marginRight: '8px' }}>
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
              <span>Light Mode</span>
            </>
          ) : (
            <>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '20px', height: '20px', marginRight: '8px' }}>
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
              </svg>
              <span>Dark Mode</span>
            </>
          )}
        </button>
        <button className="logout-button" onClick={handleLogout}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span>Logout</span>
        </button>
      </div>
    </div>
  )
}

export default Sidebar
