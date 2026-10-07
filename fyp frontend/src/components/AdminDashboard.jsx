
// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import './AdminDashboard.css';

// const AdminDashboard = () => {
//     const navigate = useNavigate();
//     const [selectedModule, setSelectedModule] = useState('User');
//     const [searchQuery, setSearchQuery] = useState('');
//     const [dateFrom, setDateFrom] = useState('');
//     const [dateTo, setDateTo] = useState('');
//     const [isLoading, setIsLoading] = useState(false);
//     const [logs, setLogs] = useState([]);
//     const [isVerified, setIsVerified] = useState(null);
//     const [showVerification, setShowVerification] = useState(false);
//     const [verificationData, setVerificationData] = useState(null);
//     const [sessionId, setSessionId] = useState(null);

//     useEffect(() => {
//         const token = localStorage.getItem('access');
//         if (!token) {
//             navigate('/login');
//             return;
//         }
//         const storedSessionId = localStorage.getItem('session_id');
//         setSessionId(storedSessionId);
//     }, [navigate]);

//     useEffect(() => {
//         if (sessionId !== null) {  // Wait until sessionId is set (could be null)
//             handleSearch();
//         }
//     }, [selectedModule, sessionId]);

//     const moduleMap = {
//         'User': 'users',
//         'Manager': 'manager',
//         'Agent': 'agents'
//     };

//     const handleSearch = async () => {
//         if (!sessionId) {
//             console.error('No session ID found. Please ensure session_id is stored in localStorage during login.');
//             setLogs([]);
//             setIsLoading(false);
//             return;
//         }
//         setIsLoading(true);
//         setShowVerification(false);
//         setIsVerified(null);
//         setVerificationData(null);

//         const token = localStorage.getItem('access');
//         const backendModule = moduleMap[selectedModule];

//         try {
//             const response = await fetch(`/audit/session-logs/?session_id=${sessionId}&module=${backendModule}`, {
//                 method: 'GET',
//                 headers: {
//                     'Authorization': `Bearer ${token}`,
//                     'Content-Type': 'application/json',
//                 },
//             });

//             if (!response.ok) {
//                 if (response.status === 401) {
//                     navigate('/login');
//                 }
//                 throw new Error('Failed to fetch logs');
//             }

//             const data = await response.json();
//             let filteredLogs = data.logs.map(log => ({
//                 id: log.id,
//                 timestamp: log.timestamp,
//                 module: selectedModule,
//                 action: log.action,
//                 details: typeof log.details === 'object' ? JSON.stringify(log.details) : log.details,
//                 hash: log.log_hash,
//                 user: log.user
//             }));

//             // Client-side filtering for searchQuery
//             if (searchQuery) {
//                 const lowerQuery = searchQuery.toLowerCase();
//                 filteredLogs = filteredLogs.filter(log =>
//                     log.id.toLowerCase().includes(lowerQuery) ||
//                     log.details.toLowerCase().includes(lowerQuery) ||
//                     log.user.toLowerCase().includes(lowerQuery)
//                 );
//             }

//             // Client-side date filtering
//             if (dateFrom || dateTo) {
//                 const fromDate = dateFrom ? new Date(dateFrom) : new Date(0);
//                 const toDate = dateTo ? new Date(dateTo) : new Date();
//                 toDate.setHours(23, 59, 59, 999);

//                 filteredLogs = filteredLogs.filter(log => {
//                     const logDate = new Date(log.timestamp);
//                     return logDate >= fromDate && logDate <= toDate;
//                 });
//             }

