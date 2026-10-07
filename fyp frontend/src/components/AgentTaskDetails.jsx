
// export default AgentTaskDetails
import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import './AgentTaskDetails.css'
import AddDocuments from './AddDocuments'
import AddMeetingModal from './AddMeetingModal'
import PageHeader from './PageHeader'

const AgentTaskDetails = () => {
  const { taskId } = useParams()
  const navigate = useNavigate()

  const [task, setTask] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isDocModalOpen, setIsDocModalOpen] = useState(false)
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false)
  const [uploadedDocuments, setUploadedDocuments] = useState([])
  const [escrowCreated, setEscrowCreated] =useState(false)
  const [installments, setInstallments] = useState('')

  useEffect(() => {
    const loadTask = async () => {
      try {
        const token = localStorage.getItem('access')
        if (!token) throw new Error('Unauthorized')

        const response = await fetch(
          `http://127.0.0.1:8000/tasks/detail/${taskId}/`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        )

        if (!response.ok) throw new Error('Task not found')

        const data = await response.json()

        
        // ✅ SAFE + FINAL mapping (seller = owner)
        const mappedTask = {
          task_number: data.task_number || data.id,

          propertyName: data.property?.name || '-',
          propertyPrice: data.property?.price || '-',
          propertyType: data.property?.propertyType || '_',
          propertyId: data.property?.id || null,



          // 👇 seller ko owner treat kiya gaya
          ownerName:
            data.owner?.full_name ||
            data.owner?.username ||
            '-',

          ownerEmail: data.owner?.email || '-',
          ownerPhone: data.owner?.phone || '-',

          ownerId:
            data.owner?.user_id || null,

          buyerName:
            data.buyer?.full_name ||
            data.buyer?.username ||
            '-',

          buyerEmail: data.buyer?.email || '-',
          buyerPhone: data.buyer?.phone || '-',
          
          buyerId:
            data.buyer?.user_id || null,

          meetings: Array.isArray(data.meetings) ? data.meetings : [],

          assignedAgent: data.agent || null,
          owner: data.owner,
          buyer: data.buyer
        }

        setTask(mappedTask)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadTask()
  }, [taskId])



  const loadUploadedDocuments = async () => {
    if (!task?.propertyId) return;
    const token = localStorage.getItem('access');
    try {
      const response = await fetch(`http://127.0.0.1:8000/documents/?property=${task.propertyId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Failed to fetch documents');
      const data = await response.json();
      setUploadedDocuments(data);
    } catch (err) {
      console.error(err);
      setUploadedDocuments([]);
    }
  }

  
  const handleProceed = async () => {

  try {

const hasAllotment =
  uploadedDocuments.some(
    doc =>
      doc.document_type ===
      "allotment"
  )

const hasPossession =
  uploadedDocuments.some(
    doc =>
      doc.document_type ===
      "possession"
  )

    if (
      !hasAllotment ||
      !hasPossession
    ) {

      alert(
        "Allotment and Possession documents are required."
      )

      return
    }

    const token =
      localStorage.getItem(
        "access"
      )

      console.log({
  property_id: task.propertyId,
  buyer_id: task.buyerId,
  owner_id: task.ownerId
})
    const response =
      await fetch(
        "http://127.0.0.1:8000/finance/escrow/create/",
        {
          method: "POST",

          headers: {
            Authorization:
              `Bearer ${token}`,

            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({

            property_id:
              task.propertyId,

            property_price:
              task.propertyPrice,

            owner_id:
              task.ownerId,

            buyer_id:
              task.buyerId
          })
        }
      )

    const data =
      await response.json()

    if (!response.ok) {

      alert(
        data.error ||
        "Failed to create escrow"
      )

      return
    }

    alert(
      "Escrow created successfully"
    )

    setEscrowCreated(true)

  } catch (error) {

    console.error(error)

    alert(
      "Something went wrong"
    )
  }
}

const handleCreateInstallmentPlan = async () => {
  if (
    !installments ||
    isNaN(installments) ||
    parseInt(installments) <= 0
  ) {
    alert("Please enter a valid number of installments.");
    return;
  }

  const token = localStorage.getItem("access");

  try {
    // Get escrow
    const escrowsResponse = await fetch(
      "http://127.0.0.1:8000/finance/escrows/",
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      }
    );

    const escrows = await escrowsResponse.json();

    const escrow = escrows.find(
      e => e.property === task.propertyId
    );

    if (!escrow) {
      alert(
        "No active escrow found. Create escrow first."
      );
      return;
    }

    // Check if plan already exists
    const planResponse = await fetch(
      `http://127.0.0.1:8000/finance/installments/${escrow.id}/`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      }
    );

    if (planResponse.ok) {
      const plan = await planResponse.json();

      alert(
        `Installment plan already exists (${plan.total_installments} installments).`
      );

      return;
    }

    // Create new plan
    const response = await fetch(
      "http://127.0.0.1:8000/finance/installments/create/",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          escrow_id: escrow.id,
          total_installments: parseInt(installments)
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      alert(
        data.error ||
        data.message ||
        "Failed to create installment plan"
      );
      return;
    }

    alert("Installment plan created successfully!");
    setInstallments("");
  } catch (err) {
    console.error(err);
    alert("Something went wrong");
  }
};
  useEffect(() => {
    loadUploadedDocuments()

    const handleDocsUpdate = (e) => {
      if (e.detail && e.detail.taskId === taskId) {
        loadUploadedDocuments()
      } else {
        // Fallback for generic generic events or if detail is missing
        loadUploadedDocuments()
      }
    }

    window.addEventListener('documentsUpdated', handleDocsUpdate)
    window.addEventListener('storage', handleDocsUpdate)

    return () => {
      window.removeEventListener('documentsUpdated', handleDocsUpdate)
      window.removeEventListener('storage', handleDocsUpdate)
    }
  }, [taskId, task])

  if (loading)
    return <div className="agent-task-details">Loading task details...</div>

  if (error)
    return (
      <div className="agent-task-details flex-center">
        <div className="glass-panel p-5 text-center">
          <h2>{error}</h2>
          <button
            className="btn-primary"
            onClick={() => {
              const role = localStorage.getItem('userRole')
              if (role === 'manager') navigate('/manager-dashboard')
              else if (role === 'agent') navigate('/agent-dashboard')
              else navigate('/dashboard')
            }}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )

  return (
    <div className="agent-task-details">
      <div className="task-details-container">
        <div className="task-details-header">
<div
  style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    whiteSpace: 'nowrap'
  }}
>
  <h1
    className="text-gradient"
    style={{
      margin: 0,
      whiteSpace: 'nowrap'
    }}
  >
    Task Details
  </h1>

  <h2
    className="text-gradient"
    style={{
      margin: '5px 0 0 0',
      fontSize: '24px',
      whiteSpace: 'nowrap'
    }}
  >
    {task.task_number}
  </h2>
</div>


<PageHeader />
        </div>
        
          {localStorage.getItem('userRole') === 'agent' && (
  <div className="task-header-buttons">

    {/* Create Meeting */}
    <button
      className="task-action-btn"
      onClick={() => setIsMeetingModalOpen(true)}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>

      Create New Meeting
    </button>


    {/* Add Document */}
    <button
      className="task-action-btn"
      onClick={() => setIsDocModalOpen(true)}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 5v14M5 12h14" />
      </svg>

      Add Document
    </button>


    {/* Proceed */}
    <button
      className={`task-action-btn ${
        escrowCreated ? "completed" : ""
      }`}
      onClick={handleProceed}
      disabled={escrowCreated}
    >
      {escrowCreated
        ? "Escrow Created"
        : "Proceed"}
    </button>


    {/* Installment Plan */}
    <div className="installment-card">

      <input
        type="number"
        placeholder="Installments count..."
        value={installments}
        onChange={(e) => setInstallments(e.target.value)}
        min="1"
      />

      <button
        className="task-action-btn installment-btn"
        onClick={handleCreateInstallmentPlan}
      >
        Create Installment Plan
      </button>

    </div>

  </div>
)}
<div>
  <p></p>
</div>

        {/* Property Card */}
        <div className="glass-panel details-card owner-card">

          <h2>Property Details</h2>
          <table className="meetings-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Price</th>
                <th>propertyType</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{task.propertyName || '-'}</td>
                <td>{task.propertyPrice || '-'}</td>
                <td>{task.propertyType || '-'}</td>
              </tr>
            </tbody>
          </table>
        </div>


        {/* Owner Card */}
        <div className="glass-panel details-card owner-card">

          <h2>Owner Details</h2>
          <table className="meetings-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{task.ownerName || '-'}</td>
                <td>{task.ownerEmail || '-'}</td>
                <td>{task.ownerPhone  || '-'}</td>
              </tr>
            </tbody>
          </table>
        </div>


        {/* Buyer Card */}
        <div className="glass-panel details-card buyer-card">

          <h2>Buyer Details</h2>
          <table className="meetings-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{task.buyerName || '-'}</td>
                <td>{task.buyerEmail || '-'}</td>
                <td>{task.buyerPhone || '-'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Agent Details */}
        {task.assignedAgent && (
          <div
            className="glass-panel details-card agent-details-container"
            style={{ gridColumn: '1 / -1' }}
          >
            <h2>Agent Details</h2>
            <table className="meetings-table">
              <thead>
                <tr>
                  <th>Agent Name</th>
                  <th>Designation</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{task.assignedAgent.user?.username || '-'}</td>
                  <td>{task.assignedAgent.designation || '-'}</td>
                  <td>{task.assignedAgent.status ? 'Active' : 'Inactive'}</td>

                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Meetings */}
        <div className="glass-panel meetings-table-container">
          <h2>Meetings</h2>
          <table className="meetings-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Details</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {task.meetings.length > 0 ? (
                task.meetings.map(m => (
                  <tr key={m.id}>
                    <td>{m.id}</td>
                    <td>{m.short_details}</td>
                    <td>{m.status}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3">No meetings</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Uploaded Documents */}
        <div className="glass-panel meetings-table-container">
          <h2>Uploaded Documents</h2>
          <table className="meetings-table">
            <thead>
              <tr>
                <th>Document Name</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {uploadedDocuments.length > 0 ? (
                uploadedDocuments.map((doc, index) => (
                  <tr key={index}>
                    <td>{doc.document_type_display}</td>
                    <td>
                      <span className={`status-pill ${doc.status.toLowerCase() === 'pending' ? 'pending' :
                          doc.status.toLowerCase() === 'verified' ? 'completed' :
                            doc.status.toLowerCase() === 'rejected' ? 'cancelled' : ''
                        }`}>
                        {doc.status_display}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="2">No documents uploaded</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isDocModalOpen && (
        <div className="document-modal-overlay" onClick={() => setIsDocModalOpen(false)}>
          <div className="document-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setIsDocModalOpen(false)}>×</button>
            <AddDocuments taskId={taskId} propertyId={task.propertyId} />
          </div>
        </div>
      )}
      <AddMeetingModal
        isOpen={isMeetingModalOpen}
        onClose={() => setIsMeetingModalOpen(false)}
        initialTaskId={taskId}
        owner={task.owner}
        buyer={task.buyer}
      />

    </div>
  )
}

export default AgentTaskDetails