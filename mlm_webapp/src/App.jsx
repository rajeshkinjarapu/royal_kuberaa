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
    { name: 'Non-Working Cashback', icon: '💸' },
    { name: 'Royalty Pools', icon: '👑' },
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
    { name: 'Binary Genealogy', icon: '🕸️' },
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
    { name: 'Pool Distributions', icon: '🔄' },
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
    const placement = e.target.placement.value;
    
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, mobile, sponsorId, password, placement })
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
                  <label style={{ fontSize: '13px', color: '#64748b', fontWeight: '600', marginBottom: '8px', display: 'block' }}>Position (Placement)</label>
                  <div style={{ display: 'flex', gap: '16px' }}>
                     <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', color: '#334155' }}>
                        <input type="radio" name="placement" value="Left" defaultChecked style={{ width: '18px', height: '18px', accentColor: '#0B1437' }} />
                        Left Team
                     </label>
                     <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', color: '#334155' }}>
                        <input type="radio" name="placement" value="Right" style={{ width: '18px', height: '18px', accentColor: '#0B1437' }} />
                        Right Team
                     </label>
                  </div>
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
        { id: 1, title: 'Main Wallet', amount: dashboardData?.mainWallet || 0, icon: '💳', bg: '#f0fdf4', iconBg: '#bbf7d0', color: '#15803d' },
        { id: 2, title: 'Rebirth Wallet', amount: dashboardData?.rebirthWallet || 0, icon: '🌱', bg: '#fdf4ff', iconBg: '#f5d0fe', color: '#86198f' },
        { id: 3, title: 'Total Earnings', amount: dashboardData?.totalEarnings || 0, icon: '🚀', bg: '#f0f9ff', iconBg: '#bae6fd', color: '#0369a1' },
        { id: 4, title: 'Left Team', amount: dashboardData?.networkStats?.leftTeamCount || 0, icon: '⬅️', bg: '#fff1f2', iconBg: '#fecdd3', color: '#be123c', isCount: true },
        { id: 5, title: 'Right Team', amount: dashboardData?.networkStats?.rightTeamCount || 0, icon: '➡️', bg: '#f5f3ff', iconBg: '#ddd6fe', color: '#6d28d9', isCount: true },
        { id: 6, title: 'Left Carry Fwd', amount: dashboardData?.networkStats?.leftCarryForward || 0, icon: '📦', bg: '#f0fdfa', iconBg: '#99f6e4', color: '#0f766e', isCount: true },
        { id: 7, title: 'Right Carry Fwd', amount: dashboardData?.networkStats?.rightCarryForward || 0, icon: '📦', bg: '#eff6ff', iconBg: '#bfdbfe', color: '#1d4ed8', isCount: true },
        { id: 8, title: 'Pairs Matched (Today)', amount: dashboardData?.networkStats?.todayPairsCount || 0, icon: '🔥', bg: '#fffbeb', iconBg: '#fde68a', color: '#b45309', isCount: true },
        { id: 9, title: 'Flushed Pairs (Today)', amount: dashboardData?.networkStats?.todayPairsFlushedCount || 0, icon: '🗑️', bg: '#fef2f2', iconBg: '#fecaca', color: '#991b1b', isCount: true },
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
        {!userData?.isActive && userRole === 'member' && (
          <div style={{ background: '#FEF2F2', padding: '24px', borderRadius: '16px', border: '1px solid #FCA5A5', marginBottom: '24px', textAlign: 'center', boxShadow: '0 4px 10px rgba(239, 68, 68, 0.1)' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#EF4444', fontSize: '20px' }}>⚠️ Account Not Activated</h3>
            <p style={{ color: '#7F1D1D', marginBottom: '16px', fontSize: '14px' }}>Your account is currently inactive. You need ₹1000 in your Main Wallet to activate your account and start earning commissions.</p>
            <button 
               onClick={async () => {
                  try {
                     const token = localStorage.getItem('token');
                     const res = await fetch('/api/user/activate', { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }});
                     const result = await res.json();
                     alert(result.message);
                     if (result.success) {
                         const ud = {...userData, isActive: true};
                         setUserData(ud);
                         window.location.reload();
                     }
                  } catch(e) { alert('Activation failed'); }
               }}
               style={{ padding: '12px 24px', background: '#EF4444', color: '#FFF', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', border: 'none', transition: 'all 0.2s' }}
            >
               Activate ID Now (₹1000)
            </button>
            <p style={{ fontSize: '13px', color: '#991B1B', marginTop: '12px', fontWeight: '600' }}>Current Main Wallet Balance: ₹{(dashboardData?.mainWallet || 0).toLocaleString()}</p>
          </div>
        )}
        <div className="cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
          {cards.map(card => (
            <div key={card.id} className="vibrant-card metric-card" style={{ background: card.bg, borderRadius: '16px', padding: '24px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                 <div className="card-icon" style={{ width: '40px', height: '40px', background: card.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontSize: '20px' }}>{card.icon}</div>
              </div>
              <div className="card-content">
                <div className="card-title" style={{ color: '#64748B', fontWeight: '700', fontSize: '12px', letterSpacing: '0.5px', marginBottom: '8px' }}>{card.title.toUpperCase()}</div>
                <div className="card-amount" style={{ color: '#0F172A', fontSize: '28px', fontWeight: '900', letterSpacing: '-0.5px' }}>{userRole==='admin'&&card.id===1?'': (card.isCount ? '' : '₹ ')} {card.amount.toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>
        {userRole === 'admin' && (
          <div style={{ background: '#FFF', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', marginTop: '20px', border: '1px solid #FCA5A5' }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#EF4444' }}>Admin Testing Tools</h3>
            <button 
               onClick={async () => {
                  try {
                     const token = localStorage.getItem('token');
                     const res = await fetch('/api/admin/trigger-cron', { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }});
                     const result = await res.json();
                     alert(result.message);
                  } catch(e) { alert('Failed to trigger cron'); }
               }}
               style={{ padding: '12px 20px', background: '#0F172A', color: '#FFF', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', border: 'none' }}
            >
               🚀 Trigger Daily Midnight Cron Job Now
            </button>
            <p style={{ fontSize: '13px', color: '#64748B', marginTop: '10px' }}>This will immediately run the daily pool distribution and flush logic as if it were 12:00 AM.</p>
          </div>
        )}
      </>
    );
  };

  // Member Views
  const renderProfile = () => {
    const [profileData, setProfileData] = useState(null);
    const [kycForm, setKycForm] = useState({ panNumber: '', aadharNumber: '', bankName: '', accountNumber: '', ifscCode: '' });
    
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch('/api/user/profile', { headers: { 'Authorization': `Bearer ${token}` }});
                const result = await res.json();
                if(result.success) {
                    setProfileData(result.user);
                    setKycForm({
                        panNumber: result.user.panNumber || '',
                        aadharNumber: result.user.aadharNumber || '',
                        bankName: result.user.bankName || '',
                        accountNumber: result.user.accountNumber || '',
                        ifscCode: result.user.ifscCode || ''
                    });
                }
            } catch(err) { console.error(err); }
        };
        if (activeMenu === 'Profile' || activeMenu === 'KYC') fetchProfile();
    }, [activeMenu]);

    const handleKycSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/user/kyc', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(kycForm)
            });
            const result = await res.json();
            alert(result.message);
            if(result.success) setProfileData(result.user);
        } catch (err) {
            alert('Failed to update KYC');
        }
    };

    if (!profileData) return <div style={{ padding: '50px', textAlign: 'center' }}>Loading Profile...</div>;

    const isReadOnly = profileData.kycStatus === 'Approved' || profileData.kycStatus === 'Submitted';

    return (
        <CardWrapper>
          <PageHeader title="My Profile & KYC" subtitle="Manage your personal details and verify identity" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div>
              <h3 style={{ marginBottom: '16px' }}>Personal Details</h3>
              <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: '12px' }}>
                <p><strong>Name:</strong> {profileData.name}</p>
                <p><strong>Member ID:</strong> {profileData.memberId}</p>
                <p><strong>Mobile:</strong> {profileData.mobile}</p>
                <p><strong>Join Date:</strong> {new Date(profileData.createdAt).toLocaleDateString()}</p>
                <p><strong>Sponsor ID:</strong> {profileData.sponsorId || 'None'}</p>
              </div>
            </div>
            <div>
              <h3 style={{ marginBottom: '16px' }}>KYC Status</h3>
              <div style={{ padding: '16px', background: profileData.kycStatus === 'Approved' ? 'rgba(16, 185, 129, 0.1)' : profileData.kycStatus === 'Submitted' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)', borderRadius: '12px', border: `1px solid ${profileData.kycStatus === 'Approved' ? 'rgba(16, 185, 129, 0.3)' : profileData.kycStatus === 'Submitted' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(239, 68, 68, 0.3)'}` }}>
                 <p style={{ color: profileData.kycStatus === 'Approved' ? '#10B981' : profileData.kycStatus === 'Submitted' ? '#F59E0B' : '#EF4444', fontWeight: 'bold' }}>
                    {profileData.kycStatus === 'Approved' ? '✅ KYC Verified' : profileData.kycStatus === 'Submitted' ? '⏳ KYC Submitted (Pending Review)' : '❌ KYC Pending'}
                 </p>
                 <p style={{ fontSize: '13px', marginTop: '8px', color: '#64748B' }}>
                    {profileData.kycStatus === 'Approved' ? 'Your PAN and Bank Account details have been approved.' : 'Please update your details below to receive payouts.'}
                 </p>
              </div>
            </div>
          </div>

          <h3 style={{ marginTop: '40px', marginBottom: '16px' }}>Bank & Identity Details</h3>
          <form onSubmit={handleKycSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', maxWidth: '800px' }}>
             <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>PAN Number</label>
                <input type="text" className="form-input" value={kycForm.panNumber} onChange={e => setKycForm({...kycForm, panNumber: e.target.value.toUpperCase()})} readOnly={isReadOnly} required />
             </div>
             <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>Aadhar Number</label>
                <input type="text" className="form-input" value={kycForm.aadharNumber} onChange={e => setKycForm({...kycForm, aadharNumber: e.target.value})} readOnly={isReadOnly} required />
             </div>
             <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>Bank Name</label>
                <input type="text" className="form-input" value={kycForm.bankName} onChange={e => setKycForm({...kycForm, bankName: e.target.value})} readOnly={isReadOnly} required />
             </div>
             <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>Account Number</label>
                <input type="text" className="form-input" value={kycForm.accountNumber} onChange={e => setKycForm({...kycForm, accountNumber: e.target.value})} readOnly={isReadOnly} required />
             </div>
             <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>IFSC Code</label>
                <input type="text" className="form-input" value={kycForm.ifscCode} onChange={e => setKycForm({...kycForm, ifscCode: e.target.value.toUpperCase()})} readOnly={isReadOnly} required />
             </div>
             
             {!isReadOnly && (
                <div style={{ gridColumn: '1 / -1', marginTop: '10px' }}>
                   <button type="submit" style={{ padding: '12px 24px', background: '#2563EB', color: '#FFF', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Submit KYC Details</button>
                </div>
             )}
          </form>
        </CardWrapper>
    );
  };

  const renderNetwork = () => {
    const [networkData, setNetworkData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNetwork = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('token');
                const res = await fetch('/api/network/directs', { headers: { 'Authorization': `Bearer ${token}` }});
                const result = await res.json();
                if(result.success) setNetworkData(result.data);
            } catch(err) { console.error(err); }
            setLoading(false);
        };
        if (activeMenu === 'My Network') fetchNetwork();
    }, [activeMenu]);

    return (
        <CardWrapper>
          <PageHeader title="My Direct Referrals" subtitle="List of members directly referred by you" />
          
          {loading ? (
             <div style={{ textAlign: 'center', padding: '50px', color: '#64748B' }}>Loading Network...</div>
          ) : networkData.length === 0 ? (
             <div style={{ textAlign: 'center', padding: '50px', color: '#64748B' }}>You haven't referred anyone yet.</div>
          ) : (
            <Table headers={['Member ID', 'Name', 'Rank', 'Join Date', 'Status']}>
              {networkData.map(user => (
                <tr key={user.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '15px', fontWeight: 'bold', color: '#0EA5E9' }}>{user.id}</td>
                  <td style={{ padding: '15px', fontWeight: 'bold' }}>{user.name}</td>
                  <td style={{ padding: '15px' }}>
                     <span style={{ fontWeight: 'bold', color: user.rank === 'Gold' ? '#F59E0B' : '#94A3B8' }}>{user.rank}</span>
                  </td>
                  <td style={{ padding: '15px', color: '#64748B' }}>{user.joinDate}</td>
                  <td style={{ padding: '15px' }}>
                    <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', background: user.status==='Active'?'rgba(16,185,129,0.1)':'rgba(239,68,68,0.1)', color: user.status==='Active'?'#10B981':'#EF4444' }}>
                      {user.status}
                    </span>
                  </td>
                </tr>
              ))}
            </Table>
          )}
        </CardWrapper>
    );
  };

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
              <h3 className="wallet-card-title">Royalty & Cashback</h3>
              <h1 className="wallet-card-amount">₹ {(dashboardData?.autopoolFund || 0).toLocaleString()}</h1>
              <div className="wallet-card-icon">👑</div>
              <div className="wallet-card-action">
                 <button className="wallet-btn wallet-btn-secondary" onClick={() => setActiveMenu('Non-Working Cashback')}>View Details</button>
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
    const [p2pTpin, setP2pTpin] = useState('');
    const [p2pMessage, setP2pMessage] = useState({ text: '', type: '' });
    const [loadingP2p, setLoadingP2p] = useState(false);

    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [withdrawTpin, setWithdrawTpin] = useState('');
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
           body: JSON.stringify({ amount: withdrawAmount, tpin: withdrawTpin })
         });
         const result = await res.json();
         if (result.success) {
           setWithdrawMessage({ text: result.message, type: 'success' });
           setWithdrawAmount('');
           setWithdrawTpin('');
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
         const res = await fetch('/api/p2p', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
           body: JSON.stringify({ receiverId: p2pReceiver, amount: p2pAmount, tpin: p2pTpin })
         });
         const result = await res.json();
         if (result.success) {
           setP2pMessage({ text: result.message, type: 'success' });
           setP2pReceiver('');
           setP2pAmount('');
           setP2pTpin('');
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
                 <input type="number" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} required placeholder="Enter Amount (Min ₹200)" style={{ width: '100%', padding: '12px', border: '1px solid #CBD5E1', borderRadius: '8px', marginBottom: '16px', fontSize: '16px' }} />
                 <input type="password" value={withdrawTpin} onChange={(e) => setWithdrawTpin(e.target.value)} required placeholder="Enter Transaction PIN" style={{ width: '100%', padding: '12px', border: '1px solid #CBD5E1', borderRadius: '8px', marginBottom: '16px', fontSize: '16px' }} />
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
              <p style={{ color: '#64748B', marginBottom: '16px' }}>Transfer funds to another member instantly. Note: <span style={{ color: '#EF4444' }}>5% Admin Charge</span> will be deducted.</p>
              
              <form onSubmit={handleP2pSubmit}>
                 <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Receiver Member ID</label>
                    <input type="text" value={p2pReceiver} onChange={(e) => setP2pReceiver(e.target.value)} required placeholder="e.g. RK12345" style={{ width: '100%', padding: '12px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '16px' }} />
                 </div>
                 <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Transfer Amount</label>
                    <input type="number" value={p2pAmount} onChange={(e) => setP2pAmount(e.target.value)} required placeholder="Amount in ₹" style={{ width: '100%', padding: '12px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '16px' }} />
                 </div>
                 <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>Transaction PIN</label>
                    <input type="password" value={p2pTpin} onChange={(e) => setP2pTpin(e.target.value)} required placeholder="Enter T-PIN" style={{ width: '100%', padding: '12px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '16px' }} />
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

  const renderTpinSettings = () => {
    const [currentTpin, setCurrentTpin] = useState('');
    const [newTpin, setNewTpin] = useState('');
    const [confirmTpin, setConfirmTpin] = useState('');
    const [msg, setMsg] = useState({text:'', type:''});
    
    // Check if user has T-PIN yet (dashboardData could have hasTpin flag)
    const hasTpin = dashboardData?.hasTpin;

    const handleTpinSubmit = async (e) => {
       e.preventDefault();
       setMsg({text:'', type:''});
       if(newTpin !== confirmTpin) {
           return setMsg({text:'New T-PIN and Confirm T-PIN do not match!', type:'error'});
       }
       try {
           const token = localStorage.getItem('token');
           const res = await fetch('/api/user/tpin', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
               body: JSON.stringify({ currentTpin: hasTpin ? currentTpin : '', newTpin })
           });
           const result = await res.json();
           if(result.success) {
               setMsg({text:result.message, type:'success'});
               setCurrentTpin(''); setNewTpin(''); setConfirmTpin('');
               if(setDashboardData) setDashboardData(prev => ({...prev, hasTpin: true}));
           } else {
               setMsg({text:result.message, type:'error'});
           }
       } catch(err) {
           setMsg({text:'Server connection error', type:'error'});
       }
    };

    return (
      <CardWrapper>
        <PageHeader title="Transaction PIN (T-PIN)" subtitle="Secure your withdrawals and transfers" />
        <div style={{ maxWidth: '500px', background: '#FFF', padding: '30px', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
            <p style={{ color: '#64748B', marginBottom: '24px', lineHeight: '1.5' }}>
               A Transaction PIN (T-PIN) is required to withdraw funds or send money via P2P. Please {hasTpin ? 'update' : 'create'} your T-PIN below and keep it safe.
            </p>
            <form onSubmit={handleTpinSubmit}>
               {hasTpin && (
                  <div style={{ marginBottom: '16px' }}>
                     <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>Current T-PIN</label>
                     <input type="password" value={currentTpin} onChange={e=>setCurrentTpin(e.target.value)} required placeholder="Enter current T-PIN" style={{ width: '100%', padding: '12px', border: '1px solid #CBD5E1', borderRadius: '8px' }} />
                  </div>
               )}
               <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>New T-PIN</label>
                  <input type="password" value={newTpin} onChange={e=>setNewTpin(e.target.value)} required placeholder="Enter new T-PIN" style={{ width: '100%', padding: '12px', border: '1px solid #CBD5E1', borderRadius: '8px' }} />
               </div>
               <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>Confirm New T-PIN</label>
                  <input type="password" value={confirmTpin} onChange={e=>setConfirmTpin(e.target.value)} required placeholder="Re-enter new T-PIN" style={{ width: '100%', padding: '12px', border: '1px solid #CBD5E1', borderRadius: '8px' }} />
               </div>

               {msg.text && (
                  <div style={{ marginBottom: '16px', padding: '10px', borderRadius: '8px', background: msg.type==='success'?'#D1FAE5':'#FEE2E2', color: msg.type==='success'?'#065F46':'#991B1B', fontSize: '14px', fontWeight: 'bold' }}>
                     {msg.text}
                  </div>
               )}

               <button type="submit" style={{ width: '100%', padding: '14px', background: '#3B82F6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}>
                  {hasTpin ? 'Update T-PIN' : 'Create T-PIN'}
               </button>
            </form>
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

  const renderFundRequests = () => {
    const [requests, setRequests] = useState([]);
    
    useEffect(() => {
       const fetchRequests = async () => {
          try {
             const token = localStorage.getItem('token');
             const res = await fetch('/api/admin/fund-requests', { headers: { 'Authorization': `Bearer ${token}` }});
             const result = await res.json();
             if(result.success) setRequests(result.data);
          } catch(err) { console.error(err); }
       };
       fetchRequests();
    }, []);

    const handleAction = async (id, action) => {
       try {
          const token = localStorage.getItem('token');
          const res = await fetch(`/api/admin/fund-requests/${id}`, {
             method: 'POST',
             headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
             body: JSON.stringify({ action })
          });
          const result = await res.json();
          if(result.success) {
             setRequests(prev => prev.filter(r => r._id !== id));
          }
          alert(result.message);
       } catch(err) { alert("Action failed"); }
    };

    return (
      <CardWrapper>
        <PageHeader title="Fund Requests" subtitle="Approve or reject member deposit requests" />
        <Table headers={['Req ID', 'Member', 'Amount', 'UTR Number', 'Date', 'Action']}>
          {requests.length === 0 && <tr><td colSpan="6" style={{ padding: '16px', textAlign: 'center' }}>No pending fund requests.</td></tr>}
          {requests.map(req => (
            <tr key={req._id} style={{ borderBottom: '1px solid #F1F5F9' }}>
              <td style={{ padding: '15px', fontWeight: 'bold' }}>{req._id.slice(-6).toUpperCase()}</td>
              <td style={{ padding: '15px', color: '#0EA5E9', fontWeight: 'bold' }}>{req.memberId}</td>
              <td style={{ padding: '15px', color: '#10B981', fontWeight: 'bold' }}>₹{req.amount}</td>
              <td style={{ padding: '15px' }}>{req.utrNumber}</td>
              <td style={{ padding: '15px', color: '#64748B' }}>{new Date(req.requestDate).toLocaleDateString()}</td>
              <td style={{ padding: '15px', display: 'flex', gap: '8px' }}>
                 <button onClick={() => handleAction(req._id, 'approve')} style={{ padding: '6px 12px', background: '#10B981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Approve</button>
                 <button onClick={() => handleAction(req._id, 'reject')} style={{ padding: '6px 12px', background: '#EF4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Reject</button>
              </td>
            </tr>
          ))}
        </Table>
      </CardWrapper>
    );
  };

  const renderDepositFunds = () => {
    const [amount, setAmount] = useState('');
    const [utrNumber, setUtrNumber] = useState('');
    const [message, setMessage] = useState({ text: '', type: '' });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
       e.preventDefault();
       setLoading(true);
       try {
          const token = localStorage.getItem('token');
          const res = await fetch('/api/fund-request', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
             body: JSON.stringify({ amount, utrNumber })
          });
          const result = await res.json();
          setMessage({ text: result.message, type: result.success ? 'success' : 'error' });
          if(result.success) {
             setAmount('');
             setUtrNumber('');
          }
       } catch(err) { setMessage({ text: 'Error connecting to server', type: 'error' }); }
       setLoading(false);
    };

    return (
      <CardWrapper>
         <PageHeader title="Deposit Funds" subtitle="Add funds to your wallet using UPI or Bank Transfer" />
         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            <div style={{ padding: '24px', background: '#F8FAFC', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
               <h3 style={{ marginBottom: '16px', color: '#0F172A' }}>Company Bank Details</h3>
               <p style={{ color: '#64748B', marginBottom: '8px' }}><strong>Bank Name:</strong> HDFC Bank</p>
               <p style={{ color: '#64748B', marginBottom: '8px' }}><strong>A/C Name:</strong> Royal Kuberaa Solutions</p>
               <p style={{ color: '#64748B', marginBottom: '8px' }}><strong>A/C Number:</strong> 50200012345678</p>
               <p style={{ color: '#64748B', marginBottom: '16px' }}><strong>IFSC Code:</strong> HDFC0001234</p>
               
               <h4 style={{ marginBottom: '12px', color: '#0F172A' }}>UPI Payment</h4>
               <div style={{ width: '150px', height: '150px', background: '#FFF', padding: '10px', borderRadius: '12px', border: '1px solid #CBD5E1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: '#94A3B8', textAlign: 'center' }}>
                  [QR Code Image Placeholder]
               </div>
               <p style={{ marginTop: '10px', color: '#0EA5E9', fontWeight: 'bold' }}>UPI ID: royalkuberaa@hdfcbank</p>
            </div>
            
            <div style={{ padding: '24px', background: '#FFF', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
               <h3 style={{ marginBottom: '16px', color: '#0F172A' }}>Submit Request</h3>
               <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '20px' }}>After making the payment, enter the UTR/Reference number here. The admin will verify and add funds to your wallet.</p>
               
               <form onSubmit={handleSubmit}>
                  <div style={{ marginBottom: '16px' }}>
                     <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>Amount Paid (₹)</label>
                     <input type="number" value={amount} onChange={e=>setAmount(e.target.value)} required placeholder="e.g. 5000" style={{ width: '100%', padding: '12px', border: '1px solid #CBD5E1', borderRadius: '8px' }} />
                  </div>
                  <div style={{ marginBottom: '20px' }}>
                     <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>UTR / Reference Number</label>
                     <input type="text" value={utrNumber} onChange={e=>setUtrNumber(e.target.value)} required placeholder="12-digit UPI UTR" style={{ width: '100%', padding: '12px', border: '1px solid #CBD5E1', borderRadius: '8px' }} />
                  </div>
                  
                  {message.text && (
                     <div style={{ marginBottom: '16px', padding: '10px', borderRadius: '8px', background: message.type==='success'?'#D1FAE5':'#FEE2E2', color: message.type==='success'?'#065F46':'#991B1B', fontSize: '14px', fontWeight: 'bold' }}>
                        {message.text}
                     </div>
                  )}

                  <button type="submit" disabled={loading} style={{ width: '100%', padding: '14px', background: '#0F172A', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
                     {loading ? 'Submitting...' : 'Submit Fund Request'}
                  </button>
               </form>
            </div>
         </div>
      </CardWrapper>
    );
  };

  const renderAutoPoolSettings = () => {
    const [pools, setPools] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPools = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch('/api/admin/pools', { headers: { 'Authorization': `Bearer ${token}` }});
                const result = await res.json();
                if(result.success) setPools(result.data);
            } catch (err) { console.error(err); }
            setLoading(false);
        };
        if (activeMenu === 'Pool Distributions' || activeMenu === 'AutoPool Settings') fetchPools();
    }, [activeMenu]);

    return (
      <CardWrapper>
        <PageHeader title="Global Royalty Pools" subtitle="Live statistics of daily company turnover distribution" />
        {loading ? (
           <div style={{ padding: '50px', textAlign: 'center', color: '#64748B' }}>Loading Pool Data...</div>
        ) : (
           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
             {pools.length === 0 ? <p style={{ color: '#64748B' }}>No pools active yet.</p> : pools.map(pool => (
               <div key={pool._id} style={{ padding: '24px', background: '#FFF', border: '1px solid #E2E8F0', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                  <h3 style={{ marginBottom: '16px', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                     <span style={{ fontSize: '24px' }}>{pool.poolName === 'GOLD' ? '🥇' : pool.poolName === 'PLATINUM' ? '🥈' : pool.poolName === 'RUBY' ? '🔴' : '💎'}</span>
                     {pool.poolName} POOL
                  </h3>
                  <div style={{ marginBottom: '12px' }}>
                     <span style={{ display: 'block', fontSize: '13px', color: '#64748B', fontWeight: 'bold', marginBottom: '4px' }}>Total Fund Collected</span>
                     <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#10B981' }}>₹ {pool.totalFund.toLocaleString()}</span>
                  </div>
                  <div>
                     <span style={{ display: 'block', fontSize: '13px', color: '#64748B', fontWeight: 'bold', marginBottom: '4px' }}>Active Qualifiers</span>
                     <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#3B82F6' }}>{pool.membersCount} Members</span>
                  </div>
                  <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #F1F5F9', fontSize: '12px', color: '#94A3B8' }}>
                     * Funds will be distributed equally among qualifiers daily at midnight.
                  </div>
               </div>
             ))}
           </div>
        )}
      </CardWrapper>
    );
  };

  const renderKYCApprovals = () => {
    const [requests, setRequests] = useState([]);
    
    useEffect(() => {
        const fetchKycRequests = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch('/api/admin/kyc', { headers: { 'Authorization': `Bearer ${token}` }});
                const result = await res.json();
                if(result.success) setRequests(result.data);
            } catch(err) { console.error(err); }
        };
        if(activeMenu === 'KYC Approvals') fetchKycRequests();
    }, [activeMenu]);

    const handleKycAction = async (memberId, action) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/admin/kyc/${memberId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ action })
            });
            const result = await res.json();
            alert(result.message);
            if(result.success) {
                setRequests(prev => prev.filter(req => req.memberId !== memberId));
            }
        } catch(err) { console.error(err); }
    };

    return (
        <CardWrapper>
          <PageHeader title="KYC Approvals" subtitle="Review and verify member KYC submissions" />
          <Table headers={['Member ID', 'Name', 'PAN', 'Aadhar', 'Bank Info', 'Status', 'Action']}>
            {requests.length === 0 && <tr><td colSpan="7" style={{ padding: '16px', textAlign: 'center' }}>No pending KYC requests.</td></tr>}
            {requests.map(req => (
              <tr key={req.memberId} style={{ borderBottom: '1px solid #F1F5F9' }}>
                <td style={{ padding: '15px', color: '#0EA5E9', fontWeight: 'bold' }}>{req.memberId}</td>
                <td style={{ padding: '15px', fontWeight: 'bold' }}>{req.name}</td>
                <td style={{ padding: '15px' }}>{req.panNumber}</td>
                <td style={{ padding: '15px' }}>{req.aadharNumber}</td>
                <td style={{ padding: '15px' }}>
                    <div style={{ fontSize: '12px', lineHeight: '1.4' }}>
                        <div><strong>Bank:</strong> {req.bankName}</div>
                        <div><strong>A/C:</strong> {req.accountNumber}</div>
                        <div><strong>IFSC:</strong> {req.ifscCode}</div>
                    </div>
                </td>
                <td style={{ padding: '15px', color: '#F59E0B', fontWeight: 'bold' }}>Pending</td>
                <td style={{ padding: '15px', display: 'flex', gap: '8px', flexDirection: 'column' }}>
                  <button onClick={() => handleKycAction(req.memberId, 'approve')} style={{ padding: '6px 12px', background: '#10B981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Approve</button>
                  <button onClick={() => handleKycAction(req.memberId, 'reject')} style={{ padding: '6px 12px', background: '#EF4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Reject</button>
                </td>
              </tr>
            ))}
          </Table>
        </CardWrapper>
    );
  };

  const renderSupportTickets = () => {
    const [tickets, setTickets] = useState([]);
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [replyText, setReplyText] = useState({});

    useEffect(() => {
       const fetchTickets = async () => {
          try {
             const token = localStorage.getItem('token');
             const url = userRole === 'admin' ? '/api/admin/tickets' : '/api/tickets';
             const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` }});
             const result = await res.json();
             if(result.success) setTickets(result.data);
          } catch(err) { console.error(err); }
       };
       if (activeMenu === 'Support Tickets' || activeMenu === 'Support') fetchTickets();
    }, [activeMenu, userRole]);

    const handleCreateTicket = async (e) => {
       e.preventDefault();
       try {
          const token = localStorage.getItem('token');
          const res = await fetch('/api/tickets', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
             body: JSON.stringify({ subject, message })
          });
          const result = await res.json();
          alert(result.message);
          if(result.success) {
             setSubject('');
             setMessage('');
             const res2 = await fetch('/api/tickets', { headers: { 'Authorization': `Bearer ${token}` }});
             const result2 = await res2.json();
             if(result2.success) setTickets(result2.data);
          }
       } catch(err) { alert('Error creating ticket'); }
    };

    const handleReply = async (id) => {
       try {
          const token = localStorage.getItem('token');
          const res = await fetch(`/api/admin/tickets/${id}/reply`, {
             method: 'POST',
             headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
             body: JSON.stringify({ reply: replyText[id] })
          });
          const result = await res.json();
          alert(result.message);
          if(result.success) {
             setTickets(prev => prev.map(t => t._id === id ? { ...t, status: 'Resolved', reply: replyText[id] } : t));
          }
       } catch(err) { alert('Error sending reply'); }
    };

    return (
      <CardWrapper>
        <PageHeader title={userRole === 'admin' ? "Support Center" : "Help & Support"} subtitle={userRole === 'admin' ? "Resolve member queries" : "Raise a ticket to get help from admin"} />
        
        {userRole === 'member' && (
          <div style={{ background: '#FFF', padding: '24px', borderRadius: '16px', border: '1px solid #E2E8F0', marginBottom: '30px' }}>
            <h3 style={{ marginBottom: '16px' }}>Create New Ticket</h3>
            <form onSubmit={handleCreateTicket}>
               <input type="text" value={subject} onChange={e=>setSubject(e.target.value)} required placeholder="Subject" style={{ width: '100%', padding: '12px', border: '1px solid #CBD5E1', borderRadius: '8px', marginBottom: '16px' }} />
               <textarea value={message} onChange={e=>setMessage(e.target.value)} required placeholder="Describe your issue..." rows="4" style={{ width: '100%', padding: '12px', border: '1px solid #CBD5E1', borderRadius: '8px', marginBottom: '16px', resize: 'vertical' }}></textarea>
               <button type="submit" style={{ padding: '12px 24px', background: '#3B82F6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Submit Ticket</button>
            </form>
          </div>
        )}

        <div style={{ background: '#FFF', padding: '24px', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
           <h3 style={{ marginBottom: '20px' }}>{userRole === 'admin' ? 'All Tickets' : 'My Tickets'}</h3>
           {tickets.length === 0 ? <p style={{ color: '#64748B' }}>No tickets found.</p> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                 {tickets.map(t => (
                    <div key={t._id} style={{ border: '1px solid #E2E8F0', borderRadius: '12px', padding: '20px', background: t.status==='Resolved'?'#F8FAFC':'#FFF' }}>
                       <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                             <span style={{ background: t.status==='Open'?'#FEF3C7':'#D1FAE5', color: t.status==='Open'?'#D97706':'#065F46', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>{t.status}</span>
                             <span style={{ fontWeight: 'bold', color: '#0F172A' }}>{t.subject}</span>
                             {userRole === 'admin' && <span style={{ color: '#0EA5E9', fontSize: '12px', fontWeight: 'bold' }}>({t.memberId})</span>}
                          </div>
                          <div style={{ fontSize: '12px', color: '#94A3B8' }}>{new Date(t.createdAt).toLocaleString()}</div>
                       </div>
                       <p style={{ color: '#475569', fontSize: '14px', margin: '0 0 16px 0', lineHeight: '1.5' }}>{t.message}</p>
                       
                       {t.reply && (
                          <div style={{ background: '#F1F5F9', padding: '12px', borderRadius: '8px', borderLeft: '4px solid #3B82F6' }}>
                             <strong style={{ display: 'block', fontSize: '12px', color: '#3B82F6', marginBottom: '4px' }}>Admin Reply:</strong>
                             <span style={{ color: '#334155', fontSize: '14px' }}>{t.reply}</span>
                          </div>
                       )}

                       {userRole === 'admin' && t.status === 'Open' && (
                          <div style={{ marginTop: '16px', display: 'flex', gap: '10px' }}>
                             <input type="text" value={replyText[t._id] || ''} onChange={e=>setReplyText({...replyText, [t._id]: e.target.value})} placeholder="Type your reply here..." style={{ flex: 1, padding: '10px', border: '1px solid #CBD5E1', borderRadius: '6px' }} />
                             <button onClick={() => handleReply(t._id)} style={{ padding: '10px 20px', background: '#10B981', color: '#FFF', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Send Reply</button>
                          </div>
                       )}
                    </div>
                 ))}
              </div>
           )}
        </div>
      </CardWrapper>
    );
  };

  const renderSystemSettings = () => {
    const [settings, setSettings] = useState({ siteName: 'Royal Kuberaa', tdsPercentage: 5, adminChargePercentage: 5, minimumWithdrawal: 200, maintenanceMode: false });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
       const fetchSettings = async () => {
          try {
             const res = await fetch('/api/settings');
             const result = await res.json();
             if(result.success && result.data) setSettings(result.data);
          } catch(err) { console.error(err); }
          setLoading(false);
       };
       if (activeMenu === 'System Settings') fetchSettings();
    }, [activeMenu]);

    const handleSave = async (e) => {
       e.preventDefault();
       try {
          const token = localStorage.getItem('token');
          const res = await fetch('/api/admin/settings', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
             body: JSON.stringify(settings)
          });
          const result = await res.json();
          alert(result.message);
       } catch(err) { alert('Failed to save settings'); }
    };

    if(loading) return <div style={{ padding: '50px', textAlign: 'center', color: '#64748B' }}>Loading settings...</div>;

    return (
      <CardWrapper>
        <PageHeader title="System Settings" subtitle="Configure core platform rules and deductions" />
        <div style={{ maxWidth: '600px', background: '#FFF', padding: '30px', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <form onSubmit={handleSave}>
             <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>Site Name</label>
                <input type="text" value={settings.siteName} onChange={e=>setSettings({...settings, siteName: e.target.value})} style={{ width: '100%', padding: '12px', border: '1px solid #CBD5E1', borderRadius: '8px' }} />
             </div>
             
             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                 <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>TDS Percentage (%)</label>
                    <input type="number" value={settings.tdsPercentage} onChange={e=>setSettings({...settings, tdsPercentage: Number(e.target.value)})} style={{ width: '100%', padding: '12px', border: '1px solid #CBD5E1', borderRadius: '8px' }} />
                 </div>
                 <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>Admin Charge (%)</label>
                    <input type="number" value={settings.adminChargePercentage} onChange={e=>setSettings({...settings, adminChargePercentage: Number(e.target.value)})} style={{ width: '100%', padding: '12px', border: '1px solid #CBD5E1', borderRadius: '8px' }} />
                 </div>
             </div>
             
             <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>Minimum Withdrawal (₹)</label>
                <input type="number" value={settings.minimumWithdrawal} onChange={e=>setSettings({...settings, minimumWithdrawal: Number(e.target.value)})} style={{ width: '100%', padding: '12px', border: '1px solid #CBD5E1', borderRadius: '8px' }} />
             </div>

             <div style={{ marginBottom: '30px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input type="checkbox" checked={settings.maintenanceMode} onChange={e=>setSettings({...settings, maintenanceMode: e.target.checked})} style={{ width: '20px', height: '20px' }} />
                <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#EF4444' }}>Enable Maintenance Mode (Blocks new logins)</label>
             </div>

             <button type="submit" style={{ width: '100%', padding: '14px', background: '#0F172A', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}>
                💾 Save Settings
             </button>
          </form>
        </div>
      </CardWrapper>
    );
  };

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

  const renderBinaryTree = () => {
    const [treeData, setTreeData] = useState(null);
    const [loadingTree, setLoadingTree] = useState(true);
    
    const fetchTree = async (memberId = '') => {
        setLoadingTree(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/network/tree/${memberId}`, { headers: { 'Authorization': `Bearer ${token}` }});
            const result = await res.json();
            if(result.success) setTreeData(result.data);
        } catch(err) { console.error(err); }
        setLoadingTree(false);
    };

    useEffect(() => {
        if (activeMenu === 'Binary Genealogy') {
            fetchTree();
        }
    }, [activeMenu]);

    const TreeNode = ({ node }) => {
        if (!node) {
            return (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '0 10px' }}>
                    <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: '#E2E8F0', border: '2px dashed #94A3B8', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: '12px', fontWeight: 'bold' }}>Empty</div>
                </div>
            );
        }
        
        const rankColors = { 'STARTER': '#94A3B8', 'GOLD': '#F59E0B', 'PLATINUM': '#3B82F6', 'RUBY': '#EF4444', 'DIAMOND': '#8B5CF6' };
        const borderColor = rankColors[node.rank] || '#10B981';

        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                {/* Node Box */}
                <div 
                    onClick={() => fetchTree(node.id)}
                    style={{ background: '#FFF', border: `2px solid ${borderColor}`, borderRadius: '12px', padding: '12px', width: '120px', textAlign: 'center', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', zIndex: 2, position: 'relative' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: borderColor, color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px', fontSize: '18px', fontWeight: 'bold' }}>
                        {node.name.charAt(0)}
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{node.id}</div>
                    <div style={{ fontSize: '10px', color: '#64748B', marginBottom: '4px' }}>{node.name}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 'bold', background: '#F1F5F9', padding: '2px 6px', borderRadius: '4px' }}>
                        <span style={{ color: '#0EA5E9' }}>L: {node.leftTeamCount}</span>
                        <span style={{ color: '#8B5CF6' }}>R: {node.rightTeamCount}</span>
                    </div>
                </div>

                {/* Children Connectors */}
                {(node.left || node.right) && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                        {/* Vertical line down from parent */}
                        <div style={{ width: '2px', height: '20px', background: '#CBD5E1' }}></div>
                        {/* Horizontal line connecting children */}
                        <div style={{ display: 'flex', width: '100%', justifyContent: 'center' }}>
                            <div style={{ width: '50%', height: '2px', background: '#CBD5E1' }}></div>
                            <div style={{ width: '50%', height: '2px', background: '#CBD5E1' }}></div>
                        </div>
                        {/* Children Container */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', paddingTop: '10px', gap: '20px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                                <div style={{ width: '2px', height: '10px', background: '#CBD5E1', marginTop: '-10px' }}></div>
                                <TreeNode node={node.left} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                                <div style={{ width: '2px', height: '10px', background: '#CBD5E1', marginTop: '-10px' }}></div>
                                <TreeNode node={node.right} />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <CardWrapper>
            <PageHeader title="Binary Genealogy Tree" subtitle="Click on any member ID to view their downline tree" />
            
            {loadingTree ? (
                <div style={{ textAlign: 'center', padding: '50px', color: '#64748B' }}>Loading Tree...</div>
            ) : (
                <div style={{ overflowX: 'auto', padding: '40px 20px', display: 'flex', justifyContent: 'center', minWidth: '800px' }}>
                    <TreeNode node={treeData} />
                </div>
            )}
            
            {treeData && treeData.id !== userData?.memberId && (
                <div style={{ textAlign: 'center', marginTop: '20px' }}>
                    <button onClick={() => fetchTree()} style={{ padding: '10px 20px', background: '#0F172A', color: '#FFF', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
                        ⬆️ Back to My Top Node
                    </button>
                </div>
            )}
        </CardWrapper>
    );
  };

  const renderRoyaltyAndCashback = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const isRoyalty = activeMenu === 'Royalty Pools';
    const filterCategory = isRoyalty ? 'ROYALTY' : 'CASHBACK';
    
    useEffect(() => {
        const fetchHistory = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('token');
                const res = await fetch('/api/transactions', { headers: { 'Authorization': `Bearer ${token}` }});
                const result = await res.json();
                if(result.success) {
                    const filtered = result.data.filter(tx => tx.category === filterCategory);
                    setHistory(filtered);
                }
            } catch(err) { console.error(err); }
            setLoading(false);
        };
        if (activeMenu === 'Royalty Pools' || activeMenu === 'Non-Working Cashback') {
            fetchHistory();
        }
    }, [activeMenu]);

    return (
        <CardWrapper>
          <PageHeader 
             title={isRoyalty ? 'Daily Royalty Pools' : 'Non-Working Cashback'} 
             subtitle={isRoyalty ? "Your daily share from Global Royalty Pools" : "Your daily non-working cashback earnings"} 
          />
          
          <div style={{ padding: '20px', background: isRoyalty ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' : 'linear-gradient(135deg, #10B981 0%, #059669 100%)', borderRadius: '16px', color: '#FFF', marginBottom: '30px', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}>
             <h3 style={{ margin: 0, opacity: 0.9 }}>Total Earned</h3>
             <h1 style={{ fontSize: '36px', margin: '10px 0 0' }}>
                 ₹ {history.reduce((sum, tx) => sum + tx.amount, 0).toLocaleString()}
             </h1>
          </div>

          {loading ? (
             <div style={{ textAlign: 'center', padding: '50px', color: '#64748B' }}>Loading History...</div>
          ) : history.length === 0 ? (
             <div style={{ textAlign: 'center', padding: '50px', color: '#64748B' }}>No earnings yet. Check back tomorrow!</div>
          ) : (
            <Table headers={['Date', 'Amount', 'Type', 'Description']}>
              {history.map((tx, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '15px', color: '#64748B' }}>{new Date(tx.createdAt).toLocaleString()}</td>
                  <td style={{ padding: '15px', fontWeight: 'bold', color: '#10B981' }}>+ ₹{tx.amount}</td>
                  <td style={{ padding: '15px' }}>
                     <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', background: 'rgba(16,185,129,0.1)', color: '#10B981' }}>
                       {tx.category}
                     </span>
                  </td>
                  <td style={{ padding: '15px', color: '#0F172A' }}>{tx.remark}</td>
                </tr>
              ))}
            </Table>
          )}
        </CardWrapper>
    );
  };

  const renderRebirths = () => {
    const [rebirthData, setRebirthData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRebirths = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('token');
                const res = await fetch('/api/network/rebirths', { headers: { 'Authorization': `Bearer ${token}` }});
                const result = await res.json();
                if(result.success) setRebirthData(result.data);
            } catch(err) { console.error(err); }
            setLoading(false);
        };
        if (activeMenu === 'Rebirth ID') fetchRebirths();
    }, [activeMenu]);

    return (
        <CardWrapper>
          <PageHeader title="My Rebirth IDs" subtitle="List of all new IDs generated from your Rebirth Wallet" />
          
          {loading ? (
             <div style={{ textAlign: 'center', padding: '50px', color: '#64748B' }}>Loading Rebirths...</div>
          ) : rebirthData.length === 0 ? (
             <div style={{ textAlign: 'center', padding: '50px', color: '#64748B' }}>You haven't generated any Rebirth IDs yet.</div>
          ) : (
            <Table headers={['Rebirth ID', 'Name', 'Left Team', 'Right Team', 'Total Earnings', 'Created On']}>
              {rebirthData.map(user => (
                <tr key={user.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '15px', fontWeight: 'bold', color: '#8B5CF6' }}>{user.id}</td>
                  <td style={{ padding: '15px', fontWeight: 'bold' }}>{user.name}</td>
                  <td style={{ padding: '15px', color: '#0EA5E9' }}>{user.leftTeam}</td>
                  <td style={{ padding: '15px', color: '#F59E0B' }}>{user.rightTeam}</td>
                  <td style={{ padding: '15px', fontWeight: 'bold', color: '#10B981' }}>₹{user.earnings}</td>
                  <td style={{ padding: '15px', color: '#64748B' }}>{user.joinDate}</td>
                </tr>
              ))}
            </Table>
          )}
        </CardWrapper>
    );
  };

  const renderRewards = () => {
    const [rewardData, setRewardData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRewards = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch('/api/user/rewards', { headers: { 'Authorization': `Bearer ${token}` }});
                const result = await res.json();
                if(result.success) setRewardData(result);
            } catch(err) { console.error(err); }
            setLoading(false);
        };
        if (activeMenu === 'Offers' || activeMenu === 'Awards & Rewards') fetchRewards();
    }, [activeMenu]);

    const handleClaim = async (pairs) => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/user/rewards/claim', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ pairs })
            });
            const result = await res.json();
            alert(result.message);
            if (result.success) {
                // Refresh data
                const res2 = await fetch('/api/user/rewards', { headers: { 'Authorization': `Bearer ${token}` }});
                const result2 = await res2.json();
                if(result2.success) setRewardData(result2);
            }
        } catch(err) { alert('Failed to claim reward'); }
    };

    if (loading || !rewardData) return <div style={{ padding: '50px', textAlign: 'center', color: '#64748B' }}>Loading Rewards...</div>;

    const { totalPairsMatched, claimedRewards, rewardsPlan } = rewardData;

    return (
        <CardWrapper>
            <PageHeader title="Lifetime Awards & Rewards" subtitle="Achieve matching pairs to unlock exclusive rewards!" />
            
            <div style={{ background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)', padding: '24px', borderRadius: '16px', color: '#FFF', marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h3 style={{ margin: 0, color: '#94A3B8' }}>Your Lifetime Matching Pairs</h3>
                    <h1 style={{ fontSize: '40px', margin: '8px 0 0', color: '#38BDF8' }}>{totalPairsMatched} <span style={{ fontSize: '18px', color: '#64748B' }}>Pairs</span></h1>
                </div>
                <div style={{ fontSize: '48px' }}>🏆</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                {rewardsPlan.map(reward => {
                    const isClaimed = claimedRewards.some(r => r.pairs === reward.pairs);
                    const isEligible = totalPairsMatched >= reward.pairs;
                    const progress = Math.min((totalPairsMatched / reward.pairs) * 100, 100);

                    return (
                        <div key={reward.pairs} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F8FAFC', padding: '20px', borderRadius: '12px', border: `1px solid ${isClaimed ? '#10B981' : isEligible ? '#F59E0B' : '#E2E8F0'}` }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                    <h3 style={{ margin: 0, color: '#0F172A' }}>{reward.name}</h3>
                                    <span style={{ background: '#E0F2FE', color: '#0284C7', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>₹{reward.cash.toLocaleString()} Cash</span>
                                </div>
                                <div style={{ color: '#64748B', fontSize: '13px', marginBottom: '12px' }}>Target: {reward.pairs} Pairs</div>
                                
                                <div style={{ width: '100%', maxWidth: '300px', height: '6px', background: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                                    <div style={{ width: `${progress}%`, height: '100%', background: isClaimed ? '#10B981' : isEligible ? '#F59E0B' : '#3B82F6', transition: 'width 1s ease-in-out' }}></div>
                                </div>
                            </div>
                            <div>
                                {isClaimed ? (
                                    <span style={{ color: '#10B981', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>✅ Claimed</span>
                                ) : isEligible ? (
                                    <button onClick={() => handleClaim(reward.pairs)} style={{ padding: '10px 20px', background: '#F59E0B', color: '#FFF', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 10px rgba(245, 158, 11, 0.3)' }}>
                                        🎁 Claim Reward
                                    </button>
                                ) : (
                                    <span style={{ color: '#94A3B8', fontWeight: 'bold', fontSize: '14px' }}>{reward.pairs - totalPairsMatched} Pairs Left</span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </CardWrapper>
    );
  };

  const renderChangePassword = () => {
    const [currentPwd, setCurrentPwd] = useState(['', '', '', '', '', '']);
    const [newPwd, setNewPwd] = useState(['', '', '', '', '', '']);
    const [msg, setMsg] = useState({ text: '', type: '' });
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        const currentPassword = currentPwd.join('');
        const newPassword = newPwd.join('');
        if (currentPassword.length !== 6 || newPassword.length !== 6) {
            return setMsg({ text: 'Please enter 6-digit passwords', type: 'error' });
        }
        
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/user/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ currentPassword, newPassword })
            });
            const result = await res.json();
            setMsg({ text: result.message, type: result.success ? 'success' : 'error' });
            if (result.success) {
                setCurrentPwd(['','','','','','']);
                setNewPwd(['','','','','','']);
            }
        } catch (err) { setMsg({ text: 'Network Error', type: 'error' }); }
    };

    return (
        <CardWrapper>
            <PageHeader title="Change Password" subtitle="Update your 6-digit login PIN for security" />
            
            <form onSubmit={handleSubmit} style={{ maxWidth: '400px', background: '#F8FAFC', padding: '24px', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 'bold' }}>Current Password</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        {currentPwd.map((digit, index) => (
                            <input key={index} type="password" inputMode="numeric" maxLength="1" className="form-input" value={digit}
                                onChange={(e) => {
                                    if (!/^[0-9]*$/.test(e.target.value)) return;
                                    const newP = [...currentPwd];
                                    newP[index] = e.target.value;
                                    setCurrentPwd(newP);
                                    if(e.target.value && e.target.nextSibling) e.target.nextSibling.focus();
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Backspace' && !digit && e.target.previousSibling) e.target.previousSibling.focus();
                                }}
                                style={{ flex: 1, minWidth: 0, height: '48px', textAlign: 'center', fontSize: '24px', fontWeight: 'bold', padding: 0 }}
                            />
                        ))}
                    </div>
                </div>
                
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 'bold' }}>New Password</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        {newPwd.map((digit, index) => (
                            <input key={index} type="password" inputMode="numeric" maxLength="1" className="form-input" value={digit}
                                onChange={(e) => {
                                    if (!/^[0-9]*$/.test(e.target.value)) return;
                                    const newP = [...newPwd];
                                    newP[index] = e.target.value;
                                    setNewPwd(newP);
                                    if(e.target.value && e.target.nextSibling) e.target.nextSibling.focus();
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Backspace' && !digit && e.target.previousSibling) e.target.previousSibling.focus();
                                }}
                                style={{ flex: 1, minWidth: 0, height: '48px', textAlign: 'center', fontSize: '24px', fontWeight: 'bold', padding: 0 }}
                            />
                        ))}
                    </div>
                </div>
                
                {msg.text && (
                    <div style={{ marginBottom: '16px', padding: '12px', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', background: msg.type==='success'?'#D1FAE5':'#FEE2E2', color: msg.type==='success'?'#059669':'#E11D48' }}>
                        {msg.text}
                    </div>
                )}
                
                <button type="submit" style={{ width: '100%', padding: '14px', background: '#0F172A', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                    Update Password
                </button>
            </form>
        </CardWrapper>
    );
  };

  const DynamicView = ({ renderFn }) => {
    return renderFn();
  };

  const renderContent = () => {
    let renderFn;
    switch(activeMenu) {
       case 'Dashboard': renderFn = renderDashboard; break;
       case 'Profile':
       case 'Bank Settings':
       case 'KYC': renderFn = renderProfile; break;
       case 'My Network': renderFn = renderNetwork; break;
       case 'Binary Genealogy': renderFn = renderBinaryTree; break;
       case 'Wallets': 
       case 'Passbook': renderFn = renderWallets; break;
       case 'Withdraw / P2P': renderFn = renderWithdrawal; break;
       case 'Manage Users':
       case 'Member Management': renderFn = renderManageUsers; break;
       case 'Payout Approvals':
       case 'Payouts & TDS': renderFn = renderPayoutApprovals; break;
       case 'Notifications': renderFn = renderNotifications; break;
       case 'Non-Working Cashback': renderFn = renderRoyaltyAndCashback; break;
       case 'Add Member': renderFn = renderAddMember; break;
       case 'Fund Requests': renderFn = renderFundRequests; break;
       case 'AutoPool Settings':
       case 'Pool Distributions': renderFn = renderAutoPoolSettings; break;
       case 'KYC Approvals': renderFn = renderKYCApprovals; break;
       case 'Support Tickets': renderFn = renderSupportTickets; break;
       case 'System Settings': renderFn = renderSystemSettings; break;
       case 'Royalty Pools': renderFn = renderRoyaltyAndCashback; break;
       case 'Rebirth ID': renderFn = renderRebirths; break;
       case 'Offers': 
       case 'Awards & Rewards': renderFn = renderRewards; break;
       case 'Deposit Funds': renderFn = renderDepositFunds; break;
       case 'Transaction PIN': renderFn = renderTpinSettings; break;
       case 'Support':
       case 'Support Tickets': renderFn = renderSupportTickets; break;
       case 'Change Password': renderFn = renderChangePassword; break;
       case 'Products':
       case 'About Us':
       case 'Terms & Conditions':
       case 'Privacy Policy':
       case 'Return & Refund':
       case 'Disclaimer':
           renderFn = () => renderComingSoon(activeMenu); break;
       default: renderFn = renderGeneric; break;
    }
    return <DynamicView key={activeMenu} renderFn={renderFn} />;
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
