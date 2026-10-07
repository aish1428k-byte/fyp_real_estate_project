import React, { useState, useEffect } from 'react';
import './TransferModule.css';

// Rich fallback mock properties for Ownership Transfer


const OwnershipTransfer = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);
const [receiptData, setReceiptData] = useState(null);
const [receiptLoading, setReceiptLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [userInfo, setUserInfo] = useState(null);
  const token = localStorage.getItem("access");


  const fetchOwnershipTransfers = async () => {
  try {
    const response = await fetch(
      "http://127.0.0.1:8000/ownership/blockchain-db/",
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const data = await response.json();

   const mapped = data.map(item => ({
  id: item.id,

  property_id: String(item.property),

  property_name:
    item.property_title ||
    `Property ${item.property}`,

  property_type:
    item.property_type ||
    "Real Estate Property",

  property_image:
    item.property_image,

  property_price:
    item.property_price,

  property_city:
    item.property_city,

  property_address:
    item.property_address,

  owner_id:
    String(item.new_owner),
    
  owner_name: item.new_owner_name,


  seller_id:
    String(item.previous_owner),

  buyer_name:
    item.new_owner_name,

  seller_name:
    item.previous_owner_name,

  buyer_email:
    item.new_owner_email,

  seller_email:
    item.previous_owner_email,

  buyer_phone:
    item.new_owner_phone,

  seller_phone:
    item.previous_owner_phone,

  total_paid:
    item.total_paid,

  commission:
    item.commission,

  status:
    "Completed",

  blockchain: {
    tx_hash:
      item.blockchain_tx_hash,

    block_number:
      "Stored on Blockchain",

    timestamp:
      "Completed Transaction",

  }
}));

console.log("API DATA:", data);
console.log("MAPPED:", mapped);

setProperties(mapped);
  }
  catch (error) {
    console.log(error);
  }
  finally {
    setLoading(false);
  }


};



const fetchReceipt = async () => {

  if (!selectedProperty?.property_id) {
    return;
  }

  try {

    setReceiptLoading(true);

    const response = await fetch(
      `http://127.0.0.1:8000/ownership/receipt/${selectedProperty.property_id}/`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || "Failed to load receipt"
      );
    }

    setReceiptData(data);
    setShowReceipt(true);

  } catch (error) {

    console.error(
      "Receipt Error:",
      error
    );

    alert(
      error.message ||
      "Unable to load receipt."
    );

  } finally {

    setReceiptLoading(false);
  }
};

const downloadReceipt = async () => {

  if (!selectedProperty?.property_id) {
    return;
  }

  try {

    setReceiptLoading(true);

    const response = await fetch(
      `http://127.0.0.1:8000/ownership/receipt/${selectedProperty.property_id}/`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || "Failed to load receipt"
      );
    }

    const property = data.property;
    const buyer = data.buyer;
    const seller = data.seller;
    const financial = data.financial_summary;
    const ownership = data.ownership;
    const blockchain = data.blockchain;

    let text = "";

    text += "====================================================\n";
    text += "        PROPERTY OWNERSHIP TRANSFER RECEIPT\n";
    text += "====================================================\n\n";

    text += "PROPERTY INFORMATION\n";
    text += "----------------------------------------------------\n";
    text += `Property ID      : ${property.id}\n`;
    text += `Property Name    : ${property.title}\n`;
    text += `Property Type    : ${property.type}\n`;
    text += `Property Price   : PKR ${property.price}\n`;
    text += `City             : ${property.city}\n`;
    text += `Address          : ${property.address}\n\n`;

    text += "BUYER INFORMATION\n";
    text += "----------------------------------------------------\n";
    text += `Username         : ${buyer.username}\n`;
    text += `Email            : ${buyer.email || "N/A"}\n`;
    text += `Phone            : ${buyer.phone || "N/A"}\n\n`;

    text += "BUYER TRANSACTIONS\n";
    text += "----------------------------------------------------\n";

    if (data.buyer_transactions.length === 0) {

      text += "No buyer transactions found.\n";

    } else {

      data.buyer_transactions.forEach(
        (transaction, index) => {

          text += `Transaction ${index + 1}\n`;
          text += `Transaction ID   : ${transaction.transaction_id}\n`;
          text += `Installment No   : ${transaction.installment_no}\n`;
          text += `Account Number   : ${transaction.account_number || "N/A"}\n`;
          text += `Amount           : PKR ${transaction.amount}\n`;
          text += `Status           : ${transaction.status}\n`;
          text += `Date & Time      : ${transaction.created_at}\n`;

          if (transaction.blockchain_tx_hash) {
            text += `Blockchain Hash  : ${transaction.blockchain_tx_hash}\n`;
          }

          text += "\n";
        }
      );
    }

    text += "SELLER INFORMATION\n";
    text += "----------------------------------------------------\n";
    text += `Username         : ${seller.username}\n`;
    text += `Email            : ${seller.email || "N/A"}\n`;
    text += `Phone            : ${seller.phone || "N/A"}\n\n`;

    text += "SELLER RELEASE TRANSACTIONS\n";
    text += "----------------------------------------------------\n";

    if (data.seller_releases.length === 0) {

      text += "No seller releases found.\n";

    } else {

      data.seller_releases.forEach(
        (release, index) => {

          text += `Release ${index + 1}\n`;
          text += `Release ID       : ${release.release_id}\n`;
          text += `Account Number   : ${release.account_number || "N/A"}\n`;
          text += `Amount Released  : PKR ${release.amount}\n`;
          text += `Status           : ${release.status}\n`;

          if (release.date && release.time) {
            text += `Date & Time      : ${release.date} ${release.time}\n`;
          } else {
            text += `Date & Time      : Not stored in database\n`;
          }

          text += "\n";
        }
      );
    }

    text += "FINANCIAL SUMMARY\n";
    text += "----------------------------------------------------\n";
    text += `Property Price   : PKR ${financial.property_price}\n`;
    text += `Total Payable    : PKR ${financial.total_payable}\n`;
    text += `Total Paid       : PKR ${financial.total_paid}\n`;
    text += `Commission       : PKR ${financial.commission_required}\n`;
    text += `Commission Paid  : PKR ${financial.commission_collected}\n`;
    text += `Total Released   : PKR ${financial.total_released}\n\n`;

    text += "OWNERSHIP TRANSFER\n";
    text += "----------------------------------------------------\n";
    text += `Previous Owner   : ${ownership.previous_owner}\n`;
    text += `New Owner        : ${ownership.new_owner}\n`;
    text += `Status           : ${ownership.status}\n`;
    text += `Transferred At   : ${ownership.transferred_at}\n`;
    text += `Blockchain Hash  : ${ownership.blockchain_tx_hash || "N/A"}\n\n`;

    text += "BLOCKCHAIN INFORMATION\n";
    text += "----------------------------------------------------\n";

    if (blockchain) {

      text += `Transaction Hash : ${blockchain.transaction_hash}\n`;
      text += `Total Paid       : PKR ${blockchain.total_paid}\n`;
      text += `Commission       : PKR ${blockchain.commission}\n`;
      text += `Recorded At      : ${blockchain.created_at}\n`;

    } else {

      text += "Blockchain transaction information not found.\n";
    }

    text += "\n====================================================\n";
    text += "              END OF RECEIPT\n";
    text += "====================================================\n";


    const blob = new Blob(
      [text],
      {
        type: "text/plain;charset=utf-8"
      }
    );

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;

    link.download =
      `${property.title}_ownership_receipt.txt`;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);

  } catch (error) {

    console.error(
      "Download Receipt Error:",
      error
    );

    alert(
      error.message ||
      "Unable to download receipt."
    );

  } finally {

    setReceiptLoading(false);
  }
};


  // Fetch properties from endpoint or fall back to high-quality mock data
