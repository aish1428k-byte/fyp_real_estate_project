import React, { useEffect, useState } from 'react';
import './LeaseManagement.css';


const LeaseManagement = () => {
  const [selectedLease, setSelectedLease] = useState(null);
  const [leases, setLeases] = useState([]);
const [loading, setLoading] = useState(true); 
const [searchTerm, setSearchTerm] = useState("");

const [selectedStatus, setSelectedStatus] = useState("");
const [selectedCity, setSelectedCity] = useState("");
const [userInfo, setUserInfo] = useState(null);


const [stats, setStats] = useState({
  total: 0,
  active: 0,
  pending: 0,
  expired: 0,
});
  const token = localStorage.getItem("access");

  const handleView = (lease) => {
    setSelectedLease(lease);
  };

  const closePanel = () => {
    setSelectedLease(null);
  };

  

useEffect(() => {
  fetchLeases();
  fetchProfile();
}, []);
const fetchProfile = async () => {
  try {
    const response = await fetch(
      "http://127.0.0.1:8000/users/profile/me/",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();
    setUserInfo(data);
  } catch (error) {
    console.log(error);
  }
};
const fetchLeases = async () => {
  try {

    const response = await fetch(
      "http://127.0.0.1:8000/lease/list/",
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const data = await response.json();

    setLeases(data);

const total = data.length;

const active = data.filter(
  (l) => l.status?.toLowerCase() === "active"
).length;

const pending = data.filter(
  (l) => l.status?.toLowerCase() === "pending"
).length;

const expired = data.filter(
  (l) => l.status?.toLowerCase() === "expired"
).length;

setStats({
  total,
  active,
  pending,
  expired,
});

  }
  catch (error) {
    console.log(error);
  }
  finally {
    setLoading(false);
  }
};
const filteredLeases = leases.filter((lease) => {
  const search = searchTerm.toLowerCase();

  const matchesSearch =
    lease.tenant?.toLowerCase().includes(search) ||
    lease.owner_name?.toLowerCase().includes(search) ||
    lease.property_title?.toLowerCase().includes(search) ||
    lease.property_city?.toLowerCase().includes(search);

  const matchesStatus =
    selectedStatus === "" ||
    lease.status === selectedStatus;

  const matchesCity =
    selectedCity === "" ||
    lease.property_city === selectedCity;

  return matchesSearch && matchesStatus && matchesCity;
});
  return (
    <div className="lease-module">
      <div className="lease-header">
        <h1>Lease Management</h1>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>

            <div style={{ background:'var(--bg-card)', border:'1px solid var(--border-light)', borderRadius:'50%', width:'40px', height:'40px', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-muted)' }}>
             {
  userInfo?.profile_picture ? (
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
              </svg>  )
}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: '600', fontSize: '14px' }}>

  {userInfo?.name || "Loading..."}
</span>

<span
  style={{
    fontSize: '12px',
    color: 'var(--text-muted)'
  }}
>
  {userInfo?.role}
</span>
            </div>
          </div>
        </div>
      </div>

      <div className="lease-stats-row">
        <div className="lease-stat-card">
          <div className="lease-stat-icon blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
          </div>
          <div className="lease-stat-details">
<span className="lease-stat-value">
  {stats.total}
</span>            <span className="lease-stat-label">Total Leases</span>
          </div>
        </div>
        <div className="lease-stat-card">
          <div className="lease-stat-icon green">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          </div>
          <div className="lease-stat-details">
<span className="lease-stat-value">
  {stats.active}
</span>            <span className="lease-stat-label">Active Leases</span>
          </div>
        </div>
        <div className="lease-stat-card">
          <div className="lease-stat-icon orange">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          </div>
          <div className="lease-stat-details">
<span className="lease-stat-value">
  {stats.pending}
</span>            <span className="lease-stat-label">Pending Leases</span>
          </div>
        </div>
        <div className="lease-stat-card">
          <div className="lease-stat-icon red">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          </div>
          <div className="lease-stat-details">
<span className="lease-stat-value">
  {stats.expired}
</span>            <span className="lease-stat-label">Expired Leases</span>
          </div>
        </div>
      </div>

      <div className="lease-content-wrapper">
        <div className={`lease-main-table ${selectedLease ? 'shrink' : ''}`}>
          <div className="lease-filters">
            <div className="filter-group">
<input
  type="text"
  className="filter-input search"
  placeholder="Search by tenant, landlord or property..."
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
/>            </div>
            <div className="filter-group">
              <label>Status</label>
              <select
  className="filter-input"
  value={selectedStatus}
  onChange={(e) => setSelectedStatus(e.target.value)}
>
  <option value="">All Status</option>
  <option value="Active">Active</option>
  <option value="Pending">Pending</option>
  <option value="Expired">Expired</option>
</select>
            </div>
            <div className="filter-group">
              <label>City</label>
             <select
  className="filter-input"
  value={selectedCity}
  onChange={(e) => setSelectedCity(e.target.value)}
>
  <option value="">All Cities</option>
  <option value="Karachi">Karachi</option>
  <option value="Lahore">Lahore</option>
  <option value="Islamabad">Islamabad</option>
</select>
            </div>
            
          </div>

          <div className="lease-table-container">
            <table className="lease-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Buyer</th>
                  <th>Owner</th>
                  <th>Property</th>
                  <th>City</th>
                  <th>Status</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeases.map((lease) => (
                 
                  <tr key={lease.id}>
                    <td style={{ color: 'var(--text-main)' }}>{lease.id}</td>
                    <td>{lease.tenant}</td>
                    <td>{lease.owner_name}</td>
                    <td>{lease.property_title}</td>
                    <td>{lease.property_city}</td>
                    <td><span className={`status-badge ${lease.status.toLowerCase()}`}>{lease.status}</span></td>
                    <td>{lease.beginning_on}</td>
                    <td>{lease.ending_on}</td>
                    <td>
                      <button className="view-btn" onClick={() => handleView(lease)}>View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          
        </div>

        <div className={`lease-details-panel ${selectedLease ? 'open' : ''}`}>
          <div className="panel-header">
            <h3>Lease Details</h3>
            <button className="close-btn" onClick={closePanel}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:'20px', height:'20px'}}><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
          
          {selectedLease && (
            <div className="panel-content">
              <div>
                <div className="section-title">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                  Basic Information
                </div>
                <div className="info-grid">
                  <span className="info-label">Lease ID</span>
                  <span className="info-value">{selectedLease.id}</span>
                  
                  <span className="info-label">Status</span>
                  <span className={`status-badge ${selectedLease.status.toLowerCase()}`} style={{ width: 'fit-content' }}>{selectedLease.status}</span>
                  
                  <span className="info-label">Property</span>
                  <span className="info-value">{selectedLease.property_title}</span>
                  
                  <span className="info-label">City</span>
                  <span className="info-value">{selectedLease.property_city}</span>
                </div>
              </div>


              <div>
                <div className="section-title">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                  Owner Information
                </div>
                <div className="info-grid">
                  <span className="info-label">Name</span>
                  <span className="info-value">{selectedLease.owner_name}</span>
                  
                  <span className="info-label">Phone</span>
                  <span className="info-value">{selectedLease.owner_phone}</span>
                  
                  <span className="info-label">Email</span>
                  <span className="info-value" style={{ wordBreak: 'break-all' }}>{selectedLease.owner_email}</span>
                </div>
              </div>

              <div>
                <div className="section-title">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                  Lease Information
                </div>
                <div className="info-grid">
                  <span className="info-label">Start Date</span>
                  <span className="info-value">{selectedLease.beginning_on}</span>
                  
                  <span className="info-label">End Date</span>
                  <span className="info-value">{selectedLease.ending_on}</span>
                  
                  <span className="info-label">Deposit Amount</span>
                  <span className="info-value">{selectedLease.lease_amount}</span>
                  <span className="info-label">Tenant</span>
<span className="info-value">
  {selectedLease.tenant}
</span>

<span className="info-label">Landlord</span>
<span className="info-value">
  {selectedLease.landlord}
</span>
                  
                </div>
              </div>
            </div>
          )}
          
          <div className="panel-footer">
            <button className="close-panel-btn" onClick={closePanel}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaseManagement;
