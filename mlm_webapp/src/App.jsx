import React, { useState, useEffect, useRef } from 'react';
import './index.css';
import * as htmlToImage from 'html-to-image';

const PinInput = ({ name }) => {
  const [pin, setPin] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef([]);

  const handleChange = (index, value) => {
    if (!/^[0-9]*$/.test(value)) return;
    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);
    if (value !== '' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text').slice(0, 6).replace(/[^0-9]/g, '');
    if (paste) {
      const newPin = [...pin];
      paste.split('').forEach((char, i) => {
        newPin[i] = char;
      });
      setPin(newPin);
      const nextIndex = Math.min(paste.length, 5);
      inputRefs.current[nextIndex]?.focus();
    }
  };

  return (
    <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between', width: '100%' }}>
      <input type="hidden" name={name} value={pin.join('')} />
      {pin.map((digit, index) => (
        <input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="password"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={index === 0 ? handlePaste : undefined}
          className="form-input"
          style={{ flex: 1, minWidth: '0', height: '48px', textAlign: 'center', fontSize: '24px', padding: '0', fontWeight: '800' }}
        />
      ))}
    </div>
  );
};

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    const loginTime = localStorage.getItem('loginTime');
    const isLogged = localStorage.getItem('isLoggedIn') === 'true';
    if (isLogged && loginTime) {
      const now = Date.now();
      const diff = now - parseInt(loginTime, 10);
      const hours24 = 24 * 60 * 60 * 1000;
      if (diff > hours24) {
        localStorage.clear();
        return false;
      }
      return true;
    }
    return false;
  });
  const [authView, setAuthView] = useState('login'); 
  const [userRole, setUserRole] = useState(() => {
    return localStorage.getItem('userRole') || 'member';
  });
  const [activeMenu, setActiveMenu] = useState('Dashboard');
  const [loading, setLoading] = useState(false);
  const [sponsorName, setSponsorName] = useState('');
  const [checkingSponsor, setCheckingSponsor] = useState(false);
  const [registeredDetails, setRegisteredDetails] = useState(null);
  const captureRef = useRef(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // States
  const [userData, setUserData] = useState(() => {
    const savedData = localStorage.getItem('userData');
    return savedData ? JSON.parse(savedData) : null;
  });
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    localStorage.setItem('isLoggedIn', isLoggedIn);
    localStorage.setItem('userRole', userRole);
    if (isLoggedIn && !localStorage.getItem('loginTime')) {
      localStorage.setItem('loginTime', Date.now().toString());
    }
    if (!isLoggedIn) {
      localStorage.removeItem('loginTime');
    }
    if (userData) {
      localStorage.setItem('userData', JSON.stringify(userData));
    } else {
      localStorage.removeItem('userData');
    }
  }, [isLoggedIn, userRole, userData]);

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
    { header: 'MAIN MENU' },
    { name: 'Dashboard', icon: '📊' },
    { name: 'Wallets', icon: '💼' },
    { name: 'AutoPool Matrix', icon: '🔄' },
    { name: 'Rank Income', icon: '👑' },
    { name: 'Rebirth ID', icon: '♾️' },
    { name: 'Products', icon: '🛍️' },
    { name: 'Offers', icon: '🎁' },
    { header: 'FINANCE' },
    { name: 'Deposit Funds', icon: '💳' },
    { name: 'Passbook', icon: '📒' },
    { name: 'Withdraw / P2P', icon: '💸' },
    { header: 'ACCOUNT' },
    { name: 'My Network', icon: '👥' },
    { name: 'Add Member', icon: '➕' },
    { name: 'Genealogy', icon: '🕸️' },
    { name: 'Profile', icon: '👤' },
    { name: 'KYC', icon: '🛡️' },
    { name: 'Bank Settings', icon: '🏦' },
    { name: 'Transaction PIN', icon: '🔒' },
    { name: 'Change Password', icon: '🔑' },
    { name: 'Support', icon: '🎧' },
    { header: 'INFORMATION' },
    { name: 'About Us', icon: 'ℹ️' },
    { name: 'Terms & Conditions', icon: '📄' },
    { name: 'Privacy Policy', icon: '🛡️' },
    { name: 'Return & Refund', icon: '↩️' },
    { name: 'Disclaimer', icon: '⚠️' },
  ];

  const adminMenu = [
    { header: 'ADMIN PANEL' },
    { name: 'Dashboard', icon: '👑' },
    { name: 'Member Management', icon: '👥' },
    { name: 'Fund Requests', icon: '💳' },
    { name: 'Payouts & TDS', icon: '💸' },
    { name: 'AutoPool Settings', icon: '🔄' },
    { name: 'KYC Approvals', icon: '📄' },
    { name: 'Support Tickets', icon: '🎧' },
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
      // Fallback for demo
      if (memberId.toLowerCase() === 'rajeshkinjarapu' && password === '474532') {
        setUserRole('admin');
        setUserData({ name: "Rajesh Kinjarapu", memberId: "rajeshkinjarapu", rank: "OWNER" });
        setIsLoggedIn(true);
      } else if (memberId.toUpperCase() === 'RK0305' || memberId.toUpperCase() === 'ADMIN') {
        setUserRole('admin');
        setUserData({ name: "Admin Demo", memberId: memberId, rank: "OWNER" });
        setIsLoggedIn(true);
      } else if (password.length === 6) {
        setUserRole('member');
        setUserData({ name: "Member", memberId: memberId, rank: "GOLD RANK" });
        setIsLoggedIn(true);
      } else {
        setErrorMsg('Invalid password. Please enter your 6-digit PIN.');
      }
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
        setRegisteredDetails({ memberId: result.user.memberId, mobile, password });
      } else {
        setErrorMsg(result.message || 'Registration failed');
      }
    } catch (error) {
      setErrorMsg('Cannot connect to Live Server.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadImage = async () => {
    if (captureRef.current) {
      try {
        const dataUrl = await htmlToImage.toPng(captureRef.current, { quality: 1, backgroundColor: '#ffffff' });
        const link = document.createElement('a');
        link.download = 'RoyalKuberaa-AccountDetails.png';
        link.href = dataUrl;
        link.click();
      } catch (err) {
        console.error('Failed to save image', err);
      }
    }
  };

  if (!isLoggedIn) {
    if (registeredDetails) {
      return (
        <div className="login-wrapper">
          <div className="login-container">
            <div className="login-illustration">
              <img src="https://img.freepik.com/free-vector/mobile-login-concept-illustration_114360-83.jpg" alt="Login" />
            </div>
            <div className="login-content" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '56px', marginBottom: '16px', animation: 'floatUp 1s ease-out' }}>🎉</div>
              <h2 className="login-title">Registration Successful!</h2>
              <p className="login-subtitle" style={{ marginBottom: '24px' }}>Welcome to Royal Kuberaa. Your account has been created.</p>
              
              <div ref={captureRef} style={{ background: '#f8faff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', marginBottom: '24px' }}>
                <p style={{ color: '#6c28d9', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '16px', fontWeight: '800' }}>Your Account Details</p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left', background: 'white', padding: '16px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Login ID</span>
                      <span style={{ fontSize: '18px', color: '#1e1b4b', fontWeight: '800' }}>{registeredDetails.memberId}</span>
                   </div>
                   <div style={{ height: '1px', background: '#f1f5f9' }}></div>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Mobile</span>
                      <span style={{ fontSize: '15px', color: '#1e1b4b', fontWeight: '700' }}>{registeredDetails.mobile}</span>
                   </div>
                   <div style={{ height: '1px', background: '#f1f5f9' }}></div>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Password</span>
                      <span style={{ fontSize: '15px', color: '#1e1b4b', fontWeight: '700' }}>{registeredDetails.password}</span>
                   </div>
                </div>

                <p style={{ color: '#f43f5e', fontSize: '12px', marginTop: '16px', fontWeight: '600' }}>⚠️ Please save these details safely!</p>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  onClick={handleDownloadImage}
                  className="login-submit-btn" 
                  style={{ flex: 1, background: '#10b981', boxShadow: '0 4px 14px 0 rgba(16, 185, 129, 0.39)', marginTop: 0 }}
                >
                  📥 Save Image
                </button>
                <button 
                  onClick={() => { setRegisteredDetails(null); setAuthView('login'); }}
                  className="login-submit-btn" 
                  style={{ flex: 1, marginTop: 0 }}
                >
                  Login Now
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="login-wrapper">
        <div className="login-container">
          <div className="login-illustration">
            <img src="https://img.freepik.com/free-vector/secure-login-concept-illustration_114360-4685.jpg" alt="Secure Login" />
          </div>
          <div className="login-content">
            <div className="login-header">
              <img src="/royal-kuberaa-logo.jpg" alt="Royal Kuberaa" className="login-logo" />
              {authView === 'login' && <h1 className="login-brand-name">Royal Kuberaa</h1>}
              {authView === 'register' && <h2 className="login-title" style={{ marginTop: '16px' }}>Create Account</h2>}
            </div>
            {authView === 'login' ? (
              <form className="login-form" onSubmit={handleLogin}>
                <div className="form-group">
                  <label style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>User ID / Mobile Number</label>
                  <input type="text" name="memberId" className="form-input" placeholder="Enter your ID or Mobile" required />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Password (6 Digits)</label>
                  <PinInput name="password" />
                </div>
                <div className="form-options">
                   <label className="remember-me">
                      <input type="checkbox" style={{ accentColor: '#5b21b6' }} /> Remember me
                   </label>
                   <span className="forgot-password">Forgot password?</span>
                </div>
                {errorMsg && (
                  <div style={{ color: '#e11d48', fontSize: '14px', fontWeight: '600', marginTop: '8px' }}>
                    {errorMsg}
                  </div>
                )}
                <button type="submit" className="login-submit-btn" disabled={loading}>
                  {loading ? 'Authenticating...' : 'Login'}
                </button>
              </form>
            ) : (
              <form className="login-form" onSubmit={handleRegister}>
                <div className="form-group">
                  <label style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Full Name</label>
                  <input type="text" name="name" className="form-input" placeholder="Enter Full Name" required />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Mobile Number</label>
                  <input type="tel" name="mobile" className="form-input" placeholder="Enter Mobile Number" required pattern="[0-9]{10}" maxLength="10" />
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Sponsor ID</label>
                  <input type="text" name="sponsorId" className="form-input" placeholder="Enter Sponsor ID" required onBlur={handleSponsorCheck} />
                  {sponsorName && (
                    <div style={{ marginTop: '6px', fontSize: '13px', fontWeight: '600', color: sponsorName === 'Invalid Sponsor ID' || sponsorName === 'Network Error' ? '#e11d48' : '#10b981' }}>
                      {checkingSponsor ? 'Checking...' : (sponsorName !== 'Invalid Sponsor ID' && sponsorName !== 'Network Error' ? `✓ Sponsor: ${sponsorName}` : `✕ ${sponsorName}`)}
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Password (6 Digits)</label>
                  <PinInput name="password" />
                </div>
                {errorMsg && (
                  <div style={{ color: '#e11d48', fontSize: '14px', fontWeight: '600', marginTop: '8px' }}>
                    {errorMsg}
                  </div>
                )}
                <button type="submit" className="login-submit-btn" disabled={loading || sponsorName === 'Invalid Sponsor ID'}>
                  {loading ? 'Creating Account...' : 'Register Now'}
                </button>
              </form>
            )}
            <div className="login-footer">
               {authView === 'login' ? (
                 <>Don't have an account? <span onClick={() => setAuthView('register')}>Click here</span></>
               ) : (
                 <>Already have an account? <span onClick={() => setAuthView('login')}>Click here</span></>
               )}
            </div>
            {/* App Store Buttons Placeholder */}
            {authView === 'login' && (
               <div style={{ display: 'flex', gap: '16px', marginTop: '32px', justifyContent: 'center' }}>
                 <a href="#" style={{ display: 'inline-block', transition: 'transform 0.2s', ':hover': { transform: 'scale(1.05)' } }}>
                   <img src="https://developer.apple.com/assets/elements/badges/download-on-the-app-store.svg" alt="Download on the App Store" style={{ height: '40px', cursor: 'pointer' }} />
                 </a>
                 <a href="#" style={{ display: 'inline-block', transition: 'transform 0.2s' }}>
                   <img src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" alt="Get it on Google Play" style={{ height: '40px', cursor: 'pointer' }} />
                 </a>
               </div>
            )}
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
    <div className="content-card-wrapper">
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
            <div key={card.id} className="vibrant-card metric-card">
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <div className="card-icon" style={{ background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px' }}>{card.icon}</div>
              </div>
              <div className="card-content">
                <div className="card-title">{card.title.toUpperCase()}</div>
                <div className="card-amount">{userRole==='admin'&&card.id===1?'':'₹'} {card.amount.toLocaleString()}</div>
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

  const renderNotifications = () => (
    <div style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
      <PageHeader title="Notifications" subtitle="Recent updates and alerts" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {[
          { id: 1, title: 'Payout Processed', desc: 'Your withdrawal request of ₹4,500 has been processed successfully.', time: '2 mins ago', icon: '💸', color: '#10B981' },
          { id: 2, title: 'New Direct Referral', desc: 'Ramesh (RK98234) joined your direct downline.', time: '1 hour ago', icon: '👤', color: '#0EA5E9' },
          { id: 3, title: 'Daily ROI Credited', desc: '₹500 has been credited to your Main Wallet.', time: '5 hours ago', icon: '💰', color: '#F59E0B' },
          { id: 4, title: 'Rank Upgraded', desc: 'Congratulations! You have reached Silver rank.', time: '1 day ago', icon: '🏆', color: '#8B5CF6' },
        ].map(n => (
          <div key={n.id} style={{ display: 'flex', gap: '16px', padding: '16px', background: '#FFFFFF', borderRadius: '16px', alignItems: 'flex-start', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', border: '1px solid #F1F5F9', cursor: 'pointer', transition: 'transform 0.2s', ':hover': { transform: 'translateY(-2px)' } }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: `${n.color}15`, color: n.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0 }}>
              {n.icon}
            </div>
            <div style={{ flex: 1, marginTop: '2px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <h4 style={{ margin: 0, color: '#0F172A', fontSize: '15px', fontWeight: '700' }}>{n.title}</h4>
                <div style={{ color: '#94A3B8', fontSize: '11px', fontWeight: '600' }}>{n.time}</div>
              </div>
              <p style={{ margin: 0, color: '#64748B', fontSize: '13px', lineHeight: '1.4' }}>{n.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
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
       case 'Notifications': return renderNotifications();
       default: return renderGeneric();
    }
  };

  return (
    <div className="app-container">
      <div className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)}></div>
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 0 16px 0', gap: '12px' }}>
          <img src="/royal-kuberaa-logo.jpg" alt="Logo" style={{ width: '70px', height: '70px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} />
          <div className="brand-title" style={{ fontSize: '22px' }}>Royal Kuberaa</div>
        </div>
        <div className="sidebar-menu">
          {activeMenuItems.map((item, index) => {
            if (item.header) {
              return <div key={'header'+index} className="menu-section">{item.header}</div>;
            }
            return (
              <div 
                key={item.name} 
                className={`menu-item ${activeMenu === item.name ? 'active' : ''}`}
                onClick={() => { setActiveMenu(item.name); setSidebarOpen(false); }}
              >
                <span className="menu-icon">{item.icon}</span>
                {item.name}
              </div>
            );
          })}
        </div>
        <div style={{ padding: '20px', borderTop: '1px solid #f1f5f9', marginTop: 'auto' }}>
          <button 
            onClick={() => { setIsLoggedIn(false); setAuthView('login'); setUserData(null); localStorage.clear(); }}
            style={{ width: '100%', padding: '12px', background: 'rgba(225, 29, 72, 0.1)', color: '#e11d48', border: '1px solid rgba(225, 29, 72, 0.2)', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s' }}
          >
            <span>🚪</span> Logout
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button className="mobile-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: 'none', border: 'none', color: '#ffffff', fontSize: '24px', cursor: 'pointer', display: 'none' }}>☰</button>
            <div className="page-title">{activeMenu}</div>
          </div>
          <div className="topbar-actions">
            <button className="notification-btn" onClick={() => { setActiveMenu('Notifications'); setSidebarOpen(false); }}>🔔</button>
          </div>
        </header>

        <div className="dashboard-content">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

export default App;
