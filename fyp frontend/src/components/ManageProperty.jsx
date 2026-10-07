import React, { useState, useEffect } from 'react'
import './ManageProperty.css'
import MyProfile from './MyProfile'

const GET_API_URL ="http://127.0.0.1:8000/finance/my-escrows/"
const GET_DOCS_URL = "http://127.0.0.1:8000/documents/"
const ESCROWS_API_URL =
  "http://127.0.0.1:8000/finance/escrows/"

const getToken = () => localStorage.getItem("access")




const DOCUMENT_TYPES_DICT = {
  cnic_front: 'CNIC Front',
  cnic_back: 'CNIC Back',
  lease_sale: 'Lease Paper / Sale Deed',
  kbc: 'KBC',
  transfer_letter: 'Transfer Letter',
  site_plan: 'Site Plan',
  demarcation: 'Demarcation Letter',
  allotment: 'Allotment Letter',
  possession: 'Possession Letter'
}

const ManageProperty = () => {
  
  const [transactions, setTransactions] = useState([])
  const [escrowDetail, setEscrowDetail] = useState(null)
  const [installmentPlan, setInstallmentPlan] =useState(null)
  const userType =
  localStorage.getItem(
    "userRole"
  );
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Modal states
  const [docModalOpen, setDocModalOpen] = useState(false)
  const [txModalOpen, setTxModalOpen] = useState(false)
  const [selectedProperty, setSelectedProperty] = useState(null)
  const [receiptModalOpen, setReceiptModalOpen] = useState(false)
const [receiptData, setReceiptData] = useState(null)
const [receiptLoading, setReceiptLoading] = useState(false)
  
  // Documents fetching states
  const [documents, setDocuments] = useState([])
  const [loadingDocs, setLoadingDocs] = useState(false)

  // Transfer Form states
  const [accountNo, setAccountNo] = useState('')
  const [transferAmount, setTransferAmount] = useState('')
  const [selectedInstallment, setSelectedInstallment] = useState('')


  const [escrows, setEscrows] = useState([])
  const [releaseRequests, setReleaseRequests] =useState([]);

  const isFullyPaid =
  Number(
    escrowDetail?.remaining_payment || 0
  ) <= 0;

  const isFullyReleased =
 Number(
   escrowDetail?.total_released || 0
 ) >=
 Number(
   escrowDetail?.property_price || 0
 );

const handleTransferSubmit = async () => {

  if (!accountNo) {
    alert(
      "Please enter account number."
    )
    return
  }

  if (
    !transferAmount ||
    Number(transferAmount) <= 0
  ) {
    alert(
      "Please enter valid amount."
    )
    return
  }

  if (!selectedInstallment) {
    alert(
      "Please select installment."
    )
    return
  }


const escrowId = getEscrowId(
selectedProperty.property_id
)

if (!escrowId) {

  alert(
    "Escrow not found for this property"
  )

  return
}
  try {

    const token = getToken()

    const response = await fetch(
      "http://127.0.0.1:8000/finance/pay/",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",

          Authorization:
            `Bearer ${token}`
        },

          body: JSON.stringify({

          escrow_id:
          getEscrowId(
            selectedProperty.property_id
          ),

          account_number:
          accountNo,

          installment_no:
          selectedInstallment,

          amount:
          transferAmount
        })
      }
    )

    const data =
      await response.json()

    if (!response.ok) {

      alert(
        data.error ||
        "Payment failed"
      )

      return
    }

    alert(
      "Installment paid successfully"
    )

    setAccountNo("")
    setTransferAmount("")
    setSelectedInstallment("")
    
  await loadEscrowSummary(
  selectedProperty.property_id
  )

  await loadEscrowTransactions(
    selectedProperty.property_id
  )

  await loadInstallmentPlan(
    selectedProperty.property_id
  )

  } catch (error) {

    console.error(error)

    alert(
      "Something went wrong"
    )
  }
}
const handleReleaseRequest = async () => {

  if (!accountNo) {
    alert("Please enter account number")
    return
  }

  if (
    !transferAmount ||
    Number(transferAmount) <= 0
  ) {
    alert("Please enter valid amount")
    return
  }

  try {

    const token = getToken()

    const response = await fetch(
      "http://127.0.0.1:8000/finance/release/request/",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",

          Authorization:
            `Bearer ${token}`
        },

        body: JSON.stringify({

  escrow_id: getEscrowId(
    selectedProperty.property_id
    
  ),

  amount: transferAmount,

  account_number: accountNo

})
      }
    )

    const data =
      await response.json()

    if (!response.ok) {
      alert(
        data.error ||
        "Request failed"
      )
      return
    }

    alert(
      "Release request submitted"
    )

    setAccountNo("")
    setTransferAmount("")
    // Refresh release request table immediately
    await fetchReleaseRequests(
      selectedProperty.property_id
    )

  } catch (error) {

    console.error(error)

    alert(
      "Something went wrong"
    )
  }
}