useEffect(() => {
  fetchOwnershipTransfers();
}, []);
  // Filter properties based on search term
  const filteredProperties = properties.filter(p => {
    const term = searchTerm.toLowerCase();
    return (
      (p.property_name || '').toLowerCase().includes(term) ||
      (p.property_id || '').toLowerCase().includes(term) ||
      (p.owner_id || '').toLowerCase().includes(term) ||
      (p.seller_id || '').toLowerCase().includes(term) ||
      (p.status || '').toLowerCase().includes(term)
    );
  });


  useEffect(() => {
  const fetchProfile = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/users/profile/me/", {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();
      setUserInfo(data);
    } catch (err) {
      console.error(err);
    }
  };

  fetchProfile();
}, []);
  // Color mappings for property statuses in the table
  const getStatusBadgeClass = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'completed') return 'green';
    if (s === 'ready for transfer') return 'purple';
    if (s === 'conditions met') return 'blue';
    if (s === 'escrow locked') return 'blue';
    return 'orange'; // for Initiated / other statuses
  };

  // Helper to determine active steps in progress stepper
  const getStepperStatus = (propStatus, stepLabel) => {
    const steps = ["Initiated", "Escrow Locked", "Conditions Met", "Ready for Transfer", "Completed"];
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
            <h1 className="text-gradient">Ownership Transfers</h1>
            <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)', fontSize: '14px' }}>
              Track and execute legal ownership transfers on the blockchain
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
                          onClick={() => setSelectedProperty(prop)}
                        >
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
            <h3 className="card-title">Property Details</h3>
            <div className="property-info-wrapper">
              <div className="property-image">
  {selectedProperty.property_image ? (
    <img
      src={`http://127.0.0.1:8000${selectedProperty.property_image}`}
      alt="property"
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
        borderRadius: "12px"
      }}
    />
  ) : (
    <span>No Image</span>
  )}
</div>
              <div className="user-details">
                <h4>{selectedProperty.property_name}</h4>
                <p>{selectedProperty.property_type}</p>
                <p>
                PKR {selectedProperty.property_price}
              </p>

              <p>
                {selectedProperty.property_city}
              </p>

              <p>
                {selectedProperty.property_address}
              </p>
                <p style={{ color: 'var(--text-main)', marginTop: '4px' }}>Seller: {selectedProperty.seller_name}</p>
              </div>
            </div>
          </div>

          <div className="transfer-card">
            <h3 className="card-title">Buyer Information</h3>
            <div className="user-info-wrapper">
              <div className="user-avatar-large">
                {(selectedProperty.buyer_name || 'B').split(' ').map(n => n[0]).join('')}
              </div>
              <div className="user-details">
                <h4>{selectedProperty.buyer_name}</h4>
                <p>{selectedProperty.buyer_email}</p>
                <p>{selectedProperty.buyer_phone}</p>
              </div>
            </div>
          </div>

          <div className="transfer-card">
            <h3 className="card-title">Seller Information</h3>
            <div className="user-info-wrapper">
              <div className="user-avatar-large" style={{ backgroundColor: 'rgba(168, 85, 247, 0.1)', color: '#a855f7' }}>
                {(selectedProperty.seller_name || 'S').split(' ').map(n => n[0]).join('')}
              </div>
              <div className="user-details">
                <h4>{selectedProperty.seller_name}</h4>
                <p>{selectedProperty.seller_email}</p>
                <p>{selectedProperty.seller_phone}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Row 2 */}
        <div className="row-3-cols">
          
          <div className="transfer-card">
            <h3 className="card-title">Blockchain Output (After Transfer)</h3>
            <div className="blockchain-info-list" style={{ flexGrow: 1 }}>
              <div className="bc-item">
                <span className="bc-label">Transaction Hash</span>
                <span className="bc-value" style={{ width: '150px' }}>{selectedProperty.blockchain.tx_hash}</span>
              </div>
              <div className="bc-item">
                <span className="bc-label">Block Number</span>
                <span className="bc-value" style={{fontFamily: 'inherit'}}>{selectedProperty.blockchain.block_number}</span>
              </div>
              <div className="bc-item">
                <span className="bc-label">Timestamp</span>
                <span className="bc-value" style={{fontFamily: 'inherit'}}>{selectedProperty.blockchain.timestamp}</span>
              </div>
              
            </div>
            
          </div>
          <div className="transfer-card">
            
  <h3 className="card-title">
    Ownership Summary
  </h3>

  <div className="blockchain-info-list">

    <div className="bc-item">
      <span className="bc-label">
        Previous Owner
      </span>
      <span className="bc-value">
        {selectedProperty.seller_name}
      </span>
    </div>

    <div className="bc-item">
      <span className="bc-label">
        Current Owner
      </span>
      <span className="bc-value">
        {selectedProperty.buyer_name}
      </span>
    </div>

    <div className="bc-item">
      <span className="bc-label">
        Property Price
      </span>
      <span className="bc-value">
        PKR {selectedProperty.property_price}
      </span>
    </div>

    <div className="bc-item">
      <span className="bc-label">
        Total Paid
      </span>
      <span className="bc-value">
        PKR {selectedProperty.total_paid}
      </span>
    </div>

    <div className="bc-item">
      <span className="bc-label">
        Commission
      </span>
      <span className="bc-value">
        PKR {selectedProperty.commission}
      </span>
    </div>

    <div className="bc-item">
      <span className="bc-label">
        Property Address
      </span>
        <span className="bc-value address-value">
    {selectedProperty.property_address}
  </span>
    </div>

  </div>
  
