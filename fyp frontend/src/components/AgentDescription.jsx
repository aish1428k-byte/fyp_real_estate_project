
import React, { useState, useEffect } from 'react'
import './AgentDescription.css'
import UserMeetingDetails from './UserMeetingDetails'
import { useNavigate } from 'react-router-dom'
import MyProfile from './MyProfile'
const AgentDescription = () => {
      const navigate = useNavigate();   // ✅ add this

  const [properties, setProperties] = useState([])

  const [userRole, setUserRole] = useState('user')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
const handleViewMeetings = async (propertyId) => {
  const token = localStorage.getItem('access');

  try {
    const res = await fetch(
      `http://127.0.0.1:8000/property/property-task/${propertyId}/`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await res.json();


console.log("Complete Response:", data);
console.log("Task ID:", data.task_id);
    navigate(`/meetings/view/${data.task_id}`);

  } catch (err) {
    console.error(err);
    alert(err.message);
  }
};


  useEffect(() => {
    const fetchAssignedAgents = async () => {
      const access = localStorage.getItem('access')
      if (!access) {
        setError('You are not authenticated. Please login again.')
        setLoading(false)
        return
      }

      try {
        const role = localStorage.getItem('userRole') || 'user'
        setUserRole(role)

        const resProps = await fetch('http://127.0.0.1:8000/property/view/', {
          headers: { Authorization: `Bearer ${access}` }
        })
        if (resProps.status === 401) throw new Error('Unauthorized')

        const propertiesData = await resProps.json()
        if (!propertiesData || propertiesData.length === 0) {
          setError('No properties found for this user.')
          setLoading(false)
          return
        }

        const agentPromises = propertiesData.map(async (property) => {
          const resAgent = await fetch(
            `http://127.0.0.1:8000/property/my-property-agent/${property.id}/`,
            { headers: { Authorization: `Bearer ${access}` } }
          )
          const agentData = await resAgent.json()
          return {
            ...property,
            assignedAgent: agentData?.user_id
              ? {
                  id: agentData.user_id,
                  name: `${agentData.first_name} ${agentData.last_name}`,
                  email: agentData.email,
                  phone: agentData.phone,
                image: agentData.profile_image
                  ? `http://127.0.0.1:8000${agentData.profile_image}`
                  : 'https://via.placeholder.com/150',
                }
              : null
          }
        })

        const results = await Promise.all(agentPromises)
        setProperties(results)
      } catch (err) {
        console.error(err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchAssignedAgents()
  }, [])

  if (loading) return <p>Loading your assigned agents...</p>
  if (error) return <p style={{ color: 'red' }}>{error}</p>
  if (properties.length === 0) return <p>No properties found.</p>

  return (
  <div className="agent-description-page">

    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        gap: '30px'
      }}
    >

      <div className="agent-page-header glass-panel">

        <h1 className="text-gradient">
          {userRole === 'user'
            ? 'Your Assigned Agents'
            : 'Our Real Estate Agents'}
        </h1>

        <p>
          {userRole === 'user'
            ? 'Meet your dedicated professionals committed to your success.'
            : 'Meet our experienced team of professionals.'}
        </p>

      </div>

      <MyProfile />

    </div>


      <div className="agents-grid">
        {properties.map((property) => {
          const agent = property.assignedAgent
          return (
            <div key={property.id} className="agent-card glass-panel">
              {agent ? (
                <>
                  <div className="agent-image-wrapper">
                    <img src={agent.image} alt={agent.name} className="agent-image" />
                  </div>

                  {/* ✅ Agent Details */}
                  <div className="agent-content">
                    <div className="agent-header">
                      <h2 className="agent-name">{agent.name}</h2>
                      <p className="agent-role">{agent.email}</p>
                      <p className="agent-phone">{agent.phone}</p>
                    </div>

                    <div className="divider"></div>
                    <p className="agent-bio">
                      Assigned to property: <strong>{property.title || property.name}</strong>
                    </p>

                    {/* ✅ Styled View Meeting Details button */}
                    <button
                              className="btn-view-meetings"
                              onClick={() => handleViewMeetings(property.id)}
                              style={{
                                marginTop: '1rem',
                                width: '100%',
                                padding: '0.75rem',
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.5rem',
                                cursor: 'pointer',
                                fontWeight: '500',
                                fontSize: '0.95rem',
                              }}
                    >
                      View Meeting Details
                      </button>

                  </div>
                </>
              ) : (
                <>
                  <div className="agent-image-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.03)' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:'32px', height:'32px', color:'var(--text-muted)'}}>
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                  </div>

                  <div className="agent-content">
                    <div className="agent-header">
                      <h2 className="agent-name" style={{ color: 'var(--text-muted)' }}>No Agent</h2>
                      <p className="agent-role">—</p>
                      <p className="agent-phone">—</p>
                    </div>

                    <div className="divider"></div>
                    <p className="agent-bio">
                      Assigned to property: <strong>{property.title || property.name}</strong>
                    </p>

                    <button
                      className="btn-view-meetings"
                      disabled
                      style={{
                        marginTop: '1rem',
                        width: '100%',
                        padding: '0.75rem',
                        background: 'rgba(255, 255, 255, 0.05)',
                        color: 'var(--text-muted)',
                        border: '1px dashed var(--border-light)',
                        borderRadius: '0.5rem',
                        cursor: 'not-allowed',
                        fontWeight: '500',
                        fontSize: '0.95rem',
                      }}
                    >
                      No Meetings Scheduled
                    </button>
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default AgentDescription
