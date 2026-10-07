
import React, { useState, useEffect } from 'react'
import './AddMeetingModal.css'

const API_URL = 'http://127.0.0.1:8000/meetings/create/'

const AddMeetingModal = ({ isOpen, onClose, onAddMeeting, initialTaskId, owner, buyer }) => {
  const [details, setDetails] = useState('')
  const [status, setStatus] = useState('pending')
  const [cancellationReason, setCancellationReason] = useState('')
  const [canceled_by, setcanceledby] = useState('')

  const [taskId, setTaskId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (initialTaskId) {
      setTaskId(initialTaskId)
    }
  }, [initialTaskId])

  const resetForm = () => {
    setDetails('')
    setStatus('pending')
    setCancellationReason('')
    setcanceledby('')
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!details.trim()) {
      setError('Meeting details are required')
      return
    }

    if (!taskId) {
      setError('Task ID missing')
      return
    }

    if (status === 'cancelled') {
      if (!cancellationReason.trim()) {
        setError('Cancellation reason is required')
        return
      }
      if (!canceled_by) {
        setError('Please select who canceled the meeting')
        return
      }
    }

    setLoading(true)
    setError('')

    try {
      const token = localStorage.getItem('access')
      if (!token) throw new Error('Authentication token missing')

      // 🔥 auto datetime
      const now = new Date().toISOString()

      const requestBody = {
        task: taskId,
        details: details,
        status: status,
        meeting_date: now,
      }

      if (status === 'cancelled') {
        requestBody.cancellation_reason = cancellationReason
        requestBody.canceled_at = now
        requestBody.canceled_by = canceled_by
      }

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(JSON.stringify(data))
      }

      if (onAddMeeting) onAddMeeting(data.data)

      resetForm()
      onClose()
      window.location.reload()

    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create New Meeting</h2>
          <button className="modal-close-button" onClick={handleClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="add-meeting-form">

          <div className="form-group">
            <label>Meeting Details *</label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows="4"
              required
            />
          </div>

          <div className="form-group">
            <label>Status *</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              required
            >
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {status === 'cancelled' && (
            <div className="cancellation-fields">
              <div className="form-group">
                <label>Cancellation Reason *</label>
                <textarea
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  rows="3"
                  required
                />
              </div>

              <div className="form-group">
                <label>Canceled By *</label>
                <select
                  value={canceled_by}
                  onChange={(e) => setcanceledby(e.target.value)}
                  required
                >
                  <option value="">Select User</option>
                  {owner && (
                    <option value={owner?.user_id}>Seller: {owner.full_name}</option>

                  )}
                  {buyer && (<option value={buyer?.user_id}>Buyer: {buyer.full_name}</option>


                  )}
                </select>
              </div>

              <div className="form-group">
                <label>Canceled At</label>
                <input
                  type="text"
                  value={new Date().toLocaleString()}
                  readOnly
                  className="readonly-input"
                />
              </div>
            </div>
          )}

          {error && <p className="error-message">{error}</p>}


          <div className="modal-actions">
            <button type="button" className="cancel-button" onClick={handleClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="add-button" disabled={loading}>
              {loading ? 'Creating...' : 'Create Meeting'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddMeetingModal
