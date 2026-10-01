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

  useEffect(() => {
    const fetchDashboard = async () => {
      const token = localStorage.getItem('token');
      if (isLoggedIn && token && activeMenu === 'Dashboard') {
        try {
          const res = await fetch('/api/dashboard', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const result = await res.json();
          if (result.success) {
            setDashboardData(result.data);
          }
        } catch (err) {
          console.error('Failed to fetch dashboard', err);
        }
      }
    };
    fetchDashboard();
  }, [isLoggedIn, activeMenu]);

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
    
    // Hardcoded Admin Bypass
    if (memberId.toLowerCase() === 'rajeshkinjarapu' && password === '474532') {
      setUserRole('admin');
      setUserData({ name: "Rajesh Kinjarapu", memberId: "rajeshkinjarapu", rank: "OWNER" });
      setIsLoggedIn(true);
      setLoading(false);
      return;
    }

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
        localStorage.setItem('token', result.token);
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
        { id: 1, title: 'Total Members', amount: dashboardData?.networkStats?.totalTeamSize || 0, icon: 'A', bg: '#f0f9ff', iconBg: '#bae6fd', color: '#0369a1' },
        { id: 2, title: 'Company Revenue', amount: (dashboardData?.totalEarnings || 0) * 100, icon: '💰', bg: '#f0fdf4', iconBg: '#bbf7d0', color: '#15803d' },
        { id: 3, title: 'Pending Payouts', amount: 45000, icon: '⏳', bg: '#fff1f2', iconBg: '#fecdd3', color: '#be123c' },
        { id: 4, title: 'Today Joinings', amount: 125, icon: '📈', bg: '#f5f3ff', iconBg: '#ddd6fe', color: '#6d28d9' },
      ]
      : [
        { id: 1, title: 'Total Earnings', amount: dashboardData?.totalEarnings || 0, icon: '🚀', bg: '#f0f9ff', iconBg: '#bae6fd', color: '#0369a1' },
        { id: 2, title: 'Main Wallet', amount: dashboardData?.mainWallet || 0, icon: '💳', bg: '#f0fdf4', iconBg: '#bbf7d0', color: '#15803d' },
        { id: 3, title: 'Direct Referral', amount: dashboardData?.directReferral || 0, icon: '👤', bg: '#fff1f2', iconBg: '#fecdd3', color: '#be123c' },
        { id: 4, title: 'Team Income', amount: dashboardData?.teamIncome || 0, icon: '👥', bg: '#f5f3ff', iconBg: '#ddd6fe', color: '#6d28d9' },
        { id: 5, title: 'Withdraw Fund', amount: dashboardData?.withdrawFund || 0, icon: '🔄', bg: '#f0fdfa', iconBg: '#99f6e4', color: '#0f766e' },
        { id: 6, title: 'Autopool Fund', amount: dashboardData?.autopoolFund || 0, icon: '♾️', bg: '#eff6ff', iconBg: '#bfdbfe', color: '#1d4ed8' },
        { id: 7, title: 'All Ranks', amount: dashboardData?.allRanks || 0, icon: '🏆', bg: '#fffbeb', iconBg: '#fde68a', color: '#b45309' },
        { id: 8, title: 'Rebirth Wallet', amount: dashboardData?.rebirthWallet || 0, icon: '🌱', bg: '#fdf4ff', iconBg: '#f5d0fe', color: '#86198f' },
      ];

    return (
      <>
        <div className="user-banner" style={{ background: userRole === 'admin' ? 'linear-gradient(135deg, #E0F2FE 0%, #BAE6FD 100%)' : 'linear-gradient(135deg, #F1F5F9 0%, #E2E8F0 100%)', padding: '20px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px', border: '1px solid #bae6fd' }}>
          <div className="user-avatar" style={{ width: '60px', height: '60px', background: '#0284C7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', color: '#fff', flexShrink: 0, boxShadow: '0 4px 10px rgba(2,132,199,0.3)' }}>
             {userRole === 'admin' ? '👑' : userData?.name?.charAt(0)}
          </div>
          <div className="user-info-text">
            <span className="welcome-text" style={{ fontSize: '11px', fontWeight: '700', color: '#0284C7', letterSpacing: '0.5px' }}>{userRole === 'admin' ? 'ADMINISTRATOR' : 'WELCOME'}</span>
            <h2 className="user-name" style={{ margin: '2px 0 6px 0', fontSize: '22px', fontWeight: '800', color: '#0F172A' }}>{userData?.name}</h2>
            <div className="badges" style={{ display: 'flex', gap: '8px' }}>
              <span className="badge badge-gold" style={{ background: '#FEF3C7', color: '#D97706', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700', border: '1px solid #FDE68A' }}>{userData?.rank}</span>
              <span className="badge badge-id" style={{ background: '#E0F2FE', color: '#0284C7', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700', border: '1px solid #BAE6FD' }}>ID: {userData?.memberId}</span>
            </div>
          </div>
        </div>
        <div className="cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
          {cards.map(card => (
            <div key={card.id} className="vibrant-card metric-card" style={{ background: card.bg, borderRadius: '16px', padding: '24px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                 <div className="card-icon" style={{ width: '40px', height: '40px', background: card.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontSize: '20px' }}>{card.icon}</div>
              </div>
              <div className="card-content">
                <div className="card-title" style={{ color: '#64748B', fontWeight: '700', fontSize: '12px', letterSpacing: '0.5px', marginBottom: '8px' }}>{card.title.toUpperCase()}</div>
                <div className="card-amount" style={{ color: '#0F172A', fontSize: '28px', fontWeight: '900', letterSpacing: '-0.5px' }}>{userRole==='admin'&&card.id===1?'':'₹ '} {card.amount.toLocaleString()}</div>
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

  const renderWallets = () => {
    const [transactions, setTransactions] = useState([]);
    useEffect(() => {
       const fetchTxns = async () => {
          try {
             const token = localStorage.getItem('token');
             const res = await fetch('/api/transactions', { headers: { 'Authorization': `Bearer ${token}` }});
             const result = await res.json();
             if(result.success) setTransactions(result.data);
          } catch(err) { console.error(err); }
       };
       if(activeMenu === 'Wallets' || activeMenu === 'Passbook' || activeMenu === 'Wallets & P2P') {
          fetchTxns();
       }
    }, [activeMenu]);

    return (
      <CardWrapper>
        <div className="wallet-cards-grid">
           <div className="wallet-card" style={{ background: 'linear-gradient(135deg, #0EA5E9 0%, #2563EB 100%)', boxShadow: '0 10px 25px -5px rgba(37,99,235,0.4)' }}>
              <h3 className="wallet-card-title">Main Wallet</h3>
              <h1 className="wallet-card-amount">₹ {(dashboardData?.mainWallet || 0).toLocaleString()}</h1>
              <div className="wallet-card-icon">💳</div>
              <div className="wallet-card-action">
                 <button className="wallet-btn wallet-btn-primary" onClick={() => setActiveMenu('Withdraw / P2P')}>Transfer (P2P)</button>
              </div>
           </div>
           <div className="wallet-card" style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', boxShadow: '0 10px 25px -5px rgba(16,185,129,0.4)' }}>
              <h3 className="wallet-card-title">Earnings Wallet</h3>
              <h1 className="wallet-card-amount">₹ {(dashboardData?.totalEarnings || 0).toLocaleString()}</h1>
              <div className="wallet-card-icon">💰</div>
              <div className="wallet-card-action">
                 <button className="wallet-btn wallet-btn-secondary" onClick={() => setActiveMenu('Withdraw / P2P')}>Withdraw</button>
              </div>
           </div>
           <div className="wallet-card" style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)', boxShadow: '0 10px 25px -5px rgba(139,92,246,0.4)' }}>
              <h3 className="wallet-card-title">Autopool Fund</h3>
              <h1 className="wallet-card-amount">₹ {(dashboardData?.autopoolFund || 0).toLocaleString()}</h1>
              <div className="wallet-card-icon">♾️</div>
              <div className="wallet-card-action">
                 <button className="wallet-btn wallet-btn-secondary" onClick={() => setActiveMenu('AutoPool Matrix')}>View Details</button>
              </div>
           </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, fontSize: '18px', color: '#0F172A', fontWeight: '800' }}>Recent Transactions</h3>
        </div>
        <Table headers={['Date', 'Remark', 'Category', 'Amount']}>
          {transactions.length === 0 && <tr><td colSpan="4" style={{ padding: '16px', textAlign: 'center' }}>No transactions found.</td></tr>}
          {transactions.map(txn => (
            <tr key={txn._id} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.2s', cursor: 'default' }} onMouseEnter={e => e.currentTarget.style.background='#F8FAFC'} onMouseLeave={e => e.currentTarget.style.background='transparent'}>
              <td style={{ padding: '16px', color: '#64748B', fontSize: '14px', fontWeight: '600' }}>{new Date(txn.createdAt).toLocaleDateString()}</td>
              <td style={{ padding: '16px', color: '#334155', fontWeight: '500' }}>{txn.remark}</td>
              <td style={{ padding: '16px', color: '#64748B', fontWeight: '500', fontSize: '13px' }}>{txn.category}</td>
              <td style={{ padding: '16px', color: txn.type==='Credit'?'#10B981':'#EF4444', fontWeight: '800', fontSize: '16px' }}>
                {txn.type==='Credit'?'+':'-'} ₹{Math.abs(txn.amount).toLocaleString()}
              </td>
            </tr>
          ))}
        </Table>
      </CardWrapper>
    );
  };

  const renderWithdrawal = () => {
    const [p2pReceiver, setP2pReceiver] = useState('');
    const [p2pAmount, setP2pAmount] = useState('');
    const [p2pMessage, setP2pMessage] = useState({ text: '', type: '' });
    const [loadingP2p, setLoadingP2p] = useState(false);

    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [withdrawMessage, setWithdrawMessage] = useState({ text: '', type: '' });
    const [loadingWithdraw, setLoadingWithdraw] = useState(false);

    const handleWithdrawSubmit = async (e) => {
       e.preventDefault();
       setLoadingWithdraw(true);
       setWithdrawMessage({ text: '', type: '' });
       try {
         const token = localStorage.getItem('token');
         const res = await fetch('/api/withdraw', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
           body: JSON.stringify({ amount: withdrawAmount })
         });
         const result = await res.json();
         if (result.success) {
           setWithdrawMessage({ text: result.message, type: 'success' });
           setWithdrawAmount('');
           if(setDashboardData) {
              setDashboardData(prev => ({ ...prev, mainWallet: result.newBalance, totalEarnings: result.newBalance }));
           }
         } else {
           setWithdrawMessage({ text: result.message, type: 'error' });
         }
       } catch (err) {
         setWithdrawMessage({ text: 'Server connection error.', type: 'error' });
       }
       setLoadingWithdraw(false);
    };

    const handleP2pSubmit = async (e) => {
       e.preventDefault();
       setLoadingP2p(true);
       setP2pMessage({ text: '', type: '' });
       try {
         const token = localStorage.getItem('token');
         const res = await fetch('/api/p2p-transfer', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
           body: JSON.stringify({ receiverId: p2pReceiver, amount: p2pAmount })
         });
         const result = await res.json();
         if (result.success) {
           setP2pMessage({ text: result.message, type: 'success' });
           setP2pReceiver('');
           setP2pAmount('');
           if(setDashboardData) {
              setDashboardData(prev => ({ ...prev, mainWallet: result.newBalance, totalEarnings: result.newBalance }));
           }
         } else {
           setP2pMessage({ text: result.message, type: 'error' });
         }
       } catch (err) {
         setP2pMessage({ text: 'Server connection error.', type: 'error' });
       }
       setLoadingP2p(false);
    };

    return (
      <CardWrapper>
        <PageHeader title="Withdraw / P2P Transfer" subtitle="Withdraw your available funds or transfer to another member" />
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
           {/* Withdrawal Form */}
           <div style={{ padding: '24px', border: '1px solid #E2E8F0', borderRadius: '16px' }}>
              <h3 style={{ marginBottom: '16px' }}>Bank Withdrawal</h3>
              <p style={{ color: '#64748B', marginBottom: '16px' }}>Available for withdrawal: <strong style={{color: '#0F172A'}}>₹ {dashboardData?.mainWallet || 0}</strong></p>
              
              <form onSubmit={handleWithdrawSubmit}>
                 <input type="number" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} required placeholder="Enter Amount (Min ₹500)" style={{ width: '100%', padding: '12px', border: '1px solid #CBD5E1', borderRadius: '8px', marginBottom: '16px', fontSize: '16px' }} />
                 <p style={{ fontSize: '13px', color: '#EF4444', marginBottom: '16px' }}>Note: 5% TDS and 5% Admin Charge will be deducted.</p>
                 {withdrawMessage.text && (
                    <div style={{ marginBottom: '16px', padding: '10px', borderRadius: '8px', background: withdrawMessage.type === 'success' ? '#D1FAE5' : '#FEE2E2', color: withdrawMessage.type === 'success' ? '#065F46' : '#991B1B', fontSize: '14px', fontWeight: '600' }}>
                       {withdrawMessage.text}
                    </div>
                 )}
                 <button type="submit" disabled={loadingWithdraw} style={{ width: '100%', padding: '14px', background: '#0B1437', color: 'white', border: 'none', borderRadius: '8px', cursor: loadingWithdraw ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '16px', opacity: loadingWithdraw ? 0.7 : 1 }}>
                   {loadingWithdraw ? 'Processing...' : 'Submit Withdrawal'}
                 </button>
              </form>
           </div>

           {/* P2P Transfer Form */}
           <div style={{ padding: '24px', border: '1px solid #E2E8F0', borderRadius: '16px', background: '#F8FAFC' }}>
              <h3 style={{ marginBottom: '16px' }}>P2P Transfer</h3>
              <p style={{ color: '#64748B', marginBottom: '16px' }}>Transfer funds to another member instantly. No deductions.</p>
              
              <form onSubmit={handleP2pSubmit}>
                 <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Receiver Member ID</label>
                    <input type="text" value={p2pReceiver} onChange={(e) => setP2pReceiver(e.target.value)} required placeholder="e.g. RK12345" style={{ width: '100%', padding: '12px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '16px' }} />
                 </div>
                 <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Transfer Amount</label>
                    <input type="number" value={p2pAmount} onChange={(e) => setP2pAmount(e.target.value)} required placeholder="Amount in ₹" style={{ width: '100%', padding: '12px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '16px' }} />
                 </div>
                 {p2pMessage.text && (
                    <div style={{ marginBottom: '16px', padding: '10px', borderRadius: '8px', background: p2pMessage.type === 'success' ? '#D1FAE5' : '#FEE2E2', color: p2pMessage.type === 'success' ? '#065F46' : '#991B1B', fontSize: '14px', fontWeight: '600' }}>
                       {p2pMessage.text}
                    </div>
                 )}
                 <button type="submit" disabled={loadingP2p} style={{ width: '100%', padding: '14px', background: '#3B82F6', color: 'white', border: 'none', borderRadius: '8px', cursor: loadingP2p ? 'not-allowed' : 'pointer', fontWeight: 'bold', fontSize: '16px', opacity: loadingP2p ? 0.7 : 1 }}>
                    {loadingP2p ? 'Processing...' : 'Transfer Funds Now'}
                 </button>
              </form>
           </div>
        </div>
      </CardWrapper>
    );
  };

  const renderManageUsers = () => {
    const [usersList, setUsersList] = useState([]);
    
    useEffect(() => {
       const fetchUsers = async () => {
          try {
             const token = localStorage.getItem('token');
             const res = await fetch('/api/admin/users', { headers: { 'Authorization': `Bearer ${token}` }});
             const result = await res.json();
             if(result.success) setUsersList(result.data);
          } catch(err) { console.error(err); }
       };
       fetchUsers();
    }, []);

    const handleToggleBlock = async (memberId) => {
       try {
          const token = localStorage.getItem('token');
          const res = await fetch(`/api/admin/users/${memberId}/toggle-block`, {
             method: 'POST',
             headers: { 'Authorization': `Bearer ${token}` }
          });
          const result = await res.json();
          if(result.success) {
             setUsersList(prev => prev.map(u => u.id === memberId ? { ...u, status: result.status } : u));
          } else {
             alert(result.message);
          }
       } catch(err) { console.error(err); }
    };

    return (
      <CardWrapper>
        <PageHeader title="Manage Users" subtitle="View and edit network members" />
        <Table headers={['ID', 'Name / Email', 'Wallet', 'Status', 'Action']}>
          {usersList.length === 0 && <tr><td colSpan="5" style={{ padding: '16px', textAlign: 'center' }}>No users found.</td></tr>}
          {usersList.map(user => (
            <tr key={user.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
              <td style={{ padding: '15px', fontWeight: 'bold' }}>{user.id}</td>
              <td style={{ padding: '15px' }}>
                <div style={{ fontWeight: 'bold' }}>{user.name}</div>
                <div style={{ fontSize: '12px', color: '#64748B' }}>User</div>
              </td>
              <td style={{ padding: '15px', color: '#10B981', fontWeight: 'bold' }}>₹{user.wallet.toLocaleString()}</td>
              <td style={{ padding: '15px' }}>
                <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', background: user.status==='Active'?'rgba(16,185,129,0.1)':'rgba(239,68,68,0.1)', color: user.status==='Active'?'#10B981':'#EF4444' }}>{user.status}</span>
              </td>
              <td style={{ padding: '15px', display: 'flex', gap: '8px' }}>
                 <button onClick={() => handleToggleBlock(user.id)} style={{ padding: '6px 12px', background: user.status === 'Active' ? '#EF4444' : '#10B981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                    {user.status === 'Active' ? 'Block' : 'Unblock'}
                 </button>
              </td>
            </tr>
          ))}
        </Table>
      </CardWrapper>
    );
  };

  const renderPayoutApprovals = () => {
    const [withdrawals, setWithdrawals] = useState([]);
    
    useEffect(() => {
       const fetchWithdrawals = async () => {
          try {
             const token = localStorage.getItem('token');
             const res = await fetch('/api/admin/withdrawals', { headers: { 'Authorization': `Bearer ${token}` }});
             const result = await res.json();
             if(result.success) setWithdrawals(result.data);
          } catch(err) { console.error(err); }
       };
       fetchWithdrawals();
    }, []);

    const handleAction = async (id, action) => {
       try {
          const token = localStorage.getItem('token');
          const res = await fetch(`/api/admin/withdrawals/${id}`, {
             method: 'POST',
             headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
             body: JSON.stringify({ action })
          });
          const result = await res.json();
          if(result.success) {
             setWithdrawals(prev => prev.map(w => w._id === id ? { ...w, status: action === 'approve' ? 'Approved' : 'Rejected' } : w));
          } else {
             alert(result.message);
          }
       } catch(err) { console.error(err); }
    };

    return (
      <CardWrapper>
        <PageHeader title="Payout Approvals" subtitle="Clear pending withdrawal requests" />
        <Table headers={['Req ID', 'Member ID', 'Gross Amt', 'Deductions', 'Net Payable', 'Status', 'Action']}>
          {withdrawals.length === 0 && <tr><td colSpan="7" style={{ padding: '16px', textAlign: 'center' }}>No requests found.</td></tr>}
          {withdrawals.map(req => (
            <tr key={req._id} style={{ borderBottom: '1px solid #F1F5F9' }}>
              <td style={{ padding: '15px', fontWeight: 'bold' }}>{req._id.slice(-6).toUpperCase()}</td>
              <td style={{ padding: '15px', color: '#0EA5E9' }}>{req.memberId}</td>
              <td style={{ padding: '15px' }}>₹{req.grossAmount}</td>
              <td style={{ padding: '15px', color: '#EF4444' }}>₹{req.tdsAmount + req.adminChargeAmount}</td>
              <td style={{ padding: '15px', color: '#10B981', fontWeight: 'bold' }}>₹{req.netAmount}</td>
              <td style={{ padding: '15px', color: req.status === 'Pending' ? '#F59E0B' : (req.status === 'Approved' ? '#10B981' : '#EF4444') }}>{req.status}</td>
              <td style={{ padding: '15px', display: 'flex', gap: '8px' }}>
                 {req.status === 'Pending' && (
                   <>
                     <button onClick={() => handleAction(req._id, 'approve')} style={{ padding: '6px 12px', background: '#10B981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Approve</button>
                     <button onClick={() => handleAction(req._id, 'reject')} style={{ padding: '6px 12px', background: '#EF4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Reject</button>
                   </>
                 )}
              </td>
            </tr>
          ))}
        </Table>
      </CardWrapper>
    );
  };

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

  const renderFundRequests = () => (
    <CardWrapper>
      <PageHeader title="Fund Requests" subtitle="Approve or reject member deposit requests" />
      <Table headers={['Req ID', 'Member', 'Amount', 'Date', 'Status', 'Action']}>
        <tr><td colSpan="6" style={{ padding: '16px', textAlign: 'center' }}>No pending fund requests.</td></tr>
      </Table>
    </CardWrapper>
  );

  const renderAutoPoolSettings = () => (
    <CardWrapper>
      <PageHeader title="AutoPool Settings" subtitle="Configure pool entry amounts and levels" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {['Starter', 'Silver', 'Gold', 'Platinum'].map(pool => (
          <div key={pool} style={{ padding: '20px', border: '1px solid #E2E8F0', borderRadius: '12px' }}>
             <h4 style={{ marginBottom: '12px' }}>{pool} Pool</h4>
             <label style={{ display: 'block', fontSize: '13px', marginBottom: '4px' }}>Entry Fee (₹)</label>
             <input type="number" defaultValue="500" style={{ width: '100%', padding: '10px', border: '1px solid #CBD5E1', borderRadius: '6px', marginBottom: '12px' }} />
             <button style={{ width: '100%', padding: '10px', background: '#0B1437', color: 'white', border: 'none', borderRadius: '6px' }}>Save</button>
          </div>
        ))}
      </div>
    </CardWrapper>
  );

  const renderKYCApprovals = () => (
    <CardWrapper>
      <PageHeader title="KYC Approvals" subtitle="Verify PAN and Bank details" />
      <Table headers={['Member ID', 'Name', 'Document Type', 'Status', 'Action']}>
        <tr><td colSpan="5" style={{ padding: '16px', textAlign: 'center' }}>No pending KYC documents.</td></tr>
      </Table>
    </CardWrapper>
  );

  const renderSupportTickets = () => (
    <CardWrapper>
      <PageHeader title="Support Tickets" subtitle="Respond to member queries" />
      <Table headers={['Ticket ID', 'Member', 'Subject', 'Status', 'Action']}>
        <tr><td colSpan="5" style={{ padding: '16px', textAlign: 'center' }}>No open support tickets.</td></tr>
      </Table>
    </CardWrapper>
  );

  const renderSystemSettings = () => (
    <CardWrapper>
      <PageHeader title="System Settings" subtitle="Manage global application settings" />
      <div style={{ maxWidth: '600px' }}>
         <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Website Name</label>
            <input type="text" defaultValue="Royal Kuberaa" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #CBD5E1' }} />
         </div>
         <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Maintenance Mode</label>
            <select style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #CBD5E1' }}>
               <option>Disabled (Site Live)</option>
               <option>Enabled (Under Maintenance)</option>
            </select>
         </div>
         <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Admin TDS Deduction (%)</label>
            <input type="number" defaultValue="5" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #CBD5E1' }} />
         </div>
         <button style={{ padding: '12px 24px', background: '#0B1437', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>Save Settings</button>
      </div>
    </CardWrapper>
  );

  const renderComingSoon = (moduleName) => (
    <CardWrapper>
      <PageHeader title={moduleName} subtitle="Coming Soon" />
      <div style={{ padding: '60px', textAlign: 'center', background: '#F8FAFC', borderRadius: '16px', border: '2px dashed #CBD5E1' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚀</div>
        <h3 style={{ color: '#0F172A', marginBottom: '8px' }}>{moduleName}</h3>
        <p style={{ color: '#64748B' }}>This feature is currently under development. Stay tuned!</p>
      </div>
    </CardWrapper>
  );

  const renderAutoPool = () => (
    <CardWrapper>
      <PageHeader title="AutoPool Matrix" subtitle="View your progress in the global auto-fill system" />
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '24px' }}>
         {['STARTER', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND', 'CROWN'].map((pool, idx) => (
            <div key={pool} style={{ flex: '1 1 200px', padding: '20px', background: idx === 0 ? 'linear-gradient(135deg, #0EA5E9 0%, #2563EB 100%)' : '#F1F5F9', color: idx === 0 ? 'white' : '#64748B', borderRadius: '12px', textAlign: 'center', boxShadow: idx === 0 ? '0 10px 25px -5px rgba(37,99,235,0.4)' : 'none' }}>
               <h3 style={{ marginBottom: '8px' }}>{pool} POOL</h3>
               <p style={{ fontSize: '12px' }}>{idx === 0 ? 'Active' : 'Locked'}</p>
               <div style={{ marginTop: '16px', background: idx === 0 ? 'rgba(255,255,255,0.2)' : '#E2E8F0', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                 {idx === 0 && <div style={{ width: '45%', height: '100%', background: 'white' }}></div>}
               </div>
               {idx === 0 && <p style={{ fontSize: '11px', marginTop: '8px' }}>Level 2 in progress...</p>}
            </div>
         ))}
      </div>
    </CardWrapper>
  );

  const handleAddMember = async (e) => {
    e.preventDefault();
    const name = e.target.name.value;
    const mobile = e.target.mobile.value;
    const password = e.target.password.value;
    const btn = e.target.submitBtn;
    
    btn.disabled = true;
    btn.innerText = 'Registering...';

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: `RK${Math.floor(Math.random() * 90000) + 10000}`, // Generating random ID
          name,
          mobile,
          password,
          sponsorId: userData?.memberId
        })
      });
      const data = await response.json();
      if (data.success) {
        alert('Member Registered Successfully! ID: ' + data.user.memberId);
        e.target.reset();
      } else {
        alert('Error: ' + data.message);
      }
    } catch (err) {
      alert('Network Error');
    } finally {
      btn.disabled = false;
      btn.innerText = 'Register Member';
    }
  };

  const renderAddMember = () => (
    <CardWrapper>
      <PageHeader title="Add New Member" subtitle="Register a new member in your downline" />
      <form onSubmit={handleAddMember} style={{ maxWidth: '500px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>Sponsor ID</label>
          <input type="text" className="form-input" value={userData?.memberId} readOnly style={{ background: '#F1F5F9' }} />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>Full Name</label>
          <input type="text" name="name" className="form-input" placeholder="Enter member name" required />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>Mobile Number</label>
          <input type="tel" name="mobile" className="form-input" placeholder="10-digit mobile number" required />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>Password</label>
          <input type="password" name="password" className="form-input" placeholder="Set password" required />
        </div>
        <button type="submit" name="submitBtn" className="login-submit-btn">Register Member</button>
      </form>
    </CardWrapper>
  );

  const renderContent = () => {
    switch(activeMenu) {
       case 'Dashboard': return renderDashboard();
       case 'Profile':
       case 'KYC': return renderProfile();
       case 'My Network':
       case 'Genealogy': return renderNetwork();
       case 'Wallets': 
       case 'Passbook': return renderWallets();
       case 'Withdraw / P2P': return renderWithdrawal();
       case 'Manage Users':
       case 'Member Management': return renderManageUsers();
       case 'Payout Approvals':
       case 'Payouts & TDS': return renderPayoutApprovals();
       case 'Notifications': return renderNotifications();
       case 'AutoPool Matrix': return renderAutoPool();
       case 'Add Member': return renderAddMember();
       case 'Fund Requests': return renderFundRequests();
       case 'AutoPool Settings': return renderAutoPoolSettings();
       case 'KYC Approvals': return renderKYCApprovals();
       case 'Support Tickets': return renderSupportTickets();
       case 'System Settings': return renderSystemSettings();
       case 'Rank Income':
       case 'Rebirth ID':
       case 'Products':
       case 'Offers':
       case 'Deposit Funds':
       case 'Bank Settings':
       case 'Transaction PIN':
       case 'Change Password':
       case 'Support':
       case 'About Us':
       case 'Terms & Conditions':
       case 'Privacy Policy':
       case 'Return & Refund':
       case 'Disclaimer':
           return renderComingSoon(activeMenu);
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