</div>

{showReceipt && receiptData && (
  <div
    className="receipt-modal-overlay"
    onClick={() => setShowReceipt(false)}
  >

    <div
      className="receipt-modal"
      onClick={(e) => e.stopPropagation()}
    >

      <div className="receipt-modal-header">

        <div>
          <h2>Property Ownership Receipt</h2>
          <p>
            Complete transaction and ownership details
          </p>
        </div>

        <button
          className="receipt-close-btn"
          onClick={() => setShowReceipt(false)}
        >
          ×
        </button>

      </div>


      {/* PROPERTY */}

      <div className="receipt-section">

        <h3>Property Information</h3>

        <div className="receipt-grid">


          <div>
            <span>Property Name</span>
            <strong>
              {receiptData.property.title}
            </strong>
          </div>

          <div>
            <span>Property Type</span>
            <strong>
              {receiptData.property.type}
            </strong>
          </div>

          <div>
            <span>Property Price</span>
            <strong>
              PKR {receiptData.property.price}
            </strong>
          </div>

          <div className="receipt-full">

            <span>Address</span>

            <strong>
              {receiptData.property.address}
            </strong>

          </div>

        </div>

      </div>


      {/* BUYER */}

      <div className="receipt-section">

        <h3>Buyer Transaction</h3>

        <div className="receipt-person">

          <div>
            <span>Buyer</span>
            <strong>
              {receiptData.buyer.username}
            </strong>
          </div>

          <div>
            <span>Account Number</span>
            <strong>
              {receiptData.buyer_transactions?.[0]?.account_number || "N/A"}
            </strong>
          </div>

        </div>


        <div className="receipt-table-wrapper">

          <table className="receipt-table">

            <thead>

              <tr>
                <th>#</th>
                <th>Amount</th>
                <th>Account</th>
                <th>Date & Time</th>
                <th>Status</th>
              </tr>

            </thead>

            <tbody>

              {receiptData.buyer_transactions.map(
                (transaction, index) => (

                  <tr key={transaction.transaction_id}>

                    <td>
                      {transaction.installment_no}
                    </td>

                    <td>
                      PKR {transaction.amount}
                    </td>

                    <td>
                      {transaction.account_number || "N/A"}
                    </td>

                    <td>
                      {transaction.created_at}
                    </td>

                    <td>
                      <span className="receipt-status">
                        {transaction.status}
                      </span>
                    </td>

                  </tr>

                )
              )}

            </tbody>

          </table>

        </div>

      </div>


      {/* SELLER */}

      <div className="receipt-section">

        <h3>Seller Release Transactions</h3>

        <div className="receipt-person">

          <div>
            <span>Seller</span>
            <strong>
              {receiptData.seller.username}
            </strong>
          </div>

        </div>


        <div className="receipt-table-wrapper">

          <table className="receipt-table">

            <thead>

              <tr>
                <th>Release ID</th>
                <th>Amount</th>
                <th>Account</th>
                <th>Status</th>
                <th>Date & Time</th>
              </tr>

            </thead>

            <tbody>

              {receiptData.seller_releases.map(
                (release) => (

                  <tr key={release.release_id}>

                    <td>
                      #{release.release_id}
                    </td>

                    <td>
                      PKR {release.amount}
                    </td>

                    <td>
                      {release.account_number || "N/A"}
                    </td>

                    <td>
                      <span className="receipt-status">
                        {release.status}
                      </span>
                    </td>

                    <td>
                      {release.date && release.time
                        ? `${release.date} ${release.time}`
                        : "Not stored"}
                    </td>

                  </tr>

                )
              )}

            </tbody>

          </table>

        </div>

      </div>


      {/* FINANCIAL SUMMARY */}

      <div className="receipt-section">

        <h3>Financial Summary</h3>

        <div className="receipt-grid">

          <div>
            <span>Property Price</span>
            <strong>
              PKR {receiptData.financial_summary.property_price}
            </strong>
          </div>

          <div>
            <span>Total Payable</span>
            <strong>
              PKR {receiptData.financial_summary.total_payable}
            </strong>
          </div>

          <div>
            <span>Total Paid</span>
            <strong>
              PKR {receiptData.financial_summary.total_paid}
            </strong>
          </div>

          <div>
            <span>Commission</span>
            <strong>
              PKR {receiptData.financial_summary.commission_required}
            </strong>
          </div>

          <div>
            <span>Commission Collected</span>
            <strong>
              PKR {receiptData.financial_summary.commission_collected}
            </strong>
          </div>

          <div>
            <span>Total Released</span>
            <strong>
              PKR {receiptData.financial_summary.total_released}
            </strong>
          </div>

        </div>

      </div>


      {/* OWNERSHIP */}

      <div className="receipt-section">

        <h3>Ownership Transfer</h3>

        <div className="receipt-grid">

          <div>
            <span>Previous Owner</span>
            <strong>
              {receiptData.ownership.previous_owner}
            </strong>
          </div>

          <div>
            <span>New Owner</span>
            <strong>
              {receiptData.ownership.new_owner}
            </strong>
          </div>

          <div>
            <span>Status</span>
            <strong>
              {receiptData.ownership.status}
            </strong>
          </div>

          <div>
            <span>Transferred At</span>
            <strong>
              {receiptData.ownership.transferred_at}
            </strong>
          </div>

        </div>

      </div>


      {/* BLOCKCHAIN */}

      <div className="receipt-section">

        <h3>Blockchain Information</h3>

        <div className="receipt-grid">

          <div className="receipt-full">

            <span>Transaction Hash</span>

            <strong className="receipt-hash">
              {receiptData.ownership.blockchain_tx_hash}
            </strong>

          </div>

          {receiptData.blockchain && (
            <div>
              <span>Blockchain Recorded At</span>

              <strong>
                {receiptData.blockchain.created_at}
              </strong>
            </div>
          )}

        </div>

      </div>


      <div className="receipt-modal-footer">

        <button
          className="receipt-btn download-receipt-btn"
          onClick={downloadReceipt}
        >
          Download Receipt
        </button>

        <button
          className="receipt-btn close-receipt-btn"
          onClick={() => setShowReceipt(false)}
        >
          Close
        </button>

      </div>

    </div>

  </div>
)}
<div className="receipt-actions">


          

  <button
    className="receipt-btn view-receipt-btn"
    onClick={fetchReceipt}
    disabled={receiptLoading}
  >
    {receiptLoading
      ? "Loading..."
      : "View Receipt"}
  </button>
  <p>
    
  </p>

  <button
    className="receipt-btn download-receipt-btn"
    onClick={downloadReceipt}
    disabled={receiptLoading}
  >
    Download Receipt
  </button>

  


</div>
        
        </div>

        

      </div>
    </div>
  );
};

export default OwnershipTransfer;
