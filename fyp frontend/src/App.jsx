import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import SignUp from './components/SignUp'
import Login from './components/Login'
import UserDashboard from './components/UserDashboard'
import BuyPage from './components/BuyPage'
import SellPage from './components/SellPage'
import AgentDescription from './components/AgentDescription'
import AgentDashboard from './components/AgentDashboard'
import AgentTaskDetails from './components/AgentTaskDetails'
import AddDocuments from './components/AddDocuments'
import ManagerDashboard from './components/ManagerDashboard'
import PropertyDetails from './components/PropertyDetails'
import Sidebar from './components/Sidebar'
import UserMeetingDetails from './components/UserMeetingDetails'
import AddAgent from './components/AddAgent'
import TaskCreation from './components/TaskCreation'
import AgentAssignment from './components/AgentAssignment'
import TaskProgress from './components/TaskProgress'
import ManagerMeetingDetails from './components/ManagerMeetingDetails'
import ManagerActiveTasks from './components/ManagerActiveTasks'
import AddMeetingModal from './components/AddMeetingModal'
import UserMessages from './components/UserMessages'
import OTPVerification from './components/OTPVerification'
import AdminDashboard from './components/AdminDashboard'
import ManageProperty from './components/ManageProperty'
import FinanceDashboard from './components/FinanceDashboard'
import OwnershipTransfer from './components/OwnershipTransfer'
import PaymentTransfer from './components/PaymentTransfer'
import LeaseManagement from './components/LeaseManagement'
import './App.css'

