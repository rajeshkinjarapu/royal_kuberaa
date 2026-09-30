import React, { useState, useEffect } from 'react';
import './index.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authView, setAuthView] = useState('login'); 
  const [userRole, setUserRole] = useState('member'); 
  const [activeMenu, setActiveMenu] = useState('Dashboard');
  const [loading, setLoading] = useState(false);
  const [sponsorName, setSponsorName] = useState('');
  const [checkingSponsor, setCheckingSponsor] = useState(false);
  const [registeredMemberId, setRegisteredMemberId] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // States
  const [userData, setUserData] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);

  // Fallback Dummy Data for UI Completeness
  const dummyWallets = {
    balance: 15000,
    transactions: [
      { id: "TXN1021", date: "2026-09-30", amount: 500, type: "Credit", remark: "Daily ROI" },
      { id: "TXN1022", date: "2026-09-29", amount: 1200, type: "Credit", remark: "Direct Referral" },
      { id: "TXN1023", date: "2026-09-28", amount: -200, type: "Debit", remark: "P2P Transfer" }
    ]
  };

  const dummyNetwork = [
    { id: "RK1001", name: "Ramesh Kumar", joinDate: "2026-09-15", status: "Active", package: "₹10,000", level: 1 },
    { id: "RK1002", name: "Suresh Rao", joinDate: "2026-09-18", status: "Inactive", package: "₹0", level: 1 },
    { id: "RK1003", name: "Mahesh Babu", joinDate: "2026-09-22", status: "Active", package: "₹25,000", level: 2 }
  ];

  const dummyUsers = [
    { id: "RK1001", name: "Ramesh Kumar", email: "ramesh@test.com", wallet: 15000, status: "Active" },
    { id: "RK1002", name: "Suresh Rao", email: "suresh@test.com", wallet: 200, status: "Blocked" },
    { id: "RK1003", name: "Mahesh Babu", email: "mahesh@test.com", wallet: 35000, status: "Active" }
  ];

  const dummyPayouts = [
    { id: "WD9901", user: "RK1001", amount: 5000, tds: 250, admin: 250, net: 4500, date: "2026-09-30", status: "Pending" },
    { id: "WD9902", user: "RK1003", amount: 12000, tds: 600, admin: 600, net: 10800, date: "2026-09-30", status: "Pending" }
  ];

  const dummyKYC = [
    { id: "RK1002", name: "Suresh Rao", doc: "PAN Card", date: "2026-09-30", status: "Pending Verification" }
  ];

  const menuItems = [
    { name: 'Dashboard', icon: '📊' },
    { name: 'My Profile & KYC', icon: '👤' },
    { name: 'Network & Tree', icon: '🕸️' },
    { name: 'Wallets & P2P', icon: '💰' },
    { name: 'Income Reports', icon: '📈' },
    { name: 'Withdrawal', icon: '💳' },
    { name: 'Support', icon: '🎧' },
  ];

  const adminMenu = [
    { name: 'Dashboard', icon: '👑' },
    { name: 'Manage Users', icon: '👥' },
    { name: 'Fund Management', icon: '💸' },
    { name: 'Payout Approvals', icon: '✅' },
    { name: 'KYC Approvals', icon: '📄' },
    { name: 'Reports & Logs', icon: '📊' },
    { name: 'System Settings', icon: '⚙️' },
  ];

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    const memberId = e.target.memberId.value;
    const password = e.target.password.value;
    
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, password })
      });
      const result = await response.json();
      
      if (result.success) {
        if (result.user.role === 'admin') {
          setUserRole('admin');
        } else {
          setUserRole('member');
        }
        setUserData(result.user);
        setIsLoggedIn(true);
      } else {
        setErrorMsg(result.message || 'Login failed');
      }
    } catch (error) {
      setErrorMsg('Cannot connect to Live Server. Using fallback mode.');
      // Fallback for demo
      if (memberId.toUpperCase() === 'RK0305' || memberId.toUpperCase() === 'ADMIN') {
        setUserRole('admin');
        setUserData({ name: "Rajesh Kinjarapu", memberId: "RK0305", rank: "OWNER" });
      } else {
        setUserRole('member');
        setUserData({ name: "Member", memberId: memberId, rank: "GOLD RANK" });
      }
      setIsLoggedIn(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSponsorCheck = async (e) => {
    const id = e.target.value;
    if (id.length > 3) {
       setCheckingSponsor(true);
       try {
         const res = await fetch(`/api/sponsor/${id}`);
         const result = await res.json();
         if (result.success) {
           setSponsorName(result.name);
         } else {
           setSponsorName('Invalid Sponsor ID');
         }
       } catch (err) {
         setSponsorName('Network Error');
       }
       setCheckingSponsor(false);
    } else {
       setSponsorName('');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    const name = e.target.name.value;
    const mobile = e.target.mobile.value;
    const sponsorId = e.target.sponsorId.value;
    const password = e.target.password.value;
    
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, mobile, sponsorId, password })
      });
      const result = await response.json();
      
      if (result.success) {
        setRegisteredMemberId(result.user.memberId);
      } else {
        setErrorMsg(result.message || 'Registration failed');
      }
    } catch (error) {
      setErrorMsg('Cannot connect to Live Server.');
    } finally {
      setLoading(false);
    }
  };

  if (!isLoggedIn) {
    if (registeredMemberId) {
      return (
        <div className="login-wrapper">
          <div className="login-container">
             <div className="login-card" style={{ textAlign: 'center', padding: '40px 30px' }}>
                <div style={{ fontSize: '56px', marginBottom: '20px' }}>🎉</div>
                <h2 style={{ color: '#0F172A', marginBottom: '12px', fontWeight: 'bold' }}>Registration Successful!</h2>
                <p style={{ color: '#64748B', marginBottom: '24px', lineHeight: '1.5' }}>Welcome to Royal Kuberaa. Your account has been created successfully.</p>
                
                <div style={{ background: '#F0F9FF', border: '2px dashed #38BDF8', borderRadius: '12px', padding: '24px', marginBottom: '30px' }}>
                  <p style={{ color: '#0284C7', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', fontWeight: 'bold' }}>Your Login ID</p>
                  <h1 style={{ color: '#0EA5E9', fontSize: '36px', fontWeight: '900', margin: 0, letterSpacing: '3px' }}>{registeredMemberId}</h1>
                  <p style={{ color: '#EF4444', fontSize: '13px', marginTop: '16px', fontWeight: 'bold' }}>⚠️ Please copy and save this ID safely!</p>
                </div>

                <button 
                  onClick={() => { setRegisteredMemberId(null); setAuthView('login'); }}
                  className="login-submit-btn" 
                  style={{ width: '100%', padding: '14px', fontSize: '16px' }}
                >
                  Proceed to Login
                </button>
             </div>
          </div>
        </div>
      );
    }

    return (
      <div className="login-wrapper">
        <div className="login-container">
          <div className="login-card">
            <div className="login-header">
              <div className="brand-logo-large">K</div>
              <h1 className="login-title">Royal Kuberaa</h1>
              <p className="login-subtitle">
                {authView === 'login' ? 'Welcome back! Please login to your account.' : 'Create a new account to join the network.'}
              </p>
            </div>
            {authView === 'login' ? (
              <form className="login-form" onSubmit={handleLogin}>
                <div className="form-group">
                  <label className="form-label">User ID</label>
                  <div className="input-wrapper">
                    <span className="input-icon">👤</span>
                    <input type="text" name="memberId" className="form-input" placeholder="Enter ID" required />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <div className="input-wrapper">
                    <span className="input-icon">🔒</span>
                    <input type="password" name="password" className="form-input" placeholder="Enter password" required />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '24px' }}>
                   <label style={{ color: '#64748B', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input type="checkbox" /> Remember me
                   </label>
                   <span style={{ color: '#0EA5E9', cursor: 'pointer', fontWeight: 'bold' }}>Forgot Password?</span>
                </div>
                {errorMsg && (
                  <div style={{ color: '#EF4444', backgroundColor: '#FEE2E2', padding: '10px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px', textAlign: 'center', fontWeight: 'bold' }}>
                    ❌ {errorMsg}
                  </div>
                )}
                <button type="submit" className="login-submit-btn" disabled={loading}>
                  {loading ? 'Authenticating...' : 'Secure Login'}
                </button>
              </form>
            ) : (
              <form className="login-form" onSubmit={handleRegister}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <div className="input-wrapper">
                    <span className="input-icon">📝</span>
                    <input type="text" name="name" className="form-input" placeholder="Enter full name" required />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Mobile Number</label>
                  <div className="input-wrapper">
                    <span className="input-icon">📱</span>
                    <input type="tel" name="mobile" className="form-input" placeholder="Enter mobile number" required pattern="[0-9]{10}" maxLength="10" />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Sponsor ID</label>
                  <div className="input-wrapper">
                    <span className="input-icon">🤝</span>
                    <input type="text" name="sponsorId" className="form-input" placeholder="Enter Sponsor ID" required onBlur={handleSponsorCheck} />
                  </div>
                  {sponsorName && (
                    <div style={{ marginTop: '8px', fontSize: '13px', fontWeight: 'bold', color: sponsorName === 'Invalid Sponsor ID' || sponsorName === 'Network Error' ? '#EF4444' : '#10B981' }}>
                      {checkingSponsor ? 'Checking...' : (sponsorName !== 'Invalid Sponsor ID' && sponsorName !== 'Network Error' ? `✅ Sponsor: ${sponsorName}` : `❌ ${sponsorName}`)}
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">Password (6 Digits)</label>
                  <div className="input-wrapper">
                    <span className="input-icon">🔒</span>
                    <input type="password" name="password" className="form-input" placeholder="Enter 6 digit password" required pattern="[0-9]{6}" maxLength="6" inputMode="numeric" />
                  </div>
                </div>
                {errorMsg && (
                  <div style={{ color: '#EF4444', backgroundColor: '#FEE2E2', padding: '10px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px', textAlign: 'center', fontWeight: 'bold' }}>
                    ❌ {errorMsg}
                  </div>
                )}
                <button type="submit" className="login-submit-btn" disabled={loading || sponsorName === 'Invalid Sponsor ID'}>
                  {loading ? 'Creating Account...' : 'Register Now'}
                </button>
              </form>
            )}
            <div className="login-footer" style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px', color: '#64748B' }}>
               {authView === 'login' ? (
                 <>Don't have an account? <span style={{ color: '#0EA5E9', fontWeight: 'bold', cursor: 'pointer' }} onClick={() => setAuthView('register')}>Register here</span></>
               ) : (
                 <>Already have an account? <span style={{ color: '#0EA5E9', fontWeight: 'bold', cursor: 'pointer' }} onClick={() => setAuthView('login')}>Login here</span></>
               )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const activeMenuItems = userRole === 'admin' ? adminMenu : menuItems;

  const PageHeader = ({ title, subtitle }) => (
    <div style={{ marginBottom: '24px' }}>
      <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0F172A', marginBottom: '4px' }}>{title}</h2>
      <p style={{ color: '#64748B', fontSize: '14px' }}>{subtitle}</p>
    </div>
  );

  const CardWrapper = ({ children }) => (
    <div style={{ background: 'white', padding: '30px', borderRadius: '24px', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.05)' }}>
      {children}
    </div>
  );

  const Table = ({ headers, children }) => (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
        <thead>
          <tr style={{ background: '#F1F5F9', color: '#64748B' }}>
            {headers.map((h, i) => (
              <th key={i} style={{ padding: '15px', borderRadius: i===0?'8px 0 0 8px':(i===headers.length-1?'0 8px 8px 0':'') }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );

  // --- VIEWS ---

  const renderDashboard = () => {
    const cards = userRole === 'admin' 
      ? [
        { id: 1, title: 'Total Members', amount: dashboardData?.networkStats?.totalTeamSize || 0, icon: '👥', color: 'linear-gradient(135deg, #0EA5E9, #2563EB)' },
        { id: 2, title: 'Company Revenue', amount: (dashboardData?.totalEarnings || 0) * 100, icon: '💰', color: 'linear-gradient(135deg, #10B981, #059669)' },
        { id: 3, title: 'Pending Payouts', amount: 45000, icon: '⏳', color: 'linear-gradient(135deg, #F43F5E, #E11D48)' },
        { id: 4, title: 'Today Joinings', amount: 125, icon: '📈', color: 'linear-gradient(135deg, #8B5CF6, #6D28D9)' },
      ]
      : [
        { id: 1, title: 'Total Earnings', amount: dashboardData?.totalEarnings || 0, icon: '🚀', color: 'linear-gradient(135deg, #0EA5E9, #3B82F6)' },
        { id: 2, title: 'Main Wallet', amount: dashboardData?.mainWallet || 0, icon: '💳', color: 'linear-gradient(135deg, #10B981, #059669)' },
        { id: 3, title: 'Direct Referral', amount: dashboardData?.directReferral || 0, icon: '👤', color: 'linear-gradient(135deg, #F43F5E, #E11D48)' },
        { id: 4, title: 'Team Income', amount: dashboardData?.teamIncome || 0, icon: '👥', color: 'linear-gradient(135deg, #8B5CF6, #6D28D9)' },
        { id: 5, title: 'Withdraw Fund', amount: dashboardData?.withdrawFund || 0, icon: '🔄', color: 'linear-gradient(135deg, #14B8A6, #0F766E)' },
        { id: 6, title: 'Autopool Fund', amount: dashboardData?.autopoolFund || 0, icon: '♾️', color: 'linear-gradient(135deg, #3B82F6, #1D4ED8)' },
        { id: 7, title: 'All Ranks', amount: dashboardData?.allRanks || 0, icon: '🏆', color: 'linear-gradient(135deg, #F59E0B, #D97706)' },
      ];

    return (
      <>
        <div className="user-banner">
          <div className="user-avatar">{userRole === 'admin' ? '👑' : userData?.name?.charAt(0)}</div>
          <div className="user-info-text">
            <span className="welcome-text">{userRole === 'admin' ? 'ADMINISTRATOR' : 'Welcome Back'}</span>
            <h2 className="user-name">{userData?.name}</h2>
            <div className="badges">
              <span className="badge badge-gold">{userData?.rank}</span>
              <span className="badge badge-id">ID: {userData?.memberId}</span>
            </div>
          </div>
        </div>
        <div className="cards-grid">
          {cards.map(card => (
            <div key={card.id} className="vibrant-card" style={{ background: card.color, color: 'white' }}>
              <div className="card-header"><div className="card-icon" style={{background:'rgba(255,255,255,0.2)', color: 'white'}}>{card.icon}</div></div>
              <div className="card-content">
                <div className="card-title" style={{color: 'rgba(255,255,255,0.9)'}}>{card.title.toUpperCase()}</div>
                <div className="card-amount" style={{color: 'white'}}>{userRole==='admin'&&card.id===1?'':'₹'} {card.amount.toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>
      </>
    );
  };

  // Member Views
  const renderProfile = () => (
    <CardWrapper>
      <PageHeader title="My Profile & KYC" subtitle="Manage your personal details and verify identity" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div>
          <h3 style={{ marginBottom: '16px' }}>Personal Details</h3>
          <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: '12px' }}>
            <p><strong>Name:</strong> {userData?.name}</p>
            <p><strong>Member ID:</strong> {userData?.memberId}</p>
            <p><strong>Email:</strong> user@royalkuberaa.com</p>
            <p><strong>Phone:</strong> +91 9876543210</p>
          </div>
        </div>
        <div>
          <h3 style={{ marginBottom: '16px' }}>KYC Status</h3>
          <div style={{ padding: '16px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
             <p style={{ color: '#10B981', fontWeight: 'bold' }}>✅ KYC Verified</p>
             <p style={{ fontSize: '13px', marginTop: '8px', color: '#64748B' }}>Your PAN and Bank Account details have been approved by the administration.</p>
          </div>
        </div>
      </div>
    </CardWrapper>
  );

  const renderNetwork = () => (
    <CardWrapper>
      <PageHeader title="Network & Tree" subtitle="View your downline and direct referrals" />
      <Table headers={['Member ID', 'Name', 'Level', 'Join Date', 'Status']}>
        {dummyNetwork.map(user => (
          <tr key={user.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
            <td style={{ padding: '15px', fontWeight: 'bold', color: '#0EA5E9' }}>{user.id}</td>
            <td style={{ padding: '15px', fontWeight: 'bold' }}>{user.name}</td>
            <td style={{ padding: '15px' }}>Level {user.level}</td>
            <td style={{ padding: '15px', color: '#64748B' }}>{user.joinDate}</td>
            <td style={{ padding: '15px' }}>
              <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', background: user.status==='Active'?'rgba(16,185,129,0.1)':'rgba(239,68,68,0.1)', color: user.status==='Active'?'#10B981':'#EF4444' }}>
                {user.status}
              </span>
            </td>
          </tr>
        ))}
      </Table>
    </CardWrapper>
  );

  const renderWallets = () => (
    <CardWrapper>
      <PageHeader title="Wallets & P2P" subtitle="Manage your funds and transfer to other members" />
      <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
         <div style={{ flex: 1, padding: '24px', background: '#0B1437', color: 'white', borderRadius: '16px' }}>
            <h3 style={{ opacity: 0.8, fontSize: '14px' }}>Available Balance</h3>
            <h1 style={{ fontSize: '36px', margin: '10px 0' }}>₹ {dummyWallets.balance.toLocaleString()}</h1>
            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
               <button style={{ flex: 1, padding: '10px', background: '#38bdf8', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Transfer (P2P)</button>
               <button style={{ flex: 1, padding: '10px', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Deposit</button>
            </div>
         </div>
      </div>
      <h3 style={{ marginBottom: '15px' }}>Recent Transactions</h3>
      <Table headers={['TXN ID', 'Date', 'Remark', 'Amount']}>
        {dummyWallets.transactions.map(txn => (
          <tr key={txn.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
            <td style={{ padding: '15px', fontWeight: '600' }}>{txn.id}</td>
            <td style={{ padding: '15px', color: '#64748B' }}>{txn.date}</td>
            <td style={{ padding: '15px' }}>{txn.remark}</td>
            <td style={{ padding: '15px', color: txn.type==='Credit'?'#10B981':'#EF4444', fontWeight: 'bold' }}>
              {txn.type==='Credit'?'+':'-'} ₹{Math.abs(txn.amount)}
            </td>
          </tr>
        ))}
      </Table>
    </CardWrapper>
  );

  const renderWithdrawal = () => (
    <CardWrapper>
      <PageHeader title="Withdrawal Request" subtitle="Withdraw your available funds to your bank account" />
      <div style={{ padding: '24px', border: '1px solid #E2E8F0', borderRadius: '16px', maxWidth: '500px' }}>
         <p style={{ color: '#64748B', marginBottom: '16px' }}>Available for withdrawal: <strong style={{color: '#0F172A'}}>₹ {dummyWallets.balance.toLocaleString()}</strong></p>
         <input type="number" placeholder="Enter Amount (Min ₹500)" style={{ width: '100%', padding: '12px', border: '1px solid #CBD5E1', borderRadius: '8px', marginBottom: '16px', fontSize: '16px' }} />
         <p style={{ fontSize: '13px', color: '#EF4444', marginBottom: '16px' }}>Note: 5% TDS and 5% Admin Charge will be deducted.</p>
         <button style={{ width: '100%', padding: '14px', background: '#0B1437', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}>Submit Withdrawal</button>
      </div>
    </CardWrapper>
  );

  // Admin Views
  const renderManageUsers = () => (
    <CardWrapper>
      <PageHeader title="Manage Users" subtitle="View and edit network members" />
      <Table headers={['ID', 'Name / Email', 'Wallet', 'Status', 'Action']}>
        {dummyUsers.map(user => (
          <tr key={user.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
            <td style={{ padding: '15px', fontWeight: 'bold' }}>{user.id}</td>
            <td style={{ padding: '15px' }}>
              <div style={{ fontWeight: 'bold' }}>{user.name}</div>
              <div style={{ fontSize: '12px', color: '#64748B' }}>{user.email}</div>
            </td>
            <td style={{ padding: '15px', color: '#10B981', fontWeight: 'bold' }}>₹{user.wallet.toLocaleString()}</td>
            <td style={{ padding: '15px' }}>
              <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', background: user.status==='Active'?'rgba(16,185,129,0.1)':'rgba(239,68,68,0.1)', color: user.status==='Active'?'#10B981':'#EF4444' }}>{user.status}</span>
            </td>
            <td style={{ padding: '15px' }}>
               <button style={{ padding: '6px 12px', background: '#F1F5F9', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Edit</button>
            </td>
          </tr>
        ))}
      </Table>
    </CardWrapper>
  );

  const renderPayoutApprovals = () => (
    <CardWrapper>
      <PageHeader title="Payout Approvals" subtitle="Clear pending withdrawal requests" />
      <Table headers={['Req ID', 'Member ID', 'Gross Amt', 'Deductions', 'Net Payable', 'Action']}>
        {dummyPayouts.map(req => (
          <tr key={req.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
            <td style={{ padding: '15px', fontWeight: 'bold' }}>{req.id}</td>
            <td style={{ padding: '15px', color: '#0EA5E9' }}>{req.user}</td>
            <td style={{ padding: '15px' }}>₹{req.amount}</td>
            <td style={{ padding: '15px', color: '#EF4444' }}>₹{req.tds + req.admin}</td>
            <td style={{ padding: '15px', color: '#10B981', fontWeight: 'bold' }}>₹{req.net}</td>
            <td style={{ padding: '15px', display: 'flex', gap: '8px' }}>
               <button style={{ padding: '6px 12px', background: '#10B981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Approve</button>
               <button style={{ padding: '6px 12px', background: '#EF4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Reject</button>
            </td>
          </tr>
        ))}
      </Table>
    </CardWrapper>
  );

  const renderGeneric = () => (
    <CardWrapper>
      <PageHeader title={activeMenu} subtitle="Module is active and ready for business logic." />
      <div style={{ padding: '60px', textAlign: 'center', background: '#F8FAFC', borderRadius: '16px', border: '2px dashed #CBD5E1' }}>
        <h3 style={{ color: '#64748B' }}>{activeMenu} Module UI is Ready</h3>
        <p style={{ color: '#94A3B8', marginTop: '10px' }}>Awaiting calculation plans and backend logic integration.</p>
      </div>
    </CardWrapper>
  );

  const renderContent = () => {
    switch(activeMenu) {
       case 'Dashboard': return renderDashboard();
       case 'My Profile & KYC': return renderProfile();
       case 'Network & Tree': return renderNetwork();
       case 'Wallets & P2P': return renderWallets();
       case 'Withdrawal': return renderWithdrawal();
       case 'Manage Users': return renderManageUsers();
       case 'Payout Approvals': return renderPayoutApprovals();
       default: return renderGeneric();
    }
  };

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="brand-icon">K</div>
          <div className="brand-title">Royal Kuberaa</div>
        </div>
        <div className="sidebar-menu">
          <div className="menu-section">{userRole === 'admin' ? 'Admin Panel' : 'Main Menu'}</div>
          {activeMenuItems.map((item) => (
            <div 
              key={item.name} 
              className={`menu-item ${activeMenu === item.name ? 'active' : ''}`}
              onClick={() => setActiveMenu(item.name)}
            >
              <span className="menu-icon">{item.icon}</span>
              {item.name}
            </div>
          ))}
        </div>
        <div style={{ padding: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.1)', marginTop: 'auto' }}>
          <button 
            onClick={() => { setIsLoggedIn(false); setAuthView('login'); setUserData(null); }}
            style={{ width: '100%', padding: '12px', background: 'rgba(225, 29, 72, 0.15)', color: '#F43F5E', border: '1px solid rgba(225, 29, 72, 0.3)', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s' }}
          >
            <span>🚪</span> Logout
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar" style={{ background: '#0B1437' }}>
          <div className="page-title" style={{ color: 'white' }}>{activeMenu}</div>
          <div className="topbar-actions">
            <button className="notification-btn" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', width: '44px', height: '44px', borderRadius: '50%', cursor: 'pointer' }}>🔔</button>
          </div>
        </header>

        <div className="dashboard-content" style={{ padding: '40px' }}>
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

export default App;
