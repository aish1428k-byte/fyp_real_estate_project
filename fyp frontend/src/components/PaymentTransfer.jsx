import React, { useState, useEffect } from 'react';
import './TransferModule.css';



const PaymentTransfer = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
const [releaseRequests, setReleaseRequests] = useState([]);
const [userInfo, setUserInfo] = useState(null);

const [summary, setSummary] =
  useState(null);


  const fetchSummary = async (
  escrowId
) => {

  const token =
    localStorage.getItem("access");

  const res = await fetch(
    `http://127.0.0.1:8000/finance/escrow/${escrowId}/summary/`,
    {
      headers: {
        Authorization:
          `Bearer ${token}`
      }
    }
  );

  const data =
    await res.json();
//console.log("Escrows API Data:", data);
  setSummary(data);
};
  // Fetch from endpoint or fall back to high-quality mock data
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const token = localStorage.getItem("access");
        if (!token) {
          setProperties([]);
          setLoading(false);
          return;
        }
        const res = await fetch(
        "http://127.0.0.1:8000/finance/escrows/",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
        if (res.ok) {
          const data = await res.json();
          
          if (Array.isArray(data) && data.length > 0) {
            const mapped = data.map(item => ({
            escrow_id: item.id,

            owner_id: `OWN-${item.seller}`,
            seller_id: `SEL-${item.seller}`,
            

            property_id: `PROP-${item.property}`,

            property_name:
              item.property_title || "Property",

               full_address:
              item.full_address || "Property",

            property_type:
              item.property_type || "Property",
              
              property_image:
               item.property_image || null,

            buyer_name:
              item.buyer_name || "Buyer",

            buyer_email:
              item.buyer_email || "",

            seller_name:
              item.seller_name || "Seller",

              owner_name: item.owner_name,

            seller_email:
              item.seller_email || "",

              total_installments:
              item.total_installments || 0,


            total_amount:
              Number(item.property_price || 0),

            paid_amount:
              Number(item.total_received || 0),

            total_released:
              Number(item.total_released || 0),

            commission_amount:
              Number(item.commission_amount || 0),

            commission_completed:
              item.commission_completed,

            status:
              item.status || "active"
          }));
            // Merge dynamic properties with our unique mock transfers list
            const combined = [...mapped];
            
            setProperties(combined);
          } else {
            setProperties([]);
          }
        } else {
          setProperties([]);
        }
      } catch (err) {
        console.error("Fetch properties error:", err);
        setProperties([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProperties();
  }, []);

const fetchReleaseRequests = async () => {

  try {

    const token =
      localStorage.getItem("access");

    const res = await fetch(
      "http://127.0.0.1:8000/finance/release/pending/",
      {
        headers: {
          Authorization:
            `Bearer ${token}`
        }
      }
    );

    const data =
      await res.json();

    //console.log("Release Requests:",data);

    setReleaseRequests(data);

  } catch(err) {

    console.error(err);

  }

};

// FETCH USER PROFILE
// FETCH USER PROFILE
useEffect(() => {

  const fetchProfile = async () => {

    try {

      const token = localStorage.getItem("access");

      const response = await fetch(
        "http://127.0.0.1:8000/users/profile/me/",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      setUserInfo(data);

    } catch (err) {

      console.error(err);

    }

  };

  fetchProfile();

}, []);
// const approveRequest =
// async (id) => {

//   const token =
//     localStorage.getItem(
//       "access"
//     );

//   const res =
//     await fetch(
//       `http://127.0.0.1:8000/finance/release/approve/${id}/`,
//       {
//         method: "POST",
//         headers: {
//           Authorization:
//             `Bearer ${token}`
//         }
//       }
//     );

//   const data =
//     await res.json();

//   alert(data.message);

//   await fetchReleaseRequests();
// };

const approveRequest = async (id) => {
    try {
        const token = localStorage.getItem("access");

        //console.log("Approving Release Request ID:", id);

        const res = await fetch(
            `http://127.0.0.1:8000/finance/release/approve/${id}/`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        const data = await res.json();

        //console.log("Approve API Status:", res.status);
        //console.log("Approve API Response:", data);

        if (!res.ok) {
            alert(data.error || data.message || "Release approval failed");
            return;
        }

        alert(data.message || "Release approved successfully");

        //console.log("Ownership Transferred:", data.ownership_transferred);
        //console.log("Ownership Details:", data.ownership_details);

        await fetchReleaseRequests();

    } catch (error) {
        console.error("Approve Release Error:", error);
        alert("Something went wrong while approving release.");
    }
};
// above part is new 

const rejectRequest =
async (id) => {

  const token =
    localStorage.getItem(
      "access"
    );

  const res =
    await fetch(
      `http://127.0.0.1:8000/finance/release/reject/${id}/`,
      {
        method: "POST",
        headers: {
          Authorization:
            `Bearer ${token}`
        }
      }
    );

    await fetchReleaseRequests();
  const data =
    await res.json();

  alert(data.message);

  fetchRequests();
};
  const createReleaseRequest = async (property) => {


  //console.log("Button Clicked");
  //console.log(property);
  const token = localStorage.getItem("access");

  const amount = "10000"

  if (!amount) return;

  try {

    const res = await fetch(
      "http://127.0.0.1:8000/finance/release/request/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          escrow_id: property.escrow_id,
          amount: amount
        })
      }
    );

    const data = await res.json();

    //console.log("Release Response:", data);

    alert(
      data.message ||
      "Release request submitted"
    );

    fetchSummary(property.escrow_id);
    fetchRequests();

  } catch(err) {

    console.error(err);

    alert("Release request failed");
  }
};
const payInstallment =
async (property) => {

  const amount =
    prompt(
      "Enter installment amount"
    );

  if (!amount) return;

  const token =
    localStorage.getItem("access");

  const res =
    await fetch(
      "http://127.0.0.1:8000/finance/pay/",
      {
        method:"POST",
        headers:{
          "Content-Type":
            "application/json",
          Authorization:
            `Bearer ${token}`
        },
        body:JSON.stringify({
          escrow_id:
            property.escrow_id,
          amount
        })
      }
    );

  const data =
    await res.json();

  alert(
    data.message ||
    "Payment completed"
  );
};
  // Filter properties based on search term
  const filteredProperties = properties.filter(p => {
    const term = searchTerm.toLowerCase();
    return (
      (p.property_name || '').toLowerCase().includes(term) ||
      (p.property_id || '').toLowerCase().includes(term) ||
      (p.owner_id || '').toLowerCase().includes(term) ||
      (p.seller_id || '').toLowerCase().includes(term)
    );
  });

  // Color mappings for property statuses in the table
  const getStatusBadgeClass = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'completed') return 'green';
    if (s === 'escrow locked') return 'blue';
    if (s === 'verification') return 'orange';
    if (s === 'payment released') return 'purple';
    return 'orange'; // for Initiated / other statuses
  };

  // Helper to determine active steps in progress stepper
  const getStepperStatus = (propStatus, stepLabel) => {
    const steps = ["Initiated", "Escrow Locked", "Verification", "Payment Released", "Completed"];
    const currentIdx = steps.indexOf(propStatus) !== -1 ? steps.indexOf(propStatus) : 0;
    const stepIdx = steps.indexOf(stepLabel);

    if (stepIdx < currentIdx) return "completed";
    if (stepIdx === currentIdx) return "active";
    return "";
  };

  // TABLE VIEW
  if (!selectedProperty) {
    return (
      <div className="transfer-module">
        <div className="transfer-table-header">
          <div className="transfer-search-bar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input 
              type="text" 
              placeholder="Search by name, ID, owner, seller..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
            <h1 className="text-gradient">Payment Transfers</h1>
            <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '14px' }}>
              View and manage escrow payment transfers for registered properties
            </p>
          </div>
          
          
          {/* MY PROFILE */}
        <div className="user-profile" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-light)',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
            overflow: 'hidden'
          }}>
            {userInfo?.profile_picture ? (
              <img
                src={userInfo.profile_picture}
                alt=""
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  objectFit: 'cover'
                }}
              />
            ) : (
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{ width: '20px', height: '20px' }}
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            )}
          </div>

          <div
            className="user-info"
            style={{
              display: 'flex',
              flexDirection: 'column',
              textAlign: 'left'
            }}
          >
            <span
              className="user-name"
              style={{
                fontWeight: '600',
                fontSize: '14px',
                color: 'white'
              }}
            >
              {userInfo?.name || "Loading..."}
            </span>

            <span
              className="user-role"
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

        <div className="transfer-table-card glass-panel">
          {loading ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Loading properties list...</p>
            </div>
          ) : filteredProperties.length === 0 ? (
            <div className="loading-container" style={{ padding: '60px 20px' }}>
              <p>No properties found matching your search.</p>
            </div>
          ) : (
            <div className="transfer-table-wrapper">
              <table className="transfer-custom-table">
                <thead>
                  <tr>
                    <th>Owner Name</th>
                    <th>Seller Name</th>
                    <th>Property Name</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProperties.map((prop, idx) => (
                    <tr key={prop.property_id || idx}>
                      <td><span >{prop.owner_name}</span></td>
                      <td><span >{prop.seller_name}</span></td>
                      <td style={{ fontWeight: '500' }}>{prop.property_name}</td>
                      <td>
                        <span className={`status-badge ${getStatusBadgeClass(prop.status)}`}>
                          {prop.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button 
                          className="action-btn outline" 
                          style={{ width: 'auto', padding: '6px 14px', display: 'inline-flex', fontSize: '12px' }}
                          onClick={() => {
                              setSelectedProperty(prop);

                          fetchSummary(
                            prop.escrow_id
                          );

                          fetchReleaseRequests();
                          
                          }}                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  // DETAILED VIEW (Dynamic property details view)
const remainingBalance = prop =>
  Number(prop.total_amount) -
  Number(prop.paid_amount);
  return (
<div className="transfer-module">

  {/* MY PROFILE */}
  <div
    className="user-profile"
    style={{
      position: 'absolute',
      top: '25px',
      right: '30px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      zIndex: 10
    }}
  >
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-light)',
      borderRadius: '50%',
      width: '40px',
      height: '40px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'var(--text-muted)',
      overflow: 'hidden'
    }}>
      {userInfo?.profile_picture ? (
        <img
          src={userInfo.profile_picture}
          alt=""
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            objectFit: 'cover'
          }}
        />
      ) : (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          style={{ width: '20px', height: '20px' }}
        >
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      )}
    </div>

    <div
      className="user-info"
      style={{
        display: 'flex',
        flexDirection: 'column',
        textAlign: 'left'
      }}
    >
      <span
        className="user-name"
        style={{
          fontWeight: '600',
          fontSize: '14px',
          color: 'white'
        }}
      >
        {userInfo?.name || "Loading..."}
      </span>

      <span
        className="user-role"
        style={{
          fontSize: '12px',
          color: 'var(--text-muted)'
        }}
      >
        {userInfo?.role}
      </span>
    </div>
  </div>


  {/* Back Button */}
  <div className="back-btn-container">
    <button
      className="back-btn"
      onClick={() => setSelectedProperty(null)}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="19" y1="12" x2="5" y2="12"></line>
        <polyline points="12 19 5 12 12 5"></polyline>
      </svg>
      Back to Properties
    </button>
  </div>
      
      <div className="transfer-grid">
        {/* Row 1 */}
        <div className="row-3-cols">
          <div className="transfer-card">
            <h3 className="card-title">Buyer Information</h3>
            <div className="user-info-wrapper">
              <div className="user-avatar-large">
                {(selectedProperty.buyer_name || 'B').split(' ').map(n => n[0]).join('')}
              </div>
              <div className="user-details">
                <h4>{selectedProperty.buyer_name}</h4>
