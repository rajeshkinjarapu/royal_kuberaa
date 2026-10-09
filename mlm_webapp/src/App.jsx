import React, { useState, useEffect, useRef } from 'react';
import './index.css';
import * as htmlToImage from 'html-to-image';

// Intercept fetch calls to route /api requests to Vercel (which proxies to VPS)
const originalFetch = window.fetch;
window.fetch = async function() {
  let [resource, config] = arguments;
  const baseURL = 'https://royal-kuberaa.vercel.app';
  if (typeof resource === 'string' && resource.startsWith('/api')) {
    resource = baseURL + resource;
  }
  return originalFetch(resource, config);
};

let dialogController = null;

window.customAlert = (message) => {
    if (dialogController) {
        dialogController.show(message, 'alert');
    } else {
        window.alert(message);
    }
};

window.customConfirm = (message) => {
    return new Promise((resolve) => {
        if (dialogController) {
            dialogController.show(message, 'confirm', resolve);
        } else {
            resolve(window.confirm(message));
        }
    });
};

const PinInput = ({ name, length = 6 }) => {
  const [pin, setPin] = useState(Array(length).fill(''));
  const inputRefs = useRef([]);

  const handleChange = (index, value) => {
    if (!/^[0-9]*$/.test(value)) return;
    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);
    if (value !== '' && index < length - 1) {
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
    const paste = e.clipboardData.getData('text').slice(0, length).replace(/[^0-9]/g, '');
    if (paste) {
      const newPin = [...pin];
      paste.split('').forEach((char, i) => {
        newPin[i] = char;
      });
      setPin(newPin);
      const nextIndex = Math.min(paste.length, length - 1);
      inputRefs.current[nextIndex]?.focus();
    }
  };

  return (
    <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between', width: '100%', maxWidth: `${length * 60}px` }}>
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
          style={{ flex: 1, minWidth: '40px', height: '48px', textAlign: 'center', fontSize: '24px', padding: '0', fontWeight: '800' }}
        />
      ))}
    </div>
  );
};