const loadEscrowTransactions =
async (propertyId) => {

  const escrowId =
    getEscrowId(propertyId)

  if (!escrowId) return

  const token = getToken()

  const res = await fetch(
    `http://127.0.0.1:8000/finance/escrow/${escrowId}/transactions/`,
    {
      headers: {
        Authorization:
          `Bearer ${token}`
      }
    }
  )

  const data =
    await res.json()

  setTransactions(data)
}

const loadEscrowSummary =
async (propertyId) => {

  const escrowId =
    getEscrowId(propertyId)

  if (!escrowId) return

  const token = getToken()

  const res = await fetch(
    `http://127.0.0.1:8000/finance/escrow/${escrowId}/summary/`,
    {
      headers: {
        Authorization:
          `Bearer ${token}`
      }
    }
  )

  const data =
    await res.json()

  setEscrowDetail(data)
}


const loadInstallmentPlan =
async (propertyId) => {

  const escrowId =
    getEscrowId(propertyId)

  if (!escrowId) return

  const token = getToken()

  const response = await fetch(
    `http://127.0.0.1:8000/finance/installments/${escrowId}/`,
    {
      headers: {
        Authorization:
          `Bearer ${token}`
      }
    }
  )

  if (!response.ok) return

  const data =
    await response.json()

  setInstallmentPlan(data)
}

const loadEscrows = async () => {

  try {

    const token = getToken()

    const response = await fetch(
      ESCROWS_API_URL,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    )

    if (!response.ok)
      throw new Error()

    const data =
      await response.json()

    setEscrows(data)

  } catch (err) {

    console.error(
      "Escrow load error:",
      err
    )
  }
}

