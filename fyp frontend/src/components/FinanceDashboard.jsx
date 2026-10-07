import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import './FinanceDashboard.css';
import React, {
  useState,
  useEffect
} from "react";
import { useThemeStore } from '../features/theme/stores/useThemeStore';


const FinanceDashboard = () => {
  const { theme } = useThemeStore();
  const isLightTheme = theme === 'light';
  
  const COLORS = isLightTheme ? [
    "#8EB1D1", // Cool Cerulean
    "#A7C7E7", // Baby Blue Eyes
    "#C4D8E5"  // Light Blue Grey
  ] : [
    "#22c55e",
    "#3b82f6",
    "#f97316",
    "#ef4444",
    "#8b5cf6"
  ];

  const [lineData, setLineData] = useState([]);
const [pieData, setPieData] = useState([]);
const [recentTransactions, setRecentTransactions] = useState([]);
const [transactionSummary, setTransactionSummary] = useState([]);
const [userInfo, setUserInfo] = useState(null);


const [stats, setStats] = useState({
  total_transactions: 0,
  total_property_value: 0,
  total_payable_amount: 0,
  total_received: 0,
  total_released: 0,
  commission_earned: 0,
  pending_requests: 0,
  failed_transactions:0,
});

const CustomPieLegend = ({ payload }) => {
  return (
    <ul className="custom-pie-legend">
      {payload.map((entry, index) => (
        <li key={index}>
          <span
            className="legend-dot"
            style={{
              backgroundColor:
                entry.color
            }}
          />

          <span className="legend-text">
            {entry.value}
          </span>
        </li>
      ))}
    </ul>
  );
};


const token = localStorage.getItem("access");

const fetchDashboard = async () => {
  try {
    const response = await fetch(
      "http://127.0.0.1:8000/finance/dashboard/",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    console.log("Dashboard Data:", data);

    setStats(data);

    setPieData([
      {
        name: "Received",
        value: Number(data.total_received),
      },
      {
        name: "Released",
        value: Number(data.total_released),
      },
      {
        name: "Commission",
        value: Number(data.commission_earned),
      },
    ]);

    setLineData([
      {
        name: "Finance",
        received: Number(data.total_received),
        pending:
          Number(data.total_payable_amount) -
          Number(data.total_received),
      },
    ]);

    setTransactionSummary(
  data.property_summary || []
);
    setRecentTransactions(
      data.recent_transactions || []
    );
  } catch (error) {
    console.log(error);
  }
};

useEffect(() => {
  fetchDashboard();
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




  return (
    <div className="finance-dashboard">
      <div className="finance-header">
        <h1>Finance Dashboard</h1>
        <div className="header-actions">
          
          <div className="user-profile" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: isLightTheme ? '#C4D8E5' : 'var(--bg-card)', border: isLightTheme ? '1px solid #8EB1D1' : '1px solid var(--border-light)', borderRadius:'50%', width:'40px', height:'40px', display:'flex', alignItems:'center', justifyContent:'center', color: isLightTheme ? '#1C2B48' : 'var(--text-muted)', overflow: 'hidden' }}>
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
            <div className="user-info" style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
              <span className="user-name" style={{ fontWeight: '600', fontSize: '14px', color: isLightTheme ? '#1C2B48' : 'white' }}>
                {userInfo?.name || "Loading..."}
              </span>
              <span className="user-role" style={{ fontSize: '12px', color: isLightTheme ? '#1C2B48' : 'var(--text-muted)' }}>
                {userInfo?.role}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
          </div>
          <div className="stat-details">
            <span className="stat-label">Total Transactions</span>
            <span className="stat-value">{stats.total_transactions}</span>
            <span className="stat-subtext">All time</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="6" width="20" height="12" rx="2"></rect>
              <circle cx="12" cy="12" r="2"></circle>
              <path d="M6 12h.01M18 12h.01"></path>
            </svg>
          </div>
          <div className="stat-details">
            <span className="stat-label">Total Amount</span>
            <span className="stat-value">PKR {stats.total_property_value}</span>
            <span className="stat-subtext">All time</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon teal">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </div>
          <div className="stat-details">
            <span className="stat-label">Received Amount</span>
            <span className="stat-value">PKR {stats.total_received}</span>
            <span className="stat-subtext">All time</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon orange">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </div>
          <div className="stat-details">
            <span className="stat-label">Pending Amount</span>
            <span className="stat-value">PKR {stats.total_payable_amount - stats.total_received}</span>
            <span className="stat-subtext">All time</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon red">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 8 12 12"></polyline>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <div className="stat-details">
            <span className="stat-label">Failed Transactions</span>
            <span className="stat-value">{stats.failed_transactions}</span>
            <span className="stat-subtext">All time</span>
          </div>
        </div>
      </div>

      <div className="charts-row">
        <div className="chart-card line-chart-card">
          <div className="chart-header">
            <h3>Transaction Overview</h3>
            <select className="year-select">
              <option>2024</option>
              <option>2023</option>
            </select>
          </div>
          <div className="chart-legend-top">
            <span className="legend-item"><span className="dot green-dot" style={{ backgroundColor: isLightTheme ? '#8EB1D1' : '#22c55e' }}></span> Received Amount</span>
            <span className="legend-item"><span className="dot orange-dot" style={{ backgroundColor: isLightTheme ? '#A7C7E7' : '#f97316' }}></span> Pending Amount</span>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={lineData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isLightTheme ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.05)'} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: isLightTheme ? '#ffffff' : '#6b7280' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: isLightTheme ? '#ffffff' : '#6b7280' }} tickFormatter={(val) => `${val / 1000000}M`} />
                <Tooltip 
                  formatter={(value) => [`PKR ${value.toLocaleString()}`, '']}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                />
                <Line type="monotone" dataKey="received" stroke={isLightTheme ? '#8EB1D1' : '#22c55e'} strokeWidth={2} dot={{ r: 4, fill: isLightTheme ? '#8EB1D1' : '#22c55e' }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="pending" stroke={isLightTheme ? '#A7C7E7' : '#f97316'} strokeWidth={2} dot={{ r: 4, fill: isLightTheme ? '#A7C7E7' : '#f97316' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card pie-chart-card">
          <div className="chart-header">
            <h3>Transaction by Type</h3>
          </div>
          <div className="chart-container pie-container">
            <div className="pie-wrapper">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => value} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pie-center-text">
                <span className="pie-total">  {stats.total_transactions}</span>
                <span className="pie-label">Total</span>
              </div>
            </div>
            <div className="pie-legend-wrapper">
              <CustomPieLegend payload={pieData.map((entry, index) => ({ color: COLORS[index], value: entry.name }))} />
            </div>
          </div>
        </div>

        <div className="chart-card recent-tx-card">
          <div className="chart-header">
            <h3>Recent Transactions</h3>
            <button className="view-all-btn">View All</button>
          </div>
          <div className="recent-tx-list">
            {recentTransactions.map((tx, idx) => (
              <div className="tx-item" key={idx}>
                <span className="tx-id">{tx.id}</span>
                <span className="tx-type">{tx.type}</span>
                <span className="tx-amount">{tx.amount}</span>
                <span className="tx-date">{tx.date}</span>
                <span className={`tx-status ${tx.status.toLowerCase()}`}>{tx.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bottom-row">
        <div className="chart-card summary-card" style={{ width: '100%' }}>
          <div className="chart-header">
            <h3>Transaction Summary</h3>
          </div>
          <div className="table-responsive">
            <table className="summary-table">
              <thead>
                <tr>
<th>Property</th>
<th>Total Price</th>
<th>Total Payable</th>
<th>Received</th>
<th>Remaining</th>
<th>Released</th>
<th>Status</th>
                </tr>
              </thead>
              <tbody>
  {transactionSummary.map((row, idx) => (
    <tr key={idx}>

      <td>
        {row.property_title}
      </td>

      <td>
        PKR {row.total_price.toLocaleString()}
      </td>

      <td>
        PKR {row.total_payable.toLocaleString()}
      </td>

      <td>
        PKR {row.received.toLocaleString()}
      </td>

      <td>
        PKR {row.remaining.toLocaleString()}
      </td>

      <td>
        PKR {row.released.toLocaleString()}
      </td>

      <td>
        {row.status}
      </td>

    </tr>
  ))}
</tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinanceDashboard;
