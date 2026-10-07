import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'
import './UserDashboard.css'
import { useUser } from "./UserContext";

const UserDashboard = () => {

  
  const navigate = useNavigate()
  const [userInfo, setUserInfo] = useState(null);
  
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


  
  return (
    <div className="user-dashboard">
      
      <div className="dashboard-header-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div style={{ textAlign: 'left' }}>
          <h1 className="text-gradient" style={{ margin: 0, fontSize: '2.5rem' }}>Welcome Back</h1>
          <p style={{ margin: '5px 0 0 0', color: 'var(--text-muted)' }}>What would you like to do today?</p>
        </div>

        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background:'var(--bg-card)', border:'1px solid var(--border-light)', borderRadius:'50%', width:'40px', height:'40px', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-muted)' }}>
              {userInfo?.profile_picture ? (
                <img
                  src={userInfo.profile_picture}
                  alt=""
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:'20px', height:'20px'}}>
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
              <span style={{ fontWeight: '600', fontSize: '14px', color: 'white' }}>
                {userInfo?.name || "Loading..."}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {userInfo?.role}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div
          className="dashboard-card glass-panel"
          onClick={() => navigate('/buy')}
        >
          <div className="card-icon-wrapper buy-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <h3>Buy Property</h3>
          <p>Explore our premium listings and find your dream home.</p>
        </div>

        <div
          className="dashboard-card glass-panel"
          onClick={() => navigate('/sell')}
        >
          <div className="card-icon-wrapper sell-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <h3>Sell Property</h3>
          <p>List your property and reach potential buyers worldwide.</p>
        </div>

      </div>
    </div>
  )
}

export default UserDashboard