const getEscrowId = (propertyId) => {

  const escrow = escrows.find(
    escrow => escrow.property === propertyId
  )

  return escrow ? escrow.id : null
}

  const loadProperties = async () => {
    try {
      const token = getToken()
      if (!token) {
        setLoading(false)
        return
      }

      const res = await fetch(GET_API_URL, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error("Failed to fetch properties")
      const data = await res.json()
      setProperties(data)
    } catch (err) {
      console.error("Load properties error:", err)
    } finally {
      setLoading(false)
    }
  }


  const handleOpenDocModal = async (property) => {
    setSelectedProperty(property)
    setDocModalOpen(true)
    setLoadingDocs(true)
    setDocuments([])

    try {
      const token = getToken()
      const response = await fetch(`${GET_DOCS_URL}?property=${property.property_id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      if (response.ok) {
        const data = await response.json()
        setDocuments(data)
      } else {
        console.error("Failed to load documents")
      }
    } catch (err) {
      console.error("Error loading documents:", err)
    } finally {
      setLoadingDocs(false)
    }
  }

const handleOpenTxModal =
async (property) => {

  setSelectedProperty(property)

  setTxModalOpen(true)

  setAccountNo("")

  setTransferAmount("")

  setSelectedInstallment("")

  await loadEscrowSummary(
    property.property_id
  )

  await loadEscrowTransactions(
    property.property_id
  )

  await loadInstallmentPlan(
    property.property_id
  )

  await fetchReleaseRequests(
    property.property_id
  )
}
const downloadRoleReceipt = () => {

  if (!receiptData) {
    return
  }

  const property = receiptData.property

  let text = ""

  text += "==============================================\n"
  text += "       PROPERTY TRANSACTION RECEIPT\n"
  text += "==============================================\n\n"


  // PROPERTY

  text += "PROPERTY INFORMATION\n"
  text += "----------------------------------------------\n"

  text += `Property ID     : ${property.id}\n`
  text += `Property Name   : ${property.title}\n`
  text += `Property Type   : ${property.type}\n`
  text += `Property Price  : PKR ${property.price}\n`
  text += `City            : ${property.city}\n`
  text += `Address         : ${property.address}\n\n`


  // BUYER

  if (userType === "buyer") {

    text += "BUYER TRANSACTION DETAILS\n"
    text += "----------------------------------------------\n"

    text += `Buyer           : ${receiptData.buyer.username}\n`
    text += `Email           : ${receiptData.buyer.email || "N/A"}\n\n`

    receiptData.buyer_transactions?.forEach(
      (tx, index) => {

        text += `Transaction ${index + 1}\n`

        text += `Transaction ID  : ${tx.transaction_id}\n`
        text += `Installment No  : ${tx.installment_no}\n`
        text += `Account Number   : ${tx.account_number || "N/A"}\n`
        text += `Amount           : PKR ${tx.amount}\n`
        text += `Status           : ${tx.status}\n`
        text += `Date & Time      : ${tx.created_at}\n`

        if (tx.blockchain_tx_hash) {

          text += `Blockchain Hash : ${tx.blockchain_tx_hash}\n`

        }

        text += "\n"
      }
    )

    text += `Total Paid       : PKR ${
      receiptData.financial_summary?.total_paid || 0
    }\n`

    text += `Total Payable    : PKR ${
      receiptData.financial_summary?.total_payable || 0
    }\n\n`

  }


  // SELLER

  if (userType === "seller") {

    text += "SELLER RELEASE DETAILS\n"
    text += "----------------------------------------------\n"

    text += `Seller           : ${receiptData.seller.username}\n`
    text += `Email            : ${receiptData.seller.email || "N/A"}\n\n`

    receiptData.seller_releases?.forEach(
      (release, index) => {

        text += `Release ${index + 1}\n`

        text += `Release ID       : ${release.release_id}\n`
        text += `Account Number   : ${release.account_number || "N/A"}\n`
        text += `Amount Released  : PKR ${release.amount}\n`
        text += `Status           : ${release.status}\n`

        text += "\n"
      }
    )

    text += `Total Released   : PKR ${
      receiptData.financial_summary?.total_released || 0
    }\n\n`

  }


  // OWNERSHIP

  text += "OWNERSHIP INFORMATION\n"
  text += "----------------------------------------------\n"

  text += `Previous Owner   : ${
    receiptData.ownership.previous_owner || "N/A"
  }\n`

  text += `New Owner        : ${
    receiptData.ownership.new_owner || "N/A"
  }\n`

  text += `Status           : ${
    receiptData.ownership.status || "N/A"
  }\n`

  text += `Transferred At   : ${
    receiptData.ownership.transferred_at || "N/A"
  }\n`

  text += `Blockchain Hash  : ${
    receiptData.ownership.blockchain_tx_hash || "N/A"
  }\n\n`


  text += "==============================================\n"
  text += "              END OF RECEIPT\n"
  text += "==============================================\n"


  const blob = new Blob(
    [text],
    {
      type: "text/plain;charset=utf-8"
    }
  )

  const url = URL.createObjectURL(blob)

  const link = document.createElement("a")

  link.href = url

  link.download =
    `${property.title}_${userType}_receipt.txt`

  document.body.appendChild(link)

  link.click()

  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}
  
const fetchReleaseRequests = async (
  propertyId
) => {

  try {

    const escrowId =
      getEscrowId(propertyId);

    if (!escrowId) return;

    const token = getToken();

    const response = await fetch(
      `http://127.0.0.1:8000/finance/release/my/?escrow_id=${escrowId}`,
      {
        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      }
    );

    const data =
      await response.json();

    if (!response.ok) {

      console.error(data);
      return;
    }

    setReleaseRequests(data);

  } catch (error) {

    console.error(
      "Release Requests Error:",
      error
    );
  }
};
const fetchPropertyReceipt = async () => {

  if (!selectedProperty?.property_id) {
    return
  }

  try {

    setReceiptLoading(true)

    const token = getToken()

    const response = await fetch(
      `http://127.0.0.1:8000/ownership/receipt/${selectedProperty.property_id}/`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    )

    const data = await response.json()

    if (!response.ok) {

      alert(
        data.error ||
        "Failed to load receipt"
      )

      return
    }

    setReceiptData(data)

    setReceiptModalOpen(true)

  } catch (error) {

    console.error(
      "Receipt error:",
      error
    )

    alert(
      "Unable to load receipt."
    )

  } finally {

    setReceiptLoading(false)
  }
}


useEffect(() => {

  loadProperties()

  loadEscrows()

}, [])

  return (
    <div className="manage-property-page">
      
<div
  className="manage-property-header text-center"
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
    Manage Property
  </h1>

  <p>
    Monitor your listed properties, view documents uploaded by your agent,
 and check your transaction and installment details.
  </p>

</div>
      <div className="properties-table-container glass-panel">
        <h2>Your Property Details</h2>
        {loading ? (
          <div className="empty-state">
            <p>Loading your properties...</p>
          </div>
        ) : properties.length === 0 ? (
          <div className="empty-state">
            <p>No properties found under your account.</p>
          </div>
        ) : (
          <div className="properties-table-wrapper">
            <table className="properties-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Location</th>
                  <th>Type</th>
                  <th>Price</th>
                  <th>Beds</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                  {properties.map((property) => (
                    <tr key={property.id}>

                      <td>{property.property_title}</td>

                      <td>{property.property_city}</td>

                      <td>{property.property_type}</td>

                      <td>
                        ${Number(
                          property.property_price || 0
                        ).toLocaleString("en-US")}
                      </td>

                      <td>{property.property_bedrooms}</td>

                      <td>
                        <span
                          className={`status-pill ${
                            (
                              property.property_status ||
                              "available"
                            )
                              .toLowerCase()
                              .replace(" ", "-")
                          }`}
                        >
                          {property.property_status}
                        </span>
                      </td>

                      <td>
                        <button
                          className="action-button doc-btn"
                          onClick={() =>
                            handleOpenDocModal(property)
                          }
                        >
                          Document
                        </button>

                        <button
                          className="action-button tx-btn"
                          onClick={() =>
                            handleOpenTxModal(property)
                          }
                        >
                          Transactions
                        </button>
                      </td>

                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- Document Modal --- */}
      {docModalOpen && selectedProperty && (
        <div className="modal-overlay" onClick={() => setDocModalOpen(false)}>
          <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Agent Uploaded Documents</h2>
              <button className="close-btn" onClick={() => setDocModalOpen(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p className="property-subtitle">Property: <strong>{selectedProperty.title || selectedProperty.name}</strong></p>
              
              {loadingDocs ? (
                <div className="loading-container">
                  <span className="spinner"></span>
                  <p>Fetching agent documents...</p>
                </div>
              ) : documents.length === 0 ? (
                <div className="empty-modal-state">
                  <svg className="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="9" y1="15" x2="15" y2="15" />
                    <line x1="9" y1="11" x2="15" y2="11" />
                    <line x1="9" y1="17" x2="10" y2="17" />
                  </svg>
                  <p>No documents uploaded by the agent for this property yet.</p>
                </div>
              ) : (
                <div className="modal-table-wrapper">
                  <table className="modal-table">
                    <thead>
                      <tr>
                        <th>Document Type</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {documents.map((doc) => {
                        const fileUrl = doc.file ? (doc.file.startsWith('http') ? doc.file : `http://127.0.0.1:8000${doc.file}`) : null
                        return (
                          <tr key={doc.id || doc.name}>
                            <td>{DOCUMENT_TYPES_DICT[doc.document_type] || doc.document_type || doc.name}</td>
                            <td>
                              <span className={`status-pill ${
                                (doc.status || 'pending').toLowerCase() === 'verified' ? 'available' : 
                                (doc.status || 'pending').toLowerCase() === 'rejected' ? 'sold' : 'under-offer'
                              }`}>
                                {doc.status || 'Pending'}
                              </span>
                            </td>
                            
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- Transactions Modal --- */}
    {/* --- Transactions Modal --- */}
{txModalOpen && selectedProperty && (() => {

  return (
          <div className="modal-overlay" onClick={() => setTxModalOpen(false)}>
            <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Transaction & Installment Plan</h2>
                <button className="close-btn" onClick={() => setTxModalOpen(false)}>✕</button>
              </div>
              <div className="modal-body">
                <p className="property-subtitle">Property: <strong>{selectedProperty.title || selectedProperty.name}</strong></p>
                
                {/* Transfer Form (Upper part of modal) */}
                <div className="transfer-form-container">
                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label">Account Number</label>
                      <input 
                        type="text" 
                        placeholder="Enter account number..." 
                        className="form-input"
                        value={accountNo}
                        onChange={(e) => setAccountNo(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Amount ($)</label>
                      <input 
                        type="number" 
                        placeholder="Enter amount..." 
                        className="form-input"
                        value={transferAmount}
                        onChange={(e) => setTransferAmount(e.target.value)}
                      />
                    </div>
{userType === "buyer" && (
  <div className="form-group">
    <label className="form-label">
      Installment No.
    </label>

    <select
      className="form-select"
      value={selectedInstallment}
      onChange={(e) =>
        setSelectedInstallment(e.target.value)
      }
    >
      <option value="">
        Select installment
      </option>
    {Array.from({
      length:
        installmentPlan?.total_installments || 0
    }).map((_, index) => {

      const installmentNo =
        index + 1

      return (
        <option
          key={installmentNo}
          value={installmentNo}
        >
          Installment #{installmentNo}
        </option>
      )
    })}
    </select>
  </div>
)}

                  </div>

                  
                  <button
  className="transfer-submit-btn"
  disabled={
    userType === "buyer"
      ? isFullyPaid
      : isFullyReleased
  }
  onClick={
    userType === "buyer"
      ? handleTransferSubmit
      : handleReleaseRequest
  }
>

 
  {
    userType === "buyer"
      ? (
        isFullyPaid
          ? "Property Fully Paid"
          : "Transfer"
      )
      : (
        isFullyReleased
          ? "Property Fully Released"
          : "Request Release"
      )
  }
</button>


{/* RECEIPT BUTTON */}

{
  (
    userType === "buyer"
      ? isFullyPaid
      : isFullyReleased
  ) && (

    <button
      type="button"
      className="manage-receipt-btn"
      onClick={fetchPropertyReceipt}
      disabled={receiptLoading}
    >
      {receiptLoading
        ? "Loading Receipt..."
        : "View Receipt"
      }
    </button>

  )
}
                    {/* <button
                      className="transfer-submit-btn"
                      disabled={
                        userType === "seller" &&
                        isFullyReleased
                      }
                      onClick={
                        userType === "buyer"
                          ? handleTransferSubmit
                          : handleReleaseRequest
                      }
                    >
                      {
                        userType === "buyer"
                          ? "Transfer"
                          : isFullyReleased
                            ? "Property Fully Released"
                            : "Request Release"
                      }
                    </button> */}
                  </div>

                {/* Stats Grid */}
                <div className="stats-grid">
                  <div className="stat-card">
                    <span className="stat-label">Total Price</span>
                    <span className="stat-value">${Number(
                            escrowDetail?.property_price || 0
                          ).toLocaleString("en-US")}</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-label">Commission Amount</span>
                    <span className="stat-value">${Number(
                    escrowDetail?.commission_required || 0
                  ).toLocaleString("en-US")}</span>
                  </div>
                  <div className="stat-card">
                    <span className="stat-label">Commission Collected</span>
                    <span className="stat-value text-green">{escrowDetail?.commission_collected} </span>
                  </div>
                  <div className="stat-card">
  <span className="stat-label">
    {
      userType === "buyer"
        ? "Remaining Payment"
        : "Remaining Release"
    }
  </span>

  <span className="stat-value text-orange">
    {
      userType === "buyer"
        ? escrowDetail?.remaining_payment
        : escrowDetail?.seller_remaining_amount
    }
  </span>
</div>
                </div>

                {/* Progress Section */}

                      <div className="progress-section">

                      <div className="progress-labels">

                        <span>
                          Total Received:
                          <strong>
                            ${escrowDetail?.total_received}
                          </strong>
                        </span>

                        <span>
                          Total Released:
                          <strong>
                            ${escrowDetail?.total_released}
                          </strong>
                        </span>

                      </div>

                    </div>



                    

                {/* Installment Plan Details Table */}
                <h3 className="section-subtitle">Payment Schedule</h3>
                <div className="modal-table-wrapper">
                  <table className="modal-table">
                    <thead>
                      <tr>
                        <th>Installment No</th>
                        <th>Date</th>
                        <th>Amount</th>
                        <th>Type</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>

                    {transactions.map(tx => (

                    <tr key={tx.id}>

                    <td>
                    #{tx.installment_no}
                    </td>

                    <td>
                    {tx.created_at}
                    </td>

                    <td>
                    ${tx.amount}
                    </td>

                    <td>
                    {tx.transaction_type}
                    </td>

                    <td>
                    {tx.status}
                    </td>

                    </tr>

                    ))}

                    </tbody>
                  </table>


                  
                </div>
                {/*release  table*/}
                {
                  userType === "seller" && (

                  <>

                  <h3 className="section-subtitle">
                  Release Request Status
                  </h3>

                  <div className="modal-table-wrapper">

                  <table className="modal-table">

                  <thead>

                  <tr>

                  <th>ID</th>

                  <th>Requested Amount</th>

                  <th>Your Account.No</th>

                  <th>Status</th>

                  </tr>

                  </thead>

                  <tbody>

                  {
                  releaseRequests.length > 0 ? (

                  releaseRequests.map((req) => (

                  <tr key={req.id}>

                  <td>{req.id}</td>

                  <td>{req.requested_amount}</td>


                  <td>{req.account_number}</td>

                  <td>{req.status}</td>

                  </tr>

                  ))

                  ) : (

                  <tr>

                  <td colSpan="6">
                  No Release Requests Found
                  </td>

                  </tr>

                  )

                  }

                  </tbody>

                  </table>

                  </div>

                  </>

                  )}

                  {/*end of table*/}
              </div>
            </div>
          </div>
          
        )
        

      })()}
      {/* ================= RECEIPT MODAL ================= */}

{receiptModalOpen && receiptData && (

  <div
    className="modal-overlay receipt-overlay"
    onClick={() => setReceiptModalOpen(false)}
  >

    <div
      className="modal-content receipt-modal-content glass-panel"
      onClick={(e) => e.stopPropagation()}
    >

      {/* HEADER */}

      <div className="modal-header">

        <div>
          <h2>
            Property Transaction Receipt
          </h2>

          <p className="property-subtitle">
            Property:{" "}
            <strong>
              {receiptData.property.title}
            </strong>
          </p>
        </div>

        <button
          className="close-btn"
          onClick={() => setReceiptModalOpen(false)}
        >
          ✕
        </button>

      </div>


      <div className="modal-body">

        {/* ================= PROPERTY ================= */}

        <div className="receipt-info-section">

          <h3 className="section-subtitle">
            Property Information
          </h3>

          <div className="receipt-info-grid">

            <div>
              <span>Property ID</span>
              <strong>
                {receiptData.property.id}
              </strong>
            </div>

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
                PKR{" "}
                {Number(
                  receiptData.property.price || 0
                ).toLocaleString()}
              </strong>
            </div>

            <div className="receipt-full-width">
              <span>Property Address</span>
              <strong>
                {receiptData.property.address}
              </strong>
            </div>

          </div>

        </div>


        {/* =================================================
            BUYER RECEIPT
        ================================================= */}

        {userType === "buyer" && (

          <div className="receipt-info-section">

            <h3 className="section-subtitle">
              Buyer Transaction
            </h3>

            <div className="receipt-user-info">

              <div>
                <span>Buyer</span>
                <strong>
                  {receiptData.buyer.username}
                </strong>
              </div>

              <div>
                <span>Email</span>
                <strong>
                  {receiptData.buyer.email || "N/A"}
                </strong>
              </div>

            </div>


            <div className="modal-table-wrapper">

              <table className="modal-table">

                <thead>

                  <tr>
                    <th>Installment</th>
                    <th>Account Number</th>
                    <th>Amount</th>
                    <th>Date & Time</th>
                    <th>Status</th>
                  </tr>

                </thead>

                <tbody>

                  {
                    receiptData.buyer_transactions?.length > 0
                      ? (
                        receiptData.buyer_transactions.map(
                          (tx) => (

                            <tr key={tx.transaction_id}>

                              <td>
                                #{tx.installment_no}
                              </td>

                              <td>
                                {tx.account_number || "N/A"}
                              </td>

                              <td>
                                PKR{" "}
                                {Number(
                                  tx.amount || 0
                                ).toLocaleString()}
                              </td>

                              <td>
                                {tx.created_at}
                              </td>

                              <td>
                                <span className="receipt-status">
                                  {tx.status}
                                </span>
                              </td>

                            </tr>

                          )
                        )
                      )
                      : (
                        <tr>
                          <td colSpan="5">
                            No payment transactions found.
                          </td>
                        </tr>
                      )
                  }

                </tbody>

              </table>

            </div>


            {/* BUYER SUMMARY */}

            <div className="receipt-summary">

              <div>
                <span>Total Paid</span>

                <strong>
                  PKR{" "}
                  {Number(
                    receiptData.financial_summary?.total_paid || 0
                  ).toLocaleString()}
                </strong>
              </div>

              <div>
                <span>Total Payable</span>

                <strong>
                  PKR{" "}
                  {Number(
                    receiptData.financial_summary?.total_payable || 0
                  ).toLocaleString()}
                </strong>
              </div>

            </div>

          </div>

        )}


        {/* =================================================
            SELLER RECEIPT
        ================================================= */}

        {userType === "seller" && (

          <div className="receipt-info-section">

            <h3 className="section-subtitle">
              Seller Release Transactions
            </h3>

            <div className="receipt-user-info">

              <div>
                <span>Seller</span>
                <strong>
                  {receiptData.seller.username}
                </strong>
              </div>

              <div>
                <span>Email</span>
                <strong>
                  {receiptData.seller.email || "N/A"}
                </strong>
              </div>

            </div>


            <div className="modal-table-wrapper">

              <table className="modal-table">

                <thead>

                  <tr>
                    <th>Release ID</th>
                    <th>Account Number</th>
                    <th>Amount Released</th>
                    <th>Status</th>
                  </tr>

                </thead>

                <tbody>

                  {
                    receiptData.seller_releases?.length > 0
                      ? (
                        receiptData.seller_releases.map(
                          (release) => (

                            <tr key={release.release_id}>

                              <td>
                                #{release.release_id}
                              </td>

                              <td>
                                {release.account_number || "N/A"}
                              </td>

                              <td>
                                PKR{" "}
                                {Number(
                                  release.amount || 0
                                ).toLocaleString()}
                              </td>

                              <td>
                                <span className="receipt-status">
                                  {release.status}
                                </span>
                              </td>

                            </tr>

                          )
                        )
                      )
                      : (
                        <tr>
                          <td colSpan="4">
                            No release transactions found.
                          </td>
                        </tr>
                      )
                  }

                </tbody>

              </table>

            </div>


            {/* SELLER SUMMARY */}

            <div className="receipt-summary">

              <div>
                <span>Total Released</span>

                <strong>
                  PKR{" "}
                  {Number(
                    receiptData.financial_summary?.total_released || 0
                  ).toLocaleString()}
                </strong>
              </div>

              <div>
                <span>Commission</span>

                <strong>
                  PKR{" "}
                  {Number(
                    receiptData.financial_summary?.commission_collected || 0
                  ).toLocaleString()}
                </strong>
              </div>

            </div>

          </div>

        )}


        {/* =================================================
            OWNERSHIP INFORMATION
        ================================================= */}

        <div className="receipt-info-section">

          <h3 className="section-subtitle">
            Ownership Information
          </h3>

          <div className="receipt-info-grid">

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


        {/* ================= FOOTER ================= */}

        <div className="receipt-modal-footer">

          <button
            className="receipt-btn close-receipt-btn"
            onClick={() => setReceiptModalOpen(false)}
          >
            Cancel
          </button>

          <button
            className="receipt-btn download-receipt-btn"
            onClick={() => downloadRoleReceipt()}
          >
            Download Receipt
          </button>

        </div>

      </div>

    </div>

  </div>

)}


    </div>
  )

  
}



export default ManageProperty
