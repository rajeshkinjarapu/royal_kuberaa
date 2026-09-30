import React, { useState, useEffect } from 'react';
import './index.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authView, setAuthView] = useState('login'); // 'login' or 'register'
  const [userRole, setUserRole] = useState('member'); // 'admin' or 'member'
  const [activeMenu, setActiveMenu] = useState('Dashboard');
  
  // Real Data States
  const [userData, setUserData] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Dynamic Menus
  const menuItems = [
    { name: 'Dashboard', icon: '📊' },
    { name: 'Wallets', icon: '💰' },
    { name: 'AutoPool Matrix', icon: '🔄' },
    { name: 'Network', icon: '🕸️' },
    { name: 'Withdraw / P2P', icon: '💸' },
    { name: 'Profile', icon: '⚙️' },
  ];

  const adminMenu = [
    { name: 'Dashboard', icon: '👑' },
    { name: 'Manage Users', icon: '👥' },
    { name: 'Payout Approvals', icon: '✅' },
    { name: 'Fund Management', icon: '💰' },
    { name: 'Support Tickets', icon: '🎫' },
    { name: 'System Settings', icon: '⚙️' },
  ];

  // API Call for Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const memberId = e.target.memberId.value;
    const password = e.target.password.value;
    
    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, password })
      });
      
      const result = await response.json();
      
      if (result.success) {
        if (memberId.toUpperCase().includes('ADMIN')) {
          setUserRole('admin');
        } else {
          setUserRole('member');
        }
        setUserData(result.user);
        setIsLoggedIn(true);
      } else {
        alert(result.message || 'Login failed');
      }
    } catch (error) {
      alert('Cannot connect to server. Ensure backend is running on port 5000.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Dashboard Data after Login
  useEffect(() => {
    if (isLoggedIn) {
      const fetchDashboard = async () => {
        try {
          const response = await fetch('http://localhost:5000/api/dashboard');
          const result = await response.json();
          if (result.success) {
            setDashboardData(result.data);
          }
        } catch (error) {
          console.error('Error fetching dashboard:', error);
        }
      };
      fetchDashboard();
    }
  }, [isLoggedIn]);

  if (!isLoggedIn) {
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
                    <input type="text" name="memberId" className="form-input" placeholder="Enter your User ID" required />
                  </div>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <div className="input-wrapper">
                    <span className="input-icon">🔒</span>
                    <input type="password" name="password" className="form-input" placeholder="Enter your password" required />
                  </div>
                </div>
                
                <div className="form-options">
                  <label className="remember-checkbox">
                    <input type="checkbox" />
                    <span>Remember me</span>
                  </label>
                  <a href="#" className="forgot-link">Forgot Password?</a>
                </div>
                
                <button type="submit" className="login-submit-btn" disabled={loading}>
                  {loading ? 'Authenticating...' : 'Secure Login'}
                </button>
              </form>
            ) : (
              <form className="login-form" onSubmit={(e) => { e.preventDefault(); setAuthView('login'); }}>
                {/* Registration Form (Same as before) */}
                <div className="form-group">
                  <label className="form-label">Sponsor ID</label>
                  <div className="input-wrapper">
                    <span className="input-icon">🤝</span>
                    <input type="text" className="form-input" placeholder="Enter Referral ID" required />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <div className="input-wrapper">
                    <span className="input-icon">👤</span>
                    <input type="text" className="form-input" placeholder="Enter your name" required />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <div className="input-wrapper">
                    <span className="input-icon">✉️</span>
                    <input type="email" className="form-input" placeholder="Enter your email" required />
                  </div>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <div className="input-wrapper">
                    <span className="input-icon">🔒</span>
                    <input type="password" className="form-input" placeholder="Create a password" required />
                  </div>
                </div>
                
                <button type="submit" className="login-submit-btn" style={{ background: 'linear-gradient(135deg, #10B981, #047857)', boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.4)' }}>
                  Create Account
                </button>
              </form>
            )}
            
            <div className="login-footer">
              {authView === 'login' ? (
                <>Don't have an account? <span className="toggle-auth" onClick={() => setAuthView('register')}>Register here</span></>
              ) : (
                <>Already have an account? <span className="toggle-auth" onClick={() => setAuthView('login')}>Login here</span></>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const activeMenuItems = userRole === 'admin' ? adminMenu : menuItems;

  // Prepare Dynamic Cards Based on API Data
  const getCards = () => {
    if (!dashboardData) return [];

    if (userRole === 'admin') {
      return [
        { id: 1, title: 'Total Members', amount: dashboardData.networkStats?.totalTeamSize || 0, icon: '👥', bg: 'linear-gradient(135deg, #8B5CF6, #7C3AED)', shadow: 'rgba(139, 92, 246, 0.4)' },
        { id: 2, title: 'Total Revenue', amount: dashboardData.totalEarnings * 100 || 0, icon: '💰', bg: 'linear-gradient(135deg, #10B981, #047857)', shadow: 'rgba(16, 185, 129, 0.4)' },
        { id: 3, title: 'Pending Payouts', amount: 45000, icon: '⏳', bg: 'linear-gradient(135deg, #F59E0B, #D97706)', shadow: 'rgba(245, 158, 11, 0.4)' },
        { id: 4, title: 'Today Joinings', amount: 125, icon: '📈', bg: 'linear-gradient(135deg, #F43F5E, #E11D48)', shadow: 'rgba(244, 63, 94, 0.4)' },
        { id: 5, title: 'Active Tickets', amount: 12, icon: '🎫', bg: 'linear-gradient(135deg, #0EA5E9, #2563EB)', shadow: 'rgba(14, 165, 233, 0.4)' },
        { id: 6, title: 'Total Autopool', amount: dashboardData.autopoolFund || 0, icon: '♾️', bg: 'linear-gradient(135deg, #14B8A6, #0F766E)', shadow: 'rgba(20, 184, 166, 0.4)' },
      ];
    } else {
      return [
        { id: 1, title: 'Total Earnings', amount: dashboardData.totalEarnings || 0, icon: '🚀', bg: 'linear-gradient(135deg, #0EA5E9, #2563EB)', shadow: 'rgba(14, 165, 233, 0.4)' },
        { id: 2, title: 'Main Wallet', amount: dashboardData.mainWallet || 0, icon: '💳', bg: 'linear-gradient(135deg, #10B981, #047857)', shadow: 'rgba(16, 185, 129, 0.4)' },
        { id: 3, title: 'Direct Referral', amount: dashboardData.directReferral || 0, icon: '👤', bg: 'linear-gradient(135deg, #F43F5E, #E11D48)', shadow: 'rgba(244, 63, 94, 0.4)' },
        { id: 4, title: 'Team Income', amount: dashboardData.teamIncome || 0, icon: '👥', bg: 'linear-gradient(135deg, #8B5CF6, #7C3AED)', shadow: 'rgba(139, 92, 246, 0.4)' },
        { id: 5, title: 'Withdraw Fund', amount: dashboardData.withdrawFund || 0, icon: '🔄', bg: 'linear-gradient(135deg, #14B8A6, #0F766E)', shadow: 'rgba(20, 184, 166, 0.4)' },
        { id: 6, title: 'Autopool Fund', amount: dashboardData.autopoolFund || 0, icon: '♾️', bg: 'linear-gradient(135deg, #6366F1, #4F46E5)', shadow: 'rgba(99, 102, 241, 0.4)' },
        { id: 7, title: 'All Ranks', amount: dashboardData.allRanks || 0, icon: '🏆', bg: 'linear-gradient(135deg, #F59E0B, #D97706)', shadow: 'rgba(245, 158, 11, 0.4)' },
      ];
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
        <header className="topbar">
          <div className="page-title">{activeMenu}</div>
          <div className="topbar-actions">
            <button className="notification-btn">🔔</button>
          </div>
        </header>

        <div className="dashboard-content">
          {/* User Banner via API Data */}
          <div className="user-banner">
            <div className="user-avatar">{userRole === 'admin' ? '👑' : (userData?.name?.charAt(0) || 'U')}</div>
            <div className="user-info-text">
              <span className="welcome-text">Welcome Back</span>
              <h2 className="user-name">{userData?.name || 'Loading...'}</h2>
              <div className="badges">
                <span className={`badge ${userRole === 'admin' ? 'badge-gold' : 'badge-gold'}`}>
                  {userData?.rank || 'MEMBER'}
                </span>
                <span className="badge badge-id">ID: {userData?.memberId || '...'}</span>
              </div>
            </div>
          </div>

          <h3 className="section-title">{userRole === 'admin' ? 'Platform Overview' : 'My Earnings Overview'}</h3>
          
          {/* Cards Grid */}
          {!dashboardData ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>Fetching real-time data from API...</div>
          ) : (
            <div className="cards-grid">
              {getCards().map((card) => (
                <div 
                  key={card.id} 
                  className="vibrant-card" 
                  style={{ background: card.bg, boxShadow: `0 10px 20px -5px ${card.shadow}` }}
                >
                  <div className="card-bg-circle card-circle-1"></div>
                  <div className="card-bg-circle card-circle-2"></div>
                  <div className="card-header">
                    <div className="card-icon">{card.icon}</div>
                    <div className="card-view-btn">View <span>›</span></div>
                  </div>
                  <div className="card-content">
                    <div className="card-title">{card.title.toUpperCase()}</div>
                    <div className="card-amount">{userRole === 'admin' && card.id === 1 ? '' : '₹'} {card.amount.toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <h3 className="section-title">{userRole === 'admin' ? 'Recent System Activity' : 'Network Activity'}</h3>
          
          <div className="network-list">
            {userRole === 'admin' ? (
              <>
                <div className="network-item">
                  <div className="network-icon-box" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' }}>⏳</div>
                  <div className="network-item-title">Pending KYC Approvals</div>
                  <div className="network-item-value">45 Users</div>
                </div>
                <div className="network-item">
                  <div className="network-icon-box" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}>💸</div>
                  <div className="network-item-title">Withdrawal Requests</div>
                  <div className="network-item-value">12 Pending</div>
                </div>
              </>
            ) : (
              <>
                <div className="network-item">
                  <div className="network-icon-box" style={{ background: 'rgba(14, 165, 233, 0.1)', color: '#0EA5E9' }}>👤</div>
                  <div className="network-item-title">Direct Referrals</div>
                  <div className="network-item-value">{dashboardData?.networkStats?.directReferrals || 0}</div>
                </div>
                <div className="network-item">
                  <div className="network-icon-box" style={{ background: 'rgba(244, 63, 94, 0.1)', color: '#F43F5E' }}>👥</div>
                  <div className="network-item-title">Total Team Size</div>
                  <div className="network-item-value">{dashboardData?.networkStats?.totalTeamSize || 0}</div>
                </div>
                <div className="network-item">
                  <div className="network-icon-box" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}>⭐</div>
                  <div className="network-item-title">Autopool Status</div>
                  <div className="network-item-value">{dashboardData?.networkStats?.autopoolStatus || 'None'}</div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