function App() {
  const [currentPage, setCurrentPage] = useState('signup')
  const [sellerProperties, setSellerProperties] = useState([])
  const [userRole, setUserRole] = useState(localStorage.getItem('userRole') || 'user')

  // Global Add Meeting Modal State
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false)

  React.useEffect(() => {
    const handleOpenModal = () => {
      setIsMeetingModalOpen(true)
    }
    window.addEventListener('openAddMeetingModal', handleOpenModal)
    return () => {
      window.removeEventListener('openAddMeetingModal', handleOpenModal)
    }
  }, [])

  const handleAddMeeting = (meetingData) => {
    const storedMeetings = JSON.parse(localStorage.getItem('agentMeetings') || '[]')
    storedMeetings.push(meetingData)
    localStorage.setItem('agentMeetings', JSON.stringify(storedMeetings))
    console.log('New meeting added:', meetingData)
    alert(`Meeting ${meetingData.meetingId} added successfully!`)

    // Notify other components
    window.dispatchEvent(new Event('meetingsUpdated'))
    window.dispatchEvent(new Event('storage')) // Force update listeners
  }

  const handleSignupSuccess = () => {
    setCurrentPage('login')
  }

  const handleGoToSignup = () => {
    setCurrentPage('signup')
  }

  const handleGoToLogin = () => {
    setCurrentPage('login')
  }

  // Pages that should show sidebar
  const pagesWithSidebar = ['/dashboard', '/buy', '/sell', '/agent-description']

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route
            path="/"
            element={
              currentPage === 'signup' ? (
                <SignUp onSignupSuccess={handleSignupSuccess} onGoToLogin={handleGoToLogin} />
              ) : (
                <Login onGoToSignup={handleGoToSignup} setUserRole={setUserRole} />
              )
            }
          />
          <Route path="/signup" element={<SignUp onSignupSuccess={handleSignupSuccess} onGoToLogin={handleGoToLogin} />} />
          <Route path="/login" element={<Login onGoToSignup={handleGoToSignup} setUserRole={setUserRole} />} />
          <Route
            path="/dashboard"
            element={
              <div className="app-layout">
                <Sidebar role={userRole} />
                <div className="main-content">
                  <UserDashboard />
                </div>
              </div>
            }
          />
          <Route
            path="/buy"
            element={
              <div className="app-layout">
                <Sidebar role={userRole} />
                <div className="main-content">
                  <BuyPage sellerProperties={sellerProperties} />
                </div>
              </div>
            }
          />
          <Route
            path="/property/:id"
            element={
              <div className="app-layout">
                <Sidebar role={userRole} />
                <div className="main-content">
                  <PropertyDetails />
                </div>
              </div>
            }
          />
          <Route
            path="/messages"
            element={
              <div className="app-layout">
                <Sidebar role={userRole} />
                <div className="main-content">
                  <UserMessages />
                </div>
              </div>
            }
          />
          <Route
            path="/sell"
            element={
              <div className="app-layout">
                <Sidebar role={userRole} />
                <div className="main-content">
                  <SellPage
                    properties={sellerProperties}
                    onPropertiesChange={setSellerProperties}
                  />
                </div>
              </div>
            }
          />
          <Route
            path="/manage-property"
            element={
              <div className="app-layout">
                <Sidebar role={userRole} />
                <div className="main-content">
                  <ManageProperty />
                </div>
              </div>
            }
          />
          <Route
            path="/agent-description"
            element={
              <div className="app-layout">
                <Sidebar role={userRole} />
                <div className="main-content">
                  <AgentDescription />
                </div>
              </div>
            }
          />
          <Route
            path="/agent-dashboard"
            element={
              <div className="app-layout">
                <Sidebar role={userRole} />
                <div className="main-content">
                  <AgentDashboard />
                </div>
              </div>
            }
          />
          <Route
            path="/agent-task-details/:taskId"
            element={
              <div className="app-layout">
                <Sidebar role={userRole} />
                <div className="main-content">
                  <AgentTaskDetails />
                </div>
              </div>
            }
          />
          <Route
            path="/add-documents"
            element={
              <div className="app-layout">
                <Sidebar role={userRole} />
                <div className="main-content">
                  <AddDocuments />
                </div>
              </div>
            }
          />
          <Route
            path="/manager-dashboard"
            element={
              <div className="app-layout">
                <Sidebar role={userRole} />
                <div className="main-content">
                  <ManagerDashboard />
                </div>
              </div>
            }
          />
          <Route
            path="/manager-active-tasks"
            element={
              <div className="app-layout">
                <Sidebar role={userRole} />
                <div className="main-content">
                  <ManagerActiveTasks />
                </div>
              </div>
            }
          />
          <Route
            path="/user-meeting-details"
            element={
              <div className="app-layout">
                <Sidebar role={userRole} />
                <div className="main-content">
                  <UserMeetingDetails />
                </div>
              </div>
            }
          />
          <Route
            path="/admin-dashboard"
            element={
              <div className="app-layout">
                <AdminDashboard />
              </div>
            }
          />
          <Route
            path="/lease"
            element={
              <div className="app-layout">
                <Sidebar role={userRole} />
                <div className="main-content">
                  <LeaseManagement />
                </div>
              </div>
            }
          />
          <Route
            path="/finance"
            element={
              <div className="app-layout">
                <Sidebar role={userRole} />
                <div className="main-content">
                  <FinanceDashboard />
                </div>
              </div>
            }
          />
          <Route
            path="/ownership-transfer"
            element={
              <div className="app-layout">
                <Sidebar role={userRole} />
                <div className="main-content">
                  <OwnershipTransfer />
                </div>
              </div>
            }
          />
          <Route
  path="/meetings/view/:taskId"
  element={<UserMeetingDetails />}
/>
          <Route
            path="/payment-transfer"
            element={
              <div className="app-layout">
                <Sidebar role={userRole} />
                <div className="main-content">
                  <PaymentTransfer />
                </div>
              </div>
            }
          />
          <Route path="/verify-otp" element={<OTPVerification />} />
        </Routes>

        {/* Global Modals */}
        <AddMeetingModal
          isOpen={isMeetingModalOpen}
          onClose={() => setIsMeetingModalOpen(false)}
          onAddMeeting={handleAddMeeting}
        />
      </div>
    </Router>
  )
  
}

export default App