<p>Email: {selectedProperty.buyer_email}</p>
              </div>
            </div>
          </div>

          <div className="transfer-card">
            <h3 className="card-title">Property Information</h3>
            <div className="property-info-wrapper">
              <div className="property-image">

  {selectedProperty.property_image ? (

    <img
      src={`http://127.0.0.1:8000${selectedProperty.property_image}`}
      alt={selectedProperty.property_name}
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
        borderRadius: "12px"
      }}
    />

  ) : (

    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%"
      }}
    >
      No Image
    </div>

  )}

</div>
              <div className="user-details">
                <h4>{selectedProperty.property_name}</h4>
                <p>Property ID: {selectedProperty.property_type}</p>
                <p>Property Address: {selectedProperty.full_address}</p>

              </div>

              
            </div>
          </div>

          

          <div className="transfer-card">
            <h3 className="card-title">Payment Plan</h3>
  <div className="detail-row">

  <span className="detail-label">
    Total Installments
  </span>

  <span className="detail-value">
    {selectedProperty.total_installments}
  </span>

</div>
            
          </div>
        </div>

        {/* Row 2 */}
        <div className="row-3-cols">
          <div className="transfer-card">
            <h3 className="card-title">Escrow Wallet Details</h3>
            <div className="detail-row">
              <span className="detail-label">Total Amount</span>
              <span className="detail-value">PKR {selectedProperty.total_amount.toLocaleString()}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Paid Amount</span>
              <span className="detail-value">PKR {selectedProperty.paid_amount.toLocaleString()}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Remaining Balance</span>
              <span className="detail-value highlight">PKR {remainingBalance(selectedProperty).toLocaleString()}</span>
            </div>
            
          </div>

          <div className="transfer-card">
            <h3 className="card-title">Installment Tracking</h3>
            <div className="vertical-stepper">
              <div className="vertical-stepper">
  <div className="v-step-item paid">
    <div className="v-step-content">
      <span className="v-step-title">
        Escrow Received
      </span>

      <span className="detail-value">
        PKR {selectedProperty.paid_amount.toLocaleString()}
      </span>

      <span className="status-badge green">
        Received
      </span>
    </div>
  </div>
  <div className="v-step-item paid">
  <div className="v-step-content">

    <span className="v-step-title">
      Released To Seller
    </span>

    <span className="detail-value">
      PKR {selectedProperty.total_released.toLocaleString()}
    </span>

    <span className="status-badge purple">
      Released
    </span>

  </div>
</div>
</div>
            </div>
          </div>
          <div className="transfer-card">
            <h3 className="card-title">Invoice Details</h3>
            <div className="invoice-header-row">
              <div className="invoice-icon-large">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline><circle cx="18" cy="18" r="3" fill="#22c55e" stroke="none"></circle><polyline points="17 18 18 19 20 17" stroke="white" strokeWidth="2"></polyline></svg>
              </div>
              <div className="invoice-details-grid">
                <span className="detail-label">Invoice ID</span>
                <span className="detail-value">INV-{selectedProperty.escrow_id}</span>
                
                <span className="detail-label">Invoice Date</span>
                <span className="detail-value">Pending</span>
                
                <span className="detail-label">Amount</span>
                <span className="detail-value highlight">PKR {selectedProperty.total_amount.toLocaleString()}</span>
                
                <span className="detail-label">Status</span>
                <span className="status-badge green" style={{ width: 'fit-content' }}>
                  {selectedProperty.status === 'Completed' ? 'Cleared' : 'Generated'}
                </span>
              </div>
            </div>
            
          </div>

        </div>



        {/* Row 3 - Release Requests Full Width */}
        <div className="full-width-row">

         
{/*new */}


<div className="transfer-card">
  <h3 className="card-title">
    Release Requests
  </h3>

  <div className="transfer-table-wrapper">
    <table className="transfer-custom-table">

      <thead>
        <tr>
          <th>Request No</th>
          <th>Amount</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>

      <tbody>

        {releaseRequests.map((req) => (

          <tr key={req.id}>

            <td>
              #{req.id}
            </td>

            <td>
              PKR {Number(req.requested_amount).toLocaleString()}
            </td>

            <td>

              <span
                className={`status-badge ${
                  req.status === "approved"
                    ? "green"
                    : req.status === "rejected"
                    ? "orange"
                    : "blue"
                }`}
              >
                {req.status}
              </span>

            </td>

            <td>

              <div
                style={{
                  display: "flex",
                  gap: "8px"
                }}
              >

                <button
                  className="action-btn light-green"
                  disabled={
                    req.status !== "pending"
                  }
                  onClick={() =>
                    approveRequest(req.id)
                  }
                >
                  Approve
                </button>

                <button
                  className="action-btn light-gray"
                  disabled={
                    req.status !== "pending"
                  }
                  onClick={() =>
                    rejectRequest(req.id)
                  }
                >
                  Reject
                </button>

              </div>

            </td>

          </tr>

        ))}

      </tbody>

    </table>
  </div>
</div>
 
          
        </div>
      </div>
    </div>
  );
};

export default PaymentTransfer;