//             setLogs(filteredLogs);
//         } catch (error) {
//             console.error(error);
//             setLogs([]);
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     const handleVerifySession = async () => {
//         if (!sessionId) {
//             console.error('No session ID found for verification.');
//             setIsVerified(false);
//             setShowVerification(true);
//             return;
//         }
//         setIsLoading(true);

//         const token = localStorage.getItem('access');
//         const backendModule = moduleMap[selectedModule];

//         try {
//             const response = await fetch('/audit/verify-log/', {
//                 method: 'POST',
//                 headers: {
//                     'Authorization': `Bearer ${token}`,
//                     'Content-Type': 'application/json',
//                 },
//                 body: JSON.stringify({
//                     session_id: sessionId,
//                     module: backendModule
//                 }),
//             });

//             if (!response.ok) {
//                 throw new Error('Verification failed');
//             }

//             const data = await response.json();
//             setVerificationData(data);
//             setIsVerified(data.verified);
//             setShowVerification(true);
//         } catch (error) {
//             console.error(error);
//             setIsVerified(false);
//             setShowVerification(true);
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     const handleLogout = () => {
//         localStorage.removeItem('userRole');
//         localStorage.removeItem('access');
//         localStorage.removeItem('session_id');
//         navigate('/login');
//     };

//     const copyToClipboard = (text) => {
//         navigator.clipboard.writeText(text);
//         alert('Hash copied to clipboard!');
//     };

//     return (
//         <div className="admin-dashboard">
//             {/* Left Sidebar */}
//             <aside className="admin-sidebar shadow-lg">
//                 <div className="admin-sidebar-header">
//                     <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
//                         <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
//                     </svg>
//                     <span className="text-gradient">Admin Panel</span>
//                 </div>

//                 <nav className="admin-nav">
//                     <button
//                         className={`admin-nav-item ${selectedModule === 'Dashboard' ? 'active' : ''}`}
//                         onClick={() => setSelectedModule('Dashboard')}
//                     >
//                         <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//                             <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
//                         </svg>
//                         <span>Dashboard</span>
//                     </button>

//                     <button
//                         className={`admin-nav-item ${selectedModule === 'User' ? 'active' : ''}`}
//                         onClick={() => setSelectedModule('User')}
//                     >
//                         <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//                             <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
//                         </svg>
//                         <span>User Logs</span>
//                     </button>

//                     <button
//                         className={`admin-nav-item ${selectedModule === 'Manager' ? 'active' : ''}`}
//                         onClick={() => setSelectedModule('Manager')}
//                     >
//                         <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//                             <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
//                         </svg>
//                         <span>Manager Logs</span>
//                     </button>

//                     <button
//                         className={`admin-nav-item ${selectedModule === 'Agent' ? 'active' : ''}`}
//                         onClick={() => setSelectedModule('Agent')}
//                     >
//                         <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//                             <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><polyline points="17 11 19 13 23 9" />
//                         </svg>
//                         <span>Agent Logs</span>
//                     </button>

//                     <button className="admin-nav-item">
//                         <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//                             <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
//                         </svg>
//                         <span>Verify Logs</span>
//                     </button>
//                 </nav>

//                 <div className="admin-sidebar-footer">
//                     <button className="admin-nav-item" onClick={handleLogout} style={{ color: '#ef4444' }}>
//                         <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//                             <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
//                         </svg>
//                         <span>Logout</span>
//                     </button>
//                 </div>
//             </aside>

//             {/* Main Content */}
//             <main className="admin-main">
//                 <header className="admin-control-center glass-panel">
//                     <div className="filter-grid">
//                         <div className="filter-group">
//                             <label>Module</label>
//                             <select
//                                 className="filter-input"
//                                 value={selectedModule}
//                                 onChange={(e) => setSelectedModule(e.target.value)}
//                             >
//                                 <option value="User">User</option>
//                                 <option value="Manager">Manager</option>
//                                 <option value="Agent">Agent</option>
//                             </select>
//                         </div>

//                         <div className="filter-group">
//                             <label>Search User / ID</label>
//                             <input
//                                 type="text"
//                                 className="filter-input"
//                                 placeholder="Search email or ID..."
//                                 value={searchQuery}
//                                 onChange={(e) => setSearchQuery(e.target.value)}
//                             />
//                         </div>

//                         <div className="filter-group">
//                             <label>Date Range</label>
//                             <div style={{ display: 'flex', gap: '0.5rem' }}>
//                                 <input type="date" className="filter-input" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
//                                 <input type="date" className="filter-input" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
//                             </div>
//                         </div>

//                         <button className="btn-primary btn-search" onClick={handleSearch}>
//                             SEARCH LOGS
//                         </button>
//                     </div>
//                 </header>

//                 <section className="admin-logs-table-container glass-panel">
//                     {isLoading ? (
//                         <div className="flex-center" style={{ padding: '5rem', flexDirection: 'column', gap: '1rem' }}>
//                             <div className="loading-spinner"></div>
//                             <p style={{ color: 'var(--text-muted)' }}>Fetching security logs...</p>
//                         </div>
//                     ) : (
//                         <table className="admin-logs-table">
//                             <thead>
//                                 <tr>
//                                     <th>Timestamp</th>
//                                     <th>Module</th>
//                                     <th>Action</th>
//                                     <th>Details</th>
//                                     <th>Log ID</th>
//                                     <th>Security Hash</th>
//                                     <th>Verify</th>
//                                 </tr>
//                             </thead>
//                             <tbody>
//                                 {logs.length > 0 ? (
//                                     logs.map((log, idx) => (
//                                         <tr key={log.id} className={idx % 2 === 0 ? 'striped' : ''}>
//                                             <td>{log.timestamp}</td>
//                                             <td>{log.module}</td>
//                                             <td><span className="status-pill in_progress">{log.action}</span></td>
//                                             <td style={{ maxWidth: '300px' }}>{log.details}</td>
//                                             <td><b>{log.id}</b></td>
//                                             <td className="hash-cell" onClick={() => copyToClipboard(log.hash)}>
//                                                 {log.hash}
//                                                 <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//                                                     <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
//                                                 </svg>
//                                             </td>
//                                             <td><input type="checkbox" defaultChecked /></td>
//                                         </tr>
//                                     ))
//                                 ) : (
//                                     <tr>
//                                         <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
//                                             No audit logs found for the selected criteria.
//                                         </td>
//                                     </tr>
//                                 )}
//                             </tbody>
//                         </table>
//                     )}
//                 </section>

//                 {!isLoading && logs.length > 0 && !showVerification && (
//                     <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center' }}>
//                         <button className="btn-primary" onClick={handleVerifySession} style={{ padding: '1rem 3rem' }}>
//                             VERIFY FULL SESSION
//                         </button>
//                     </div>
//                 )}

//                 {showVerification && (
//                     <div className="verification-card glass-panel">
//                         <div className="verification-header">
//                             <div>
//                                 <h3 style={{ margin: 0 }}>Blockchain Verification Report</h3>
//                                 <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Session Integrity Check via Merkle Proof</p>
//                             </div>
//                             <div className={`status-badge ${isVerified ? 'verified' : 'tampered'}`}>
//                                 {isVerified ? '✓ VERIFIED' : '✖ TAMPERED'}
//                             </div>
//                         </div>

//                         <div className="merkle-roots-grid">
//                             <div className="merkle-root-item">
//                                 <label>Computed Merkle Root</label>
//                                 <div className="merkle-root-value">
//                                     {verificationData?.computed_root || 'N/A'}
//                                 </div>
//                             </div>
//                             <div className="merkle-root-item">
//                                 <label>Blockchain Merkle Root (Sepolia Testnet)</label>
//                                 <div className="merkle-root-value" style={{ color: '#22c55e' }}>
//                                     {verificationData?.blockchain_root || 'N/A'}
//                                 </div>
//                             </div>
//                         </div>

//                         <div className="blockchain-meta">
//                             <span>Transaction Hash: <b style={{ color: '#3b82f6', cursor: 'pointer' }} onClick={() => window.open(verificationData?.explorer_url, '_blank')}>{verificationData?.explorer_url?.split('/tx/')[1] || 'N/A'}</b></span>
//                             <span>Block Number: <b>N/A</b></span>
//                             <span>Network: <b>Sepolia Testnet</b></span>
//                         </div>
//                     </div>
//                 )}
//             </main>
//         </div>
//     );
// };

// export default AdminDashboard;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';
import { useThemeStore } from '../features/theme/stores/useThemeStore';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const { theme, toggleTheme } = useThemeStore();
    const isLightTheme = theme === 'light';
    const [selectedModule, setSelectedModule] = useState('User');
    const [searchQuery, setSearchQuery] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [logs, setLogs] = useState([]);
    const [isVerified, setIsVerified] = useState(null);
    const [showVerification, setShowVerification] = useState(false);
    const [verificationData, setVerificationData] = useState(null);
    const [sessionId, setSessionId] = useState(null);
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

    

    useEffect(() => {
        const token = localStorage.getItem('access');
        if (!token) {
            navigate('/login');
            return;
        }
        const storedSessionId = localStorage.getItem('session_id');
        setSessionId(storedSessionId);
    }, [navigate]);
useEffect(() => {
    if (sessionId !== null) {
        handleSearch();
    }
}, [
    selectedModule,
    sessionId,
    searchQuery,
    dateFrom,
    dateTo
]);

    const moduleMap = {
        'User': 'users',
        'Manager': 'manager',
        'Agent': 'agents'
    };
const handleSearch = async () => {

    if (selectedModule !== "Dashboard" && !sessionId) {
        console.error('No session ID found. Please ensure session_id is stored in localStorage during login.');
        setLogs([]);
        setIsLoading(false);
        return;
    }

    setIsLoading(true);
    setShowVerification(false);
    setIsVerified(null);
    setVerificationData(null);

    const token = localStorage.getItem('access');

    let url = "";

switch (selectedModule) {
    case "Dashboard":
        url = "http://127.0.0.1:8000/audit/all-logs/";
        break;

    case "User":
        url = "http://127.0.0.1:8000/audit/user-logs/";
        break;

    case "Agent":
        url = "http://127.0.0.1:8000/audit/agent-logs/";
        break;

    case "Manager":
        url = "http://127.0.0.1:8000/audit/manager-logs/";
        break;

    case "FinanceManager":
        url =
            "http://127.0.0.1:8000/audit/finance-manager-logs/";
        break;

    case "LeaseManager":
        url =
            "http://127.0.0.1:8000/audit/lease-manager-logs/";
        break;

    default:
        url = "http://127.0.0.1:8000/audit/all-logs/";
}
    

    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            if (response.status === 401) navigate('/login');
            throw new Error('Failed to fetch logs');
        }

        const data = await response.json();

        
        let filteredLogs = data.logs.map(log => ({
    id: log.id,
    timestamp: log.timestamp,
    module: log.module,
    action: log.action,
    details:
        typeof log.details === 'object'
            ? JSON.stringify(log.details)
            : log.details,
    hash: log.log_hash,
    user: log.user,
    userType: log.user_type,
    userId: log.user_id
}));

        // search filter
        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            filteredLogs = filteredLogs.filter(log =>
                String(log.id)
    .toLowerCase()
    .includes(lowerQuery) ||
                log.details.toLowerCase().includes(lowerQuery) ||
                log.user.toLowerCase().includes(lowerQuery)
            );
        }

        // date filter
        // if (dateFrom || dateTo) {
        //     const fromDate = dateFrom ? new Date(dateFrom) : new Date(0);
        //     const toDate = dateTo ? new Date(dateTo) : new Date();
        //     toDate.setHours(23, 59, 59, 999);

        //     filteredLogs = filteredLogs.filter(log => {
        //         const logDate = new Date(log.timestamp);
        //         return logDate >= fromDate && logDate <= toDate;
        //     });
        // }

        setLogs(filteredLogs);
    } catch (error) {
        console.error(error);
        setLogs([]);
    } finally {
        setIsLoading(false);
    }
};
    // // Fetch logs from backend
    // const handleSearch = async () => {
    //     if (!sessionId) {
    //         console.error('No session ID found. Please ensure session_id is stored in localStorage during login.');
    //         setLogs([]);
    //         setIsLoading(false);
    //         return;
    //     }
    //     setIsLoading(true);
    //     setShowVerification(false);
    //     setIsVerified(null);
    //     setVerificationData(null);

    //     const token = localStorage.getItem('access');
    //     const backendModule = moduleMap[selectedModule];

    //     try {
    //         const response = await fetch(`/audit/session-logs/?session_id=${sessionId}&module=${backendModule}`, {
    //             method: 'GET',
    //             headers: {
    //                 'Authorization': `Bearer ${token}`,
    //                 'Content-Type': 'application/json',
    //             },
    //         });

    //         if (!response.ok) {
    //             if (response.status === 401) {
    //                 navigate('/login');
    //             }
    //             throw new Error('Failed to fetch logs');
    //         }

    //         const data = await response.json();
    //         let filteredLogs = data.logs.map(log => ({
    //             id: log.id,
    //             timestamp: log.timestamp,
    //             module: selectedModule,
    //             action: log.action,
    //             details: typeof log.details === 'object' ? JSON.stringify(log.details) : log.details,
    //             hash: log.log_hash,
    //             user: log.user
    //         }));

    //         // Client-side filtering for searchQuery
    //         if (searchQuery) {
    //             const lowerQuery = searchQuery.toLowerCase();
    //             filteredLogs = filteredLogs.filter(log =>
    //                 log.id.toLowerCase().includes(lowerQuery) ||
    //                 log.details.toLowerCase().includes(lowerQuery) ||
    //                 log.user.toLowerCase().includes(lowerQuery)
    //             );
    //         }

    //         // Client-side date filtering
    //         if (dateFrom || dateTo) {
    //             const fromDate = dateFrom ? new Date(dateFrom) : new Date(0);
    //             const toDate = dateTo ? new Date(dateTo) : new Date();
    //             toDate.setHours(23, 59, 59, 999);

    //             filteredLogs = filteredLogs.filter(log => {
    //                 const logDate = new Date(log.timestamp);
    //                 return logDate >= fromDate && logDate <= toDate;
    //             });
    //         }

    //         setLogs(filteredLogs);
    //     } catch (error) {
    //         console.error(error);
    //         setLogs([]);
    //     } finally {
    //         setIsLoading(false);
    //     }
    // };


    // Verify logs via backend
    const handleVerifySession = async () => {
        if (!sessionId) {
            console.error('No session ID found for verification.');
            setIsVerified(false);
            setShowVerification(true);
            return;
        }
        setIsLoading(true);

        const token = localStorage.getItem('access');
        const backendModule = moduleMap[selectedModule];

        try {
            const response = await fetch('http://127.0.0.1:8000/audit/verify-log/', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    session_id: sessionId,
                    module: backendModule
                }),
            });

            if (!response.ok) {
                throw new Error('Verification failed');
            }

            const data = await response.json();
            setVerificationData(data);
            setIsVerified(data.verified);
            setShowVerification(true);
        } catch (error) {
            console.error(error);
            setIsVerified(false);
            setShowVerification(true);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('userRole');
        localStorage.removeItem('access');
        localStorage.removeItem('session_id');
        navigate('/login');
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        alert('Hash copied to clipboard!');
    };

    return (
        <div className="admin-dashboard">
            {/* Left Sidebar */}
            <aside className="admin-sidebar shadow-lg">
                <div className="admin-sidebar-header">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                    <span className="text-gradient">Admin Panel</span>
                </div>

                <nav className="admin-nav">
                        <button
                            className={`admin-nav-item ${selectedModule === 'Dashboard' ? 'active' : ''}`}
                            onClick={() => setSelectedModule('Dashboard')}
                        >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                        </svg>
                        <span>Dashboard</span>
                    </button>

                    <button
                        className={`admin-nav-item ${selectedModule === 'User' ? 'active' : ''}`}
                        onClick={() => setSelectedModule('User')}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                        </svg>
                        <span>User Logs</span>
                    </button>

                    <button
                        className={`admin-nav-item ${selectedModule === 'Manager' ? 'active' : ''}`}
                        onClick={() => setSelectedModule('Manager')}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                        <span>Manager Logs</span>
                    </button>

                    <button
                        className={`admin-nav-item ${selectedModule === 'Agent' ? 'active' : ''}`}
                        onClick={() => setSelectedModule('Agent')}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><polyline points="17 11 19 13 23 9" />
                        </svg>
                        <span>Agent Logs</span>
                    </button>


                                    <button
                    className={`admin-nav-item ${
                        selectedModule === "FinanceManager"
                            ? "active"
                            : ""
                    }`}
                    onClick={() =>
                        setSelectedModule(
                            "FinanceManager"
                        )
                    }
                >
                    <span>
                        Finance Manager Logs
                    </span>
                </button>

                <button
                    className={`admin-nav-item ${
                        selectedModule === "LeaseManager"
                            ? "active"
                            : ""
                    }`}
                    onClick={() =>
                        setSelectedModule(
                            "LeaseManager"
                        )
                    }
                >
                    <span>
                        Lease Manager Logs
                    </span>
                </button>
                </nav>

                <div className="admin-sidebar-footer">
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
                    <button className="admin-nav-item" onClick={handleLogout} style={{ color: '#ef4444' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="admin-main">
                <div className="admin-header-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h1 className="text-gradient" style={{ margin: 0, fontSize: '2rem' }}>Admin Control Center</h1>
                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ background:'var(--bg-card)', border:'1px solid var(--border-light)', borderRadius:'50%', width:'40px', height:'40px', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-muted)' }}>
                                {userInfo?.profile_picture ? (
                                    <img
                                        src={userInfo.profile_picture}
                                        alt=""
                                        style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }}
                                    />
                                ) : (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '20px', height: '20px' }}>
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                        <circle cx="12" cy="7" r="4" />
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
                <header className="admin-control-center glass-panel">
                    <div className="filter-grid">
                        <div className="filter-group">
                            <label>Module</label>
                            <select
                                className="filter-input"
                                value={selectedModule}
                                onChange={(e) => setSelectedModule(e.target.value)}
                            >