function App() {
  const [dialogState, setDialogState] = useState({ isOpen: false, message: '', type: 'alert', resolvePromise: null });

  useEffect(() => {
      dialogController = {
          show: (message, type, resolvePromise = null) => {
              setDialogState({ isOpen: true, message, type, resolvePromise });
          },
          hide: () => setDialogState(prev => ({ ...prev, isOpen: false }))
      };
  }, []);

  const handleDialogConfirm = () => {
      if (dialogState.resolvePromise) dialogState.resolvePromise(true);
      if (dialogController) dialogController.hide();
  };

  const handleDialogCancel = () => {
      if (dialogState.resolvePromise) dialogState.resolvePromise(false);
      if (dialogController) dialogController.hide();
  };

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


  const menuItems = [
    { header: 'MAIN MENU' },
    { name: 'Dashboard', icon: '📊' },
    { name: 'ID Activation', icon: '⚡' },
    { name: 'Non-Working Cashback', icon: '💸' },
    { name: 'Royalty Pools', icon: '👑' },
    { name: 'Rebirth ID', icon: '♾️' },
    { name: 'Products', icon: '🛍️' },
    { header: 'FINANCE' },
    { name: 'Deposit Funds', icon: '💳' },
    { name: 'Passbook', icon: '📒' },
    { name: 'Bank Withdrawal', icon: '🏦' },
    { name: 'P2P Transfer', icon: '💸' },
    { header: 'ACCOUNT' },
    { name: 'My Network', icon: '👥' },
    { name: 'Add Member', icon: '➕' },
    { name: 'Team Network', icon: '🕸️' },
    { name: 'Profile', icon: '👤' },
    { name: 'KYC', icon: '🛡️' },
    { name: 'Payment Settings', icon: '🏦' },
    { name: 'Transaction PIN', icon: '🔒' },
    { name: 'Change Password', icon: '🔑' },
    { name: 'Support', icon: '🎧' },
    { name: 'Download App', icon: '📱' },
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
    { name: 'Fund Management', icon: '💰' },
    { name: 'Fund Requests', icon: '💳' },
    { name: 'Payouts & TDS', icon: '💸' },
    { name: 'Pool Distributions', icon: '🔄' },
    { name: 'KYC Approvals', icon: '📄' },
    { name: 'Products', icon: '🛍️' },
    { name: 'Support Tickets', icon: '🎧' },
    { name: 'System Settings', icon: '⚙️' },
    { name: 'App Upload', icon: '📱' },
    { name: 'System Reports', icon: '📊' },
  ];

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    const memberId = e.target.memberId.value;
    const password = e.target.password.value;
    
    // Handled purely via backend authentication

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
      // Removed demo bypass, using purely API authentication
      setErrorMsg('Network error or server down. Please try again.');
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
        setRegisteredDetails({ memberId: result.user.memberId, name, mobile, password });
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
                      <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Name</span>
                      <span style={{ fontSize: '15px', color: '#1e1b4b', fontWeight: '700' }}>{registeredDetails.name}</span>
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
            <img src="https://img.freepik.com/free-vector/mobile-login-concept-illustration_114360-83.jpg" alt="Welcome" />
          </div>
          <div className="login-content">
            <div className="login-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', width: '100%', marginBottom: '24px' }}>
              <img src="/royal-kuberaa-logo.jpg" alt="Royal Kuberaa" className="login-logo" style={{ display: 'block', margin: '0 auto 12px auto' }} />
              {authView === 'login' && (
                <>
                  <h1 className="login-brand-name">Royal Kuberaa</h1>
                  <p style={{ fontSize: '13px', color: '#9ca3af', marginTop: '4px' }}>Welcome Back! Login to continue</p>
                </>
              )}
              {authView === 'register' && <h2 className="login-title" style={{ marginTop: '12px' }}>Create Account</h2>}
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
                  <input type="text" name="name" className="form-input" placeholder="Enter Full Name" required onInput={(e) => e.target.value = e.target.value.toUpperCase()} style={{ textTransform: 'uppercase' }} />
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

  const PageHeader = ({ title, subtitle }) => {
    if (!subtitle) return null;
    return (
      <div style={{ marginBottom: '16px' }}>
        <p style={{ color: '#64748B', fontSize: '14px' }}>{subtitle}</p>
      </div>
    );
  };

  const CardWrapper = ({ children }) => (
    <div className="content-card-wrapper" style={{ maxWidth: '100%', overflow: 'hidden' }}>
      {children}
    </div>
  );

  const Table = ({ headers, children }) => (
    <div style={{ overflowX: 'auto', maxWidth: '100%' }}>
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
        { id: 1, title: 'Total Members', amount: dashboardData?.networkStats?.totalTeamSize || 0, icon: '👥', bg: '#f0f9ff', iconBg: '#bae6fd', color: '#0369a1', isCount: true },
        { id: 2, title: 'Roll-up Profit', amount: dashboardData?.totalRollupProfit || 0, icon: '👑', bg: '#fef3c7', iconBg: '#fde68a', color: '#b45309' },
        { id: 3, title: 'Rebirth IDs', amount: dashboardData?.totalRebirths || 0, icon: '♻️', bg: '#ecfdf5', iconBg: '#d1fae5', color: '#047857', isCount: true },
        { id: 4, title: 'Today Joinings', amount: dashboardData?.todayJoinings || 0, icon: '📈', bg: '#f5f3ff', iconBg: '#ddd6fe', color: '#6d28d9', isCount: true },
      ]
      : [
        { id: 1, title: 'Main Wallet', amount: dashboardData?.mainWallet || 0, icon: '💳', bg: '#f0fdf4', iconBg: '#bbf7d0', color: '#15803d' },
        { id: 10, title: 'Direct Income', amount: dashboardData?.directIncome || 0, icon: '🎯', bg: '#fff7ed', iconBg: '#ffedd5', color: '#c2410c' },
        { id: 11, title: 'Team Level Income', amount: dashboardData?.levelIncome || 0, icon: '📈', bg: '#ecfdf5', iconBg: '#d1fae5', color: '#047857' },
        { id: 2, title: 'Rebirth Wallet', amount: dashboardData?.rebirthWallet || 0, icon: '🌱', bg: '#fdf4ff', iconBg: '#f5d0fe', color: '#86198f' },
        { id: 3, title: 'Total Earnings', amount: dashboardData?.totalEarnings || 0, icon: '🚀', bg: '#f0f9ff', iconBg: '#bae6fd', color: '#0369a1' },
        { id: 4, title: 'Total Team (10 Levels)', amount: dashboardData?.networkStats?.totalTeamSize || 0, icon: '👥', bg: '#eff6ff', iconBg: '#bfdbfe', color: '#1d4ed8', isCount: true },
        { id: 5, title: 'Direct Referrals', amount: dashboardData?.networkStats?.directReferrals || 0, icon: '🎯', bg: '#fef2f2', iconBg: '#fecaca', color: '#991b1b', isCount: true }
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
          <div style={{ background: '#FEF2F2', padding: '12px 16px', borderRadius: '12px', border: '1px solid #FCA5A5', marginBottom: '16px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px', boxShadow: '0 2px 4px rgba(239, 68, 68, 0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '24px' }}>⚠️</span>
                <div>
                   <h3 style={{ margin: '0 0 2px 0', color: '#B91C1C', fontSize: '15px', fontWeight: '700' }}>Account Not Activated</h3>
                   <span style={{ fontSize: '13px', color: '#991B1B', fontWeight: '600' }}>Wallet: ₹{(dashboardData?.mainWallet || 0).toLocaleString()}</span>
                </div>
            </div>
            <button 
               onClick={async () => {
                  const balance = dashboardData?.mainWallet || 0;
                  if (balance < 1500) {
                      setActiveMenu('Deposit Funds');
                      if(window.innerWidth <= 768) setIsMobileMenuOpen(false);
                      return;
                  }
                  try {
                     const token = localStorage.getItem('token');
                     const res = await fetch('/api/user/activate', { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }});
                     const result = await res.json();
                     window.customAlert(result.message);
                     if (result.success) {
                         const ud = {...userData, isActive: true};
                         setUserData(ud);
                         window.location.reload();
                     }
                  } catch(e) { window.customAlert('Activation failed'); }
               }}
               style={{ padding: '8px 16px', background: 'linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)', color: '#FFF', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', border: 'none', transition: 'all 0.2s', fontSize: '13px', boxShadow: '0 2px 8px rgba(239, 68, 68, 0.2)', whiteSpace: 'nowrap' }}
            >
               {(dashboardData?.mainWallet || 0) < 1500 ? 'Deposit to Activate' : 'Activate (₹1500)'}
            </button>
          </div>
        )}
        <div className="cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
          {cards.map(card => (
            <div key={card.id} className="vibrant-card metric-card" style={{ background: card.bg, borderRadius: '12px', padding: '16px', border: 'none', boxShadow: '0 4px 10px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                 <div className="card-icon" style={{ width: '32px', height: '32px', background: card.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', fontSize: '16px' }}>{card.icon}</div>
              </div>
              <div className="card-content">
                <div className="card-title" style={{ color: '#64748B', fontWeight: '700', fontSize: '11px', letterSpacing: '0.5px', marginBottom: '4px' }}>{card.title.toUpperCase()}</div>
                <div className="card-amount" style={{ color: '#0F172A', fontSize: '20px', fontWeight: '900', letterSpacing: '-0.5px' }}>{userRole==='admin'&&card.id===1?'': (card.isCount ? '' : '₹ ')} {card.amount.toLocaleString()}</div>
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
                     window.customAlert(result.message);
                  } catch(e) { window.customAlert('Failed to trigger cron'); }
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
        fetchProfile();
    }, [activeMenu]);

    const handleKycSubmit = async (e) => {
        e.preventDefault();
        if (!kycForm.qrFile) return window.customAlert('Please select an image file');
        
        try {
            const formData = new FormData();
            formData.append('qrCode', kycForm.qrFile);
            
            const token = localStorage.getItem('token');
            const res = await fetch('/api/user/upload-qr', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            const result = await res.json();
            window.customAlert(result.message);
            if(result.success) {
                setProfileData({ ...profileData, paymentQrCode: result.qrUrl });
                setKycForm({ qrFile: null });
            }
        } catch (err) {
            window.customAlert('Failed to upload QR Code');
        }
    };

    if (!profileData) return <div style={{ padding: '50px', textAlign: 'center' }}>Loading Profile...</div>;

    const isReadOnly = profileData.kycStatus === 'Approved' || profileData.kycStatus === 'Submitted';

    const isPaymentSettings = activeMenu === 'Payment Settings';

    return (
        <CardWrapper>
          <PageHeader 
              title={isPaymentSettings ? "Payment Settings" : "My Profile & KYC"} 
              subtitle={isPaymentSettings ? "Manage your withdrawal methods" : "Manage your personal details and verify identity"} 
          />
          
          {!isPaymentSettings && (
             <div style={{ marginBottom: '24px' }}>
               <h3 style={{ marginBottom: '16px' }}>Personal Details</h3>
               <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: '12px' }}>
                 <p><strong>Name:</strong> {profileData.name}</p>
                 <p><strong>Member ID:</strong> {profileData.memberId}</p>
                 <p><strong>Mobile:</strong> {profileData.mobile}</p>
                 <p><strong>Join Date:</strong> {new Date(profileData.createdAt).toLocaleDateString()}</p>
                 <p><strong>Sponsor ID:</strong> {profileData.sponsorId || 'None'}</p>
               </div>
             </div>
          )}

          {isPaymentSettings && (
             <>
               <div style={{ marginBottom: '24px' }}>
                  {profileData.paymentQrCode ? (
                     <div style={{ padding: '16px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                        <p style={{ color: '#10B981', fontWeight: 'bold' }}>✅ QR Code Uploaded</p>
                        <p style={{ fontSize: '13px', marginTop: '4px', color: '#64748B' }}>Your payment QR code is active for receiving payouts.</p>
                     </div>
                  ) : (
                     <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                        <p style={{ color: '#EF4444', fontWeight: 'bold' }}>❌ No QR Code Uploaded</p>
                        <p style={{ fontSize: '13px', marginTop: '4px', color: '#64748B' }}>Upload your payment QR code to receive your payouts.</p>
                     </div>
                  )}
               </div>

               <h3 style={{ marginTop: '20px', marginBottom: '16px' }}>Payment QR Code (UPI)</h3>
               <form onSubmit={handleKycSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '400px' }}>
                  
                  {profileData.paymentQrCode && (
                    <div style={{ marginBottom: '16px' }}>
                      <img src={profileData.paymentQrCode} alt="Payment QR" style={{ width: '200px', borderRadius: '12px', border: '1px solid #E2E8F0' }} />
                    </div>
                  )}

                  <div>
                     <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>Upload New QR Code Image</label>
                     <input type="file" accept="image/*" onChange={e => setKycForm({ qrFile: e.target.files[0] })} required style={{ width: '100%', padding: '10px', background: '#F8FAFC', border: '1px dashed #CBD5E1', borderRadius: '8px' }} />
                  </div>
                  
                  <div style={{ marginTop: '10px' }}>
                     <button type="submit" style={{ padding: '12px 24px', background: '#2563EB', color: '#FFF', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Upload QR Code</button>
                  </div>
               </form>
             </>
          )}
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
        <div className="wallet-cards-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
           <div className="wallet-card" style={{ background: 'linear-gradient(135deg, #0EA5E9 0%, #2563EB 100%)', boxShadow: '0 10px 25px -5px rgba(37,99,235,0.4)' }}>
              <h3 className="wallet-card-title">Main Wallet</h3>
              <h1 className="wallet-card-amount">₹ {(dashboardData?.mainWallet || 0).toLocaleString()}</h1>
              <div className="wallet-card-icon">💳</div>
              <div className="wallet-card-action">
                 <button className="wallet-btn wallet-btn-primary" onClick={() => setActiveMenu('P2P Transfer')} style={{ marginRight: '8px' }}>Transfer (P2P)</button>
                 <button className="wallet-btn wallet-btn-secondary" onClick={() => setActiveMenu('Bank Withdrawal')}>Withdraw</button>
              </div>
           </div>
           <div className="wallet-card" style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)', boxShadow: '0 10px 25px -5px rgba(139,92,246,0.4)' }}>
              <h3 className="wallet-card-title">Rebirth Wallet</h3>
              <h1 className="wallet-card-amount">₹ {(dashboardData?.rebirthWallet || 0).toLocaleString()}</h1>
              <div className="wallet-card-icon">🌱</div>
              <div className="wallet-card-action" style={{ opacity: 0.8, fontSize: '12px', color: '#FFF', fontWeight: '500' }}>
                 Auto-creates ID at ₹1,000
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

  const renderBankWithdrawal = () => {
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

    return (
      <CardWrapper>
        <PageHeader title="Bank Withdrawal" subtitle="Withdraw your available funds to your bank account" />
        <div style={{ padding: '24px', border: '1px solid #E2E8F0', borderRadius: '16px' }}>
           <p style={{ color: '#64748B', marginBottom: '16px' }}>Available for withdrawal: <strong style={{color: '#0F172A'}}>₹ {dashboardData?.mainWallet || 0}</strong></p>
           
           <form onSubmit={handleWithdrawSubmit}>
              <input type="number" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} required placeholder="Enter Amount (Min ₹500)" style={{ width: '100%', padding: '12px', border: '1px solid #CBD5E1', borderRadius: '8px', marginBottom: '16px', fontSize: '16px' }} />
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
      </CardWrapper>
    );
  };

  const renderP2PTransfer = () => {
    const [p2pReceiver, setP2pReceiver] = useState('');
    const [p2pAmount, setP2pAmount] = useState('');
    const [p2pTpin, setP2pTpin] = useState('');
    const [p2pMessage, setP2pMessage] = useState({ text: '', type: '' });
    const [loadingP2p, setLoadingP2p] = useState(false);

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
        <PageHeader title="P2P Transfer" subtitle="Transfer funds to another member instantly" />
        <div style={{ padding: '24px', border: '1px solid #E2E8F0', borderRadius: '16px', background: '#F8FAFC' }}>
           <p style={{ color: '#64748B', marginBottom: '16px' }}>Available Balance: <strong style={{color: '#0F172A'}}>₹ {dashboardData?.mainWallet || 0}</strong> <br/> Note: <span style={{ color: '#EF4444' }}>5% Admin Charge</span> will be deducted.</p>
           
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
      </CardWrapper>
    );
  };

  const renderTpinSettings = () => {
    const [msg, setMsg] = useState({text:'', type:''});
    
    // Check if user has T-PIN yet (dashboardData could have hasTpin flag)
    const hasTpin = dashboardData?.hasTpin;

    const handleTpinSubmit = async (e) => {
       e.preventDefault();
       setMsg({text:'', type:''});
       const currentTpin = hasTpin ? e.target.elements.currentTpin.value : '';
       const newTpin = e.target.elements.newTpin.value;
       const confirmTpin = e.target.elements.confirmTpin.value;

       if(newTpin.length !== 4) {
           return setMsg({text:'T-PIN must be exactly 4 digits.', type:'error'});
       }
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
               e.target.reset(); // clear form
               if(setDashboardData) setDashboardData(prev => ({...prev, hasTpin: true}));
               setTimeout(() => window.location.reload(), 1500); // refresh to clear pin inputs fully
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
        <div style={{ maxWidth: '400px', background: '#FFF', padding: '30px', borderRadius: '24px', border: '1px solid #E2E8F0', margin: '0 auto', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
            <p style={{ color: '#475569', marginBottom: '24px', lineHeight: '1.6', fontSize: '14px', textAlign: 'center' }}>
               A Transaction PIN (T-PIN) is required to withdraw funds or send money via P2P. Please <strong>{hasTpin ? 'update' : 'create'}</strong> your 4-digit T-PIN below.
            </p>
            <form onSubmit={handleTpinSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
               {hasTpin && (
                  <div>
                     <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '10px', color: '#1E293B', textAlign: 'center' }}>Current T-PIN</label>
                     <div style={{ display: 'flex', justifyContent: 'center' }}>
                         <PinInput name="currentTpin" length={4} />
                     </div>
                  </div>
               )}
               <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '10px', color: '#1E293B', textAlign: 'center' }}>New T-PIN (4 Digits)</label>
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <PinInput name="newTpin" length={4} />
                  </div>
               </div>
               <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '10px', color: '#1E293B', textAlign: 'center' }}>Confirm New T-PIN</label>
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <PinInput name="confirmTpin" length={4} />
                  </div>
               </div>

               {msg.text && (
                  <div style={{ padding: '12px', borderRadius: '12px', background: msg.type==='success'?'#D1FAE5':'#FEE2E2', color: msg.type==='success'?'#065F46':'#991B1B', fontSize: '14px', fontWeight: 'bold', textAlign: 'center' }}>
                     {msg.text}
                  </div>
               )}

               <button type="submit" style={{ marginTop: '10px', padding: '16px', background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)', color: 'white', border: 'none', borderRadius: '14px', cursor: 'pointer', fontWeight: '800', fontSize: '15px', boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.4)', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform='translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform='translateY(0)'}>
                  {hasTpin ? 'Update T-PIN' : 'Create T-PIN'}
               </button>
            </form>
        </div>
      </CardWrapper>
    );
  };

  const renderManageUsers = () => {
    const [usersList, setUsersList] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingUser, setEditingUser] = useState(null);
    const [editForm, setEditForm] = useState({ name: '', mobile: '', password: '' });
    
    useEffect(() => {
       fetchUsers();
    }, []);

    const fetchUsers = async () => {
       try {
          const token = localStorage.getItem('token');
          const res = await fetch('/api/admin/users', { headers: { 'Authorization': `Bearer ${token}` }});
          const result = await res.json();
          if(result.success) setUsersList(result.data);
       } catch(err) { console.error(err); }
    };

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
             window.customAlert(result.message);
          }
       } catch(err) { console.error(err); }
    };

    const handleEditSave = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/admin/users/${editingUser.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(editForm)
            });
            const result = await res.json();
            if(result.success) {
                window.customAlert('User details updated successfully');
                setEditingUser(null);
                fetchUsers();
            } else {
                window.customAlert(result.message);
            }
                } catch(err) { console.error(err); }
    };

    const handleDeleteUser = async (memberId) => {
        if (!await window.customConfirm(`Are you sure you want to permanently delete user ${memberId}? This action cannot be undone.`)) return;
        
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/admin/users/${memberId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await res.json();
            if(result.success) {
                window.customAlert('User deleted successfully');
                fetchUsers();
            } else {
                window.customAlert(result.message);
            }
        } catch(err) { console.error(err); }
    };

    const filteredUsers = usersList.filter(u => 
        u.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (u.mobile && u.mobile.includes(searchTerm))
    );

    return (
      <CardWrapper>
        <PageHeader title="Member Management" subtitle="Search, view and edit network members" />
        
        <div style={{ marginBottom: '20px' }}>
            <input 
                type="text" 
                placeholder="Search by ID, Name or Mobile Number..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '100%', padding: '12px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '14px' }}
            />
        </div>

        <Table headers={['ID', 'Name', 'Mobile', 'Wallet', 'Status', 'Action']}>
          {filteredUsers.length === 0 && <tr><td colSpan="6" style={{ padding: '16px', textAlign: 'center' }}>No users found.</td></tr>}
          {filteredUsers.map(user => (
            <tr key={user.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
              <td style={{ padding: '15px', fontWeight: 'bold' }}>{user.id}</td>
              <td style={{ padding: '15px', fontWeight: 'bold' }}>{user.name}</td>
              <td style={{ padding: '15px' }}>{user.mobile || 'N/A'}</td>
              <td style={{ padding: '15px', color: '#10B981', fontWeight: 'bold' }}>₹{user.wallet.toLocaleString()}</td>
              <td style={{ padding: '15px' }}>
                <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', background: user.status==='Active'?'rgba(16,185,129,0.1)':'rgba(239,68,68,0.1)', color: user.status==='Active'?'#10B981':'#EF4444' }}>{user.status}</span>
              </td>
              <td style={{ padding: '15px', display: 'flex', gap: '8px' }}>
                 <button onClick={() => { setEditingUser(user); setEditForm({ name: user.name, mobile: user.mobile || '', password: '' }); }} style={{ padding: '6px 12px', background: '#3B82F6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Edit</button>
                 <button onClick={() => handleToggleBlock(user.id)} style={{ padding: '6px 12px', background: user.status === 'Active' ? '#F59E0B' : '#10B981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                    {user.status === 'Active' ? 'Block' : 'Unblock'}
                 </button>
                 <button onClick={() => handleDeleteUser(user.id)} style={{ padding: '6px 12px', background: '#EF4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Delete</button>
              </td>
            </tr>
          ))}
        </Table>

        {editingUser && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                <div style={{ background: '#FFF', padding: '24px', borderRadius: '16px', width: '90%', maxWidth: '400px' }}>
                    <h3 style={{ marginBottom: '16px', color: '#0F172A' }}>Edit User: {editingUser.id}</h3>
                    <form onSubmit={handleEditSave}>
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 'bold' }}>Name</label>
                            <input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1' }} required />
                        </div>
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 'bold' }}>Mobile Number</label>
                            <input type="text" value={editForm.mobile} onChange={e => setEditForm({...editForm, mobile: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1' }} required />
                        </div>
                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', fontWeight: 'bold' }}>New Password (Leave blank to keep current)</label>
                            <input type="text" placeholder="Enter new password" value={editForm.password} onChange={e => setEditForm({...editForm, password: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1' }} />
                        </div>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button type="submit" style={{ flex: 1, padding: '12px', background: '#0F172A', color: '#FFF', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Save Changes</button>
                            <button type="button" onClick={() => setEditingUser(null)} style={{ flex: 1, padding: '12px', background: '#F1F5F9', color: '#475569', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Cancel</button>
                        </div>
                    </form>
                </div>
            </div>
        )}
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
             if (action === 'delete') {
                 setWithdrawals(prev => prev.filter(w => w._id !== id));
             } else {
                 setWithdrawals(prev => prev.map(w => w._id === id ? { ...w, status: action === 'approve' ? 'Approved' : 'Rejected' } : w));
             }
          } else {
             window.customAlert(result.message);
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
                 <button onClick={() => { if(window.confirm('Delete this record?')) handleAction(req._id, 'delete') }} style={{ padding: '6px 12px', background: '#64748B', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Delete</button>
              </td>
            </tr>
          ))}
        </Table>
      </CardWrapper>
    );
  };

  const renderAppUpload = () => {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    
    const handleFileChange = (e) => {
      if (e.target.files && e.target.files.length > 0) {
        setFile(e.target.files[0]);
      }
    };

    const handleUpload = async () => {
      if (!file) return;
      setUploading(true);
      const formData = new FormData();
      formData.append('appFile', file);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/admin/upload-app', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });
        const result = await res.json();
        if (result.success) {
          showDialog('alert', 'Success', 'App APK uploaded successfully. Members can now download it.');
          setFile(null);
        } else {
          showDialog('alert', 'Error', result.message || 'Upload failed');
        }
      } catch (err) {
        showDialog('alert', 'Error', 'Network error during upload');
      }
      setUploading(false);
    };

    return (
      <CardWrapper>
        <PageHeader title="App Upload" subtitle="Upload the latest Android APK for members to download." />
        <div style={{ padding: '40px', background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📱</div>
            <h3 style={{ color: '#0f172a', marginBottom: '8px' }}>Upload Latest APK</h3>
            <p style={{ color: '#64748b', fontSize: '14px' }}>Select the .apk file from your device and upload it. The previous app will be overwritten.</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <input 
              type="file" 
              accept=".apk"
              onChange={handleFileChange}
              style={{ padding: '12px', border: '2px dashed #cbd5e1', borderRadius: '8px', width: '100%', cursor: 'pointer' }}
            />
            {file && (
              <div style={{ padding: '12px', background: '#f1f5f9', borderRadius: '8px', fontSize: '14px', color: '#334155' }}>
                Selected: <strong>{file.name}</strong> ({(file.size / (1024 * 1024)).toFixed(2)} MB)
              </div>
            )}
            <button 
              onClick={handleUpload} 
              disabled={!file || uploading}
              style={{
                background: file && !uploading ? '#2563eb' : '#94a3b8',
                color: 'white',
                border: 'none',
                padding: '14px',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: file && !uploading ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s',
                marginTop: '8px'
              }}
            >
              {uploading ? 'Uploading...' : 'Upload App'}
            </button>
          </div>
        </div>
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

  const renderNotifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/user/notifications', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await res.json();
        if (result.success && Array.isArray(result.data)) {
          setNotifications(result.data);
        }
      } catch (err) {
        console.error("Failed to load notifications:", err);
      }
      setLoading(false);
    };

    useEffect(() => {
      if (activeMenu === 'Notifications') {
        fetchNotifications();
      }
    }, [activeMenu]);

    return (
      <div style={{ maxWidth: '850px', margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
          <button 
            onClick={fetchNotifications} 
            disabled={loading}
            style={{ padding: '8px 16px', background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', color: '#334155' }}
          >
            {loading ? 'Refreshing...' : '🔄 Refresh'}
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', background: '#FFF', borderRadius: '16px', border: '1px solid #E2E8F0', color: '#64748B' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>⏳</div>
            Loading your live notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', background: '#F8FAFC', borderRadius: '16px', border: '2px dashed #CBD5E1' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
            <h3 style={{ color: '#0F172A', marginBottom: '8px' }}>No Notifications Yet</h3>
            <p style={{ color: '#64748B', margin: 0 }}>You're all caught up! New transaction and account alerts will appear here in real time.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {notifications.map(n => (
              <div 
                key={n.id} 
                style={{ 
                  display: 'flex', 
                  gap: '16px', 
                  padding: '18px', 
                  background: '#FFFFFF', 
                  borderRadius: '16px', 
                  alignItems: 'flex-start', 
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)', 
                  border: '1px solid #F1F5F9', 
                  transition: 'transform 0.15s, box-shadow 0.15s' 
                }}
              >
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: `${n.color}18`, color: n.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0 }}>
                  {n.icon}
                </div>
                <div style={{ flex: 1, marginTop: '2px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <h4 style={{ margin: 0, color: '#0F172A', fontSize: '15px', fontWeight: '700' }}>{n.title}</h4>
                    <span style={{ color: '#94A3B8', fontSize: '11px', fontWeight: '600', background: '#F8FAFC', padding: '2px 8px', borderRadius: '10px' }}>
                      {n.time}
                    </span>
                  </div>
                  <p style={{ margin: 0, color: '#475569', fontSize: '13px', lineHeight: '1.5' }}>{n.desc}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderFundManagement = () => {
    const [stats, setStats] = useState(null);
    const [loadingStats, setLoadingStats] = useState(true);
    const [memberId, setMemberId] = useState('');
    const [verifiedMember, setVerifiedMember] = useState(null);
    const [checkingMember, setCheckingMember] = useState(false);
    const [amount, setAmount] = useState('');
    const [actionType, setActionType] = useState('credit');
    const [walletType, setWalletType] = useState('main');
    const [remark, setRemark] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    const fetchStats = async () => {
      setLoadingStats(true);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/admin/fund-stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await res.json();
        if (result.success) setStats(result.data);
      } catch (err) {
        console.error("Error loading fund stats:", err);
      }
      setLoadingStats(false);
    };

    useEffect(() => {
      if (activeMenu === 'Fund Management') {
        fetchStats();
      }
    }, [activeMenu]);

    const handleCheckMember = async (id) => {
      const trimmed = id.trim();
      if (trimmed.length >= 3) {
        setCheckingMember(true);
        try {
          const res = await fetch(`/api/sponsor/${trimmed}`);
          const result = await res.json();
          if (result.success) {
            setVerifiedMember({ id: trimmed, name: result.name });
          } else {
            setVerifiedMember(null);
          }
        } catch (e) {
          setVerifiedMember(null);
        }
        setCheckingMember(false);
      } else {
        setVerifiedMember(null);
      }
    };

    const handleFundSubmit = async (e) => {
      e.preventDefault();
      if (!amount || Number(amount) <= 0) {
        setMessage({ text: 'Please enter a valid amount', type: 'error' });
        return;
      }

      setSubmitting(true);
      setMessage({ text: '', type: '' });

      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/admin/fund-action', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            memberId: memberId.trim(),
            amount: Number(amount),
            actionType,
            walletType,
            remark
          })
        });

        const result = await res.json();
        setMessage({
          text: result.message,
          type: result.success ? 'success' : 'error'
        });

        if (result.success) {
          setAmount('');
          setRemark('');
          fetchStats();
        }
      } catch (err) {
        setMessage({ text: 'Error connecting to server', type: 'error' });
      }
      setSubmitting(false);
    };

    return (
      <CardWrapper>
        <PageHeader 
          title="Fund Management & Platform Liability" 
          subtitle="Real-time system balances and manual credit / debit controls for member wallets" 
        />

        {/* 1. Live Liability & Balance Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '28px' }}>
          <div style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', color: '#FFF', padding: '20px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(15,23,42,0.15)' }}>
            <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total System Liability</span>
            <div style={{ fontSize: '24px', fontWeight: '900', marginTop: '6px', color: '#38BDF8' }}>
              ₹ {(stats?.totalSystemLiability || 0).toLocaleString()}
            </div>
            <span style={{ fontSize: '11px', color: '#CBD5E1', marginTop: '4px', display: 'block' }}>Main + Rebirth Wallets combined</span>
          </div>

          <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '20px', borderRadius: '16px' }}>
            <span style={{ fontSize: '11px', color: '#166534', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Main Wallets</span>
            <div style={{ fontSize: '24px', fontWeight: '900', marginTop: '6px', color: '#15803D' }}>
              ₹ {(stats?.totalMainWallet || 0).toLocaleString()}
            </div>
            <span style={{ fontSize: '11px', color: '#16A34A', marginTop: '4px', display: 'block' }}>Available for Payouts / P2P</span>
          </div>

          <div style={{ background: '#FDF4FF', border: '1px solid #F5D0FE', padding: '20px', borderRadius: '16px' }}>
            <span style={{ fontSize: '11px', color: '#86198F', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Rebirth Engine Wallet</span>
            <div style={{ fontSize: '24px', fontWeight: '900', marginTop: '6px', color: '#A21CAF' }}>
              ₹ {(stats?.totalRebirthWallet || 0).toLocaleString()}
            </div>
            <span style={{ fontSize: '11px', color: '#C026D3', marginTop: '4px', display: 'block' }}>Locked for auto ID generation</span>
          </div>

          <div style={{ background: '#FFF1F2', border: '1px solid #FECDD3', padding: '20px', borderRadius: '16px' }}>
            <span style={{ fontSize: '11px', color: '#9F1239', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pending Payouts Queue</span>
            <div style={{ fontSize: '24px', fontWeight: '900', marginTop: '6px', color: '#BE123C' }}>
              ₹ {(stats?.pendingWithdrawalsAmount || 0).toLocaleString()}
            </div>
            <span style={{ fontSize: '11px', color: '#E11D48', marginTop: '4px', display: 'block' }}>{stats?.pendingWithdrawalsCount || 0} requests awaiting transfer</span>
          </div>

          <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '20px', borderRadius: '16px' }}>
            <span style={{ fontSize: '11px', color: '#1E40AF', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pending UPI Deposits</span>
            <div style={{ fontSize: '24px', fontWeight: '900', marginTop: '6px', color: '#2563EB' }}>
              ₹ {(stats?.pendingFundRequestsAmount || 0).toLocaleString()}
            </div>
            <span style={{ fontSize: '11px', color: '#3B82F6', marginTop: '4px', display: 'block' }}>{stats?.pendingFundRequestsCount || 0} UTR verification requests</span>
          </div>
        </div>

        {/* 2. Manual Action Form */}
        <div style={{ background: '#FFFFFF', padding: '28px', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', marginBottom: '32px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>⚡</span> Manual Member Wallet Credit / Debit
          </h3>
          <p style={{ color: '#64748B', fontSize: '13px', marginBottom: '24px' }}>
            Directly adjust any member's wallet balance. System automatically logs passbook records and prevents negative balance debits.
          </p>

          <form onSubmit={handleFundSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginBottom: '20px' }}>
              {/* Member ID Input */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px', color: '#334155' }}>Member ID / Mobile Number</label>
                <input 
                  type="text" 
                  value={memberId} 
                  onChange={e => {
                    setMemberId(e.target.value);
                    handleCheckMember(e.target.value);
                  }} 
                  placeholder="e.g. RK10001 or rajeshkinjarapu" 
                  required
                  style={{ width: '100%', padding: '12px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '14px', textTransform: 'uppercase' }} 
                />
                {checkingMember ? (
                  <span style={{ fontSize: '12px', color: '#64748B', marginTop: '4px', display: 'block' }}>Verifying ID...</span>
                ) : verifiedMember ? (
                  <span style={{ fontSize: '12px', color: '#16A34A', fontWeight: 'bold', marginTop: '4px', display: 'block' }}>
                    ✓ Member Found: {verifiedMember.name}
                  </span>
                ) : memberId.length >= 3 ? (
                  <span style={{ fontSize: '12px', color: '#DC2626', fontWeight: 'bold', marginTop: '4px', display: 'block' }}>
                    ✕ Member not found in system
                  </span>
                ) : null}
              </div>

              {/* Action Type */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px', color: '#334155' }}>Action Type</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button 
                    type="button" 
                    onClick={() => setActionType('credit')}
                    style={{ padding: '11px', borderRadius: '8px', border: actionType === 'credit' ? '2px solid #10B981' : '1px solid #CBD5E1', background: actionType === 'credit' ? '#ECFDF5' : '#FFF', color: actionType === 'credit' ? '#065F46' : '#64748B', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
                  >
                    🟢 Credit (Add)
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setActionType('debit')}
                    style={{ padding: '11px', borderRadius: '8px', border: actionType === 'debit' ? '2px solid #EF4444' : '1px solid #CBD5E1', background: actionType === 'debit' ? '#FEF2F2' : '#FFF', color: actionType === 'debit' ? '#991B1B' : '#64748B', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
                  >
                    🔴 Debit (Deduct)
                  </button>
                </div>
              </div>

              {/* Wallet Type */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px', color: '#334155' }}>Target Wallet</label>
                <select 
                  value={walletType} 
                  onChange={e => setWalletType(e.target.value)}
                  style={{ width: '100%', padding: '12px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '14px', background: '#FFF' }}
                >
                  <option value="main">💳 Main Wallet (Payouts & Transfers)</option>
                  <option value="rebirth">🌱 Rebirth Wallet (ID Generation)</option>
                </select>
              </div>

              {/* Amount */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px', color: '#334155' }}>Amount (₹)</label>
                <input 
                  type="number" 
                  value={amount} 
                  onChange={e => setAmount(e.target.value)} 
                  placeholder="e.g. 1000" 
                  required
                  min="1"
                  style={{ width: '100%', padding: '12px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '14px' }} 
                />
              </div>
            </div>

            {/* Remark */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px', color: '#334155' }}>Reason / Passbook Remark</label>
              <input 
                type="text" 
                value={remark} 
                onChange={e => setRemark(e.target.value)} 
                placeholder="e.g. Cash deposit approved at head office / Special bonus" 
                style={{ width: '100%', padding: '12px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '14px' }} 
              />
            </div>

            {message.text && (
              <div style={{ marginBottom: '20px', padding: '14px', borderRadius: '10px', background: message.type === 'success' ? '#D1FAE5' : '#FEE2E2', color: message.type === 'success' ? '#065F46' : '#991B1B', fontSize: '14px', fontWeight: 'bold' }}>
                {message.text}
              </div>
            )}

            <button 
              type="submit" 
              disabled={submitting}
              style={{ padding: '14px 28px', background: actionType === 'credit' ? '#059669' : '#DC2626', color: '#FFF', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '15px', cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            >
              {submitting ? 'Executing Transaction...' : (actionType === 'credit' ? '➕ Credit Member Wallet' : '➖ Debit Member Wallet')}
            </button>
          </form>
        </div>

        {/* 3. Recent Admin Transactions Log */}
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#0F172A', marginBottom: '14px' }}>
            📋 Recent Admin Manual Transactions Log
          </h3>
          <Table headers={['Date & Time', 'Member ID', 'Type', 'Amount', 'Remark', 'Action']}>
            {(!stats?.recentAdminTransactions || stats.recentAdminTransactions.length === 0) ? (
              <tr><td colSpan="6" style={{ padding: '20px', textAlign: 'center', color: '#64748B' }}>No manual admin transactions executed yet.</td></tr>
            ) : (
              stats.recentAdminTransactions.map(tx => (
                <tr key={tx._id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '14px', fontSize: '13px', color: '#64748B' }}>
                    {new Date(tx.createdAt || tx.date).toLocaleString()}
                  </td>
                  <td style={{ padding: '14px', fontWeight: 'bold', color: '#0EA5E9' }}>
                    {tx.memberId}
                  </td>
                  <td style={{ padding: '14px' }}>
                    <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '800', background: tx.type === 'Credit' ? '#D1FAE5' : '#FEE2E2', color: tx.type === 'Credit' ? '#065F46' : '#991B1B' }}>
                      {tx.type}
                    </span>
                  </td>
                  <td style={{ padding: '14px', fontWeight: 'bold', color: tx.type === 'Credit' ? '#10B981' : '#EF4444' }}>
                    {tx.type === 'Credit' ? '+' : '-'} ₹{tx.amount.toLocaleString()}
                  </td>
                  <td style={{ padding: '14px', fontSize: '13px', color: '#334155' }}>
                    {tx.remark || 'Manual Admin Action'}
                  </td>
                  <td style={{ padding: '14px' }}>
                    <button 
                       onClick={async () => {
                           if(!await window.customConfirm('Are you sure you want to delete this log entry? (Note: This does NOT reverse the wallet balance, it only removes the record).')) return;
                           try {
                               const token = localStorage.getItem('token');
                               const res = await fetch(`/api/admin/transactions/${tx._id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }});
                               const result = await res.json();
                               if(result.success) {
                                   window.customAlert('Log deleted successfully');
                                   fetchStats(); // Refresh the stats to update the table
                               } else {
                                   window.customAlert(result.message);
                               }
                           } catch(err) { console.error(err); }
                       }}
                       style={{ padding: '6px 12px', background: '#EF4444', color: '#FFF', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                    >Delete</button>
                  </td>
                </tr>
              ))
            )}
          </Table>
        </div>
      </CardWrapper>
    );
  };

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
          window.customAlert(result.message);
       } catch(err) { window.customAlert("Action failed"); }
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
    const [companyInfo, setCompanyInfo] = useState({
      companyBankName: 'HDFC Bank',
      companyAccountName: 'Royal Kuberaa Solutions',
      companyAccountNumber: '50200012345678',
      companyIfsc: 'HDFC0001234',
      companyUpiId: 'royalkuberaa@hdfcbank',
      companyQrUrl: ''
    });
    const [copied, setCopied] = useState(false);

    useEffect(() => {
      fetch('/api/settings')
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data) {
            setCompanyInfo({
              companyBankName: data.data.companyBankName || 'HDFC Bank',
              companyAccountName: data.data.companyAccountName || 'Royal Kuberaa Solutions',
              companyAccountNumber: data.data.companyAccountNumber || '50200012345678',
              companyIfsc: data.data.companyIfsc || 'HDFC0001234',
              companyUpiId: data.data.companyUpiId || 'royalkuberaa@hdfcbank',
              companyQrUrl: data.data.companyQrUrl || ''
            });
          }
        })
        .catch(err => console.error("Error loading settings:", err));
    }, []);

    const qrSrc = companyInfo.companyQrUrl || `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(`upi://pay?pa=${companyInfo.companyUpiId}&pn=${companyInfo.companyAccountName}&cu=INR`)}`;

    const copyUpi = () => {
      navigator.clipboard.writeText(companyInfo.companyUpiId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

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

    const handleRazorpaySubmit = async () => {
        if (!amount || Number(amount) < 100) return window.customAlert('Minimum deposit is ₹100');
        
        setLoading(true);
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onerror = () => {
            window.customAlert('Razorpay SDK failed to load. Are you offline?');
            setLoading(false);
        };
        script.onload = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch('/api/payment/create-order', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ amount: Number(amount) })
                });
                const data = await res.json();
                if (!data.success) {
                    setLoading(false);
                    return window.customAlert(data.message);
                }

                const options = {
                    key: 'rzp_test_dummy_key', // Mock API Key
                    amount: data.order.amount,
                    currency: data.order.currency,
                    name: 'Royal Kuberaa',
                    description: 'Wallet Deposit',
                    order_id: data.order.id,
                    handler: async function (response) {
                        try {
                            const verifyRes = await fetch('/api/payment/verify', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                                body: JSON.stringify({
                                    razorpay_order_id: response.razorpay_order_id,
                                    razorpay_payment_id: response.razorpay_payment_id,
                                    razorpay_signature: response.razorpay_signature,
                                    amount: Number(amount)
                                })
                            });
                            const verifyData = await verifyRes.json();
                            window.customAlert(verifyData.message);
                            if (verifyData.success) {
                                window.location.reload();
                            }
                        } catch (err) { window.customAlert('Payment verification failed'); }
                    },
                    theme: { color: '#0F172A' },
                    modal: { ondismiss: () => setLoading(false) }
                };
                const rzp = new window.Razorpay(options);
                rzp.open();
            } catch (err) { 
                window.customAlert('Could not initiate payment'); 
                setLoading(false);
            }
        };
        document.body.appendChild(script);
    };

    return (
      <CardWrapper>
         <PageHeader title="Deposit Funds" subtitle="Add funds to your wallet using UPI or Bank Transfer" />
         <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
            <div style={{ padding: '24px', background: '#F8FAFC', borderRadius: '16px', border: '1px solid #E2E8F0' }}>

               <h4 style={{ marginBottom: '12px', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>📱</span> UPI QR Code Payment
               </h4>
               <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#FFF', padding: '16px', borderRadius: '12px', border: '1px solid #CBD5E1', marginBottom: '12px' }}>
                  <img src={qrSrc} alt="UPI QR Code" style={{ width: '180px', height: '180px', objectFit: 'contain', borderRadius: '8px' }} />
                  <p style={{ fontSize: '11px', color: '#64748B', marginTop: '8px' }}>Scan with PhonePe / GPay / Paytm</p>
               </div>

               <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#EFF6FF', padding: '12px', borderRadius: '8px', border: '1px solid #BFDBFE' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: '#3B82F6', fontWeight: 'bold', display: 'block' }}>UPI ID:</span>
                    <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#1E40AF' }}>{companyInfo.companyUpiId}</span>
                  </div>
                  <button onClick={copyUpi} type="button" style={{ padding: '6px 12px', background: '#2563EB', color: '#FFF', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>
                     {copied ? '✅ Copied!' : '📋 Copy'}
                  </button>
               </div>

               <div style={{ marginTop: '12px' }}>
                  <a 
                    href={`upi://pay?pa=${companyInfo.companyUpiId}&pn=${encodeURIComponent(companyInfo.companyAccountName)}&cu=INR`}
                    style={{ display: 'block', textAlign: 'center', padding: '10px', background: '#059669', color: '#FFF', borderRadius: '8px', fontWeight: 'bold', textDecoration: 'none', fontSize: '13px' }}
                  >
                     ⚡ Pay Directly via UPI App (Mobile Only)
                  </a>
               </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ padding: '24px', background: '#FFF', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
                   <h3 style={{ marginBottom: '16px', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>📝</span> Submit UTR Reference (Manual)
                   </h3>
                   <p style={{ color: '#64748B', fontSize: '14px', marginBottom: '20px' }}>If you paid manually using the QR code or Bank Account details, enter the UTR below.</p>
                   
                   <form onSubmit={handleSubmit}>
                      <div style={{ marginBottom: '16px' }}>
                         <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>Amount Paid (₹)</label>
                         <input type="number" value={amount} onChange={e=>setAmount(e.target.value)} required placeholder="e.g. 1000" style={{ width: '100%', padding: '12px', border: '1px solid #CBD5E1', borderRadius: '8px' }} />
                      </div>
                      <div style={{ marginBottom: '20px' }}>
                         <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>UTR / Reference Number</label>
                         <input type="text" value={utrNumber} onChange={e=>setUtrNumber(e.target.value)} required placeholder="12-digit UPI UTR / Transaction No" style={{ width: '100%', padding: '12px', border: '1px solid #CBD5E1', borderRadius: '8px' }} />
                      </div>
                      
                      {message.text && (
                         <div style={{ marginBottom: '16px', padding: '10px', borderRadius: '8px', background: message.type==='success'?'#D1FAE5':'#FEE2E2', color: message.type==='success'?'#065F46':'#991B1B', fontSize: '14px', fontWeight: 'bold' }}>
                            {message.text}
                         </div>
                      )}

                      <button type="submit" disabled={loading} style={{ width: '100%', padding: '14px', background: '#0F172A', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer' }}>
                         {loading ? 'Submitting...' : 'Submit Manual Request'}
                      </button>
                   </form>
                </div>
            </div>
         </div>
      </CardWrapper>
    );
  };

  const renderAutoPoolSettings = () => {
    const [pools, setPools] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPoolMembers, setSelectedPoolMembers] = useState(null);

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
               <div key={pool._id} style={{ padding: '24px', background: '#FFF', border: '1px solid #E2E8F0', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', cursor: 'pointer', transition: 'transform 0.2s' }} onClick={() => setSelectedPoolMembers(pool)} onMouseEnter={e => e.currentTarget.style.transform='scale(1.02)'} onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}>
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
                     * Click to view list of qualified members.
                  </div>
               </div>
             ))}
           </div>
        )}

        {selectedPoolMembers && (
           <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setSelectedPoolMembers(null)}>
              <div style={{ background: 'white', padding: '24px', borderRadius: '12px', width: '90%', maxWidth: '400px', maxHeight: '80vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
                 <h3 style={{ marginBottom: '16px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>{selectedPoolMembers.poolName} POOL Members</h3>
                 {selectedPoolMembers.membersList && selectedPoolMembers.membersList.length > 0 ? (
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                       {selectedPoolMembers.membersList.map((id, idx) => (
                          <li key={idx} style={{ padding: '10px', borderBottom: '1px solid #f1f5f9', color: '#334155' }}>👤 {id}</li>
                       ))}
                    </ul>
                 ) : (
                    <p style={{ color: '#64748B' }}>No active members in this pool yet.</p>
                 )}
                 <button onClick={() => setSelectedPoolMembers(null)} style={{ marginTop: '20px', width: '100%', padding: '12px', background: '#E2E8F0', color: '#334155', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Close</button>
              </div>
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
            window.customAlert(result.message);
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
          window.customAlert(result.message);
          if(result.success) {
             setSubject('');
             setMessage('');
             const res2 = await fetch('/api/tickets', { headers: { 'Authorization': `Bearer ${token}` }});
             const result2 = await res2.json();
             if(result2.success) setTickets(result2.data);
          }
       } catch(err) { window.customAlert('Error creating ticket'); }
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
          window.customAlert(result.message);
          if(result.success) {
             setTickets(prev => prev.map(t => t._id === id ? { ...t, status: 'Resolved', reply: replyText[id] } : t));
          }
       } catch(err) { window.customAlert('Error sending reply'); }
    };

    return (
      <CardWrapper>
        <PageHeader title={userRole === 'admin' ? "Support Center" : "Help & Support"} subtitle={userRole === 'admin' ? "Resolve member queries" : "Raise a ticket to get help from admin"} />
        
        {userRole === 'member' && (
          <div style={{ background: '#FFF', padding: '30px', borderRadius: '24px', border: '1px solid #E2E8F0', marginBottom: '30px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
            <h3 style={{ marginBottom: '24px', color: '#1E293B', fontSize: '18px' }}>Create New Ticket</h3>
            <form onSubmit={handleCreateTicket} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
               <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px', color: '#334155' }}>Subject</label>
                  <input type="text" value={subject} onChange={e=>setSubject(e.target.value)} required placeholder="E.g., Issue with withdrawal" style={{ width: '100%', padding: '14px', border: '1px solid #CBD5E1', borderRadius: '12px', fontSize: '15px' }} />
               </div>
               <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px', color: '#334155' }}>Message</label>
                  <textarea value={message} onChange={e=>setMessage(e.target.value)} required placeholder="Describe your issue in detail..." rows="4" style={{ width: '100%', padding: '14px', border: '1px solid #CBD5E1', borderRadius: '12px', resize: 'vertical', fontSize: '15px', fontFamily: 'inherit' }}></textarea>
               </div>
               <button type="submit" style={{ padding: '14px 24px', background: 'linear-gradient(135deg, #4F46E5 0%, #3730A3 100%)', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '800', fontSize: '15px', alignSelf: 'flex-start', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform='translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform='translateY(0)'}>
                  Submit Ticket
               </button>
            </form>
          </div>
        )}

        <div style={{ background: '#FFF', padding: '30px', borderRadius: '24px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}>
           <h3 style={{ marginBottom: '24px', color: '#1E293B', fontSize: '18px' }}>{userRole === 'admin' ? 'All Support Tickets' : 'My Ticket History'}</h3>
           {tickets.length === 0 ? (
               <div style={{ padding: '40px', textAlign: 'center', background: '#F8FAFC', borderRadius: '16px', color: '#64748B', fontWeight: '500' }}>
                   No tickets found.
               </div>
           ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                 {tickets.map(t => (
                    <div key={t._id} style={{ border: '1px solid #E2E8F0', borderRadius: '16px', padding: '24px', background: t.status==='Resolved'?'#F8FAFC':'#FFF', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                       <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                             <span style={{ background: t.status==='Open'?'#FEF3C7':'#D1FAE5', color: t.status==='Open'?'#D97706':'#065F46', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '800', letterSpacing: '0.5px' }}>{t.status.toUpperCase()}</span>
                             <span style={{ fontWeight: '800', color: '#0F172A', fontSize: '16px' }}>{t.subject}</span>
                             {userRole === 'admin' && <span style={{ color: '#0EA5E9', fontSize: '13px', fontWeight: 'bold', background: '#E0F2FE', padding: '4px 8px', borderRadius: '6px' }}>ID: {t.memberId}</span>}
                          </div>
                          <div style={{ fontSize: '13px', color: '#94A3B8', fontWeight: '500' }}>{new Date(t.createdAt).toLocaleString()}</div>
                       </div>
                       <p style={{ color: '#475569', fontSize: '15px', margin: '0 0 20px 0', lineHeight: '1.6' }}>{t.message}</p>
                       
                       {t.reply && (
                          <div style={{ background: '#EFF6FF', padding: '16px', borderRadius: '12px', borderLeft: '4px solid #3B82F6' }}>
                             <strong style={{ display: 'block', fontSize: '13px', color: '#1D4ED8', marginBottom: '8px' }}>Admin Reply:</strong>
                             <span style={{ color: '#1E293B', fontSize: '15px', lineHeight: '1.5' }}>{t.reply}</span>
                          </div>
                       )}

                       {userRole === 'admin' && t.status === 'Open' && (
                          <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
                             <input type="text" value={replyText[t._id] || ''} onChange={e=>setReplyText({...replyText, [t._id]: e.target.value})} placeholder="Type your reply to resolve this ticket..." style={{ flex: 1, padding: '12px 16px', border: '1px solid #CBD5E1', borderRadius: '10px', fontSize: '14px' }} />
                             <button onClick={() => handleReply(t._id)} style={{ padding: '12px 24px', background: '#10B981', color: '#FFF', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 6px rgba(16,185,129,0.2)' }}>Send Reply & Resolve</button>
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
    const [settings, setSettings] = useState({ 
      siteName: 'Royal Kuberaa', 
      tdsPercentage: 5, 
      adminChargePercentage: 5, 
      minimumWithdrawal: 500, 
      maintenanceMode: false,
      companyBankName: 'HDFC Bank',
      companyAccountName: 'Royal Kuberaa Solutions',
      companyAccountNumber: '50200012345678',
      companyIfsc: 'HDFC0001234',
      companyUpiId: 'royalkuberaa@hdfcbank',
      companyQrUrl: ''
    });
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
          window.customAlert(result.message);
       } catch(err) { window.customAlert('Failed to save settings'); }
    };

    if(loading) return <div style={{ padding: '50px', textAlign: 'center', color: '#64748B' }}>Loading settings...</div>;

    return (
      <CardWrapper>
        <PageHeader title="System Settings" subtitle="Configure core platform rules, deductions, and company banking" />
        <div style={{ maxWidth: '700px', background: '#FFF', padding: '30px', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <form onSubmit={handleSave}>
             <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#0F172A', marginBottom: '16px', borderBottom: '1px solid #E2E8F0', paddingBottom: '8px' }}>⚙️ General Platform Rules</h3>
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

             <div style={{ marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input type="checkbox" checked={settings.maintenanceMode} onChange={e=>setSettings({...settings, maintenanceMode: e.target.checked})} style={{ width: '20px', height: '20px' }} />
                <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#EF4444' }}>Enable Maintenance Mode (Blocks new logins)</label>
             </div>

             <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#0F172A', marginBottom: '16px', borderBottom: '1px solid #E2E8F0', paddingBottom: '8px' }}>🏦 Company Banking & UPI (Deposit Funds Screen)</h3>
             
             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                 <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>Company Bank Name</label>
                    <input type="text" value={settings.companyBankName || ''} onChange={e=>setSettings({...settings, companyBankName: e.target.value})} placeholder="e.g. HDFC Bank" style={{ width: '100%', padding: '12px', border: '1px solid #CBD5E1', borderRadius: '8px' }} />
                 </div>
                 <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>Account Holder / Entity Name</label>
                    <input type="text" value={settings.companyAccountName || ''} onChange={e=>setSettings({...settings, companyAccountName: e.target.value})} placeholder="e.g. Royal Kuberaa Solutions" style={{ width: '100%', padding: '12px', border: '1px solid #CBD5E1', borderRadius: '8px' }} />
                 </div>
             </div>

             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                 <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>Bank Account Number</label>
                    <input type="text" value={settings.companyAccountNumber || ''} onChange={e=>setSettings({...settings, companyAccountNumber: e.target.value})} placeholder="e.g. 50200012345678" style={{ width: '100%', padding: '12px', border: '1px solid #CBD5E1', borderRadius: '8px' }} />
                 </div>
                 <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>IFSC Code</label>
                    <input type="text" value={settings.companyIfsc || ''} onChange={e=>setSettings({...settings, companyIfsc: e.target.value})} placeholder="e.g. HDFC0001234" style={{ width: '100%', padding: '12px', border: '1px solid #CBD5E1', borderRadius: '8px' }} />
                 </div>
             </div>

             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                 <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>Official UPI ID</label>
                    <input type="text" value={settings.companyUpiId || ''} onChange={e=>setSettings({...settings, companyUpiId: e.target.value})} placeholder="e.g. royalkuberaa@hdfcbank" style={{ width: '100%', padding: '12px', border: '1px solid #CBD5E1', borderRadius: '8px' }} />
                 </div>
                 <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>Custom QR Image URL (Optional)</label>
                    <input type="text" value={settings.companyQrUrl || ''} onChange={e=>setSettings({...settings, companyQrUrl: e.target.value})} placeholder="Leave blank to auto-generate dynamic QR" style={{ width: '100%', padding: '12px', border: '1px solid #CBD5E1', borderRadius: '8px' }} />
                 </div>
             </div>

             <button type="submit" style={{ width: '100%', padding: '14px', background: '#0F172A', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}>
                💾 Save Settings & Company Bank Details
             </button>
          </form>
        </div>
      </CardWrapper>
    );
  };

  const renderSystemReports = () => {
    const [reports, setReports] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReports = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch('/api/admin/reports', { headers: { 'Authorization': `Bearer ${token}` }});
                const result = await res.json();
                if(result.success) setReports(result.data);
            } catch(err) { console.error(err); }
            setLoading(false);
        };
        if(activeMenu === 'System Reports') fetchReports();
    }, [activeMenu]);

    if(loading || !reports) return <div style={{ padding: '50px', textAlign: 'center' }}>Loading Reports...</div>;

    return (
        <CardWrapper>
            <PageHeader title="System Reports" subtitle="High-level overview of network and finances" />
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', marginBottom: '24px' }}>
                <div style={{ background: '#FFF', padding: '24px', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                        <span style={{ fontSize: '24px' }}>👥</span>
                        <h4 style={{ margin: 0, color: '#64748B', fontSize: '14px' }}>Total Members</h4>
                    </div>
                    <div style={{ fontSize: '28px', fontWeight: '800', color: '#0F172A' }}>{reports.totalUsers}</div>
                    <div style={{ fontSize: '13px', color: '#10B981', marginTop: '8px', fontWeight: 'bold' }}>{reports.activeUsers} Active IDs</div>
                </div>

                <div style={{ background: '#FFF', padding: '24px', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                        <span style={{ fontSize: '24px' }}>💰</span>
                        <h4 style={{ margin: 0, color: '#64748B', fontSize: '14px' }}>Total Income Generated</h4>
                    </div>
                    <div style={{ fontSize: '28px', fontWeight: '800', color: '#0F172A' }}>₹{reports.totalIncomeGenerated.toLocaleString()}</div>
                    <div style={{ fontSize: '13px', color: '#64748B', marginTop: '8px' }}>Direct, Level & Royalty</div>
                </div>

                <div style={{ background: '#FFF', padding: '24px', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                        <span style={{ fontSize: '24px' }}>🏦</span>
                        <h4 style={{ margin: 0, color: '#64748B', fontSize: '14px' }}>Approved Payouts</h4>
                    </div>
                    <div style={{ fontSize: '28px', fontWeight: '800', color: '#0EA5E9' }}>₹{reports.approvedWithdrawals.netPaid.toLocaleString()}</div>
                    <div style={{ fontSize: '13px', color: '#64748B', marginTop: '8px' }}>Gross: ₹{reports.approvedWithdrawals.gross.toLocaleString()}</div>
                </div>
                
                <div style={{ background: '#FFF', padding: '24px', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                        <span style={{ fontSize: '24px' }}>⏳</span>
                        <h4 style={{ margin: 0, color: '#64748B', fontSize: '14px' }}>Pending Payouts</h4>
                    </div>
                    <div style={{ fontSize: '28px', fontWeight: '800', color: '#F59E0B' }}>₹{reports.pendingWithdrawals.netPaid.toLocaleString()}</div>
                    <div style={{ fontSize: '13px', color: '#EF4444', marginTop: '8px', fontWeight: 'bold' }}>{reports.pendingWithdrawals.count} Requests</div>
                </div>
            </div>

            <div style={{ background: '#F8FAFC', padding: '20px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                <h3 style={{ color: '#0F172A', marginBottom: '16px' }}>Tax & Admin Collections (From Approved Withdrawals)</h3>
                <div style={{ display: 'flex', gap: '40px' }}>
                   <div>
                       <span style={{ color: '#64748B', fontSize: '13px', display: 'block', marginBottom: '4px' }}>Total TDS Collected (5%)</span>
                       <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#0F172A' }}>₹{reports.approvedWithdrawals.tds.toLocaleString()}</span>
                   </div>
                   <div>
                       <span style={{ color: '#64748B', fontSize: '13px', display: 'block', marginBottom: '4px' }}>Admin Charges Collected (5%)</span>
                       <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#0F172A' }}>₹{reports.approvedWithdrawals.adminCharge.toLocaleString()}</span>
                   </div>
                </div>
            </div>
        </CardWrapper>
    );
  };

  const renderIDActivation = () => {
    return (
      <CardWrapper>
        <PageHeader title="ID Activation" subtitle="Activate any Member ID instantly using your Main Wallet balance" />
        <div style={{ background: '#FFF', padding: '30px', borderRadius: '24px', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.1)', maxWidth: '500px', margin: '0 auto', textAlign: 'center', border: '1px solid #F1F5F9' }}>
           <div style={{ width: '80px', height: '80px', background: 'linear-gradient(135deg, #4F46E5 0%, #3B82F6 100%)', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', margin: '0 auto 20px auto', boxShadow: '0 10px 20px -5px rgba(79,70,229,0.4)' }}>⚡</div>
           <h3 style={{ margin: '0 0 10px 0', color: '#0F172A', fontSize: '24px', fontWeight: '900' }}>Activate Member</h3>
           <p style={{ color: '#64748B', fontSize: '15px', marginBottom: '24px', lineHeight: '1.6' }}>Enter the Member ID or Mobile Number to activate. This will deduct <b>₹1500</b> from your Main Wallet.</p>
           
           <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '16px', marginBottom: '24px', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <span style={{ color: '#475569', fontWeight: '600', fontSize: '14px' }}>Main Wallet Balance:</span>
               <span style={{ color: '#10B981', fontWeight: '900', fontSize: '18px' }}>₹{(userData?.mainWallet || 0).toLocaleString()}</span>
           </div>

           <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input 
                 type="text" 
                 id="quickActivateIdSidebar"
                 placeholder="Enter Member ID or Mobile..." 
                 style={{ width: '100%', padding: '16px', border: '2px solid #E2E8F0', borderRadius: '12px', textTransform: 'uppercase', fontSize: '16px', fontWeight: '600', outline: 'none', transition: 'border-color 0.2s', textAlign: 'center' }}
                 onFocus={e => e.target.style.borderColor = '#4F46E5'}
                 onBlur={e => e.target.style.borderColor = '#E2E8F0'}
              />
              <button 
                 onClick={async (e) => {
                     const btn = e.target;
                     const targetId = document.getElementById('quickActivateIdSidebar').value;
                     if (!targetId.trim()) return window.customAlert('Please enter a Member ID or Mobile Number');
                     if (!await window.customConfirm(`Are you sure you want to deduct ₹1500 to activate: ${targetId.toUpperCase()}?`)) return;
                     
                     btn.disabled = true;
                     btn.innerText = 'Processing...';
                     try {
                         const token = localStorage.getItem('token');
                         const res = await fetch('/api/user/activate', { 
                             method: 'POST', 
                             headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                             body: JSON.stringify({ targetMemberId: targetId })
                         });
                         const result = await res.json();
                         window.customAlert(result.message);
                         if(result.success) window.location.reload();
                     } catch(err) { window.customAlert('Activation failed'); } finally {
                         btn.disabled = false;
                         btn.innerText = 'Activate Now (₹1500)';
                     }
                 }}
                 style={{ width: '100%', padding: '16px', background: 'linear-gradient(135deg, #4F46E5 0%, #3B82F6 100%)', color: '#FFF', border: 'none', borderRadius: '12px', fontWeight: '900', cursor: 'pointer', fontSize: '16px', textTransform: 'uppercase', letterSpacing: '1px', boxShadow: '0 4px 14px 0 rgba(79,70,229,0.39)', transition: 'transform 0.2s' }}
                 onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                 onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                 >
                 Activate Now (₹1500)
              </button>
           </div>
        </div>
      </CardWrapper>
    );
  };

  const renderProducts = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({ name: '', description: '', price: 1500, bv: 100, image: '📦', badge: '', deliveryInfo: 'Free Delivery', isActive: true });
    const [productImageFile, setProductImageFile] = useState(null);
    
    useEffect(() => {
        if (activeMenu === 'Products') {
           fetchProducts();
        }
    }, [activeMenu]);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const endpoint = userRole === 'admin' ? '/api/admin/products' : '/api/products';
            const res = await fetch(endpoint, { headers: { 'Authorization': `Bearer ${token}` }});
            const result = await res.json();
            if(result.success) setProducts(result.data);
        } catch(err) { console.error(err); }
        setLoading(false);
    };

    const handleSaveProduct = async (e) => {
        e.preventDefault();
        if (!editForm.name.trim() || !editForm.description.trim()) {
            window.customAlert('Product Name and Description are required!');
            return;
        }
        try {
            const token = localStorage.getItem('token');
            const method = editForm._id ? 'PUT' : 'POST';
            const url = editForm._id ? `/api/admin/products/${editForm._id}` : '/api/admin/products';
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(editForm)
            });
            const result = await res.json();
            
            if(result.success) {
                const productId = result.data._id;
                if (productImageFile) {
                    const formData = new FormData();
                    formData.append('image', productImageFile);
                    await fetch(`/api/admin/products/${productId}/image`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${token}` },
                        body: formData
                    });
                }
                window.customAlert(result.message);
                setIsEditing(false);
                setProductImageFile(null);
                fetchProducts();
            } else {
                window.customAlert(result.message);
            }
        } catch(err) { window.customAlert('Failed to save product'); }
    };

    const handleDeleteProduct = async (id) => {
        if(!await window.customConfirm('Are you sure you want to delete this product?')) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }});
            const result = await res.json();
            window.customAlert(result.message);
            if(result.success) fetchProducts();
        } catch(err) { window.customAlert('Failed to delete product'); }
    };

    const handleBuyAndActivate = async (product) => {
        if (userData?.isActive) {
            window.customAlert('Your ID is already activated!');
            return;
        }
        if(!await window.customConfirm(`Are you sure you want to buy ${product.name} and activate your ID for ₹${product.price}? (Requires wallet balance)`)) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/user/activate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ productId: product._id })
            });
            const result = await res.json();
            window.customAlert(result.message);
            if(result.success) {
                const ud = {...userData, isActive: true};
                setUserData(ud);
                window.location.reload();
            }
        } catch(err) { window.customAlert('Activation failed'); }
    };

    if (isEditing && userRole === 'admin') {
        return (
            <CardWrapper>
                <PageHeader title={editForm._id ? "Edit Product" : "Add New Product"} />
                <form onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '650px', background: '#FFF', padding: '30px', borderRadius: '16px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '8px' }}>Product Name</label>
                        <input placeholder="Enter product name" value={editForm.name} onChange={e=>setEditForm({...editForm, name: e.target.value})} required style={{ width: '100%', padding: '14px', border: '1px solid #CBD5E1', borderRadius: '10px', fontSize: '14px', transition: 'all 0.2s', outline: 'none' }} />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '8px' }}>Product Description</label>
                        <textarea placeholder="Describe the product benefits..." value={editForm.description} onChange={e=>setEditForm({...editForm, description: e.target.value})} required style={{ width: '100%', padding: '14px', border: '1px solid #CBD5E1', borderRadius: '10px', minHeight: '120px', fontSize: '14px', fontFamily: 'inherit', resize: 'vertical', outline: 'none' }} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                       <div>
                           <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '8px' }}>Price (₹)</label>
                           <input type="number" placeholder="1500" value={editForm.price} onChange={e=>setEditForm({...editForm, price: e.target.value})} required style={{ width: '100%', padding: '14px', border: '1px solid #CBD5E1', borderRadius: '10px', fontSize: '14px', outline: 'none' }} />
                       </div>
                       <div>
                           <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '8px' }}>Business Volume (BV)</label>
                           <input type="number" placeholder="100" value={editForm.bv} onChange={e=>setEditForm({...editForm, bv: e.target.value})} required style={{ width: '100%', padding: '14px', border: '1px solid #CBD5E1', borderRadius: '10px', fontSize: '14px', outline: 'none' }} />
                       </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                       <div>
                           <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '8px' }}>Product Image File (Replaces Emoji/URL)</label>
                           <input type="file" accept="image/*" onChange={e => setProductImageFile(e.target.files[0])} style={{ width: '100%', padding: '10px', border: '1px solid #CBD5E1', borderRadius: '10px', fontSize: '14px', outline: 'none' }} />
                           {editForm.image && !productImageFile && <div style={{marginTop: '5px', fontSize: '12px', color: '#64748B'}}>Current: {editForm.image.substring(0, 30)}...</div>}
                       </div>
                       <div>
                           <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '8px' }}>Badge (Optional)</label>
                           <input placeholder="e.g. BEST SELLER" value={editForm.badge} onChange={e=>setEditForm({...editForm, badge: e.target.value})} style={{ width: '100%', padding: '14px', border: '1px solid #CBD5E1', borderRadius: '10px', fontSize: '14px', outline: 'none' }} />
                       </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#334155', marginBottom: '8px' }}>Delivery Information</label>
                        <input placeholder="e.g. Free Delivery" value={editForm.deliveryInfo} onChange={e=>setEditForm({...editForm, deliveryInfo: e.target.value})} style={{ width: '100%', padding: '14px', border: '1px solid #CBD5E1', borderRadius: '10px', fontSize: '14px', outline: 'none' }} />
                    </div>

                    <div style={{ display: 'flex', gap: '16px', marginTop: '10px' }}>
                       <button type="submit" style={{ flex: 1, padding: '14px', background: '#10B981', color: '#FFF', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px' }}>Save Product</button>
                       <button type="button" onClick={() => setIsEditing(false)} style={{ flex: 1, padding: '14px', background: '#F1F5F9', color: '#475569', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px' }}>Cancel</button>
                    </div>
                </form>
            </CardWrapper>
        );
    }

    return (
      <CardWrapper>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <PageHeader title="Welcome Product Packages" subtitle="Select your preferred high-value product kit" />
          {userRole === 'admin' && (
             <button onClick={() => { setEditForm({ name: '', description: '', price: 1500, bv: 100, image: '📦', badge: '', deliveryInfo: 'Free Delivery', isActive: true }); setIsEditing(true); }} style={{ padding: '10px 20px', background: '#10B981', color: '#FFF', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>+ Add Product</button>
          )}
        </div>
        
        {loading ? (
            <div style={{ textAlign: 'center', padding: '50px', color: '#64748B' }}>Loading Products...</div>
        ) : products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px', color: '#64748B' }}>No products available yet.</div>
        ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginTop: '16px' }}>
              {products.map((product, idx) => (
                <div key={product._id} style={{ background: '#FFF', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '24px', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', position: 'relative' }}>
                  {product.badge && (
                     <div style={{ position: 'absolute', top: '16px', right: '16px', background: '#DEF7EC', color: '#03543F', fontSize: '12px', fontWeight: '800', padding: '4px 10px', borderRadius: '20px' }}>
                       {product.badge.toUpperCase()}
                     </div>
                  )}
                  <div style={{ width: '100%', height: '200px', borderRadius: '14px', background: 'linear-gradient(135deg, #F1F5F9 0%, #E2E8F0 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px', marginBottom: '16px', overflow: 'hidden' }}>
                    {product.image && product.image.includes('/') ? (
                        <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                        product.image || '📦'
                    )}
                  </div>
                  <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0F172A', marginBottom: '8px' }}>{product.name}</h3>
                  <p style={{ fontSize: '13px', color: '#64748B', lineHeight: '1.5', marginBottom: '16px', whiteSpace: 'pre-wrap' }}>
                    {product.description}
                  </p>
                  <div style={{ background: '#F8FAFC', padding: '12px', borderRadius: '10px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ color: '#64748B' }}>Delivery:</span>
                      <strong style={{ color: '#10B981' }}>{product.deliveryInfo}</strong>
                    </div>
                  </div>
                  <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: '20px', fontWeight: '800', color: '#0F172A' }}>₹{product.price.toLocaleString()}</div>
                    </div>
                    {userRole === 'admin' ? (
                       <div style={{ display: 'flex', gap: '8px' }}>
                           <button onClick={() => { setEditForm(product); setIsEditing(true); }} style={{ padding: '6px 12px', background: '#0EA5E9', color: '#FFF', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>Edit</button>
                           <button onClick={() => handleDeleteProduct(product._id)} style={{ padding: '6px 12px', background: '#EF4444', color: '#FFF', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>Delete</button>
                       </div>
                    ) : (
                       !userData?.isActive && (
                           <button onClick={() => handleBuyAndActivate(product)} style={{ padding: '8px 16px', background: '#0F172A', color: '#FFF', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', border: 'none' }}>Buy & Activate</button>
                       )
                    )}
                  </div>
                </div>
              ))}
            </div>
        )}
      </CardWrapper>
    );
  };

  const renderAboutUs = () => (
    <CardWrapper>
      <PageHeader title="About Royal Kuberaa" subtitle="Empowering individuals through transparent affiliate networking and community wealth sharing" />
      <div style={{ maxWidth: '850px', background: '#FFF', padding: '32px', borderRadius: '16px', border: '1px solid #E2E8F0', lineHeight: '1.7', color: '#334155' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', padding: '20px', borderRadius: '12px', color: '#FFF' }}>
          <img src="/royal-kuberaa-logo.jpg" alt="Logo" style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #38BDF8' }} />
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: '800', margin: 0, color: '#F8FAFC' }}>Royal Kuberaa Solutions</h2>
            <p style={{ margin: 0, fontSize: '13px', color: '#94A3B8' }}>Pioneering ethical, high-yield digital community commerce</p>
          </div>
        </div>

        <h3 style={{ color: '#0F172A', fontWeight: '800', marginBottom: '12px' }}>🎯 Our Vision & Mission</h3>
        <p style={{ marginBottom: '20px' }}>
          At Royal Kuberaa, our mission is to build a sustainable, transparent, and technology-driven networking ecosystem that enables every motivated individual across India to achieve genuine financial independence. We combine tangible, high-value consumer products with an automated, mathematically disciplined profit-sharing plan.
        </p>

        <h3 style={{ color: '#0F172A', fontWeight: '800', marginBottom: '12px' }}>⭐ Why Royal Kuberaa Stands Apart</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
            <strong style={{ color: '#0F172A', display: 'block', marginBottom: '6px' }}>👑 100% Unilevel Fairness</strong>
            <span style={{ fontSize: '13px', color: '#64748B' }}>10-Level deep Team Income without any complicated matching legs or flush outs.</span>
          </div>
          <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
            <strong style={{ color: '#0F172A', display: 'block', marginBottom: '6px' }}>🔄 Daily Midnight Pools</strong>
            <span style={{ fontSize: '13px', color: '#64748B' }}>₹300 from every active ID is pooled and split evenly every single night at 12:00 AM among Royalty achievers, plus ₹100 for Non-Working members.</span>
          </div>
          <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
            <strong style={{ color: '#0F172A', display: 'block', marginBottom: '6px' }}>🌱 Perpetual Rebirth IDs</strong>
            <span style={{ fontSize: '13px', color: '#64748B' }}>Automatic 10% re-investment cycle creating fresh IDs, fresh sponsor bonuses (₹400), and new pool fuel (₹1100).</span>
          </div>
          <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
            <strong style={{ color: '#0F172A', display: 'block', marginBottom: '6px' }}>🛡️ 100% Legal & Compliant</strong>
            <span style={{ fontSize: '13px', color: '#64748B' }}>Strict compliance with Direct Selling Guidelines 2021, statutory 5% TDS with PAN, and 7-day cooling policy.</span>
          </div>
        </div>

        <h3 style={{ color: '#0F172A', fontWeight: '800', marginBottom: '12px' }}>📞 Official Support & Office</h3>
        <p style={{ margin: 0, fontSize: '14px', color: '#64748B' }}>
          <strong>Corporate Email:</strong> support@royalkuberaa.com<br />
          <strong>Working Hours:</strong> Monday – Saturday, 10:00 AM – 6:00 PM IST<br />
          <strong>Headquarters:</strong> Andhra Pradesh & Telangana, India
        </p>
      </div>
    </CardWrapper>
  );

  const renderTermsAndConditions = () => (
    <CardWrapper>
      <PageHeader title="Terms & Conditions" subtitle="Official rules, distributor agreement, and compensation plan terms" />
      <div style={{ maxWidth: '850px', background: '#FFF', padding: '32px', borderRadius: '16px', border: '1px solid #E2E8F0', lineHeight: '1.7', color: '#334155', fontSize: '14px' }}>
        <h4 style={{ color: '#0F172A', fontSize: '16px', fontWeight: '800', marginBottom: '8px' }}>1. Acceptance of Terms & Eligibility</h4>
        <p style={{ marginBottom: '16px' }}>
          By registering on Royal Kuberaa, you confirm that you are an Indian citizen of at least 18 years of age. You agree to act as an Independent Affiliate Distributor and not an employee or agent of the company.
        </p>

        <h4 style={{ color: '#0F172A', fontSize: '16px', fontWeight: '800', marginBottom: '8px' }}>2. One-Time Membership & Product Package</h4>
        <p style={{ marginBottom: '16px' }}>
          Membership activation requires a one-time fee of ₹1,500 (inclusive of taxes and selected tangible welcome product kit). Activation grants access to the member portal, income dashboards, and unilevel team network placement.
        </p>

        <h4 style={{ color: '#0F172A', fontSize: '16px', fontWeight: '800', marginBottom: '8px' }}>3. Direct & Team Level Income</h4>
        <p style={{ marginBottom: '16px' }}>
          Every direct referral earns you an instant ₹400. In addition, you earn income up to 10 levels deep from your entire network without any binary matching requirements. Level incomes range from ₹100 at Level 1 down to ₹10 at Level 10. There are no daily caps or flush outs on team level income.
        </p>

        <h4 style={{ color: '#0F172A', fontSize: '16px', fontWeight: '800', marginBottom: '8px' }}>4. Daily Royalty Pools & Lifetime Limits</h4>
        <p style={{ marginBottom: '16px' }}>
          Royalty pools (Gold, Platinum, Ruby, Diamond) require active direct referrals and carry defined lifetime payout caps: Gold (₹20,000), Platinum (₹1,00,000), Ruby (₹5,00,000), and Diamond (₹25,00,000). Once the lifetime cap is reached, pool distributions for that tier cease.
        </p>

        <h4 style={{ color: '#0F172A', fontSize: '16px', fontWeight: '800', marginBottom: '8px' }}>5. Non-Working Cashback Policy</h4>
        <p style={{ marginBottom: '16px' }}>
          The daily non-working cashback fund is distributed strictly among active members who have earned zero (0) commissions, until their ₹1,500 joining fee is recovered. If a user earns any commission (Direct or Level income), cashback eligibility stops permanently as they transition to the active earning plan.
        </p>

        <h4 style={{ color: '#0F172A', fontSize: '16px', fontWeight: '800', marginBottom: '8px' }}>6. Rebirth ID System</h4>
        <p style={{ marginBottom: '16px' }}>
          Ten percent (10%) of all earnings are systematically directed to the member's Rebirth Wallet. When this wallet accumulates ₹1,500, an automated new position is generated under the same sponsor, distributing ₹400 sponsor bonus and ₹1,100 into the daily royalty pools.
        </p>

        <h4 style={{ color: '#0F172A', fontSize: '16px', fontWeight: '800', marginBottom: '8px' }}>7. Statutory Deductions & Payouts</h4>
        <p style={{ marginBottom: '16px' }}>
          All wallet withdrawals are subject to a mandatory 5% TDS (Section 194H) and a 5% platform administrative charge. Minimum withdrawal limit is ₹500. Payouts require verified KYC and valid bank account details.
        </p>

        <h4 style={{ color: '#0F172A', fontSize: '16px', fontWeight: '800', marginBottom: '8px' }}>8. Code of Conduct & Termination</h4>
        <p style={{ margin: 0 }}>
          Cross-sponsoring, defamatory remarks against the company, or fraudulent claims of fixed passive returns will result in immediate termination of the member ID and forfeiture of pending balances.
        </p>
      </div>
    </CardWrapper>
  );

  const renderPrivacyPolicy = () => (
    <CardWrapper>
      <PageHeader title="Privacy Policy" subtitle="How Royal Kuberaa safeguards your personal and financial information" />
      <div style={{ maxWidth: '850px', background: '#FFF', padding: '32px', borderRadius: '16px', border: '1px solid #E2E8F0', lineHeight: '1.7', color: '#334155', fontSize: '14px' }}>
        <h4 style={{ color: '#0F172A', fontSize: '16px', fontWeight: '800', marginBottom: '8px' }}>1. Information We Collect</h4>
        <p style={{ marginBottom: '16px' }}>
          When you register and use the Royal Kuberaa platform, we collect essential identifying information including your Full Name, Mobile Number, Email Address, PAN Card (required for statutory TDS compliance), Aadhaar details for KYC verification, and Bank Account details (Bank Name, Account Number, IFSC) for commission disbursements.
        </p>

        <h4 style={{ color: '#0F172A', fontSize: '16px', fontWeight: '800', marginBottom: '8px' }}>2. Use of Collected Data</h4>
        <p style={{ marginBottom: '16px' }}>
          Your data is used strictly for user identification, unilevel team network processing, automated commission payouts, statutory tax filings (Form 16A TDS certificates), and vital system notifications.
        </p>

        <h4 style={{ color: '#0F172A', fontSize: '16px', fontWeight: '800', marginBottom: '8px' }}>3. Data Protection & Security</h4>
        <p style={{ marginBottom: '16px' }}>
          All data transmitted between your device and our servers is secured using industry-standard 256-bit SSL encryption. Critical actions including withdrawals and password changes require secondary PIN authorization.
        </p>

        <h4 style={{ color: '#0F172A', fontSize: '16px', fontWeight: '800', marginBottom: '8px' }}>4. Zero Third-Party Selling</h4>
        <p style={{ marginBottom: '16px' }}>
          Royal Kuberaa will NEVER sell, lease, or rent your personal data to any marketing agencies or third parties. Data is shared only with government tax authorities and verified banking gateways for payout fulfillment.
        </p>

        <h4 style={{ color: '#0F172A', fontSize: '16px', fontWeight: '800', marginBottom: '8px' }}>5. User Access & Control</h4>
        <p style={{ margin: 0 }}>
          You retain the right to inspect your personal profile and submitted KYC documents at any time via your member portal. For data updates or corrections, please contact our support team.
        </p>
      </div>
    </CardWrapper>
  );

  const renderReturnAndRefund = () => (
    <CardWrapper>
      <PageHeader title="Return & Refund Policy" subtitle="Transparent 7-day cooling-off period and product return guidelines" />
      <div style={{ maxWidth: '850px', background: '#FFF', padding: '32px', borderRadius: '16px', border: '1px solid #E2E8F0', lineHeight: '1.7', color: '#334155', fontSize: '14px' }}>
        <div style={{ background: '#EFF6FF', padding: '16px', borderRadius: '10px', borderLeft: '4px solid #3B82F6', marginBottom: '20px' }}>
          <strong style={{ color: '#1D4ED8', display: 'block', marginBottom: '4px' }}>🛡️ Mandatory 7-Day Cooling-Off Period</strong>
          <span style={{ fontSize: '13px', color: '#1E293B' }}>
            In accordance with the Consumer Protection (Direct Selling) Rules 2021, newly registered members have 7 calendar days from their activation date to cancel membership and request a full refund.
          </span>
        </div>

        <h4 style={{ color: '#0F172A', fontSize: '16px', fontWeight: '800', marginBottom: '8px' }}>1. Physical Product Kit Returns</h4>
        <p style={{ marginBottom: '16px' }}>
          To qualify for a refund on physical welcome kits (Ayurvedic/Personal Care), the products must be returned unopened, unused, with all safety seals intact, and in their original packaging. Return shipping expenses are borne by the customer.
        </p>

        <h4 style={{ color: '#0F172A', fontSize: '16px', fontWeight: '800', marginBottom: '8px' }}>2. Digital Products & E-Learning Packages</h4>
        <p style={{ marginBottom: '16px' }}>
          Digital marketing courses, downloadable software templates, and e-learning resources are non-refundable once the course materials or downloadable assets have been accessed or logged into.
        </p>

        <h4 style={{ color: '#0F172A', fontSize: '16px', fontWeight: '800', marginBottom: '8px' }}>3. Refund Claim Procedure</h4>
        <p style={{ marginBottom: '16px' }}>
          To initiate a refund request within 7 calendar days, submit a support ticket via the Support section under category "Refund Request" with your Member ID, payment reference (UTR), and reason.
        </p>

        <h4 style={{ color: '#0F172A', fontSize: '16px', fontWeight: '800', marginBottom: '8px' }}>4. Disbursement Timeline</h4>
        <p style={{ margin: 0 }}>
          Approved refund amounts will be credited back to the member's source bank account within 5 to 7 business working days after deduction of applicable bank/admin processing charges. Upon refund completion, the associated Member ID is permanently decommissioned.
        </p>
      </div>
    </CardWrapper>
  );

  const renderDisclaimer = () => (
    <CardWrapper>
      <PageHeader title="Legal Disclaimer" subtitle="Affiliate disclosure, earnings disclaimer, and regulatory compliance" />
      <div style={{ maxWidth: '850px', background: '#FFF', padding: '32px', borderRadius: '16px', border: '1px solid #E2E8F0', lineHeight: '1.7', color: '#334155', fontSize: '14px' }}>
        <div style={{ background: '#FEF2F2', padding: '16px', borderRadius: '10px', borderLeft: '4px solid #EF4444', marginBottom: '20px' }}>
          <strong style={{ color: '#991B1B', display: 'block', marginBottom: '4px' }}>⚠️ Not an Investment or Fixed Yield Scheme</strong>
          <span style={{ fontSize: '13px', color: '#7F1D1D' }}>
            Royal Kuberaa is an affiliate marketing and direct selling business platform. It does NOT offer financial investment services, daily interest on deposits, or guaranteed passive income.
          </span>
        </div>

        <h4 style={{ color: '#0F172A', fontSize: '16px', fontWeight: '800', marginBottom: '8px' }}>1. Earnings & Income Representation</h4>
        <p style={{ marginBottom: '16px' }}>
          Any earnings examples, team level income figures, or pool distributions displayed in promotional presentations are for educational illustration only. Income is strictly contingent upon genuine product distribution, sales volume, and individual performance. There is no guaranteed minimum earning.
        </p>

        <h4 style={{ color: '#0F172A', fontSize: '16px', fontWeight: '800', marginBottom: '8px' }}>2. Regulatory Compliance</h4>
        <p style={{ marginBottom: '16px' }}>
          Royal Kuberaa operates in strict accordance with the Consumer Protection (Direct Selling) Rules 2021 and the Prize Chits and Money Circulation Schemes (Banning) Act, 1978. Enrollment fees are strictly associated with tangible products and digital training courses.
        </p>

        <h4 style={{ color: '#0F172A', fontSize: '16px', fontWeight: '800', marginBottom: '8px' }}>3. Independent Contractor Relationship</h4>
        <p style={{ marginBottom: '16px' }}>
          Affiliates are independent contractors responsible for their own tax obligations, regional registration requirements, and business conduct. Affiliates are strictly prohibited from misrepresenting the company's business plan.
        </p>

        <h4 style={{ color: '#0F172A', fontSize: '16px', fontWeight: '800', marginBottom: '8px' }}>4. Modification Rights</h4>
        <p style={{ margin: 0 }}>
          Royal Kuberaa reserves the right to modify compensation plans, operational guidelines, or product packages with due notice to maintain mathematical equilibrium and network solvency.
        </p>
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
    const password = Math.floor(100000 + Math.random() * 900000).toString();
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
        setRegisteredDetails({ memberId: data.user.memberId, name, mobile, password });
        e.target.reset();
      } else {
        window.customAlert('Error: ' + data.message);
      }
    } catch (err) {
      window.customAlert('Network Error');
    } finally {
      btn.disabled = false;
      btn.innerText = 'Register Member';
    }
  };

  const renderAddMember = () => (
    <CardWrapper>
      <PageHeader title="Add New Member" subtitle="Register a new member in your downline" />
      <div style={{ padding: '32px', background: '#F8FAFC', borderRadius: '24px', border: '1px solid #E2E8F0', maxWidth: '600px', margin: '0 auto' }}>
          {registeredDetails ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '56px', marginBottom: '16px', animation: 'floatUp 1s ease-out' }}>🎉</div>
              <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#0F172A', marginBottom: '8px' }}>Registration Successful!</h2>
              <p style={{ color: '#64748B', marginBottom: '24px' }}>Member has been added to your downline.</p>
              
              <div ref={captureRef} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', marginBottom: '24px' }}>
                <p style={{ color: '#6c28d9', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '16px', fontWeight: '800' }}>Member Account Details</p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', textAlign: 'left', background: '#F8FAFC', padding: '16px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Login ID</span>
                      <span style={{ fontSize: '18px', color: '#1e1b4b', fontWeight: '800' }}>{registeredDetails.memberId}</span>
                   </div>
                   <div style={{ height: '1px', background: '#f1f5f9' }}></div>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Name</span>
                      <span style={{ fontSize: '15px', color: '#1e1b4b', fontWeight: '700' }}>{registeredDetails.name}</span>
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
                  style={{ flex: 1, background: '#10b981', color: 'white', padding: '14px', borderRadius: '12px', border: 'none', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 14px 0 rgba(16, 185, 129, 0.39)' }}
                >
                  Download Image
                </button>
                <button 
                  onClick={() => setRegisteredDetails(null)}
                  style={{ flex: 1, background: '#0F172A', color: 'white', padding: '14px', borderRadius: '12px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  Add Another Member
                </button>
              </div>
            </div>
          ) : (
          <form onSubmit={handleAddMember} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '700', color: '#1E293B' }}>Sponsor ID</label>
                  <input type="text" name="sponsorId" className="form-input" value={userData?.memberId} readOnly style={{ background: '#E2E8F0', color: '#64748B', fontWeight: 'bold' }} />
                </div>
                
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '700', color: '#1E293B' }}>Full Name</label>
                  <input type="text" name="name" className="form-input" placeholder="Enter member name" required onInput={(e) => e.target.value = e.target.value.toUpperCase()} style={{ textTransform: 'uppercase' }} />
                </div>
                
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '700', color: '#1E293B' }}>Mobile Number</label>
                  <input type="tel" name="mobile" className="form-input" placeholder="10-digit mobile number" required pattern="[0-9]{10}" maxLength="10" />
                </div>
            </div>

            <button type="submit" name="submitBtn" style={{ marginTop: '16px', padding: '16px', background: 'linear-gradient(135deg, #4F46E5 0%, #3730A3 100%)', color: 'white', border: 'none', borderRadius: '14px', cursor: 'pointer', fontWeight: '800', fontSize: '16px', boxShadow: '0 10px 25px -5px rgba(79,70,229,0.4)', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform='translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform='translateY(0)'}>
               Register Member
            </button>
          </form>
          )}
      </div>
    </CardWrapper>
  );

  const renderBinaryTree = () => {
    const [treeData, setTreeData] = useState(null);
    const [loadingTree, setLoadingTree] = useState(true);
    const [searchId, setSearchId] = useState('');
    
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
            
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', maxWidth: '400px', margin: '0 auto 20px' }}>
                <input 
                    type="text" 
                    value={searchId} 
                    onChange={e => setSearchId(e.target.value)} 
                    placeholder="Enter Member ID (e.g. RK...)" 
                    style={{ flex: 1, padding: '10px 12px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '14px', textTransform: 'uppercase' }} 
                />
                <button 
                    onClick={() => { if(searchId.trim()) fetchTree(searchId.trim().toUpperCase()); }}
                    style={{ padding: '0 20px', background: '#3B82F6', color: '#FFF', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                    Search
                </button>
            </div>
            
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
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
             <div style={{ padding: '20px', background: isRoyalty ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' : 'linear-gradient(135deg, #10B981 0%, #059669 100%)', borderRadius: '16px', color: '#FFF', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}>
                <h3 style={{ margin: 0, opacity: 0.9, fontSize: '14px' }}>Total Earned ({isRoyalty ? 'Royalty' : 'Cashback'})</h3>
                <h1 style={{ fontSize: '32px', margin: '8px 0 0' }}>
                    ₹ {history.reduce((sum, tx) => sum + tx.amount, 0).toLocaleString()}
                </h1>
             </div>
             
             {!isRoyalty && (
                <div style={{ padding: '20px', background: '#FFF', border: '1px solid #E2E8F0', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#475569' }}>₹1,500 Guarantee Recovery</span>
                      <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#10B981' }}>₹{dashboardData?.royaltyStats?.cashbackEarnings || 0} / ₹1,500</span>
                   </div>
                   <div style={{ width: '100%', height: '8px', background: '#E2E8F0', borderRadius: '4px', overflow: 'hidden', margin: '12px 0 8px 0' }}>
                      <div style={{ width: `${Math.min(((dashboardData?.royaltyStats?.cashbackEarnings || 0) / 1500) * 100, 100)}%`, height: '100%', background: '#10B981', transition: 'width 0.5s' }}></div>
                   </div>
                   <span style={{ fontSize: '11px', color: '#94A3B8' }}>* Non-working members receive daily share until ₹1500 fee is recovered.</span>
                </div>
             )}
          </div>

          {isRoyalty && (
             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '30px' }}>
                {[
                   { name: 'GOLD', cap: 20000, earned: dashboardData?.royaltyStats?.goldEarnings || 0, icon: '🥇', req: '2 Active Directs', color: '#F59E0B' },
                   { name: 'PLATINUM', cap: 100000, earned: dashboardData?.royaltyStats?.platinumEarnings || 0, icon: '🥈', req: '2 Gold Directs', color: '#3B82F6' },
                   { name: 'RUBY', cap: 500000, earned: dashboardData?.royaltyStats?.rubyEarnings || 0, icon: '🔴', req: '5 Platinum Directs', color: '#EF4444' },
                   { name: 'DIAMOND', cap: 2500000, earned: dashboardData?.royaltyStats?.diamondEarnings || 0, icon: '💎', req: '5 Ruby Directs', color: '#8B5CF6' }
                ].map(pool => {
                   const userRank = dashboardData?.royaltyStats?.rank || 'STARTER';
                   const ranksOrder = ['STARTER', 'GOLD', 'PLATINUM', 'RUBY', 'DIAMOND', 'OWNER'];
                   const isQualified = ranksOrder.indexOf(userRank) >= ranksOrder.indexOf(pool.name);
                   const progress = Math.min((pool.earned / pool.cap) * 100, 100);

                   return (
                      <div key={pool.name} style={{ background: '#FFF', padding: '18px', borderRadius: '16px', border: `1px solid ${isQualified ? pool.color : '#E2E8F0'}`, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03)' }}>
                         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <span style={{ fontWeight: '800', fontSize: '15px', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                               <span>{pool.icon}</span> {pool.name} POOL
                            </span>
                            <span style={{ padding: '3px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 'bold', background: isQualified ? '#D1FAE5' : '#F1F5F9', color: isQualified ? '#065F46' : '#94A3B8' }}>
                               {isQualified ? 'Active' : 'Locked'}
                            </span>
                         </div>
                         <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '10px' }}>Req: {pool.req}</div>
                         <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
                            <span style={{ color: '#059669' }}>₹{pool.earned.toLocaleString()}</span>
                            <span style={{ color: '#94A3B8' }}>Cap: ₹{pool.cap.toLocaleString()}</span>
                         </div>
                         <div style={{ width: '100%', height: '6px', background: '#F1F5F9', borderRadius: '3px', overflow: 'hidden' }}>
                            <div style={{ width: `${progress}%`, height: '100%', background: pool.color }}></div>
                         </div>
                      </div>
                   );
                })}
             </div>
          )}

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

    const currentRebirthBal = dashboardData?.rebirthWallet || 0;
    const progressToNext = Math.min(((currentRebirthBal % 1500) / 1500) * 100, 100);
    const amountNeeded = 1500 - (currentRebirthBal % 1500);

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
          <PageHeader title="Rebirth ID System (Infinite Engine)" subtitle="Automatic rebirth IDs generated every time your Rebirth Wallet reaches ₹1,500" />
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '28px' }}>
             <div style={{ padding: '24px', background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)', borderRadius: '16px', color: '#FFF', boxShadow: '0 10px 25px -5px rgba(139,92,246,0.4)' }}>
                <div style={{ fontSize: '13px', opacity: 0.9, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Current Rebirth Wallet</div>
                <h1 style={{ fontSize: '36px', margin: '8px 0 12px 0' }}>₹ {currentRebirthBal.toLocaleString()}</h1>
                <div style={{ fontSize: '13px', opacity: 0.95 }}>Total Rebirth IDs Generated: <strong>{rebirthData.length} IDs</strong></div>
             </div>

             <div style={{ padding: '24px', background: '#FFF', border: '1px solid #E2E8F0', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                   <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#0F172A' }}>Next Rebirth Progress</span>
                   <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#8B5CF6' }}>{Math.round(progressToNext)}%</span>
                </div>
                <div style={{ width: '100%', height: '10px', background: '#F1F5F9', borderRadius: '6px', overflow: 'hidden', marginBottom: '10px' }}>
                   <div style={{ width: `${progressToNext}%`, height: '100%', background: 'linear-gradient(90deg, #8B5CF6 0%, #A855F7 100%)', transition: 'width 0.5s' }}></div>
                </div>
                <div style={{ fontSize: '12px', color: '#64748B' }}>
                   ₹{amountNeeded.toLocaleString()} more needed to automatically generate your next Rebirth ID.
                </div>
             </div>
          </div>

          <div style={{ background: '#EFF6FF', padding: '16px 20px', borderRadius: '12px', borderLeft: '4px solid #3B82F6', marginBottom: '24px', fontSize: '13px', color: '#1E40AF', lineHeight: '1.5' }}>
             💡 <strong>100% Distribution per Rebirth ID (₹1,500):</strong> ₹400 goes to your Direct Sponsor (Passive Sponsor Bonus), and ₹1,100 goes into Daily Royalty Pools (Gold-₹440, Platinum-₹220, Ruby-₹220, Diamond-₹220).
          </div>
          
          {loading ? (
             <div style={{ textAlign: 'center', padding: '50px', color: '#64748B' }}>Loading Rebirths...</div>
          ) : rebirthData.length === 0 ? (
             <div style={{ textAlign: 'center', padding: '50px', color: '#64748B', background: '#F8FAFC', borderRadius: '16px' }}>You haven't generated any Rebirth IDs yet. As your income grows, Rebirth IDs will automatically be created here!</div>
          ) : (
            <Table headers={['Rebirth ID', 'Generated For', 'Sponsor Bonus', 'Pool Contribution', 'Generated On', 'Status']}>
              {rebirthData.map(user => (
                <tr key={user.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '15px', fontWeight: 'bold', color: '#8B5CF6' }}>♾️ {user.id}</td>
                  <td style={{ padding: '15px', fontWeight: 'bold' }}>{user.name}</td>
                  <td style={{ padding: '15px', color: '#059669', fontWeight: 'bold' }}>₹{user.sponsorBonus} (Paid)</td>
                  <td style={{ padding: '15px', color: '#2563EB', fontWeight: 'bold' }}>₹{user.poolContribution} (Distributed)</td>
                  <td style={{ padding: '15px', color: '#64748B' }}>{user.createdDate}</td>
                  <td style={{ padding: '15px' }}>
                    <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', background: '#D1FAE5', color: '#065F46' }}>
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
            window.customAlert(result.message);
            if (result.success) {
                // Refresh data
                const res2 = await fetch('/api/user/rewards', { headers: { 'Authorization': `Bearer ${token}` }});
                const result2 = await res2.json();
                if(result2.success) setRewardData(result2);
            }
        } catch(err) { window.customAlert('Failed to claim reward'); }
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
                    const claimedObj = claimedRewards.find(r => r.pairs === reward.pairs);
                    const isClaimed = !!claimedObj;
                    const isEligible = totalPairsMatched >= reward.pairs;
                    const progress = Math.min((totalPairsMatched / reward.pairs) * 100, 100);

                    return (
                        <div key={reward.pairs} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F8FAFC', padding: '20px', borderRadius: '12px', border: `1px solid ${isClaimed ? '#10B981' : isEligible ? '#F59E0B' : '#E2E8F0'}` }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                    <h3 style={{ margin: 0, color: '#0F172A' }}>🎁 {reward.name}</h3>
                                    <span style={{ background: '#FEF3C7', color: '#D97706', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>Gift Value: ₹{reward.cash.toLocaleString()}</span>
                                </div>
                                <div style={{ color: '#64748B', fontSize: '13px', marginBottom: '12px' }}>Target: {reward.pairs} Pairs (Physical Gift delivered by Company)</div>
                                
                                <div style={{ width: '100%', maxWidth: '300px', height: '6px', background: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                                    <div style={{ width: `${progress}%`, height: '100%', background: isClaimed ? '#10B981' : isEligible ? '#F59E0B' : '#3B82F6', transition: 'width 1s ease-in-out' }}></div>
                                </div>
                            </div>
                            <div>
                                {isClaimed ? (
                                    <span style={{ padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', background: claimedObj?.status === 'Delivered' ? '#D1FAE5' : claimedObj?.status === 'Dispatched' ? '#E0F2FE' : '#FEF3C7', color: claimedObj?.status === 'Delivered' ? '#065F46' : claimedObj?.status === 'Dispatched' ? '#0369A1' : '#D97706', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        {claimedObj?.status === 'Delivered' ? '✅ Gift Delivered' : claimedObj?.status === 'Dispatched' ? '🚚 Dispatched' : '⏳ Claimed (Dispatch Pending)'}
                                    </span>
                                ) : isEligible ? (
                                    <button onClick={() => handleClaim(reward.pairs)} style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)', color: '#FFF', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 4px 10px rgba(245, 158, 11, 0.3)' }}>
                                        🎁 Claim Gift
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

  const renderRewardsAchievers = () => {
    const [achievers, setAchievers] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchAchievers = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/admin/rewards', { headers: { 'Authorization': `Bearer ${token}` } });
        const result = await res.json();
        if(result.success) setAchievers(result.data);
      } catch(err) { console.error(err); }
      setLoading(false);
    };

    useEffect(() => {
      if (activeMenu === 'Rewards Achievers') fetchAchievers();
    }, [activeMenu]);

    const handleUpdateStatus = async (userId, pairs, status) => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/admin/rewards/${userId}/${pairs}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ status })
        });
        const result = await res.json();
        window.customAlert(result.message);
        if(result.success) fetchAchievers();
      } catch(err) { window.customAlert('Failed to update status'); }
    };

    return (
      <CardWrapper>
        <PageHeader title="Rewards Achievers List" subtitle="Track and dispatch physical gifts to qualified leaders" />
        {loading ? (
           <div style={{ textAlign: 'center', padding: '50px', color: '#64748B' }}>Loading Achievers...</div>
        ) : achievers.length === 0 ? (
           <div style={{ textAlign: 'center', padding: '50px', color: '#64748B' }}>No reward claims yet.</div>
        ) : (
           <Table headers={['Member ID', 'Name', 'Mobile', 'Reward Gift', 'Pairs', 'Status', 'Date', 'Action']}>
             {achievers.map((a, idx) => (
               <tr key={idx} style={{ borderBottom: '1px solid #F1F5F9' }}>
                 <td style={{ padding: '15px', fontWeight: 'bold', color: '#0EA5E9' }}>{a.memberId}</td>
                 <td style={{ padding: '15px', fontWeight: '600' }}>{a.name}</td>
                 <td style={{ padding: '15px', color: '#64748B' }}>{a.mobile}</td>
                 <td style={{ padding: '15px', fontWeight: 'bold', color: '#0F172A' }}>🎁 {a.rewardName}</td>
                 <td style={{ padding: '15px', fontWeight: 'bold', color: '#8B5CF6' }}>{a.pairs} Pairs</td>
                 <td style={{ padding: '15px' }}>
                   <span style={{ padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', background: a.status==='Delivered'?'#D1FAE5':a.status==='Dispatched'?'#E0F2FE':'#FEF3C7', color: a.status==='Delivered'?'#065F46':a.status==='Dispatched'?'#0369A1':'#D97706' }}>
                     {a.status}
                   </span>
                 </td>
                 <td style={{ padding: '15px', color: '#64748B' }}>{new Date(a.claimedAt).toLocaleDateString()}</td>
                 <td style={{ padding: '15px', display: 'flex', gap: '8px' }}>
                   {a.status === 'Pending Dispatch' && (
                     <button onClick={() => handleUpdateStatus(a.userId, a.pairs, 'Dispatched')} style={{ padding: '6px 12px', background: '#0284C7', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>
                       Mark Dispatched
                     </button>
                   )}
                   {a.status !== 'Delivered' && (
                     <button onClick={() => handleUpdateStatus(a.userId, a.pairs, 'Delivered')} style={{ padding: '6px 12px', background: '#10B981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>
                       Mark Delivered
                     </button>
                   )}
                 </td>
               </tr>
             ))}
           </Table>
        )}
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
       case 'Payment Settings':
       case 'KYC': renderFn = renderProfile; break;
       case 'My Network': renderFn = renderNetwork; break;
       case 'Team Network': renderFn = renderBinaryTree; break;
       case 'Wallets': 
       case 'Passbook': renderFn = renderWallets; break;
       case 'Bank Withdrawal': renderFn = renderBankWithdrawal; break;
       case 'P2P Transfer': renderFn = renderP2PTransfer; break;
       case 'Manage Users':
       case 'Member Management': renderFn = renderManageUsers; break;
       case 'Payout Approvals':
       case 'Payouts & TDS': renderFn = renderPayoutApprovals; break;
       case 'Notifications': renderFn = renderNotifications; break;
       case 'App Upload': renderFn = renderAppUpload; break;
       case 'ID Activation': renderFn = renderIDActivation; break;
       case 'Non-Working Cashback': renderFn = renderRoyaltyAndCashback; break;
       case 'Add Member': renderFn = renderAddMember; break;
       case 'Fund Management': renderFn = renderFundManagement; break;
       case 'Fund Requests': renderFn = renderFundRequests; break;
       case 'AutoPool Settings':
       case 'Pool Distributions': renderFn = renderAutoPoolSettings; break;
 
       case 'KYC Approvals': renderFn = renderKYCApprovals; break;
       case 'Support Tickets': renderFn = renderSupportTickets; break;
       case 'System Settings': renderFn = renderSystemSettings; break;
       case 'System Reports': renderFn = renderSystemReports; break;
       case 'Royalty Pools': renderFn = renderRoyaltyAndCashback; break;
       case 'Rebirth ID': renderFn = renderRebirths; break;
       case 'Offers': 
 
       case 'Deposit Funds': renderFn = renderDepositFunds; break;
       case 'Transaction PIN': renderFn = renderTpinSettings; break;
       case 'Support':
       case 'Support Tickets': renderFn = renderSupportTickets; break;
       case 'Change Password': renderFn = renderChangePassword; break;
       case 'Products': renderFn = renderProducts; break;
       case 'About Us': renderFn = renderAboutUs; break;
       case 'Terms & Conditions': renderFn = renderTermsAndConditions; break;
       case 'Privacy Policy': renderFn = renderPrivacyPolicy; break;
       case 'Return & Refund': renderFn = renderReturnAndRefund; break;
       case 'Disclaimer': renderFn = renderDisclaimer; break;
       default: renderFn = renderGeneric; break;
    }
    return <DynamicView key={activeMenu} renderFn={renderFn} />;
  };

  return (
    <>
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
                onClick={() => { 
                  if (item.name === 'Download App') {
                    window.location.href = 'https://royal-kuberaa.vercel.app/api/app/download';
                    return;
                  }
                  setActiveMenu(item.name); 
                  setSidebarOpen(false); 
                }}
              >
                <span className="menu-icon">{item.icon}</span>
                {item.name}
              </div>
            );
          })}
        </div>
        <div style={{ padding: '20px', borderTop: '1px solid #f1f5f9', marginTop: 'auto' }}>
          <button 
            onClick={() => { setIsLoggedIn(false); setAuthView('login'); setUserData(null); setRegisteredDetails(null); localStorage.clear(); }}
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
            <button className="notification-btn" onClick={() => { setActiveMenu('Notifications'); setSidebarOpen(false); }} style={{ position: 'relative' }}>
              🔔
              <span style={{ position: 'absolute', top: '4px', right: '4px', width: '8px', height: '8px', background: '#EF4444', borderRadius: '50%' }}></span>
            </button>
          </div>
        </header>

        <div className="dashboard-content">
          {renderContent()}
        </div>
      </main>
    </div>
      {dialogState.isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.75)', zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(4px)' }}>
            <div style={{ background: '#FFF', borderRadius: '24px', padding: '32px', maxWidth: '400px', width: '100%', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', textAlign: 'center', animation: 'scaleIn 0.2s ease-out' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: dialogState.type === 'confirm' ? '#FEF3C7' : '#E0E7FF', color: dialogState.type === 'confirm' ? '#D97706' : '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', margin: '0 auto 20px' }}>
                    {dialogState.type === 'confirm' ? '?' : '!'}
                </div>
                <h3 style={{ margin: '0 0 12px 0', color: '#0F172A', fontSize: '22px', fontWeight: '800' }}>{dialogState.type === 'confirm' ? 'Confirmation' : 'Notice'}</h3>
                <p style={{ color: '#475569', fontSize: '16px', lineHeight: '1.5', marginBottom: '32px' }}>{dialogState.message}</p>
                <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                    {dialogState.type === 'confirm' && (
                        <button onClick={handleDialogCancel} style={{ flex: 1, padding: '14px', background: '#F1F5F9', color: '#475569', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px', transition: 'all 0.2s' }}>Cancel</button>
                    )}
                    <button onClick={handleDialogConfirm} style={{ flex: dialogState.type === 'confirm' ? 1 : 'none', minWidth: dialogState.type === 'alert' ? '140px' : 'auto', padding: '14px', background: '#0B1437', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(11, 20, 55, 0.2)' }}>OK</button>
                </div>
            </div>
            <style>{`
                @keyframes scaleIn {
                    from { transform: scale(0.95); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </div>
      )}
      </>
  );
}

export default App;