<option value="Dashboard">
    Dashboard
</option>

<option value="User">
    User
</option>

<option value="Manager">
    Manager
</option>

<option value="Agent">
    Agent
</option>

<option value="FinanceManager">
    Finance Manager
</option>

<option value="LeaseManager">
    Lease Manager
</option>
                            </select>
                        </div>

                        <div className="filter-group">
                            <label>Search User / ID</label>
                            <input
                                type="text"
                                className="filter-input"
                                placeholder="Search email or ID..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                       
                        <button className="btn-primary btn-search" onClick={handleSearch}>
                            SEARCH LOGS
                        </button>
                    </div>
                </header>

                <section className="admin-logs-table-container glass-panel">
                    {isLoading ? (
                        <div className="flex-center" style={{ padding: '5rem', flexDirection: 'column', gap: '1rem' }}>
                            <div className="loading-spinner"></div>
                            <p style={{ color: 'var(--text-muted)' }}>Fetching security logs...</p>
                        </div>
                    ) : (
                        
                        <table className="admin-logs-table">
                            <thead>
                                <tr><th>Timestamp</th>
                                    <th>Username</th>
                                    <th>User Type</th>
                                    <th>Module</th>
                                    <th>Action</th>
                                    <th>Details</th>
                                    <th>Security Hash</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.length > 0 ? (
                                    logs.map((log, idx) => (
                                        <tr key={log.id} className={idx % 2 === 0 ? 'striped' : ''}>
                                            <td>{log.timestamp}</td>
                                                    <td>{log.user}</td>
                                                    <td>{log.userType}</td>
                                                    <td>{log.module}</td>
                                                    <td>{log.action}</td>
                                                    <td style={{
                                                        maxWidth: "250px",
                                                        overflow: "hidden",
                                                        textOverflow: "ellipsis",
                                                        whiteSpace: "nowrap"
                                                    }}>{log.details}</td>
                                            <td className="hash-cell" onClick={() => copyToClipboard(log.hash)}>
                                                {log.hash}
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                                                </svg>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                            No audit logs found for the selected criteria.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </section>


                {showVerification && (
                    <div className="verification-card glass-panel">
                        <div className="verification-header">
                            <div>
                                <h3 style={{ margin: 0 }}>Blockchain Verification Report</h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Session Integrity Check via Merkle Proof</p>
                            </div>
                            <div className={`status-badge ${isVerified ? 'verified' : 'tampered'}`}>
                                {isVerified ? '✓ VERIFIED' : '✖ TAMPERED'}
                            </div>
                        </div>

                        <div className="merkle-roots-grid">
                            <div className="merkle-root-item">
                                <label>Computed Merkle Root</label>
                                <div className="merkle-root-value">
                                    {verificationData?.computed_root || 'N/A'}
                                </div>
                            </div>
                            <div className="merkle-root-item">
                                <label>Blockchain Merkle Root (Sepolia Testnet)</label>
                                <div className="merkle-root-value" style={{ color: '#22c55e' }}>
                                    {verificationData?.blockchain_root || 'N/A'}
                                </div>
                            </div>
                        </div>

                        <div className="blockchain-meta">
                            <span>Transaction Hash: <b style={{ color: '#3b82f6', cursor: 'pointer' }} onClick={() => window.open(verificationData?.explorer_url, '_blank')}>{verificationData?.explorer_url?.split('/tx/')[1] || 'N/A'}</b></span>
                            <span>Block Number: <b>N/A</b></span>
                            <span>Network: <b>Sepolia Testnet</b></span>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default AdminDashboard;